import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  ArrowLeft, 
  Lightbulb, 
  MessageSquare, 
  Quote,
  Target,
  Users,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDojoData } from '@/contexts/DojoDataContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function CompanyDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { companies, isLoading, isReady } = useDojoData();
  
  const company = useMemo(() => {
    if (!slug || !companies.length) return null;
    
    // Match by slug (lowercase, hyphenated name)
    const normalizedSlug = slug.toLowerCase();
    return companies.find(c => 
      c.name.toLowerCase().replace(/\s+/g, '-') === normalizedSlug ||
      c.name.toLowerCase() === normalizedSlug.replace(/-/g, ' ')
    ) || null;
  }, [slug, companies]);
  
  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8 md:py-12 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-12 w-2/3 mb-4" />
          <Skeleton className="h-6 w-1/3 mb-8" />
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
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
        <div className="flex items-start gap-4 mb-8">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{company.name}</h1>
            <p className="text-muted-foreground">
              Discussed in {company.episode_count} episode{company.episode_count !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl border border-border bg-card text-center">
            <div className="text-2xl font-bold text-primary mb-1">{company.episode_count}</div>
            <div className="text-xs text-muted-foreground">Episodes</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card text-center">
            <div className="text-2xl font-bold text-primary mb-1">{company.total_decisions}</div>
            <div className="text-xs text-muted-foreground">Decisions</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card text-center">
            <div className="text-2xl font-bold text-primary mb-1">{company.total_opinions}</div>
            <div className="text-xs text-muted-foreground">Opinions</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card text-center">
            <div className="text-2xl font-bold text-primary mb-1">{company.question_seeds?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Practice Q's</div>
          </div>
        </div>
        
        {/* Practice CTA */}
        <div className="p-5 rounded-xl border border-primary/30 bg-primary/5 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold mb-1 flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Practice with {company.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                Generate interview questions based on real decisions discussed on the podcast.
              </p>
            </div>
            <Link to="/practice" state={{ company: company.name.toLowerCase() }}>
              <Button className="btn-primary-gradient gap-2">
                <Target className="h-4 w-4" />
                Start Practice
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Episodes */}
        {company.episodes && company.episodes.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Featured In
            </h2>
            <div className="space-y-3">
              {company.episodes.map((ep, i) => (
                <div 
                  key={i}
                  className="p-4 rounded-lg border border-border bg-card"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium">{ep.episode_title}</h3>
                      <p className="text-sm text-muted-foreground">
                        with {ep.guest_name}
                        {ep.is_guest_company && (
                          <span className="ml-2 px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">
                            Guest's Company
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {ep.context && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {ep.context}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
        
        {/* Key Decisions */}
        {company.decisions && company.decisions.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Key Decisions
            </h2>
            <div className="space-y-4">
              {company.decisions.slice(0, 10).map((decision, i) => (
                <div 
                  key={i}
                  className="p-4 rounded-lg border border-border bg-card"
                >
                  <h3 className="font-medium mb-2">{decision.what}</h3>
                  {decision.why && (
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Why:</strong> {decision.why}
                    </p>
                  )}
                  {decision.outcome && (
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Outcome:</strong> {decision.outcome}
                    </p>
                  )}
                  {decision.quote && (
                    <blockquote className="text-sm italic border-l-2 border-primary/40 pl-3 mt-3 text-muted-foreground">
                      "{decision.quote}"
                    </blockquote>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    — {decision.guest_name}
                  </p>
                </div>
              ))}
              {company.decisions.length > 10 && (
                <p className="text-sm text-muted-foreground text-center">
                  + {company.decisions.length - 10} more decisions
                </p>
              )}
            </div>
          </section>
        )}
        
        {/* Expert Opinions */}
        {company.opinions && company.opinions.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Expert Opinions
            </h2>
            <div className="space-y-4">
              {company.opinions.slice(0, 8).map((opinion, i) => (
                <div 
                  key={i}
                  className="p-4 rounded-lg border border-border bg-card"
                >
                  <p className="text-sm mb-2">{opinion.opinion}</p>
                  {opinion.quote && (
                    <blockquote className="text-sm italic border-l-2 border-primary/40 pl-3 mt-3 text-muted-foreground">
                      "{opinion.quote}"
                    </blockquote>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    — {opinion.guest_name}
                  </p>
                </div>
              ))}
              {company.opinions.length > 8 && (
                <p className="text-sm text-muted-foreground text-center">
                  + {company.opinions.length - 8} more opinions
                </p>
              )}
            </div>
          </section>
        )}
        
        {/* Metrics */}
        {company.metrics && company.metrics.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Metrics Mentioned
            </h2>
            <div className="flex flex-wrap gap-2">
              {[...new Set(company.metrics)].map((metric, i) => (
                <span 
                  key={i}
                  className="px-3 py-1.5 rounded-full text-sm bg-muted border border-border"
                >
                  {metric}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
