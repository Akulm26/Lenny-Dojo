import { ExtractedIntelligence } from './ai';
import { Episode } from './github';
import { getCachedIntelligence } from './intelligenceCache';

// ============================================
// TYPES
// ============================================

export interface CompanyIntelligence {
  name: string;
  episode_count: number;
  total_decisions: number;
  total_opinions: number;

  episodes: Array<{
    episode_id: string;
    guest_name: string;
    episode_title: string;
    is_guest_company: boolean;
    context: string;
  }>;

  decisions: Array<{
    what: string;
    when: string | null;
    why: string;
    outcome: string;
    quote: string;
    guest_name: string;
    episode_id: string;
  }>;

  opinions: Array<{
    opinion: string;
    quote: string;
    guest_name: string;
    episode_id: string;
  }>;

  metrics: string[];

  question_seeds: Array<{
    type: string;
    situation: string;
    what_happened: string;
    usable_quotes: string[];
    guest_name: string;
    episode_id: string;
    episode_title: string;
  }>;
}

export interface Framework {
  name: string;
  creator: string;
  category: string;
  explanation: string;
  when_to_use: string;
  example: string;
  quote: string;
  mentioned_in: Array<{
    episode_id: string;
    guest_name: string;
    episode_title: string;
  }>;
}

// ============================================
// HELPER: Aggregate intelligence into maps
// ============================================

function aggregateIntelligence(
  intelligence: ExtractedIntelligence,
  episode: Episode,
  companiesMap: Map<string, CompanyIntelligence>,
  frameworksMap: Map<string, Framework>
) {
  // Aggregate companies
  for (const company of intelligence.companies || []) {
    const key = company.name.toLowerCase();
    const existing = companiesMap.get(key) || {
      name: company.name,
      episode_count: 0,
      total_decisions: 0,
      total_opinions: 0,
      episodes: [],
      decisions: [],
      opinions: [],
      metrics: [],
      question_seeds: []
    };

    existing.episode_count++;

    existing.episodes.push({
      episode_id: episode.id,
      guest_name: episode.guest,
      episode_title: episode.title,
      is_guest_company: company.is_guest_company,
      context: company.mention_context
    });

    for (const decision of company.decisions || []) {
      existing.decisions.push({
        ...decision,
        guest_name: episode.guest,
        episode_id: episode.id
      });
      existing.total_decisions++;
    }

    for (const opinion of company.opinions || []) {
      existing.opinions.push({
        ...opinion,
        guest_name: episode.guest,
        episode_id: episode.id
      });
      existing.total_opinions++;
    }

    existing.metrics.push(...(company.metrics_mentioned || []));

    companiesMap.set(key, existing);
  }

  // Aggregate question seeds
  for (const seed of intelligence.question_seeds || []) {
    const companyKey = seed.company.toLowerCase();
    const existing = companiesMap.get(companyKey);
    if (existing) {
      existing.question_seeds.push({
        ...seed,
        guest_name: episode.guest,
        episode_id: episode.id,
        episode_title: episode.title
      });
    }
  }

  // Aggregate frameworks
  for (const framework of intelligence.frameworks || []) {
    const key = framework.name.toLowerCase();
    const existing = frameworksMap.get(key);

    if (existing) {
      existing.mentioned_in.push({
        episode_id: episode.id,
        guest_name: episode.guest,
        episode_title: episode.title
      });
    } else {
      frameworksMap.set(key, {
        ...framework,
        mentioned_in: [{
          episode_id: episode.id,
          guest_name: episode.guest,
          episode_title: episode.title
        }]
      });
    }
  }
}

// ============================================
// EXTRACTION & AGGREGATION (CACHE ONLY - NO AI CALLS)
// ============================================

/**
 * Load intelligence from the Supabase cache and aggregate into companies/frameworks.
 * This function NEVER calls AI extraction - it only uses cached data.
 * Users must seed the cache via Settings → Intelligence Cache.
 */
export async function extractAllIntelligence(
  episodes: Episode[],
  onProgress?: (current: number, total: number, message: string) => void
): Promise<{ companies: CompanyIntelligence[]; frameworks: Framework[] }> {
  
  const companiesMap = new Map<string, CompanyIntelligence>();
  const frameworksMap = new Map<string, Framework>();

  // Check cache
  onProgress?.(0, episodes.length, 'Loading intelligence from cache...');
  const episodeIds = episodes.map(e => e.id);
  const cachedIntelligence = await getCachedIntelligence(episodeIds);
  
  // Aggregate cached data
  let cachedCount = 0;
  
  for (const episode of episodes) {
    const cached = cachedIntelligence.get(episode.id);
    if (cached) {
      aggregateIntelligence(cached, episode, companiesMap, frameworksMap);
      cachedCount++;
    }
  }
  
  // Report results
  if (cachedCount === 0) {
    onProgress?.(
      0,
      episodes.length,
      'No cached intelligence. Go to Settings → Seed Intelligence Cache.'
    );
    return { companies: [], frameworks: [] };
  }

  const uncachedCount = episodes.length - cachedCount;
  if (uncachedCount > 0) {
    console.log(`Loaded ${cachedCount} episodes from cache. ${uncachedCount} not cached (skipped).`);
    onProgress?.(cachedCount, episodes.length, `Loaded ${cachedCount} from cache. ${uncachedCount} skipped.`);
  } else {
    onProgress?.(episodes.length, episodes.length, `All ${cachedCount} episodes loaded from cache!`);
  }

  // Convert maps to arrays and sort
  const companies = Array.from(companiesMap.values())
    .sort((a, b) => b.episode_count - a.episode_count);

  const frameworks = Array.from(frameworksMap.values())
    .sort((a, b) => b.mentioned_in.length - a.mentioned_in.length);

  return { companies, frameworks };
}
