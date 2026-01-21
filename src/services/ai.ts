import { supabase } from '@/integrations/supabase/client';

// ============================================
// TYPES
// ============================================

export interface GeneratedQuestion {
  id: string;
  type: string;
  company: string;
  difficulty: string;
  suggested_time_minutes: number;
  situation_brief: string;
  question: string;
  follow_ups: string[];
  model_answer: {
    what_happened: string;
    key_reasoning: string;
    key_quote: string;
    frameworks_mentioned: string[];
    full_answer: string;
  };
  source: {
    episode_title: string;
    guest_name: string;
  };
}

export interface AnswerEvaluation {
  overall_score: number;
  dimension_scores: {
    structure: { score: number; feedback: string };
    insight: { score: number; feedback: string };
    framework_usage: { score: number; feedback: string };
    communication: { score: number; feedback: string };
    outcome_orientation: { score: number; feedback: string };
  };
  strengths: string[];
  improvements: string[];
  missed_from_podcast: string[];
  quote_to_remember: {
    text: string;
    why_it_matters: string;
  };
  encouragement: string;
}

export interface ExtractedIntelligence {
  companies: Array<{
    name: string;
    is_guest_company: boolean;
    mention_context: string;
    decisions: Array<{
      what: string;
      when: string | null;
      why: string;
      outcome: string;
      quote: string;
    }>;
    opinions: Array<{
      opinion: string;
      quote: string;
    }>;
    metrics_mentioned: string[];
  }>;
  frameworks: Array<{
    name: string;
    creator: string;
    category: string;
    explanation: string;
    when_to_use: string;
    example: string;
    quote: string;
  }>;
  question_seeds: Array<{
    type: string;
    company: string;
    situation: string;
    what_happened: string;
    usable_quotes: string[];
  }>;
  memorable_quotes: Array<{
    quote: string;
    topic: string;
    context: string;
  }>;
  _source: {
    episode_id: string;
    guest_name: string;
    episode_title: string;
    extracted_at: string;
  };
}

// ============================================
// API FUNCTIONS
// ============================================

export async function generateQuestion(params: {
  interviewType: string;
  difficulty: string;
  companyName: string;
  companyContext: string;
  decisions: string[];
  quotes: string[];
  guestName: string;
  episodeTitle: string;
}): Promise<GeneratedQuestion> {
  const { data, error } = await supabase.functions.invoke('generate-question', {
    body: params
  });

  if (error) {
    console.error('Generate question error:', error);
    throw new Error(error.message || 'Failed to generate question');
  }

  return data;
}

export async function evaluateAnswer(params: {
  question: string;
  situationBrief: string;
  userAnswer: string;
  modelAnswer: GeneratedQuestion['model_answer'];
  interviewType: string;
  guestName: string;
  episodeTitle: string;
}): Promise<AnswerEvaluation> {
  const { data, error } = await supabase.functions.invoke('evaluate-answer', {
    body: params
  });

  if (error) {
    console.error('Evaluate answer error:', error);
    throw new Error(error.message || 'Failed to evaluate answer');
  }

  return data;
}

export async function extractIntelligence(params: {
  transcript: string;
  episodeId: string;
  guestName: string;
  episodeTitle: string;
}): Promise<ExtractedIntelligence> {
  const { data, error } = await supabase.functions.invoke('extract-intelligence', {
    body: params
  });

  if (error) {
    console.error('Extract intelligence error:', error);
    throw new Error(error.message || 'Failed to extract intelligence');
  }

  return data;
}
