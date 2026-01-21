import { Layout } from '@/components/layout/Layout';
import { useProgressStore } from '@/stores/progressStore';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  BarChart3,
  Dumbbell,
  Clock,
  Building2,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { INTERVIEW_TYPE_INFO, type InterviewType } from '@/types';

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const TrendIcon = ({ trend }: { trend: 'improving' | 'stable' | 'declining' }) => {
  switch (trend) {
    case 'improving':
      return <TrendingUp className="h-4 w-4 text-success" />;
    case 'declining':
      return <TrendingDown className="h-4 w-4 text-destructive" />;
    default:
      return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
};

const ALL_TYPES: InterviewType[] = [
  'behavioral', 'product_sense', 'product_design', 'rca',
  'guesstimate', 'tech', 'ai_ml', 'strategy', 'metrics'
];

export default function Progress() {
  const { progress, getReadinessScore, getRecommendations, clearProgress } = useProgressStore();
  
  const readinessScore = getReadinessScore();
  const recommendations = getRecommendations();
  const hasPracticed = progress.total_questions_attempted > 0;
  
  // Calculate stats
  const typesPracticed = ALL_TYPES.filter(
    type => progress.scores_by_type[type].questions_attempted > 0
  ).length;
  
  if (!hasPracticed) {
    return (
      <Layout>
        <div className="container py-16 md:py-24">
          <div className="max-w-md mx-auto text-center">
            <div className="p-4 rounded-full bg-primary/10 text-primary w-fit mx-auto mb-6">
              <BarChart3 className="h-12 w-12" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Your dojo awaits</h1>
            <p className="text-muted-foreground mb-6">
              You haven't started training yet. 284 masters are ready to teach you.
            </p>
            <Link to="/practice">
              <Button className="btn-primary-gradient gap-2">
                <Dumbbell className="h-5 w-5" />
                Start Your First Session
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              Progress Dashboard
            </h1>
            <p className="text-muted-foreground">
              Track your interview readiness across all question types
            </p>
          </div>
          
          <Link to="/practice">
            <Button className="btn-primary-gradient gap-2">
              <Dumbbell className="h-5 w-5" />
              Continue Training
            </Button>
          </Link>
        </div>
        
        {/* Readiness Score + Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {/* Readiness */}
          <div className="md:col-span-2 p-6 rounded-xl border border-border bg-card">
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Interview Readiness</h2>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-muted"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeDasharray={2 * Math.PI * 42}
                    strokeDashoffset={2 * Math.PI * 42 * (1 - readinessScore / 100)}
                    strokeLinecap="round"
                    className="text-primary transition-all duration-700"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
                  {readinessScore}%
                </span>
              </div>
              
              <div className="flex-1">
                <div className="text-sm text-muted-foreground mb-1">
                  {readinessScore < 30 && "Just getting started — keep training!"}
                  {readinessScore >= 30 && readinessScore < 60 && "Making progress — you're building skills."}
                  {readinessScore >= 60 && readinessScore < 80 && "Looking strong — keep refining."}
                  {readinessScore >= 80 && "Interview ready — you've got this!"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {typesPracticed}/9 types practiced
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="stat-card">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Dumbbell className="h-4 w-4" />
              Questions
            </div>
            <div className="text-2xl font-bold">{progress.total_questions_attempted}</div>
          </div>
          
          <div className="stat-card">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Practice Time
            </div>
            <div className="text-2xl font-bold">{formatTime(progress.total_practice_time_seconds)}</div>
          </div>
        </div>
        
        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="p-5 rounded-xl border border-primary/20 bg-primary/5 mb-8">
            <h2 className="font-semibold mb-3">🎯 Recommended for You</h2>
            <ul className="space-y-2">
              {recommendations.map((rec, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Type Breakdown */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Performance by Type</h2>
          <div className="grid gap-3">
            {ALL_TYPES.map((type) => {
              const info = INTERVIEW_TYPE_INFO[type];
              const typeProgress = progress.scores_by_type[type];
              const hasAttempts = typeProgress.questions_attempted > 0;
              
              return (
                <div
                  key={type}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card"
                >
                  <span className="text-xl">{info.icon}</span>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{info.label}</span>
                      {hasAttempts && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <TrendIcon trend={typeProgress.trend} />
                          {typeProgress.average_score.toFixed(1)}/10
                        </span>
                      )}
                    </div>
                    
                    <div className="score-bar">
                      <div
                        className={cn(
                          'score-bar-fill',
                          hasAttempts ? 'bg-primary' : 'bg-muted-foreground/20'
                        )}
                        style={{ width: hasAttempts ? `${typeProgress.average_score * 10}%` : '0%' }}
                      />
                    </div>
                    
                    <div className="text-xs text-muted-foreground mt-1">
                      {hasAttempts
                        ? `${typeProgress.questions_attempted} practiced`
                        : 'Not started'
                      }
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Additional Stats */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="stat-card">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Companies Studied
            </div>
            <div className="text-2xl font-bold">{progress.companies_practiced.length}</div>
          </div>
          
          <div className="stat-card">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Frameworks Encountered
            </div>
            <div className="text-2xl font-bold">{progress.frameworks_encountered.length}</div>
          </div>
        </div>
        
        {/* Clear Progress */}
        <div className="border-t border-border pt-6">
          <Button
            variant="outline"
            size="sm"
            className="text-muted-foreground hover:text-destructive hover:border-destructive"
            onClick={() => {
              if (confirm('Are you sure? This will delete all your practice history.')) {
                clearProgress();
              }
            }}
          >
            Clear Progress
          </Button>
        </div>
      </div>
    </Layout>
  );
}
