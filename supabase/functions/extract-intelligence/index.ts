// Extract Intelligence Edge Function - v3 (BYOK - user's own API key required)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Friendly error messages for invalid API keys
function friendlyApiError(provider: string, status: number, _rawError: string): string {
  const name = provider === 'google_gemini' ? 'Google Gemini' : provider === 'openai' ? 'OpenAI' : provider === 'deepseek' ? 'DeepSeek' : 'Anthropic';
  if (status === 401 || status === 403) return `Your ${name} API key is invalid or has been revoked. Please update it in Settings → API Keys.`;
  if (status === 429) return `Your ${name} API key has hit its rate limit. Please wait a moment or check your plan's usage limits.`;
  if (status === 402 || status === 400) return `Your ${name} API key request was rejected (${status}). Please check your billing and API key permissions.`;
  return `${name} returned an error (${status}). Please verify your API key in Settings → API Keys.`;
}

// Provider-specific API endpoints
const PROVIDER_CONFIG: Record<string, { url: string; defaultModel: string; authHeader: (key: string) => Record<string, string> }> = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o',
    authHeader: (key) => ({ 'Authorization': `Bearer ${key}` }),
  },
  google_gemini: {
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    defaultModel: 'gemini-2.5-flash',
    authHeader: (key) => ({ 'Authorization': `Bearer ${key}` }),
  },
  anthropic: {
    url: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-sonnet-4-20250514',
    authHeader: (key) => ({ 'x-api-key': key, 'anthropic-version': '2023-06-01' }),
  },
  deepseek: {
    url: 'https://api.deepseek.com/chat/completions',
    defaultModel: 'deepseek-chat',
    authHeader: (key) => ({ 'Authorization': `Bearer ${key}` }),
  },
};

// Authentication helper - returns userId OR identifies service_role caller
async function authenticateRequest(req: Request): Promise<{ authenticated: boolean; userId?: string; isServiceRole?: boolean; error?: string }> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { authenticated: false, error: 'Missing or invalid Authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  // Check if this is a service_role call (from seed/sync admin functions)
  if (serviceRoleKey && token === serviceRoleKey) {
    return { authenticated: true, isServiceRole: true };
  }

  // Otherwise, authenticate as a regular user
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data?.user) {
    return { authenticated: false, error: 'Invalid or expired token. Please log in.' };
  }

  return { authenticated: true, userId: data.user.id };
}

// Decryption helper for encrypted API keys
async function decryptApiKey(ciphertext: string): Promise<string> {
  const raw = Deno.env.get('API_KEY_ENCRYPTION_KEY');
  if (!raw) throw new Error('Encryption key not configured');
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.digest('SHA-256', encoder.encode(raw));
  const key = await crypto.subtle.importKey('raw', keyMaterial, { name: 'AES-GCM' }, false, ['decrypt']);
  const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
  return new TextDecoder().decode(decrypted);
}

// Look up user's own API key from the database
async function getUserApiKey(userId: string): Promise<{ provider: string; apiKey: string } | null> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabase
    .from('user_api_keys')
    .select('provider, api_key')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  
  try {
    const decryptedKey = await decryptApiKey(data.api_key);
    return { provider: data.provider, apiKey: decryptedKey };
  } catch (e) {
    console.warn('Decryption failed, trying as plaintext:', e);
    return { provider: data.provider, apiKey: data.api_key };
  }
}

