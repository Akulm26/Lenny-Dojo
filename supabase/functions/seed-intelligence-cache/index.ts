// Seed Intelligence Cache Edge Function - v3 (real transcript extraction)
// This now fetches actual transcripts from GitHub and uses AI extraction
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');

// GitHub repo configuration
const REPO_OWNER = 'ChatPRD';
const REPO_NAME = 'lennys-podcast-transcripts';
const BRANCH = 'main';

// Validation constants
const MAX_EPISODES = 500;
const MAX_STRING_LENGTH = 500;
const BATCH_SIZE = 5; // Process 5 at a time to avoid rate limits
const DELAY_BETWEEN_BATCHES = 3000; // 3 second delay between batches

interface EpisodeInput {
  id: string;
  guest: string;
  title: string;
}

// Validate and sanitize string input
function validateString(value: unknown, fieldName: string, maxLength: number): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  if (value.length > maxLength) {
    return value.substring(0, maxLength);
  }
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

// Validate episode object
function validateEpisode(value: unknown, index: number): EpisodeInput {
  if (!value || typeof value !== 'object') {
    throw new Error(`episodes[${index}] must be an object`);
  }

  const obj = value as Record<string, unknown>;

  return {
    id: validateString(obj.id, `episodes[${index}].id`, MAX_STRING_LENGTH),
    guest: validateString(obj.guest, `episodes[${index}].guest`, MAX_STRING_LENGTH),
    title: validateString(obj.title, `episodes[${index}].title`, MAX_STRING_LENGTH),
  };
}

// Validate request body
function validateRequest(body: unknown): EpisodeInput[] {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body must be a valid JSON object');
  }

  const obj = body as Record<string, unknown>;
  const episodes = obj.episodes;

  if (!Array.isArray(episodes)) {
    throw new Error('episodes must be an array');
  }

  if (episodes.length === 0) {
    throw new Error('episodes array cannot be empty');
  }

  if (episodes.length > MAX_EPISODES) {
    throw new Error(`episodes array exceeds maximum length of ${MAX_EPISODES}`);
  }

  return episodes.map((ep, i) => validateEpisode(ep, i));
}

// Fetch transcript from GitHub
async function fetchTranscript(episodeId: string): Promise<{ guest: string; title: string; transcript: string } | null> {
  try {
    const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/episodes/${episodeId}/transcript.md`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Failed to fetch transcript for ${episodeId}: ${response.status}`);
      return null;
    }
    
    const content = await response.text();
    
    // Parse YAML frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    
    let guest = episodeId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    let title = `Episode with ${guest}`;
    let transcript = content;
    
    if (frontmatterMatch) {
      const yamlContent = frontmatterMatch[1];
      transcript = frontmatterMatch[2].trim();
      
      yamlContent.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          let value = line.substring(colonIndex + 1).trim();
          
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          
          if (key === 'guest') guest = value;
          if (key === 'title') title = value;
        }
      });
    }
    
    return { guest, title, transcript };
  } catch (error) {
    console.error(`Error fetching transcript for ${episodeId}:`, error);
    return null;
  }
}

// Call the extract-intelligence edge function
async function extractIntelligence(
  transcript: string,
  episodeId: string,
  guestName: string,
  episodeTitle: string,
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<any> {
  const response = await fetch(`${supabaseUrl}/functions/v1/extract-intelligence`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({
      transcript,
      episodeId,
      guestName,
      episodeTitle,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Extract intelligence failed (${response.status}): ${errorText}`);
  }

  return response.json();
}

// Sleep helper
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse and validate request
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let episodes: EpisodeInput[];
    try {
      episodes = validateRequest(rawBody);
    } catch (validationError) {
      return new Response(
        JSON.stringify({ error: validationError instanceof Error ? validationError.message : 'Validation failed' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check which episodes are already cached
    const episodeIds = episodes.map(e => e.id);
    const { data: existingCache } = await supabase
      .from('episode_intelligence_cache')
      .select('episode_id')
      .in('episode_id', episodeIds);

    const cachedIds = new Set((existingCache || []).map(e => e.episode_id));
    const uncachedEpisodes = episodes.filter(e => !cachedIds.has(e.id));

    console.log(`Found ${cachedIds.size} cached, ${uncachedEpisodes.length} to process`);

    if (uncachedEpisodes.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: "All episodes already cached", 
          cached: cachedIds.size,
          seeded: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process episodes in small batches with real AI extraction
    let totalSeeded = 0;
    const errors: string[] = [];

    for (let i = 0; i < uncachedEpisodes.length; i += BATCH_SIZE) {
      const batch = uncachedEpisodes.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} episodes`);
      
      for (const episode of batch) {
        try {
          // Fetch real transcript from GitHub
          const transcriptData = await fetchTranscript(episode.id);
          
          if (!transcriptData) {
            errors.push(`${episode.id}: Failed to fetch transcript`);
            continue;
          }
          
          // Extract intelligence using AI
          const intelligence = await extractIntelligence(
            transcriptData.transcript,
            episode.id,
            transcriptData.guest,
            transcriptData.title,
            supabaseUrl,
            supabaseKey
          );
          
          // Store in cache
          const { error: insertError } = await supabase
            .from('episode_intelligence_cache')
            .upsert({
              episode_id: episode.id,
              guest_name: transcriptData.guest,
              episode_title: transcriptData.title,
              intelligence,
              extracted_at: new Date().toISOString(),
            }, { onConflict: 'episode_id' });
          
          if (insertError) {
            errors.push(`${episode.id}: ${insertError.message}`);
          } else {
            totalSeeded++;
            console.log(`✓ Extracted: ${episode.id}`);
          }
          
          // Small delay between individual episodes
          await sleep(500);
          
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`${episode.id}: ${msg}`);
          console.error(`✗ Failed: ${episode.id} - ${msg}`);
        }
      }
      
      // Longer delay between batches to avoid rate limits
      if (i + BATCH_SIZE < uncachedEpisodes.length) {
        console.log(`Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
        await sleep(DELAY_BETWEEN_BATCHES);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Successfully extracted ${totalSeeded} episodes with real data`,
        cached: cachedIds.size,
        seeded: totalSeeded,
        total: episodes.length,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined // Only first 10 errors
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Seed intelligence cache error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
