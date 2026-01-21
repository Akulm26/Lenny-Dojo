import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Service role authentication - only allow internal/admin access
function authenticateServiceRole(req: Request): { authenticated: boolean; error?: string } {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { authenticated: false, error: 'Missing or invalid Authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Check if it's the service role key
  if (token === SUPABASE_SERVICE_ROLE_KEY) {
    return { authenticated: true };
  }

  return { authenticated: false, error: 'Unauthorized - service role required' };
}

// Validation constants
const MAX_TRANSCRIPT_LENGTH = 60000;
const MAX_STRING_LENGTH = 500;

interface ExtractRequest {
  transcript: string;
  episodeId: string;
  guestName: string;
  episodeTitle: string;
}

// Validate and sanitize string input
function validateString(value: unknown, fieldName: string, maxLength: number): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  if (value.length === 0) {
    throw new Error(`${fieldName} cannot be empty`);
  }
  if (value.length > maxLength) {
    throw new Error(`${fieldName} exceeds maximum length of ${maxLength}`);
  }
  // Basic sanitization - remove control characters except newlines/tabs
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

// Validate request body
function validateRequest(body: unknown): ExtractRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body must be a valid JSON object');
  }

  const obj = body as Record<string, unknown>;

  return {
    transcript: validateString(obj.transcript, 'transcript', MAX_TRANSCRIPT_LENGTH),
    episodeId: validateString(obj.episodeId, 'episodeId', MAX_STRING_LENGTH),
    guestName: validateString(obj.guestName, 'guestName', MAX_STRING_LENGTH),
    episodeTitle: validateString(obj.episodeTitle, 'episodeTitle', MAX_STRING_LENGTH),
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate - require service role for admin operations
    const auth = authenticateServiceRole(req);
    if (!auth.authenticated) {
      return new Response(
        JSON.stringify({ error: auth.error || 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Parse and validate request
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let body: ExtractRequest;
    try {
      body = validateRequest(rawBody);
    } catch (validationError) {
      return new Response(
        JSON.stringify({ error: validationError instanceof Error ? validationError.message : 'Validation failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Truncate very long transcripts (already validated, but apply soft limit for AI)
    const transcript = body.transcript.length > MAX_TRANSCRIPT_LENGTH 
      ? body.transcript.substring(0, MAX_TRANSCRIPT_LENGTH) + '\n\n[Transcript truncated for processing]' 
      : body.transcript;

    const systemPrompt = `You are analyzing a Lenny's Podcast transcript to extract structured intelligence.

CRITICAL: Extract ONLY what is explicitly stated in the transcript.
- Do NOT add external knowledge
- Do NOT infer or assume facts not stated
- If something isn't mentioned, don't include it
- Capture direct quotes exactly as stated`;

    const userPrompt = `EPISODE: "${body.episodeTitle}"
GUEST: ${body.guestName}

TRANSCRIPT:
${transcript}

---

Extract intelligence from this transcript. Return ONLY this JSON:
{
  "companies": [
    {
      "name": "<company name>",
      "is_guest_company": <true if guest works/worked there>,
      "mention_context": "<brief context of why this company was discussed>",
      "decisions": [
        {
          "what": "<what they decided or did>",
          "when": "<when, if mentioned>",
          "why": "<reasoning if explained>",
          "outcome": "<result as described by guest>",
          "quote": "<direct quote about this decision>"
        }
      ],
      "opinions": [
        {
          "opinion": "<guest's opinion or analysis>",
          "quote": "<supporting quote>"
        }
      ],
      "metrics_mentioned": ["<any specific numbers, percentages, or metrics discussed>"]
    }
  ],
  "frameworks": [
    {
      "name": "<framework name as guest called it>",
      "creator": "<who created it, if mentioned>",
      "category": "<prioritization|strategy|growth|metrics|design|execution|leadership|ai_ml>",
      "explanation": "<how it works>",
      "when_to_use": "<when to apply it, if explained>",
      "example": "<example guest gave>",
      "quote": "<direct quote explaining framework>"
    }
  ],
  "question_seeds": [
    {
      "type": "<behavioral|product_sense|product_design|rca|guesstimate|tech|ai_ml|strategy|metrics>",
      "company": "<company this relates to>",
      "situation": "<situation or problem described>",
      "what_happened": "<outcome or decision>",
      "usable_quotes": ["<quote 1>", "<quote 2>"]
    }
  ],
  "memorable_quotes": [
    {
      "quote": "<memorable quote>",
      "topic": "<what it's about>",
      "context": "<brief context>"
    }
  ]
}

Include ONLY items explicitly discussed. Empty arrays are fine if nothing fits a category.`;

    // Call Lovable AI with retries for transient 429s
    const maxAttempts = 6;
    let lastStatus = 0;
    let content = '';

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          // Use a faster/less rate-limit-prone model for large batch extraction
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 4096,
        }),
      });

      lastStatus = response.status;

      if (response.ok) {
        const data = await response.json();
        content = data.choices?.[0]?.message?.content ?? '';
        
        // If we got a 200 but no content, log the full response and retry
        if (!content) {
          console.warn(`Attempt ${attempt}: AI returned 200 but empty content. Response:`, JSON.stringify(data).substring(0, 500));
          if (attempt === maxAttempts) {
            throw new Error('AI returned empty response after all retries');
          }
          await new Promise((r) => setTimeout(r, 1000 * attempt));
          continue;
        }
        break;
      }

      const errorText = await response.text();

      // Surface rate limiting clearly to the client
      if (response.status === 429) {
        if (attempt === maxAttempts) {
          return new Response(JSON.stringify({ error: 'AI rate limited (429). Please try again in a few minutes.' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Exponential backoff
        const waitMs = Math.min(30000, 1500 * Math.pow(2, attempt - 1));
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }

      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add funds to your Lovable AI workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    if (!content) {
      throw new Error('AI returned no content after all attempts');
    }

    let intelligenceData;
    
    // Clean up common AI JSON formatting issues
    const cleanJson = (text: string): string => {
      // Extract JSON from markdown code blocks
      const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        text = codeBlockMatch[1];
      }
      
      // Find the JSON object
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return text;
      
      let json = jsonMatch[0];
      
      // Fix trailing commas in arrays and objects (common AI mistake)
      json = json.replace(/,(\s*[\]\}])/g, '$1');
      
      // Fix unescaped newlines in strings
      json = json.replace(/:\s*"([^"]*(?:\\.[^"]*)*)"/g, (match) => {
        return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
      });
      
      return json;
    };

    try {
      intelligenceData = JSON.parse(content);
    } catch {
      const cleaned = cleanJson(content);
      try {
        intelligenceData = JSON.parse(cleaned);
      } catch (e2) {
        console.error('JSON parse failed even after cleaning. First 2000 chars:', cleaned.substring(0, 2000));
        throw new Error('Failed to parse intelligence response: ' + (e2 instanceof Error ? e2.message : String(e2)));
      }
    }

    // Add source metadata
    intelligenceData._source = {
      episode_id: body.episodeId,
      guest_name: body.guestName,
      episode_title: body.episodeTitle,
      extracted_at: new Date().toISOString()
    };

    return new Response(JSON.stringify(intelligenceData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Common transient case: client disconnected / incomplete body.
    // Avoid treating it as a hard runtime error.
    if (
      (error as any)?.name === 'Http' &&
      typeof message === 'string' &&
      message.toLowerCase().includes('error reading a body')
    ) {
      console.warn('Extract intelligence request body read failed:', message);
      return new Response(
        JSON.stringify({ error: 'Request body was not fully received. Please retry.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.error('Extract intelligence error:', error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
