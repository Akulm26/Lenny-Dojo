import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GITHUB_API_BASE = 'https://api.github.com/repos/nicoles/lennys-podcast-transcripts';

// Generate demo intelligence (same as seed-intelligence-cache)
function generateDemoIntelligence(episodeId: string, guestName: string, episodeTitle: string) {
  const companyTypes = ['B2B SaaS', 'Consumer Tech', 'Marketplace', 'Fintech', 'E-commerce', 'Developer Tools', 'AI/ML', 'Healthcare Tech'];
  const stages = ['Seed', 'Series A', 'Series B', 'Series C', 'Growth', 'Public'];
  const industries = ['Technology', 'Finance', 'Healthcare', 'Retail', 'Media', 'Enterprise', 'Consumer'];
  
  const frameworkCategories = ['Growth', 'Product', 'Leadership', 'Strategy', 'Culture', 'Marketing', 'Sales'];
  
  const numCompanies = 2 + Math.floor(Math.random() * 3);
  const companies = [];
  
  for (let i = 0; i < numCompanies; i++) {
    const companyName = i === 0 ? `${guestName.split(' ')[1] || guestName}'s Company` : `Partner Co ${i}`;
    companies.push({
      name: companyName,
      role: i === 0 ? 'Founder & CEO' : ['Advisor', 'Board Member', 'Investor', 'Partner'][Math.floor(Math.random() * 4)],
      timeframe: `${2015 + Math.floor(Math.random() * 8)}-${i === 0 ? 'Present' : 2020 + Math.floor(Math.random() * 4)}`,
      context: `Discussed in episode about ${episodeTitle.toLowerCase()}`,
      stage: stages[Math.floor(Math.random() * stages.length)],
      type: companyTypes[Math.floor(Math.random() * companyTypes.length)],
      industry: industries[Math.floor(Math.random() * industries.length)],
    });
  }

  const numFrameworks = 1 + Math.floor(Math.random() * 2);
  const frameworks = [];
  
  for (let i = 0; i < numFrameworks; i++) {
    const category = frameworkCategories[Math.floor(Math.random() * frameworkCategories.length)];
    frameworks.push({
      name: `The ${guestName.split(' ')[0]} ${category} Framework`,
      category,
      description: `A ${category.toLowerCase()} approach discussed by ${guestName} for building successful products.`,
      steps: [
        'Define your core metrics',
        'Identify key leverage points',
        'Build feedback loops',
        'Iterate and measure',
      ],
      source_episode: episodeId,
      guest: guestName,
    });
  }

  return {
    companies,
    frameworks,
    question_seeds: [
      { topic: 'career', question: `What drove ${guestName}'s career decisions?` },
      { topic: 'product', question: `How does ${guestName} approach product development?` },
    ],
    memorable_quotes: [
      { quote: `"The best products solve real problems."`, context: 'On product strategy' },
    ],
    _source: 'demo_sync',
  };
}

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

async function fetchEpisodeMetadata(episodeId: string): Promise<{ guest: string; title: string } | null> {
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
    
    return {
      guest: guestMatch?.[1]?.trim() || 'Unknown Guest',
      title: titleMatch?.[1]?.trim() || episodeId,
    };
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Fetch metadata and seed new episodes (batch of 10 at a time)
    const BATCH_SIZE = 10;
    let seeded = 0;
    const errors: string[] = [];

    for (let i = 0; i < newEpisodeIds.length; i += BATCH_SIZE) {
      const batch = newEpisodeIds.slice(i, i + BATCH_SIZE);
      
      const metadataResults = await Promise.all(
        batch.map(async (id) => {
          const meta = await fetchEpisodeMetadata(id);
          return meta ? { id, ...meta } : null;
        })
      );

      const validEpisodes = metadataResults.filter(Boolean) as Array<{ id: string; guest: string; title: string }>;

      if (validEpisodes.length > 0) {
        const records = validEpisodes.map(ep => ({
          episode_id: ep.id,
          guest_name: ep.guest,
          episode_title: ep.title,
          intelligence: generateDemoIntelligence(ep.id, ep.guest, ep.title),
          extracted_at: new Date().toISOString(),
        }));

        const { error: insertError } = await supabase
          .from('episode_intelligence_cache')
          .upsert(records, { onConflict: 'episode_id' });

        if (insertError) {
          errors.push(`Batch ${i}: ${insertError.message}`);
        } else {
          seeded += validEpisodes.length;
        }
      }
    }

    console.log(`Seeded ${seeded} new episodes`);

    return new Response(
      JSON.stringify({
        message: `Synced ${seeded} new episodes`,
        total: allEpisodeIds.length,
        cached: cachedIds.size,
        new: seeded,
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
