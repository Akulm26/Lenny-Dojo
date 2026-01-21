import { extractIntelligence, ExtractedIntelligence } from './ai';
import { Episode } from './github';

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
// EXTRACTION & AGGREGATION
// ============================================

export async function extractAllIntelligence(
  episodes: Episode[],
  onProgress?: (current: number, total: number, message: string) => void
): Promise<{ companies: CompanyIntelligence[]; frameworks: Framework[] }> {
  
  const companiesMap = new Map<string, CompanyIntelligence>();
  const frameworksMap = new Map<string, Framework>();

  // Process episodes sequentially to avoid rate limits
  const batchSize = 1;

  // If the backend starts rate limiting or requires payment, stop early and surface
  // a helpful error so the UI doesn't look "empty" with no explanation.
  let sawRateLimit = false;
  let sawPaymentRequired = false;

  for (let i = 0; i < episodes.length; i += batchSize) {
    const batch = episodes.slice(i, i + batchSize);

    onProgress?.(i, episodes.length, `Analyzing episode ${i + 1} of ${episodes.length}...`);

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
    results.forEach((result, idx) => {
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
        console.warn(`Failed to extract from ${batch[idx].id}:`, result.reason);
        return;
      }

      const intelligence = result.value;
      const episode = batch[idx];

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
    });

    // Delay between batches to avoid rate limits
    if (i + batchSize < episodes.length) {
      // A bit of jitter helps avoid "thundering herd" if multiple users sync at once.
      const jitter = Math.floor(Math.random() * 600);
      await new Promise((r) => setTimeout(r, 2500 + jitter));
    }
  }

  if (sawPaymentRequired) {
    throw new Error('Payment required (402). Please add funds to your Lovable AI workspace in Settings → Workspace → Usage.');
  }

  if (sawRateLimit) {
    throw new Error('AI rate limited (429). Please wait a few minutes and try syncing again.');
  }

  // Convert maps to arrays and sort
  const companies = Array.from(companiesMap.values())
    .sort((a, b) => b.episode_count - a.episode_count);

  const frameworks = Array.from(frameworksMap.values())
    .sort((a, b) => b.mentioned_in.length - a.mentioned_in.length);

  return { companies, frameworks };
}
