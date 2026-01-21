// Service to fetch practice data from the cached intelligence
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
 * Fetch a random company with rich context from the intelligence cache
 */
export async function getRandomCompanyContext(
  config: SessionConfig
): Promise<CompanyContext | null> {
  try {
    // Fetch all cached intelligence
    const { data, error } = await supabase
      .from('episode_intelligence_cache')
      .select('*');

    if (error || !data || data.length === 0) {
      console.error('No cached intelligence found:', error);
      return null;
    }

    // Build a list of companies with their contexts
    const companiesWithContext: CompanyContext[] = [];

    for (const row of data) {
      const intel = row.intelligence as any;
      if (!intel?.companies) continue;

      for (const company of intel.companies) {
        // Skip if filtering by company and doesn't match
        if (config.company && company.name.toLowerCase() !== config.company.toLowerCase()) {
          continue;
        }

        // Skip companies with no decisions or context
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
          decisions: decisions.slice(0, 5), // Limit to 5 decisions
          quotes: quotes.slice(0, 5), // Limit to 5 quotes
          guestName: row.guest_name,
          episodeTitle: row.episode_title,
        });
      }
    }

    if (companiesWithContext.length === 0) {
      console.warn('No companies with rich context found');
      return null;
    }

    // Pick a random company
    const randomIndex = Math.floor(Math.random() * companiesWithContext.length);
    return companiesWithContext[randomIndex];
  } catch (err) {
    console.error('Error fetching company context:', err);
    return null;
  }
}

/**
 * Generate a question using Lovable AI
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
    // Try to extract more specific error info
    const errorMessage = error.message || 'Failed to generate question';
    if (errorMessage.includes('429') || errorMessage.includes('rate')) {
      throw new Error('Rate limited. Please wait a moment and try again.');
    }
    if (errorMessage.includes('402') || errorMessage.includes('Payment')) {
      throw new Error('AI credits depleted. Please add funds in Settings.');
    }
    throw new Error(errorMessage);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

/**
 * Evaluate an answer using Lovable AI
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
    if (errorMessage.includes('429') || errorMessage.includes('rate')) {
      throw new Error('Rate limited. Please wait a moment and try again.');
    }
    if (errorMessage.includes('402') || errorMessage.includes('Payment')) {
      throw new Error('AI credits depleted. Please add funds in Settings.');
    }
    throw new Error(errorMessage);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}
