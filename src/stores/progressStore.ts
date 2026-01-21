import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProgress, InterviewType, TypeProgress, PracticeSession, AttemptedQuestion } from '@/types';

const defaultTypeProgress: TypeProgress = {
  questions_attempted: 0,
  average_score: 0,
  recent_scores: [],
  trend: 'stable',
};

const defaultProgress: UserProgress = {
  sessions: [],
  total_questions_attempted: 0,
  total_practice_time_seconds: 0,
  scores_by_type: {
    behavioral: { ...defaultTypeProgress },
    product_sense: { ...defaultTypeProgress },
    product_design: { ...defaultTypeProgress },
    rca: { ...defaultTypeProgress },
    guesstimate: { ...defaultTypeProgress },
    tech: { ...defaultTypeProgress },
    ai_ml: { ...defaultTypeProgress },
    strategy: { ...defaultTypeProgress },
    metrics: { ...defaultTypeProgress },
  },
  companies_practiced: [],
  frameworks_encountered: [],
  last_practice_at: '',
};

interface ProgressStore {
  progress: UserProgress;
  currentSession: PracticeSession | null;
  startSession: () => void;
  endSession: () => void;
  addAttempt: (attempt: AttemptedQuestion) => void;
  clearProgress: () => void;
  getReadinessScore: () => number;
  getRecommendations: () => string[];
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      progress: defaultProgress,
      currentSession: null,
      
      startSession: () => {
        const newSession: PracticeSession = {
          id: `session-${Date.now()}`,
          started_at: new Date().toISOString(),
          ended_at: '',
          questions: [],
        };
        set({ currentSession: newSession });
      },
      
      endSession: () => {
        const { currentSession, progress } = get();
        if (currentSession && currentSession.questions.length > 0) {
          const completedSession: PracticeSession = {
            ...currentSession,
            ended_at: new Date().toISOString(),
          };
          set({
            progress: {
              ...progress,
              sessions: [...progress.sessions, completedSession],
              last_practice_at: new Date().toISOString(),
            },
            currentSession: null,
          });
        } else {
          set({ currentSession: null });
        }
      },
      
      addAttempt: (attempt) => {
        const { currentSession, progress } = get();
        if (!currentSession) return;
        
        // Update current session
        const updatedSession: PracticeSession = {
          ...currentSession,
          questions: [...currentSession.questions, attempt],
        };
        
        // Update type progress
        const typeProgress = { ...progress.scores_by_type[attempt.type] };
        typeProgress.questions_attempted += 1;
        typeProgress.recent_scores = [attempt.overall_score, ...typeProgress.recent_scores].slice(0, 5);
        typeProgress.average_score = typeProgress.recent_scores.reduce((a, b) => a + b, 0) / typeProgress.recent_scores.length;
        
        // Calculate trend
        if (typeProgress.recent_scores.length >= 3) {
          const firstHalf = typeProgress.recent_scores.slice(0, Math.floor(typeProgress.recent_scores.length / 2));
          const secondHalf = typeProgress.recent_scores.slice(Math.floor(typeProgress.recent_scores.length / 2));
          const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
          const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
          
          if (avgFirst > avgSecond + 0.5) {
            typeProgress.trend = 'improving';
          } else if (avgSecond > avgFirst + 0.5) {
            typeProgress.trend = 'declining';
          } else {
            typeProgress.trend = 'stable';
          }
        }
        
        // Update companies practiced
        const companiesPracticed = progress.companies_practiced.includes(attempt.company)
          ? progress.companies_practiced
          : [...progress.companies_practiced, attempt.company];
        
        set({
          currentSession: updatedSession,
          progress: {
            ...progress,
            total_questions_attempted: progress.total_questions_attempted + 1,
            total_practice_time_seconds: progress.total_practice_time_seconds + attempt.time_spent_seconds,
            scores_by_type: {
              ...progress.scores_by_type,
              [attempt.type]: typeProgress,
            },
            companies_practiced: companiesPracticed,
            last_practice_at: new Date().toISOString(),
          },
        });
      },
      
      clearProgress: () => {
        set({ progress: defaultProgress, currentSession: null });
      },
      
      getReadinessScore: () => {
        const { progress } = get();
        const interviewTypes: InterviewType[] = [
          'behavioral', 'product_sense', 'product_design', 'rca',
          'guesstimate', 'tech', 'ai_ml', 'strategy', 'metrics'
        ];
        
        // Coverage: Have all 9 interview types been practiced?
        const typesPracticed = interviewTypes.filter(
          type => progress.scores_by_type[type].questions_attempted > 0
        ).length;
        const coverageScore = (typesPracticed / 9) * 100;
        
        // Depth: Minimum 3 questions per type?
        const avgQuestionsPerType = interviewTypes.reduce(
          (sum, type) => sum + progress.scores_by_type[type].questions_attempted, 0
        ) / 9;
        const depthScore = Math.min(avgQuestionsPerType / 3, 1) * 100;
        
        // Performance: Average score across all attempts
        const allScores = interviewTypes.flatMap(
          type => progress.scores_by_type[type].recent_scores
        );
        const avgScore = allScores.length > 0
          ? allScores.reduce((a, b) => a + b, 0) / allScores.length
          : 0;
        const performanceScore = (avgScore / 10) * 100;
        
        // Trend: Is performance improving?
        const trends = interviewTypes.map(type => progress.scores_by_type[type].trend);
        const improvingCount = trends.filter(t => t === 'improving').length;
        const decliningCount = trends.filter(t => t === 'declining').length;
        let trendScore = 70;
        if (improvingCount > decliningCount) trendScore = 100;
        if (decliningCount > improvingCount) trendScore = 40;
        
        const readiness = (coverageScore * 0.3) + (depthScore * 0.2) + (performanceScore * 0.3) + (trendScore * 0.2);
        
        return Math.round(readiness);
      },
      
      getRecommendations: () => {
        const { progress } = get();
        const recommendations: string[] = [];
        const interviewTypes: InterviewType[] = [
          'behavioral', 'product_sense', 'product_design', 'rca',
          'guesstimate', 'tech', 'ai_ml', 'strategy', 'metrics'
        ];
        
        // Find unpracticed types
        const unpracticed = interviewTypes.filter(
          type => progress.scores_by_type[type].questions_attempted === 0
        );
        if (unpracticed.length > 0) {
          recommendations.push(
            `You haven't practiced ${unpracticed[0].replace('_', ' ')} yet — it's common in PM interviews`
          );
        }
        
        // Find weakest types
        const practiced = interviewTypes
          .filter(type => progress.scores_by_type[type].questions_attempted > 0)
          .sort((a, b) => progress.scores_by_type[a].average_score - progress.scores_by_type[b].average_score);
        
        if (practiced.length > 0 && progress.scores_by_type[practiced[0]].average_score < 7) {
          recommendations.push(
            `${practiced[0].replace('_', ' ')} is your weakest area — try a few more questions`
          );
        }
        
        // Find improving types
        const improving = interviewTypes.find(
          type => progress.scores_by_type[type].trend === 'improving'
        );
        if (improving) {
          recommendations.push(
            `Your ${improving.replace('_', ' ')} scores are improving! Keep practicing`
          );
        }
        
        return recommendations.slice(0, 3);
      },
    }),
    {
      name: 'lenny-dojo-progress',
    }
  )
);
