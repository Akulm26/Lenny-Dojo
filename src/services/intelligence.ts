import { extractIntelligence, ExtractedIntelligence } from './ai';
import { Episode } from './github';
import { getCachedIntelligence, cacheIntelligence, loadAllCachedIntelligence } from './intelligenceCache';

// Re-export for convenience
export { loadAllCachedIntelligence } from './intelligenceCache';

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
    if (!company?.name || typeof company.name !== 'string') {
      // Skip malformed entries from older cache rows
      continue;
    }
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
    // Some older cache rows may have incomplete seeds
    if (!seed?.company || typeof seed.company !== 'string') continue;
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
    if (!framework?.name || typeof framework.name !== 'string') continue;
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
// EXTRACTION & AGGREGATION
// ============================================

export async function extractAllIntelligence(
  episodes: Episode[],
  onProgress?: (current: number, total: number, message: string) => void
): Promise<{ companies: CompanyIntelligence[]; frameworks: Framework[] }> {
  
  const companiesMap = new Map<string, CompanyIntelligence>();
  const frameworksMap = new Map<string, Framework>();

  // Check cache first
  onProgress?.(0, episodes.length, 'Checking cache for previously extracted episodes...');
  const episodeIds = episodes.map(e => e.id);
  const cachedIntelligence = await getCachedIntelligence(episodeIds);
  
  // Separate cached vs uncached episodes
  const uncachedEpisodes: Episode[] = [];
  
  for (const episode of episodes) {
    const cached = cachedIntelligence.get(episode.id);
    if (cached) {
      // Use cached intelligence
      aggregateIntelligence(cached, episode, companiesMap, frameworksMap);
    } else {
      uncachedEpisodes.push(episode);
    }
  }
  
  const cachedCount = episodes.length - uncachedEpisodes.length;
  if (cachedCount > 0) {
    onProgress?.(cachedCount, episodes.length, `Loaded ${cachedCount} episodes from cache. ${uncachedEpisodes.length} to extract...`);
  }
  
  // If everything is cached, we're done
  if (uncachedEpisodes.length === 0) {
    onProgress?.(episodes.length, episodes.length, 'All episodes loaded from cache!');
    
    const companies = Array.from(companiesMap.values())
      .sort((a, b) => b.episode_count - a.episode_count);
    const frameworks = Array.from(frameworksMap.values())
      .sort((a, b) => b.mentioned_in.length - a.mentioned_in.length);
    
    return { companies, frameworks };
  }

  // Process uncached episodes sequentially to avoid rate limits
  const batchSize = 1;
  let sawRateLimit = false;
  let sawPaymentRequired = false;

  for (let i = 0; i < uncachedEpisodes.length; i += batchSize) {
    const batch = uncachedEpisodes.slice(i, i + batchSize);
    const overallProgress = cachedCount + i;

    onProgress?.(
      overallProgress, 
      episodes.length, 
      `Extracting episode ${i + 1} of ${uncachedEpisodes.length} (${cachedCount} from cache)...`
    );

    const results = await Promise.allSettled(
      batch.map((episode) =>
        extractIntelligence({
          transcript: episode.transcript,
          episodeId: episode.id,
          guestName: episode.guest,
          episodeTitle: episode.title,
        })
      )
    );

    // Process results
    for (let idx = 0; idx < results.length; idx++) {
      const result = results[idx];
      const episode = batch[idx];
      
      if (result.status === 'rejected') {
        const reason = result.reason as any;
        const msg =
          typeof reason?.message === 'string'
            ? reason.message
            : typeof reason === 'string'
              ? reason
              : '';
        if (msg.includes('429') || msg.toLowerCase().includes('rate limited')) {
          sawRateLimit = true;
        }
        if (msg.includes('402') || msg.toLowerCase().includes('payment required')) {
          sawPaymentRequired = true;
        }
        console.warn(`Failed to extract from ${episode.id}:`, result.reason);
        continue;
      }

      const intelligence = result.value;
      
      // Cache the result for future runs
      await cacheIntelligence(
        episode.id,
        episode.guest,
        episode.title,
        intelligence
      );
      
      // Aggregate into maps
      aggregateIntelligence(intelligence, episode, companiesMap, frameworksMap);
    }

    // Stop early if we hit payment or rate limit issues
    if (sawPaymentRequired || sawRateLimit) {
      console.warn('Stopping extraction early due to rate limit or payment issue.');
      break;
    }

    // Delay between batches to avoid rate limits
    if (i + batchSize < uncachedEpisodes.length) {
      const jitter = Math.floor(Math.random() * 600);
      await new Promise((r) => setTimeout(r, 2500 + jitter));
    }
  }

  // Throw if we hit blocking issues so the UI can display an appropriate message
  if (sawPaymentRequired) {
    throw new Error('Payment required (402). Please add Lovable AI credits in Settings → Workspace → Usage.');
  }

  if (sawRateLimit) {
    throw new Error('Rate limited (429). Please wait a few minutes and try syncing again.');
  }

  // Convert maps to arrays and sort
  const companies = Array.from(companiesMap.values())
    .sort((a, b) => b.episode_count - a.episode_count);

  const frameworks = Array.from(frameworksMap.values())
    .sort((a, b) => b.mentioned_in.length - a.mentioned_in.length);

  return { companies, frameworks };
}

// ============================================
// LOAD FROM SUPABASE CACHE (no GitHub needed)
// ============================================

/**
 * Load and aggregate all intelligence directly from the Supabase cache.
 * This is the fastest path when data already exists in the database.
 */
export async function loadCachedCompaniesAndFrameworks(): Promise<{
  companies: CompanyIntelligence[];
  frameworks: Framework[];
}> {
  const cachedRecords = await loadAllCachedIntelligence();
  
  if (cachedRecords.length === 0) {
    return { companies: [], frameworks: [] };
  }
  
  const companiesMap = new Map<string, CompanyIntelligence>();
  const frameworksMap = new Map<string, Framework>();
  
  for (const record of cachedRecords) {
    // Create a minimal Episode-like object for aggregation
    const fakeEpisode = {
      id: record.episode_id,
      guest: record.guest_name,
      title: record.episode_title
    } as Episode;
    
    aggregateIntelligence(record.intelligence, fakeEpisode, companiesMap, frameworksMap);
  }
  
  const companies = Array.from(companiesMap.values())
    .sort((a, b) => b.episode_count - a.episode_count);
  
  const frameworks = Array.from(frameworksMap.values())
    .sort((a, b) => b.mentioned_in.length - a.mentioned_in.length);
  
  return { companies, frameworks };
}
