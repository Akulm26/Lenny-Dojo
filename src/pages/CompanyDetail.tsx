import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  ArrowLeft, 
  Lightbulb, 
  MessageSquare, 
  Target,
  Users,
  TrendingUp,
  Zap,
  ChevronDown,
  ChevronUp,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDojoData } from '@/contexts/DojoDataContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function CompanyDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { companies, isLoading, isReady } = useDojoData();
  const [showAllLessons, setShowAllLessons] = useState(false);
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);
  
  const company = useMemo(() => {
    if (!slug || !companies.length) return null;
    
    const normalizedSlug = slug.toLowerCase();
    return companies.find(c => 
      c.name.toLowerCase().replace(/\s+/g, '-') === normalizedSlug ||
      c.name.toLowerCase() === normalizedSlug.replace(/-/g, ' ')
    ) || null;
  }, [slug, companies]);
  
  // Generate TLDR from decisions
  const tldrPoints = useMemo(() => {
    if (!company) return [];
    
    const points: string[] = [];
    
    // Get top decisions with outcomes
    const decisionsWithOutcomes = (company.decisions || [])
      .filter(d => d.outcome && d.what)
      .slice(0, 3);
    
    decisionsWithOutcomes.forEach(d => {
      const summary = d.what.length > 80 ? d.what.substring(0, 80) + '...' : d.what;
      points.push(summary);
    });
    
    // Add a key opinion if we have room
    if (points.length < 3 && company.opinions?.length > 0) {
      const topOpinion = company.opinions[0];
      if (topOpinion.opinion) {
        const summary = topOpinion.opinion.length > 80 
          ? topOpinion.opinion.substring(0, 80) + '...' 
          : topOpinion.opinion;
        points.push(summary);
      }
    }
    
    return points;
  }, [company]);
  
  // Format lessons from decisions
  const lessons = useMemo(() => {
    if (!company?.decisions) return [];
    
    return company.decisions.map((decision, i) => ({
      id: i,
      title: decision.what,
      context: decision.why || 'Context not specified',
      outcome: decision.outcome || 'Outcome not specified',
      quote: decision.quote,
      source: decision.guest_name,
    }));
  }, [company]);
  
  // Format insights from opinions
  const insights = useMemo(() => {
    if (!company?.opinions) return [];
    
    return company.opinions.map((opinion, i) => ({
      id: i,
      insight: opinion.opinion,
      quote: opinion.quote,
      source: opinion.guest_name,
    }));
  }, [company]);
  
  const displayedLessons = showAllLessons ? lessons : lessons.slice(0, 5);
  const displayedInsights = showAllInsights ? insights : insights.slice(0, 4);
  
  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8 md:py-12 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-12 w-2/3 mb-4" />
          <Skeleton className="h-6 w-1/3 mb-8" />
          <Skeleton className="h-32 mb-6" />
          <Skeleton className="h-64" />
        </div>
      </Layout>
    );
  }
  
  if (!company && isReady) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Company Not Found</h2>
          <p className="text-muted-foreground mb-6">
            We couldn't find a company matching "{slug}".
          </p>
          <Button onClick={() => navigate('/companies')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Companies
          </Button>
        </div>
      </Layout>
    );
  }
  
  if (!company) return null;
  
  return (
    <Layout>
      <div className="container py-8 md:py-12 max-w-4xl">
        {/* Back Button */}
        <Link 
          to="/companies" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Companies
        </Link>
        
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary mb-1">Success Autopsy</p>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{company.name}</h1>
            <p className="text-muted-foreground">
              {lessons.length} lessons from {company.episode_count} podcast episode{company.episode_count !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        {/* TLDR Section */}
        {tldrPoints.length > 0 && (
          <div className="p-5 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-lg">TL;DR — Key Takeaways</h2>
            </div>
            <ul className="space-y-2">
              {tldrPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="p-3 rounded-lg border border-border bg-card text-center">
            <div className="text-xl font-bold text-primary">{lessons.length}</div>
            <div className="text-xs text-muted-foreground">Lessons</div>
          </div>
          <div className="p-3 rounded-lg border border-border bg-card text-center">
            <div className="text-xl font-bold text-primary">{insights.length}</div>
            <div className="text-xs text-muted-foreground">Insights</div>
          </div>
          <div className="p-3 rounded-lg border border-border bg-card text-center">
            <div className="text-xl font-bold text-primary">{company.episode_count}</div>
            <div className="text-xs text-muted-foreground">Episodes</div>
          </div>
        </div>
        
        {/* Practice CTA */}
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm">
                <strong>Ready to practice?</strong> Generate interview questions based on these real {company.name} decisions.
              </p>
            </div>
            <Link to="/practice" state={{ company: company.name.toLowerCase() }}>
              <Button size="sm" className="btn-primary-gradient gap-2 whitespace-nowrap">
                Practice Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Lessons Learned */}
        {lessons.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Lessons Learned
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Real decisions and their outcomes, shared by podcast guests.
            </p>
            
            <div className="space-y-3">
              {displayedLessons.map((lesson, i) => (
                <div 
                  key={lesson.id}
                  className="rounded-lg border border-border bg-card overflow-hidden"
                >
                  {/* Collapsed View */}
                  <button
                    onClick={() => setExpandedLesson(expandedLesson === lesson.id ? null : lesson.id)}
                    className="w-full p-4 text-left hover:bg-surface/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                            Lesson {i + 1}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            via {lesson.source}
                          </span>
                        </div>
                        <h3 className="font-medium text-sm line-clamp-2">{lesson.title}</h3>
                      </div>
                      {expandedLesson === lesson.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  </button>
                  
                  {/* Expanded View */}
                  {expandedLesson === lesson.id && (
                    <div className="px-4 pb-4 pt-0 border-t border-border bg-surface/30 animate-fade-in">
                      <div className="grid gap-3 mt-3">
                        {lesson.context && lesson.context !== 'Context not specified' && (
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                              <BookOpen className="h-3 w-3" />
                              WHY THEY DID IT
                            </div>
                            <p className="text-sm">{lesson.context}</p>
                          </div>
                        )}
                        
                        {lesson.outcome && lesson.outcome !== 'Outcome not specified' && (
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                              <TrendingUp className="h-3 w-3" />
                              WHAT HAPPENED
                            </div>
                            <p className="text-sm">{lesson.outcome}</p>
                          </div>
                        )}
                        
                        {lesson.quote && (
                          <blockquote className="text-sm italic border-l-2 border-primary/40 pl-3 text-muted-foreground">
                            "{lesson.quote}"
                            <span className="block text-xs mt-1 not-italic">— {lesson.source}</span>
                          </blockquote>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {lessons.length > 5 && (
              <button
                onClick={() => setShowAllLessons(!showAllLessons)}
                className="w-full mt-3 py-2 text-sm text-primary hover:text-primary-hover transition-colors flex items-center justify-center gap-1"
              >
                {showAllLessons ? (
                  <>Show Less <ChevronUp className="h-4 w-4" /></>
                ) : (
                  <>Show All {lessons.length} Lessons <ChevronDown className="h-4 w-4" /></>
                )}
              </button>
            )}
          </section>
        )}
        
        {/* Expert Insights */}
        {insights.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Expert Insights
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Opinions and recommendations from industry leaders.
            </p>
            
            <div className="grid md:grid-cols-2 gap-3">
              {displayedInsights.map((insight) => (
                <div 
                  key={insight.id}
                  className="p-4 rounded-lg border border-border bg-card"
                >
                  <p className="text-sm mb-3">{insight.insight}</p>
                  {insight.quote && (
                    <blockquote className="text-xs italic border-l-2 border-primary/40 pl-2 text-muted-foreground mb-2">
                      "{insight.quote.length > 100 ? insight.quote.substring(0, 100) + '...' : insight.quote}"
                    </blockquote>
                  )}
                  <p className="text-xs text-muted-foreground">— {insight.source}</p>
                </div>
              ))}
            </div>
            
            {insights.length > 4 && (
              <button
                onClick={() => setShowAllInsights(!showAllInsights)}
                className="w-full mt-3 py-2 text-sm text-primary hover:text-primary-hover transition-colors flex items-center justify-center gap-1"
              >
                {showAllInsights ? (
                  <>Show Less <ChevronUp className="h-4 w-4" /></>
                ) : (
                  <>Show All {insights.length} Insights <ChevronDown className="h-4 w-4" /></>
                )}
              </button>
            )}
          </section>
        )}
        
        {/* Key Metrics */}
        {company.metrics && company.metrics.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Metrics That Mattered
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              KPIs and metrics mentioned in discussions about {company.name}.
            </p>
            <div className="flex flex-wrap gap-2">
              {[...new Set(company.metrics)].slice(0, 15).map((metric, i) => (
                <span 
                  key={i}
                  className="px-3 py-1.5 rounded-full text-sm bg-muted border border-border"
                >
                  {metric}
                </span>
              ))}
              {[...new Set(company.metrics)].length > 15 && (
                <span className="px-3 py-1.5 rounded-full text-sm text-muted-foreground">
                  +{[...new Set(company.metrics)].length - 15} more
                </span>
              )}
            </div>
          </section>
        )}
        
        {/* Source Episodes (Collapsed) */}
        {company.episodes && company.episodes.length > 0 && (
          <section className="mb-8">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer list-none p-4 rounded-lg border border-border bg-card hover:bg-surface transition-colors">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-medium">Source Episodes ({company.episodes.length})</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground group-open:rotate-180 transition-transform" />
              </summary>
              <div className="mt-3 space-y-2">
                {company.episodes.map((ep, i) => (
                  <div 
                    key={i}
                    className="p-3 rounded-lg border border-border bg-surface/50 text-sm"
                  >
                    <p className="font-medium">{ep.episode_title}</p>
                    <p className="text-muted-foreground text-xs">
                      Guest: {ep.guest_name}
                      {ep.is_guest_company && ' • Guest\'s Company'}
                    </p>
                  </div>
                ))}
              </div>
            </details>
          </section>
        )}
      </div>
    </Layout>
  );
}
