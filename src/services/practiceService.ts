// Service to fetch practice data from the pre-generated question bank
import { supabase } from '@/integrations/supabase/client';
import type { InterviewType, Difficulty, SessionConfig } from '@/types';
import type { GeneratedQuestion, AnswerEvaluation } from './ai';

export interface CompanyContext {
  companyName: string;
  companyContext: string;
  decisions: string[];
  quotes: string[];
  guestName: string;
  episodeTitle: string;
}

/**
 * Fetch a random pre-generated question from the question bank.
 * No AI calls needed — questions are pre-generated during sync.
 */
export async function getRandomQuestion(
  config: SessionConfig
): Promise<GeneratedQuestion | null> {
  try {
    // Build query with filters
    let query = supabase
      .from('question_bank')
      .select('*');

    // Filter by interview type
    if (config.interview_types?.length > 0) {
      query = query.in('interview_type', config.interview_types);
    }

    // Filter by difficulty
    if (config.difficulty) {
      query = query.eq('difficulty', config.difficulty);
    }

    // Filter by company if specified
    if (config.company) {
      query = query.ilike('company_name', config.company);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Question bank query error:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.warn('No questions found in question bank matching filters');
      return null;
    }

    // Pick a random question
    const randomIndex = Math.floor(Math.random() * data.length);
    const row = data[randomIndex];

    // The question JSONB column contains the full GeneratedQuestion structure
    return row.question as unknown as GeneratedQuestion;
  } catch (err) {
    console.error('Error fetching from question bank:', err);
    return null;
  }
}

/**
 * Legacy: Fetch a random company context from cache (still used for fallback)
 */
export async function getRandomCompanyContext(
  config: SessionConfig
): Promise<CompanyContext | null> {
  try {
    const { data, error } = await supabase
      .from('episode_intelligence_cache')
      .select('*');

    if (error || !data || data.length === 0) {
      console.error('No cached intelligence found:', error);
      return null;
    }

    const companiesWithContext: CompanyContext[] = [];

    for (const row of data) {
      const intel = row.intelligence as any;
      if (!intel?.companies) continue;

      for (const company of intel.companies) {
        if (config.company && company.name.toLowerCase() !== config.company.toLowerCase()) {
          continue;
        }

        if (!company.decisions?.length && !company.opinions?.length) continue;

        const decisions = (company.decisions || []).map((d: any) => 
          `${d.what}${d.why ? ` (Why: ${d.why})` : ''}${d.outcome ? ` → ${d.outcome}` : ''}`
        );

        const quotes = (company.decisions || [])
          .filter((d: any) => d.quote)
          .map((d: any) => d.quote)
          .concat((company.opinions || []).filter((o: any) => o.quote).map((o: any) => o.quote));

        if (decisions.length === 0 && quotes.length === 0) continue;

        companiesWithContext.push({
          companyName: company.name,
          companyContext: company.mention_context || `${company.name} as discussed by ${row.guest_name}`,
          decisions: decisions.slice(0, 5),
          quotes: quotes.slice(0, 5),
          guestName: row.guest_name,
          episodeTitle: row.episode_title,
        });
      }
    }

    if (companiesWithContext.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * companiesWithContext.length);
    return companiesWithContext[randomIndex];
  } catch (err) {
    console.error('Error fetching company context:', err);
    return null;
  }
}

/**
 * Generate a question using AI (fallback when question bank is empty)
 */
export async function generateQuestion(
  interviewType: InterviewType,
  difficulty: Difficulty,
  context: CompanyContext
): Promise<GeneratedQuestion> {
  const { data, error } = await supabase.functions.invoke('generate-question', {
    body: {
      interviewType,
      difficulty,
      companyName: context.companyName,
      companyContext: context.companyContext,
      decisions: context.decisions,
      quotes: context.quotes,
      guestName: context.guestName,
      episodeTitle: context.episodeTitle,
    }
  });

  if (error) {
    console.error('Generate question error:', error);
    const errorMessage = error.message || 'Failed to generate question';
    throw new Error(errorMessage);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

/**
 * Evaluate an answer using AI (BYOK - requires user's own API key)
 */
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
    const errorMessage = error.message || 'Failed to evaluate answer';
    throw new Error(errorMessage);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}
