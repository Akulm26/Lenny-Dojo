import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Dumbbell, 
  Building2, 
  BarChart3,
  ArrowRight,
  Sparkles,
  Target,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { useDojoData } from '@/contexts/DojoDataContext';
import { useProgressStore } from '@/stores/progressStore';

export default function Index() {
  const { episodes, companies, frameworks, totalEpisodes, isLoading } = useDojoData();
  const { getReadinessScore, getRecommendations, progress } = useProgressStore();
  
  const episodeCount = totalEpisodes || episodes.length || 284;
  const readinessScore = getReadinessScore();
  const recommendations = getRecommendations();
  
  const quickStats = [
    { label: 'Episodes', value: isLoading ? '...' : episodeCount.toString(), icon: Sparkles },
    { label: 'Companies', value: isLoading ? '...' : `${companies.length || '120'}+`, icon: Building2 },
    { label: 'Frameworks', value: isLoading ? '...' : `${frameworks.length || '50'}+`, icon: BookOpen },
  ];
  
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-light via-background to-background -z-10" />
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
        
        <div className="container py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Trained on {episodeCount} episodes
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              <span className="text-gradient">🥋 Lenny's Dojo</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
              Train on real PM decisions.<br />
              See how they played out.
            </p>
            
            <p className="text-muted-foreground max-w-xl mx-auto">
              An AI-powered PM interview preparation app that extracts intelligence 
              from Lenny's Podcast transcripts and simulates realistic PM interviews 
              across 9 interview types.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/practice">
                <Button size="lg" className="btn-primary-gradient gap-2 h-12 px-8 text-base">
                  <Dumbbell className="h-5 w-5" />
                  Enter the Dojo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              
              <Link to="/companies">
                <Button variant="outline" size="lg" className="gap-2 h-12 px-8 text-base">
                  <Building2 className="h-5 w-5" />
                  Browse Companies
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Stats Row */}
      <section className="border-y border-border bg-surface/50">
        <div className="container py-8">
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            {quickStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Quick Actions */}
      <section className="container py-12 md:py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Practice Card */}
          <Link to="/practice" className="group">
            <div className="h-full p-6 rounded-xl border border-border bg-card card-hover">
              <div className="p-3 rounded-lg bg-primary/10 text-primary w-fit mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quick Start</h3>
              <p className="text-muted-foreground mb-4">
                Jump into a practice session with AI-generated questions from real PM scenarios.
              </p>
              <div className="flex items-center text-primary font-medium group-hover:gap-2 transition-all">
                Start Practice <ArrowRight className="h-4 w-4 ml-1" />
              </div>
            </div>
          </Link>
          
          {/* Companies Card */}
          <Link to="/companies" className="group">
            <div className="h-full p-6 rounded-xl border border-border bg-card card-hover">
              <div className="p-3 rounded-lg bg-primary/10 text-primary w-fit mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Company Intel</h3>
              <p className="text-muted-foreground mb-4">
                Deep dive into specific companies. Understand their key decisions and outcomes.
              </p>
              <div className="flex items-center text-primary font-medium group-hover:gap-2 transition-all">
                Browse Intel <ArrowRight className="h-4 w-4 ml-1" />
              </div>
            </div>
          </Link>
          
          {/* Progress Card */}
          <Link to="/progress" className="group">
            <div className="h-full p-6 rounded-xl border border-border bg-card card-hover">
              <div className="p-3 rounded-lg bg-primary/10 text-primary w-fit mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">My Progress</h3>
              <p className="text-muted-foreground mb-4">
                Track your readiness across all 9 interview types with personalized insights.
              </p>
              <div className="flex items-center text-primary font-medium group-hover:gap-2 transition-all">
                View Dashboard <ArrowRight className="h-4 w-4 ml-1" />
              </div>
            </div>
          </Link>
        </div>
      </section>
      
      {/* Readiness & Recommendations */}
      {progress.total_questions_attempted > 0 && (
        <section className="container pb-12 md:pb-16">
          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Readiness Score */}
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="text-muted"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeDasharray={2 * Math.PI * 28}
                      strokeDashoffset={2 * Math.PI * 28 * (1 - readinessScore / 100)}
                      className="text-primary transition-all duration-500"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                    {readinessScore}%
                  </span>
                </div>
                <div>
                  <div className="font-semibold">Interview Readiness</div>
                  <div className="text-sm text-muted-foreground">
                    {progress.total_questions_attempted} questions practiced
                  </div>
                </div>
              </div>
              
              {/* Recommendations */}
              {recommendations.length > 0 && (
                <div className="flex-1 md:border-l md:pl-6 md:ml-6 border-border">
                  <div className="text-sm font-medium mb-2">Recommended for You</div>
                  <ul className="space-y-1">
                    {recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary">→</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
      
      {/* Interview Types Grid */}
      <section className="container pb-12 md:pb-16">
        <h2 className="text-2xl font-bold mb-6 text-center">9 Interview Types. Real Scenarios.</h2>
        <div className="grid grid-cols-3 md:grid-cols-9 gap-3">
          {[
            { emoji: '💬', label: 'Behavioral' },
            { emoji: '🎯', label: 'Product Sense' },
            { emoji: '✏️', label: 'Design' },
            { emoji: '🔍', label: 'RCA' },
            { emoji: '📊', label: 'Guesstimate' },
            { emoji: '⚙️', label: 'Tech' },
            { emoji: '🤖', label: 'AI/ML' },
            { emoji: '♟️', label: 'Strategy' },
            { emoji: '📈', label: 'Metrics' },
          ].map((type) => (
            <div
              key={type.label}
              className="flex flex-col items-center justify-center p-4 rounded-lg bg-surface border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors"
            >
              <span className="text-2xl mb-2">{type.emoji}</span>
              <span className="text-xs font-medium text-center">{type.label}</span>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
}
