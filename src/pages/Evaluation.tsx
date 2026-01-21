import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { 
  Loader2,
  ChevronDown,
  ChevronUp,
  Quote,
  ArrowRight,
  Home,
  Dumbbell,
  CheckCircle2,
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { INTERVIEW_TYPE_INFO } from '@/types';
import type { Question, EvaluationResult } from '@/types';
import { useProgressStore } from '@/stores/progressStore';

// Demo evaluation - in production this comes from AI
const DEMO_EVALUATION: EvaluationResult = {
  overall_score: 7.2,
  dimension_scores: {
    structure: { score: 8, justification: "Well-organized answer with clear problem framing and logical solution progression." },
    insight: { score: 7, justification: "Good understanding of marketplace dynamics, but could dig deeper into host psychology." },
    framework_usage: { score: 6, justification: "Mentioned prioritization but didn't explicitly use frameworks like RICE or North Star." },
    communication: { score: 8, justification: "Clear and concise communication. Easy to follow your reasoning." },
    outcome_orientation: { score: 7, justification: "Good focus on metrics, but could better articulate expected impact and success criteria." },
  },
  strengths: [
    "Strong problem framing that showed you understood the core challenge",
    "Good balance between quick wins and longer-term solutions",
  ],
  areas_to_improve: [
    "Explicitly reference PM frameworks to structure your approach",
    "Quantify expected impact when proposing solutions",
  ],
  missed_elements: [
    "The importance of professional photography (2.5x booking improvement)",
    "Setting realistic host expectations during onboarding",
  ],
  suggested_quote: {
    text: "The first booking is everything. It's not just revenue - it's validation that this can work for them.",
    guest_name: "Brian Chesky",
    episode_id: "brian-chesky-1"
  },
  encouraging_note: "Strong answer! You're building good PM instincts. A few more practice rounds focusing on frameworks will take you to the next level."
};

const ScoreBar = ({ score, label }: { score: number; label: string }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-sm">
      <span>{label}</span>
      <span className="font-medium">{score}/10</span>
    </div>
    <div className="score-bar">
      <div
        className={cn(
          'score-bar-fill',
          score >= 8 ? 'bg-success' : score >= 6 ? 'bg-primary' : 'bg-warning'
        )}
        style={{ width: `${score * 10}%` }}
      />
    </div>
  </div>
);

export default function Evaluation() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { question, answer, timeSpent } = location.state || {};
  
  const [isLoading, setIsLoading] = useState(true);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [showWhatHappened, setShowWhatHappened] = useState(false);
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  
  const { addAttempt, endSession } = useProgressStore();
  
  useEffect(() => {
    if (!question || !answer) {
      navigate('/practice');
      return;
    }
    
    // Simulate AI evaluation
    const timer = setTimeout(() => {
      setEvaluation(DEMO_EVALUATION);
      setIsLoading(false);
      
      // Record the attempt
      addAttempt({
        question_id: question.id,
        type: question.type,
        company: question.company,
        user_answer: answer,
        overall_score: DEMO_EVALUATION.overall_score,
        dimension_scores: {
          structure: DEMO_EVALUATION.dimension_scores.structure.score,
          insight: DEMO_EVALUATION.dimension_scores.insight.score,
          framework_usage: DEMO_EVALUATION.dimension_scores.framework_usage.score,
          communication: DEMO_EVALUATION.dimension_scores.communication.score,
          outcome_orientation: DEMO_EVALUATION.dimension_scores.outcome_orientation.score,
        },
        time_spent_seconds: timeSpent || 0,
        attempted_at: new Date().toISOString(),
      });
      
      endSession();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [question, answer, navigate, addAttempt, endSession, timeSpent]);
  
  if (isLoading) {
    return (
      <Layout showFooter={false}>
        <div className="container py-16 md:py-24">
          <div className="max-w-md mx-auto text-center">
            <div className="p-4 rounded-full bg-primary/10 text-primary w-fit mx-auto mb-6">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <h2 className="text-xl font-semibold mb-4">📊 Evaluating your answer...</h2>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Reading your response
              </p>
              <p className="flex items-center justify-center gap-2 animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin" />
                Comparing with expert insights
              </p>
              <p className="text-muted-foreground/50">
                Generating feedback
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!evaluation) return null;
  
  const typeInfo = INTERVIEW_TYPE_INFO[question.type];
  
  const getScoreMessage = (score: number) => {
    if (score >= 9) return "Exceptional. You think like the best PMs.";
    if (score >= 7) return "Strong answer. A few refinements and you're there.";
    if (score >= 5) return "Good foundation. Let's sharpen your approach.";
    if (score >= 3) return "Keep practicing. Every master started here.";
    return "This framework might help you structure better.";
  };
  
  return (
    <Layout showFooter={false}>
      <div className="container py-6 md:py-10 max-w-3xl">
        {/* Score Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <span className="text-3xl font-bold text-primary animate-count-up">
              {evaluation.overall_score.toFixed(1)}
            </span>
            <span className="text-lg text-muted-foreground">/10</span>
          </div>
          <p className="text-muted-foreground">{getScoreMessage(evaluation.overall_score)}</p>
        </div>
        
        {/* Dimension Breakdown */}
        <div className="p-5 rounded-xl border border-border bg-card mb-6">
          <h3 className="font-semibold mb-4">Dimension Breakdown</h3>
          <div className="space-y-4">
            <ScoreBar score={evaluation.dimension_scores.structure.score} label="Structure" />
            <ScoreBar score={evaluation.dimension_scores.insight.score} label="Insight" />
            <ScoreBar score={evaluation.dimension_scores.framework_usage.score} label="Framework Usage" />
            <ScoreBar score={evaluation.dimension_scores.communication.score} label="Communication" />
            <ScoreBar score={evaluation.dimension_scores.outcome_orientation.score} label="Outcome Orientation" />
          </div>
        </div>
        
        {/* Strengths and Improvements */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="p-5 rounded-xl border border-success/30 bg-success-light">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-success">
              <CheckCircle2 className="h-5 w-5" />
              What You Did Well
            </h3>
            <ul className="space-y-2 text-sm">
              {evaluation.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-success">•</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="p-5 rounded-xl border border-warning/30 bg-warning-light">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-warning">
              <AlertCircle className="h-5 w-5" />
              How to Improve
            </h3>
            <ul className="space-y-2 text-sm">
              {evaluation.areas_to_improve.map((a, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-warning">•</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Insight Quote */}
        <div className="p-5 rounded-xl border border-primary/30 bg-primary/5 mb-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Insight from the Dojo
          </h3>
          <blockquote className="quote-block text-sm">
            "{evaluation.suggested_quote.text}"
          </blockquote>
          <p className="text-sm text-muted-foreground mt-2">
            — {evaluation.suggested_quote.guest_name}
          </p>
        </div>
        
        {/* What Actually Happened */}
        <button
          onClick={() => setShowWhatHappened(!showWhatHappened)}
          className="w-full p-4 rounded-lg border border-border bg-card hover:bg-surface transition-colors flex items-center justify-between mb-3"
        >
          <span className="font-medium">📊 What the Guest Said Happened</span>
          {showWhatHappened ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
        
        {showWhatHappened && question.model_answer && (
          <div className="p-5 rounded-lg border border-border bg-surface mb-6 animate-fade-in">
            <p className="text-sm text-muted-foreground mb-2">
              According to {question.source_guest}:
            </p>
            <p className="text-sm mb-4">{question.model_answer.what_happened}</p>
            <p className="text-xs text-muted-foreground italic">
              ⚠ This reflects the guest's perspective as shared on the podcast.
            </p>
          </div>
        )}
        
        {/* Model Answer */}
        <button
          onClick={() => setShowModelAnswer(!showModelAnswer)}
          className="w-full p-4 rounded-lg border border-border bg-card hover:bg-surface transition-colors flex items-center justify-between mb-6"
        >
          <span className="font-medium">📝 View Model Answer</span>
          {showModelAnswer ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
        
        {showModelAnswer && question.model_answer && (
          <div className="p-5 rounded-lg border border-border bg-surface mb-6 animate-fade-in">
            <h4 className="font-medium mb-2">Key Reasoning</h4>
            <p className="text-sm mb-4">{question.model_answer.key_reasoning}</p>
            
            {question.model_answer.frameworks_used?.length > 0 && (
              <>
                <h4 className="font-medium mb-2">Frameworks Used</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  {question.model_answer.frameworks_used.map((fw, i) => (
                    <span key={i} className="px-2 py-1 rounded text-xs bg-muted">
                      {fw}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Encouraging Note */}
        <p className="text-center text-muted-foreground mb-8">
          {evaluation.encouraging_note}
        </p>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/practice">
            <Button className="btn-primary-gradient gap-2 w-full sm:w-auto">
              <Dumbbell className="h-4 w-4" />
              Continue Training
            </Button>
          </Link>
          
          <Link to="/">
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
