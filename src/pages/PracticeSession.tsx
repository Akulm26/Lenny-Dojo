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
  Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { INTERVIEW_TYPE_INFO, DIFFICULTY_INFO } from '@/types';
import type { InterviewType, Difficulty, SessionConfig, Question } from '@/types';
import { useProgressStore } from '@/stores/progressStore';

// Demo question for MVP - in production this comes from AI
const DEMO_QUESTION: Partial<Question> = {
  id: 'demo-1',
  type: 'product_sense',
  company: 'Airbnb',
  difficulty: 'medium',
  suggested_time_minutes: 25,
  context_era: '2015',
  situation_brief: `In 2015, Airbnb was experiencing explosive growth but facing a critical challenge. Brian Chesky shared on the podcast that they noticed a troubling pattern: first-time hosts were struggling to get their first booking, with many giving up after just a few weeks.

The data showed that hosts who got their first booking within 2 weeks had a 70% retention rate, while those who waited longer than a month had only a 20% retention rate. The team was debating several approaches to solve this "cold start" problem.

The marketplace had about 500,000 listings at the time, but roughly 40% of new hosts were churning before ever making money on the platform.`,
  question: `How would you approach solving Airbnb's host "cold start" problem? Walk me through your thinking on how to help new hosts get their first booking faster.`,
  follow_ups: [
    "What metrics would you use to measure success?",
    "How would you prioritize between different solution approaches?",
    "What are the potential risks of your proposed solution?",
  ],
  source_episode_id: 'brian-chesky-1',
  source_guest: 'Brian Chesky',
  model_answer: {
    what_happened: `Airbnb implemented several key initiatives. They created a "Superhost" instant booking feature that reduced friction. They also introduced professional photography services for new hosts, which increased booking rates by 2.5x. Most importantly, they redesigned the new host onboarding to set realistic expectations and provide guidance on competitive pricing.`,
    key_reasoning: `Brian emphasized focusing on the "moment of truth" - the first booking experience. They learned that host quality signals (photos, reviews) mattered more than they initially thought. The approach was to remove friction and build host confidence simultaneously.`,
    quotes: [
      { text: "The first booking is everything. It's not just revenue - it's validation that this can work for them.", guest_name: 'Brian Chesky', episode_id: 'brian-chesky-1' }
    ],
    frameworks_used: ['North Star Metric', 'Jobs to Be Done'],
    full_answer: 'Focus on reducing time-to-first-booking as the key metric...',
  },
};

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
  const [question, setQuestion] = useState<Partial<Question> | null>(null);
  const [answer, setAnswer] = useState('');
  const [showFollowUps, setShowFollowUps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { startSession, addAttempt } = useProgressStore();
  
  // Load question on mount
  useEffect(() => {
    startSession();
    
    // Simulate loading
    const timer = setTimeout(() => {
      setQuestion(DEMO_QUESTION);
      setIsLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Timer
  useEffect(() => {
    if (!isLoading && !isSubmitting) {
      timerRef.current = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoading, isSubmitting]);
  
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
              Crafting a scenario from {DEMO_QUESTION.source_guest}'s experience
            </p>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!question) {
    return (
      <Layout showFooter={false}>
        <div className="container py-16 text-center">
          <p>Something went wrong. Please try again.</p>
          <Button onClick={() => navigate('/practice')} className="mt-4">
            Back to Practice
          </Button>
        </div>
      </Layout>
    );
  }
  
  const typeInfo = INTERVIEW_TYPE_INFO[question.type as InterviewType];
  const diffInfo = DIFFICULTY_INFO[question.difficulty as Difficulty];
  
  return (
    <Layout showFooter={false}>
      <div className="container py-6 md:py-10 max-w-4xl">
        {/* Header badges */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className={cn('interview-badge', typeInfo.color)}>
            {typeInfo.icon} {typeInfo.label}
          </span>
          <span className="interview-badge bg-muted border-border">
            <Building2 className="h-3 w-3" />
            {question.company}
          </span>
          <span className={cn('interview-badge', diffInfo.color)}>
            {diffInfo.label}
          </span>
          <span className="interview-badge bg-muted border-border">
            <Clock className="h-3 w-3" />
            ~{question.suggested_time_minutes} mins
          </span>
          <span className="ml-auto font-mono text-sm text-muted-foreground">
            {formatTime(timeSpent)}
          </span>
        </div>
        
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
            {question.follow_ups?.map((fu, i) => (
              <li key={i} className="text-sm text-muted-foreground">• {fu}</li>
            ))}
          </ul>
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
