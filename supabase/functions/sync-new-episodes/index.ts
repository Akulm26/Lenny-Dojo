import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

// Authentication - supports service role OR cron secret
function authenticateRequest(req: Request): { authenticated: boolean; error?: string } {
  const authHeader = req.headers.get('Authorization');
  const cronSecret = req.headers.get('x-cron-secret');
  const expectedCronSecret = Deno.env.get('CRON_SECRET');
  
  // Option 1: Service role key authentication (for manual triggers)
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    if (token === SUPABASE_SERVICE_ROLE_KEY) {
      return { authenticated: true };
    }
  }
  
  // Option 2: Cron secret authentication (for scheduled jobs)
  if (cronSecret && expectedCronSecret && cronSecret === expectedCronSecret) {
    return { authenticated: true };
  }
  
  // No valid auth found
  if (!authHeader && !cronSecret) {
    return { authenticated: false, error: 'Missing authentication' };
  }
  
  return { authenticated: false, error: 'Invalid credentials' };
}

const GITHUB_API_BASE = 'https://api.github.com/repos/ChatPRD/lennys-podcast-transcripts';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/ChatPRD/lennys-podcast-transcripts/main';

function getGitHubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'LennysDojo-Sync',
  };
  
  const githubToken = Deno.env.get('GITHUB_TOKEN');
  if (githubToken) {
    headers['Authorization'] = `Bearer ${githubToken}`;
  }
  
  return headers;
}

async function fetchEpisodeList(): Promise<string[]> {
  const response = await fetch(`${GITHUB_API_BASE}/contents/episodes`, {
    headers: getGitHubHeaders(),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('GitHub API response:', response.status, errorText);
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
      `${GITHUB_RAW_BASE}/episodes/${episodeId}/transcript.md`
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

async function extractIntelligenceViaFunction(params: {
  transcript: string;
  episodeId: string;
  guestName: string;
  episodeTitle: string;
  supabaseUrl: string;
  serviceRoleKey: string;
}): Promise<any> {
  const { transcript, episodeId, guestName, episodeTitle, supabaseUrl, serviceRoleKey } = params;

  const url = `${supabaseUrl}/functions/v1/extract-intelligence`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // The extract-intelligence function is intentionally restricted to service role.
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
    },
    body: JSON.stringify({
      transcript,
      episodeId,
      guestName,
      episodeTitle,
    }),
  });

  if (!response.ok) {
    const status = response.status;
    const errorText = await response.text();

    if (status === 429) {
      throw new Error('RATE_LIMITED');
    }

    if (status === 402) {
      throw new Error('PAYMENT_REQUIRED');
    }

    console.error('extract-intelligence error:', status, errorText);
    throw new Error(`extract-intelligence error: ${status}`);
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate - require service role or cron secret
    const auth = authenticateRequest(req);
    if (!auth.authenticated) {
      return new Response(
        JSON.stringify({ error: auth.error || 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

        // Extract intelligence using the internal AI-backed function (Lovable AI gateway)
        const intelligence = await extractIntelligenceViaFunction({
          transcript: content.transcript,
          episodeId,
          guestName: content.guest,
          episodeTitle: content.title,
          supabaseUrl,
          serviceRoleKey: supabaseKey,
        });

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
        if (msg === 'RATE_LIMITED' || msg === 'PAYMENT_REQUIRED') {
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
        message: `Synced ${processed} new episodes`,
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
