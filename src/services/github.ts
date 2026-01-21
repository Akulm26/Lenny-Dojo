const REPO_OWNER = 'ChatPRD';
const REPO_NAME = 'lennys-podcast-transcripts';
const BRANCH = 'main';

// ============================================
// TYPES
// ============================================

export interface EpisodeMetadata {
  id: string;
  guest: string;
  title: string;
  youtube_url: string;
  video_id: string;
  description: string;
  duration: string;
  duration_seconds: number;
  view_count: number;
  channel: string;
}

export interface Episode extends EpisodeMetadata {
  transcript: string;
  word_count: number;
  fetched_at: string;
}

export interface SyncStatus {
  status: 'idle' | 'checking' | 'syncing' | 'complete' | 'error';
  last_sync: string | null;
  last_commit_sha: string | null;
  total_episodes: number;
  latest_episode_date: string | null;
  error_message: string | null;
}

// ============================================
// CACHE MANAGEMENT
// ============================================

const CACHE_KEYS = {
  EPISODE_LIST: 'dojo_episode_list',
  SYNC_STATUS: 'dojo_sync_status',
  EPISODES_DATA: 'dojo_episodes_data',
  COMPANIES: 'dojo_companies',
  FRAMEWORKS: 'dojo_frameworks'
};

const CACHE_TTL = {
  EPISODE_LIST: 60 * 60 * 1000,      // 1 hour
  TRANSCRIPT: 24 * 60 * 60 * 1000,   // 24 hours
};

function getCached<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const { data, expiry } = JSON.parse(item);
    if (expiry && Date.now() > expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return data as T;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T, ttl?: number): void {
  try {
    const item = {
      data,
      expiry: ttl ? Date.now() + ttl : null
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (e) {
    console.warn('Cache write failed:', e);
  }
}

// ============================================
// GITHUB API FUNCTIONS
// ============================================

export async function fetchEpisodeList(): Promise<string[]> {
  // Check cache first
  const cached = getCached<string[]>(CACHE_KEYS.EPISODE_LIST);
  if (cached && cached.length > 0) {
    return cached;
  }

  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/episodes`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Lennys-Dojo'
    }
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Please wait a few minutes.');
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = await response.json();

  const episodes = data
    .filter((item: { type: string }) => item.type === 'dir')
    .map((item: { name: string }) => item.name)
    .sort();

  setCache(CACHE_KEYS.EPISODE_LIST, episodes, CACHE_TTL.EPISODE_LIST);

  return episodes;
}

export async function fetchTranscriptRaw(episodeId: string): Promise<string> {
  const cacheKey = `dojo_transcript_${episodeId}`;
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/episodes/${episodeId}/transcript.md`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch transcript for ${episodeId}: ${response.status}`);
  }

  const content = await response.text();
  setCache(cacheKey, content, CACHE_TTL.TRANSCRIPT);
  return content;
}

export function parseTranscript(content: string, episodeId: string): Episode {
  // Extract YAML frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  let metadata: Partial<EpisodeMetadata> = {};
  let transcript = content;

  if (frontmatterMatch) {
    const yamlContent = frontmatterMatch[1];
    transcript = frontmatterMatch[2].trim();

    // Parse YAML (simple key: value)
    yamlContent.split('\n').forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();

        // Remove surrounding quotes
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }

        // Type conversion
        if (key === 'duration_seconds' || key === 'view_count') {
          (metadata as Record<string, unknown>)[key] = parseInt(value, 10) || 0;
        } else {
          (metadata as Record<string, unknown>)[key] = value;
        }
      }
    });
  }

  // Create readable guest name from folder if not in metadata
  const guestName = metadata.guest || episodeId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    id: episodeId,
    guest: guestName,
    title: metadata.title || `Episode with ${guestName}`,
    youtube_url: metadata.youtube_url || '',
    video_id: metadata.video_id || '',
    description: metadata.description || '',
    duration: metadata.duration || '',
    duration_seconds: metadata.duration_seconds || 0,
    view_count: metadata.view_count || 0,
    channel: metadata.channel || "Lenny's Podcast",
    transcript,
    word_count: transcript.split(/\s+/).length,
    fetched_at: new Date().toISOString()
  };
}

export async function fetchAndParseEpisode(episodeId: string): Promise<Episode> {
  const raw = await fetchTranscriptRaw(episodeId);
  return parseTranscript(raw, episodeId);
}

export async function checkForUpdates(): Promise<{ hasUpdates: boolean; sha: string; date: string }> {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits/${BRANCH}`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Lennys-Dojo'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to check for updates');
  }

  const data = await response.json();
  const latestSha = data.sha;
  const commitDate = data.commit.committer.date;

  const syncStatus = getSyncStatus();
  const hasUpdates = latestSha !== syncStatus.last_commit_sha;

  return { hasUpdates, sha: latestSha, date: commitDate };
}

export function getSyncStatus(): SyncStatus {
  const cached = getCached<SyncStatus>(CACHE_KEYS.SYNC_STATUS);
  return cached || {
    status: 'idle',
    last_sync: null,
    last_commit_sha: null,
    total_episodes: 0,
    latest_episode_date: null,
    error_message: null
  };
}

export function updateSyncStatus(updates: Partial<SyncStatus>): void {
  const current = getSyncStatus();
  setCache(CACHE_KEYS.SYNC_STATUS, { ...current, ...updates });
}

export function getStoredEpisodes(): Episode[] {
  return getCached<Episode[]>(CACHE_KEYS.EPISODES_DATA) || [];
}

export function storeEpisodes(episodes: Episode[]): void {
  setCache(CACHE_KEYS.EPISODES_DATA, episodes);
}

export function getStoredCompanies<T>(): T[] {
  return getCached<T[]>(CACHE_KEYS.COMPANIES) || [];
}

export function storeCompanies<T>(companies: T[]): void {
  setCache(CACHE_KEYS.COMPANIES, companies);
}

export function getStoredFrameworks<T>(): T[] {
  return getCached<T[]>(CACHE_KEYS.FRAMEWORKS) || [];
}

export function storeFrameworks<T>(frameworks: T[]): void {
  setCache(CACHE_KEYS.FRAMEWORKS, frameworks);
}

export function clearAllCache(): void {
  Object.values(CACHE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  // Also clear individual transcript caches
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('dojo_transcript_')) {
      localStorage.removeItem(key);
    }
  });
}