// Call AI with user's key (for user calls) or Lovable AI (for service_role admin calls)
async function callAI(
  messages: Array<{role: string; content: string}>,
  maxTokens: number,
  options: { userId?: string; isServiceRole?: boolean }
) {
  // For authenticated users: require their own API key
  if (options.userId) {
    const userKey = await getUserApiKey(options.userId);
    
    if (!userKey || !PROVIDER_CONFIG[userKey.provider]) {
      throw new Error('No API key configured. Please add your own API key in Settings → API Keys before using this feature.');
    }

    const config = PROVIDER_CONFIG[userKey.provider];

    if (userKey.provider === 'anthropic') {
      const response = await fetch(config.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...config.authHeader(userKey.apiKey) },
        body: JSON.stringify({
          model: config.defaultModel,
          max_tokens: maxTokens,
          system: messages.find(m => m.role === 'system')?.content || '',
          messages: messages.filter(m => m.role !== 'system'),
        }),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(friendlyApiError('Anthropic', response.status, errText));
      }
      const data = await response.json();
      return data.content?.[0]?.text ?? '';
    }

    const response = await fetch(config.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...config.authHeader(userKey.apiKey) },
      body: JSON.stringify({ model: config.defaultModel, messages, max_tokens: maxTokens }),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(friendlyApiError(userKey.provider, response.status, errText));
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? '';
  }

  // For service_role admin calls (seed/sync): use Lovable AI gateway
  if (options.isServiceRole) {
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured for admin extraction');
    }

    const maxAttempts = 6;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({ model: 'google/gemini-3-flash-preview', messages, max_tokens: maxTokens }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content ?? '';
        if (!content && attempt < maxAttempts) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
          continue;
        }
        return content;
      }

      if (response.status === 429) {
        if (attempt === maxAttempts) throw new Error('AI rate limited (429). Please try again later.');
        const waitMs = Math.min(30000, 1500 * Math.pow(2, attempt - 1));
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }

      if (response.status === 402) throw new Error('Payment required (402).');
      
      const errorText = await response.text();
      throw new Error(`Lovable AI error: ${response.status} - ${errorText}`);
    }
    throw new Error('AI returned no content after all attempts');
  }

  throw new Error('No valid authentication context for AI call');
}

// Validation constants
const MAX_TRANSCRIPT_LENGTH = 120000;
const MAX_STRING_LENGTH = 500;

interface ExtractRequest {
  transcript: string;
  episodeId: string;
  guestName: string;
  episodeTitle: string;
}

function validateString(value: unknown, fieldName: string, maxLength: number, truncate = false): string {
  if (typeof value !== 'string') throw new Error(`${fieldName} must be a string`);
  if (value.length === 0) throw new Error(`${fieldName} cannot be empty`);
  let result = value;
  if (truncate && result.length > maxLength) result = result.substring(0, maxLength);
  else if (result.length > maxLength) throw new Error(`${fieldName} exceeds maximum length of ${maxLength}`);
  return result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

function validateRequest(body: unknown): ExtractRequest {
  if (!body || typeof body !== 'object') throw new Error('Request body must be a valid JSON object');
  const obj = body as Record<string, unknown>;
  return {
    transcript: validateString(obj.transcript, 'transcript', MAX_TRANSCRIPT_LENGTH, true),
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
    // Authenticate — require either user JWT or service_role
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return new Response(
        JSON.stringify({ error: auth.error || 'Unauthorized. Please log in to use this feature.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request
    let rawBody: unknown;
    try { rawBody = await req.json(); } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let body: ExtractRequest;
    try { body = validateRequest(rawBody); } catch (validationError) {
      return new Response(
        JSON.stringify({ error: validationError instanceof Error ? validationError.message : 'Validation failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const transcript = body.transcript.length > MAX_TRANSCRIPT_LENGTH 
      ? body.transcript.substring(0, MAX_TRANSCRIPT_LENGTH) + '\n\n[Transcript truncated for processing]' 
      : body.transcript;

    const systemPrompt = `You are analyzing a Lenny's Podcast transcript to extract structured intelligence.

CRITICAL: Extract ONLY what is explicitly stated in the transcript.
- Do NOT add external knowledge
- Do NOT infer or assume facts not stated
- If something isn't mentioned, don't include it
- Capture direct quotes exactly as stated`;

    const userPrompt = `EPISODE: \"${body.episodeTitle}\"
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

    const content = await callAI(
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      4096,
      { userId: auth.userId, isServiceRole: auth.isServiceRole }
    );

    if (!content) throw new Error('AI returned empty response');

    // Parse JSON response
    let intelligenceData;
    const cleanJson = (text: string): string => {
      const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) text = codeBlockMatch[1];
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return text;
      let json = jsonMatch[0];
      json = json.replace(/,(\s*[\]\}])/g, '$1');
      return json;
    };

    try {
      intelligenceData = JSON.parse(content);
    } catch {
      const cleaned = cleanJson(content);
      try {
        intelligenceData = JSON.parse(cleaned);
      } catch (e2) {
        console.error('JSON parse failed. First 2000 chars:', cleaned.substring(0, 2000));
        throw new Error('Failed to parse intelligence response: ' + (e2 instanceof Error ? e2.message : String(e2)));
      }
    }

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

    if ((error as any)?.name === 'Http' && typeof message === 'string' && message.toLowerCase().includes('error reading a body')) {
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
