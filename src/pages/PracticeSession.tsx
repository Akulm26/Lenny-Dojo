import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowRight, 
  Clock, 
  Building2, 
  Loader2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Send,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { INTERVIEW_TYPE_INFO, DIFFICULTY_INFO } from '@/types';
import type { InterviewType, Difficulty, SessionConfig } from '@/types';
import { useProgressStore } from '@/stores/progressStore';
import { getRandomQuestion, getRandomCompanyContext, generateQuestion, CompanyContext } from '@/services/practiceService';
import type { GeneratedQuestion } from '@/services/ai';
import { toast } from 'sonner';

export default function PracticeSession() {
  const location = useLocation();
  const navigate = useNavigate();
  const config = (location.state?.config as SessionConfig) || {
    company: null,
    interview_types: ['product_sense'],
    difficulty: 'medium',
    session_length: 1,
    timer_mode: 'none',
  };
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Finding a scenario from the podcast archive...');
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState<GeneratedQuestion | null>(null);
  const [companyContext, setCompanyContext] = useState<CompanyContext | null>(null);
  const [answer, setAnswer] = useState('');
  const [showFollowUps, setShowFollowUps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { startSession } = useProgressStore();
  
  // Load question on mount
  useEffect(() => {
    startSession();
    loadQuestion();
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
  
  const loadQuestion = async () => {
    setIsLoading(true);
    setError(null);
    setLoadingMessage('Finding a practice question...');
    
    try {
      // Step 1: Try the pre-generated question bank (no AI needed)
      const bankQuestion = await getRandomQuestion(config);
      
      if (bankQuestion) {
        setQuestion(bankQuestion);
        setCompanyContext({
          companyName: bankQuestion.company,
          companyContext: '',
          decisions: [],
          quotes: [],
          guestName: bankQuestion.source?.guest_name || '',
          episodeTitle: bankQuestion.source?.episode_title || '',
        });
        setIsLoading(false);
        return;
      }
      
      // Step 2: Fallback to AI generation if question bank is empty
      setLoadingMessage('No pre-generated questions found. Generating with AI...');
      
      const context = await getRandomCompanyContext(config);
      
      if (!context) {
        throw new Error('No practice scenarios available. Please sync the data first.');
      }
      
      setCompanyContext(context);
      setLoadingMessage(`Crafting a question about ${context.companyName}...`);
      
      const randomType = config.interview_types[
        Math.floor(Math.random() * config.interview_types.length)
      ];
      
      const generatedQuestion = await generateQuestion(
        randomType,
        config.difficulty,
        context
      );
      
      setQuestion(generatedQuestion);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load question:', err);
      const message = err instanceof Error ? err.message : 'Failed to load question';
      setError(message);
      setIsLoading(false);
      toast.error(message);
    }
  };
  
  // Timer
  useEffect(() => {
    if (!isLoading && !isSubmitting && !error) {
      timerRef.current = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoading, isSubmitting, error]);
  
  const handleSubmit = async () => {
    if (!answer.trim() || !question) return;
    
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Navigate to evaluation page with data
    navigate('/practice/evaluate', {
      state: {
        question,
        answer,
        timeSpent,
        config,
        companyContext,
      }
    });
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (isLoading) {
    return (
      <Layout showFooter={false}>
        <div className="container py-16 md:py-24">
          <div className="max-w-md mx-auto text-center">
            <div className="p-4 rounded-full bg-primary/10 text-primary w-fit mx-auto mb-6 animate-pulse">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <h2 className="text-xl font-semibold mb-2">🎯 Preparing your challenge...</h2>
            <p className="text-muted-foreground">
              {loadingMessage}
            </p>
            {companyContext && (
              <p className="text-sm text-muted-foreground mt-2">
                Based on {companyContext.guestName}'s insights
              </p>
            )}
          </div>
        </div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout showFooter={false}>
        <div className="container py-16 text-center">
          <div className="p-4 rounded-full bg-destructive/10 text-destructive w-fit mx-auto mb-6">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Couldn't load question</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={loadQuestion} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" onClick={() => navigate('/practice')}>
              Back to Practice
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!question) return null;
  
  const typeInfo = INTERVIEW_TYPE_INFO[question.type as InterviewType];
  const diffInfo = DIFFICULTY_INFO[question.difficulty as Difficulty];
  
  return (
    <Layout showFooter={false}>
      <div className="container py-6 md:py-10 max-w-4xl">
        {/* Header badges */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className={cn('interview-badge', typeInfo?.color)}>
            {typeInfo?.icon} {typeInfo?.label}
          </span>
          <span className="interview-badge bg-muted border-border">
            <Building2 className="h-3 w-3" />
            {question.company}
          </span>
          <span className={cn('interview-badge', diffInfo?.color)}>
            {diffInfo?.label}
          </span>
          <span className="interview-badge bg-muted border-border">
            <Clock className="h-3 w-3" />
            ~{question.suggested_time_minutes} mins
          </span>
          <span className="ml-auto font-mono text-sm text-muted-foreground">
            {formatTime(timeSpent)}
          </span>
        </div>
        
        {/* Source info */}
        {question.source && (
          <p className="text-xs text-muted-foreground mb-4">
            Based on "{question.source.episode_title}" with {question.source.guest_name}
          </p>
        )}
        
        {/* Situation */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
            📋 SITUATION
          </h2>
          <div className="p-4 rounded-lg bg-surface border border-border">
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {question.situation_brief}
            </p>
          </div>
        </div>
        
        {/* Question */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
            ❓ YOUR CHALLENGE
          </h2>
          <p className="text-lg font-medium">
            {question.question}
          </p>
        </div>
        
        {/* Follow-ups hint */}
        {question.follow_ups && question.follow_ups.length > 0 && (
          <>
            <button
              onClick={() => setShowFollowUps(!showFollowUps)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <Lightbulb className="h-4 w-4" />
              Interviewer may ask...
              {showFollowUps ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            
            {showFollowUps && (
              <ul className="mb-6 space-y-2 pl-4 border-l-2 border-muted animate-fade-in">
                {question.follow_ups.map((fu, i) => (
                  <li key={i} className="text-sm text-muted-foreground">• {fu}</li>
                ))}
              </ul>
            )}
          </>
        )}
        
        {/* Answer input */}
        <div className="space-y-3">
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here. Be structured, reference frameworks, and think out loud..."
            className="min-h-[200px] md:min-h-[250px] resize-y"
          />
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {answer.length} characters
              {answer.length < 200 && answer.length > 0 && (
                <span className="text-warning"> (aim for 500+ for a thorough answer)</span>
              )}
            </span>
            
            <Button
              onClick={handleSubmit}
              disabled={!answer.trim() || isSubmitting}
              className="btn-primary-gradient gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Answer
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
