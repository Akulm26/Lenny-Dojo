import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Use Lovable AI endpoint - no API key required, no rate limits
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractRequest {
  transcript: string;
  episodeId: string;
  guestName: string;
  episodeTitle: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const body: ExtractRequest = await req.json();

    // Truncate very long transcripts
    const transcript = body.transcript.length > 60000 
      ? body.transcript.substring(0, 60000) + '\n\n[Transcript truncated for processing]' 
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

    // Use Lovable AI API (OpenRouter-compatible endpoint)
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 8000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Lovable AI error:', error);
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    let intelligenceData;
    try {
      intelligenceData = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        intelligenceData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse intelligence response');
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
    console.error('Extract intelligence error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
