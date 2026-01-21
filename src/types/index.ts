// Lenny's Dojo Type Definitions

export type InterviewType =
  | 'behavioral'
  | 'product_sense'
  | 'product_design'
  | 'rca'
  | 'guesstimate'
  | 'tech'
  | 'ai_ml'
  | 'strategy'
  | 'metrics';

export type Difficulty = 'medium' | 'hard' | 'expert';

export type FrameworkCategory =
  | 'prioritization'
  | 'strategy'
  | 'growth'
  | 'metrics'
  | 'design'
  | 'execution'
  | 'leadership'
  | 'ai_ml';

export interface Episode {
  id: string;
  guest_name: string;
  episode_title: string;
  youtube_url: string;
  video_id: string;
  duration: string;
  duration_seconds: number;
  description: string;
  transcript?: string;
  processed_at?: string;
  word_count?: number;
}

export interface Company {
  id: string;
  name: string;
  mention_count: number;
  episodes: string[];
  decisions: Decision[];
  expert_opinions: ExpertOpinion[];
  related_frameworks: string[];
  question_count: Record<InterviewType, number>;
}

export interface Decision {
  id: string;
  decision: string;
  time_period: string | null;
  outcome: string;
  guest_opinion: string;
  quotes: Quote[];
  episode_id: string;
  guest_name: string;
}

export interface ExpertOpinion {
  opinion: string;
  context: string;
  guest_name: string;
  episode_id: string;
}

export interface Quote {
  text: string;
  guest_name: string;
  episode_id: string;
}

export interface Framework {
  id: string;
  name: string;
  creator: string | null;
  category: FrameworkCategory;
  description: string;
  when_to_use: string | null;
  example: string | null;
  episodes: string[];
  related_frameworks: string[];
}

export interface Question {
  id: string;
  type: InterviewType;
  company: string;
  difficulty: Difficulty;
  suggested_time_minutes: number;
  context_era: string | null;
  situation_brief: string;
  question: string;
  follow_ups: string[];
  model_answer: ModelAnswer;
  source_episode_id: string;
  source_guest: string;
}

export interface ModelAnswer {
  what_happened: string;
  key_reasoning: string;
  quotes: Quote[];
  frameworks_used: string[];
  full_answer: string;
}

export interface PracticeSession {
  id: string;
  started_at: string;
  ended_at: string;
  questions: AttemptedQuestion[];
}

export interface AttemptedQuestion {
  question_id: string;
  type: InterviewType;
  company: string;
  user_answer: string;
  overall_score: number;
  dimension_scores: DimensionScores;
  time_spent_seconds: number;
  attempted_at: string;
}

export interface DimensionScores {
  structure: number;
  insight: number;
  framework_usage: number;
  communication: number;
  outcome_orientation: number;
}

export interface EvaluationResult {
  overall_score: number;
  dimension_scores: {
    structure: { score: number; justification: string };
    insight: { score: number; justification: string };
    framework_usage: { score: number; justification: string };
    communication: { score: number; justification: string };
    outcome_orientation: { score: number; justification: string };
  };
  strengths: string[];
  areas_to_improve: string[];
  missed_elements: string[];
  suggested_quote: Quote;
  encouraging_note: string;
}

export interface TypeProgress {
  questions_attempted: number;
  average_score: number;
  recent_scores: number[];
  trend: 'improving' | 'stable' | 'declining';
}

export interface UserProgress {
  sessions: PracticeSession[];
  total_questions_attempted: number;
  total_practice_time_seconds: number;
  scores_by_type: Record<InterviewType, TypeProgress>;
  companies_practiced: string[];
  frameworks_encountered: string[];
  last_practice_at: string;
}

export interface SyncMetadata {
  last_commit_sha: string;
  last_sync_at: string;
  episodes_processed: string[];
  total_episodes: number;
  latest_episode_date: string;
  sync_status: 'synced' | 'syncing' | 'error';
  error_message: string | null;
}

export interface SessionConfig {
  company: string | null;
  interview_types: InterviewType[];
  difficulty: Difficulty;
  session_length: 1 | 3 | 5 | 9;
  timer_mode: 'none' | 'relaxed' | 'standard' | 'pressure';
}

// Interview type display info
export const INTERVIEW_TYPE_INFO: Record<InterviewType, { label: string; icon: string; color: string }> = {
  behavioral: { label: 'Behavioral', icon: '💬', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  product_sense: { label: 'Product Sense', icon: '🎯', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  product_design: { label: 'Product Design', icon: '✏️', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  rca: { label: 'RCA', icon: '🔍', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  guesstimate: { label: 'Guesstimate', icon: '📊', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  tech: { label: 'Tech Round', icon: '⚙️', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  ai_ml: { label: 'AI/ML', icon: '🤖', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  strategy: { label: 'Strategy', icon: '♟️', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  metrics: { label: 'Metrics', icon: '📈', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
};

export const DIFFICULTY_INFO: Record<Difficulty, { label: string; color: string }> = {
  medium: { label: 'Medium', color: 'bg-success-light text-success' },
  hard: { label: 'Hard', color: 'bg-warning-light text-warning' },
  expert: { label: 'Expert', color: 'bg-destructive/10 text-destructive' },
};
