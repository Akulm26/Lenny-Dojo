import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const GITHUB_API_BASE = 'https://api.github.com/repos/nicoles/lennys-podcast-transcripts';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

async function fetchEpisodeList(): Promise<string[]> {
  const response = await fetch(`${GITHUB_API_BASE}/contents/transcripts`, {
    headers: { 'Accept': 'application/vnd.github.v3+json' },
  });
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data
    .filter((item: any) => item.type === 'dir')
    .map((item: any) => item.name);
}

async function fetchEpisodeContent(episodeId: string): Promise<{ guest: string; title: string; transcript: string } | null> {
  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/nicoles/lennys-podcast-transcripts/main/transcripts/${episodeId}/transcript.md`
    );
    
    if (!response.ok) return null;
    
    const content = await response.text();
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    
    if (!frontmatterMatch) return null;
    
    const frontmatter = frontmatterMatch[1];
    const guestMatch = frontmatter.match(/guest:\s*["']?([^"'\n]+)["']?/);
    const titleMatch = frontmatter.match(/title:\s*["']?([^"'\n]+)["']?/);
    
    // Extract transcript body (after frontmatter)
    const transcript = content.replace(/^---\n[\s\S]*?\n---\n*/, '').trim();
    
    return {
      guest: guestMatch?.[1]?.trim() || 'Unknown Guest',
      title: titleMatch?.[1]?.trim() || episodeId,
      transcript,
    };
  } catch {
    return null;
  }
}

async function extractIntelligenceWithAI(
  transcript: string,
  episodeId: string,
  guestName: string,
  episodeTitle: string,
  apiKey: string
): Promise<any> {
  // Truncate transcript if too long
  const maxChars = 60000;
  const truncatedTranscript = transcript.length > maxChars 
    ? transcript.substring(0, maxChars) + '\n\n[TRANSCRIPT TRUNCATED]'
    : transcript;

  const systemPrompt = `You are an expert analyst extracting structured intelligence from podcast transcripts.
Extract ONLY information that is EXPLICITLY STATED in the transcript. Do not infer or assume.

Return a JSON object with this structure:
{
  "companies": [
    {
      "name": "Company Name",
      "is_guest_company": true/false,
      "mention_context": "Brief context of how mentioned",
      "decisions": [{"what": "", "when": null, "why": "", "outcome": "", "quote": ""}],
      "opinions": [{"opinion": "", "quote": ""}],
      "metrics_mentioned": []
    }
  ],
  "frameworks": [
    {
      "name": "Framework Name",
      "creator": "Who created it",
      "category": "Growth/Product/Leadership/etc",
      "explanation": "What it is",
      "when_to_use": "When to apply",
      "example": "Example from transcript",
      "quote": "Direct quote"
    }
  ],
  "question_seeds": [
    {
      "type": "product/growth/leadership/strategy",
      "company": "Company name",
      "situation": "Brief situation",
      "what_happened": "What happened",
      "usable_quotes": []
    }
  ],
  "memorable_quotes": [
    {
      "quote": "Exact quote",
      "topic": "Topic",
      "context": "Context"
    }
  ]
}`;

  const userPrompt = `Extract intelligence from this podcast transcript featuring ${guestName}:

Episode: ${episodeTitle}

TRANSCRIPT:
${truncatedTranscript}

Return ONLY valid JSON matching the schema. Extract real companies, frameworks, and quotes from the transcript.`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: `${systemPrompt}\n\n${userPrompt}` }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 429) {
      throw new Error('RATE_LIMITED');
    }
    if (status === 402 || status === 403) {
      throw new Error('API_KEY_ERROR');
    }
    const errorText = await response.text();
    console.error('Gemini API error:', status, errorText);
    throw new Error(`Gemini API error: ${status}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON in AI response');
  }
  
  const intelligence = JSON.parse(jsonMatch[0]);
  
  return {
    ...intelligence,
    _source: {
      episode_id: episodeId,
      guest_name: guestName,
      episode_title: episodeTitle,
      extracted_at: new Date().toISOString(),
    },
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!geminiApiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY not configured');
    }

    console.log('Checking GitHub for new episodes...');
    
    // Get all episode IDs from GitHub
    const allEpisodeIds = await fetchEpisodeList();
    console.log(`Found ${allEpisodeIds.length} episodes in GitHub`);

    // Get already cached episode IDs
    const { data: cached, error: cacheError } = await supabase
      .from('episode_intelligence_cache')
      .select('episode_id');

    if (cacheError) {
      throw new Error(`Cache query error: ${cacheError.message}`);
    }

    const cachedIds = new Set((cached || []).map(r => r.episode_id));
    console.log(`Found ${cachedIds.size} episodes already cached`);

    // Find new episodes
    const newEpisodeIds = allEpisodeIds.filter(id => !cachedIds.has(id));
    console.log(`Found ${newEpisodeIds.length} new episodes to process`);

    if (newEpisodeIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No new episodes found',
          total: allEpisodeIds.length,
          cached: cachedIds.size,
          new: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process new episodes one at a time (to avoid rate limits)
    let processed = 0;
    const errors: string[] = [];
    const MAX_PER_RUN = 5; // Limit per cron run to avoid timeouts

    for (const episodeId of newEpisodeIds.slice(0, MAX_PER_RUN)) {
      try {
        console.log(`Processing episode: ${episodeId}`);
        
        // Fetch transcript content
        const content = await fetchEpisodeContent(episodeId);
        if (!content) {
          errors.push(`${episodeId}: Could not fetch content`);
          continue;
        }

        // Extract intelligence using Google Gemini
        const intelligence = await extractIntelligenceWithAI(
          content.transcript,
          episodeId,
          content.guest,
          content.title,
          geminiApiKey
        );

        // Store in cache
        const { error: insertError } = await supabase
          .from('episode_intelligence_cache')
          .upsert({
            episode_id: episodeId,
            guest_name: content.guest,
            episode_title: content.title,
            intelligence,
            extracted_at: new Date().toISOString(),
          }, { onConflict: 'episode_id' });

        if (insertError) {
          errors.push(`${episodeId}: ${insertError.message}`);
        } else {
          processed++;
          console.log(`Successfully processed: ${episodeId}`);
        }

        // Small delay between episodes to avoid rate limits
        await new Promise(r => setTimeout(r, 2000));

      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === 'RATE_LIMITED' || msg === 'API_KEY_ERROR') {
          console.log(`Stopping due to: ${msg}`);
          errors.push(`Stopped: ${msg}`);
          break;
        }
        errors.push(`${episodeId}: ${msg}`);
      }
    }

    console.log(`Processed ${processed} new episodes`);

    return new Response(
      JSON.stringify({
        message: `Synced ${processed} new episodes with Google Gemini`,
        total: allEpisodeIds.length,
        cached: cachedIds.size,
        newFound: newEpisodeIds.length,
        processed,
        remaining: newEpisodeIds.length - processed,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
