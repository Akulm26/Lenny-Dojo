import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  ArrowLeft, 
  User,
  Lightbulb,
  Target,
  Podcast,
  Quote,
  CheckCircle2,
  Zap,
  Clock,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDojoData } from '@/contexts/DojoDataContext';
import { Skeleton } from '@/components/ui/skeleton';

const CATEGORY_LABELS: Record<string, string> = {
  prioritization: 'Prioritization',
  strategy: 'Strategy',
  growth: 'Growth',
  metrics: 'Metrics',
  design: 'Design',
  execution: 'Execution',
  leadership: 'Leadership',
  ai_ml: 'AI/ML',
};

const CATEGORY_COLORS: Record<string, string> = {
  prioritization: 'bg-purple-100 text-purple-700 border-purple-200',
  strategy: 'bg-blue-100 text-blue-700 border-blue-200',
  growth: 'bg-green-100 text-green-700 border-green-200',
  metrics: 'bg-orange-100 text-orange-700 border-orange-200',
  design: 'bg-pink-100 text-pink-700 border-pink-200',
  execution: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  leadership: 'bg-amber-100 text-amber-700 border-amber-200',
  ai_ml: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

// Generate a concise TL;DR summary
function generateTLDR(framework: { name: string; explanation?: string; category?: string; creator?: string }): string {
  const { name, explanation, category, creator } = framework;
  
  if (explanation) {
    // Create a punchy one-liner from the explanation
    const firstSentence = explanation.split('.')[0];
    return `${name} is ${firstSentence.toLowerCase().startsWith(name.toLowerCase()) ? firstSentence : `a ${category || 'product'} framework that ${firstSentence.toLowerCase()}`}${creator ? ` — developed by ${creator}` : ''}.`;
  }
  
  return `${name} is a ${category?.replace('_', ' ') || 'product management'} framework ${creator ? `by ${creator} ` : ''}used to improve decision-making and strategic thinking.`;
}

// Generate a comprehensive end-to-end overview
function generateCompleteOverview(framework: {
  name: string;
  explanation?: string;
  when_to_use?: string;
  example?: string;
  category?: string;
  creator?: string;
  mentioned_in?: Array<{ guest_name: string }>;
}): string {
  const { name, explanation, when_to_use, example, category, creator, mentioned_in } = framework;
  
  const parts: string[] = [];
  
  // What it is
  if (explanation) {
    parts.push(explanation);
  } else {
    parts.push(`${name} is a ${category?.replace('_', ' ') || 'product management'} framework${creator ? ` developed by ${creator}` : ''}.`);
  }
  
  // When to use
  if (when_to_use) {
    parts.push(`Apply this framework when ${when_to_use.toLowerCase().startsWith('when') ? when_to_use.slice(5) : when_to_use.toLowerCase()}`);
  }
  
  // Example
  if (example) {
    parts.push(`In practice, ${example.toLowerCase().startsWith('for example') || example.toLowerCase().startsWith('e.g.') ? example.slice(example.indexOf(',') + 1).trim() : example}`);
  }
  
  // Source credibility
  const guestCount = mentioned_in?.length || 0;
  if (guestCount > 0) {
    const uniqueGuests = [...new Set(mentioned_in?.map(m => m.guest_name) || [])];
    parts.push(`This framework has been discussed by ${guestCount} podcast guest${guestCount > 1 ? 's' : ''}${uniqueGuests.length <= 3 ? `, including ${uniqueGuests.slice(0, 3).join(', ')}` : ''}.`);
  }
  
  return parts.join(' ');
}

export default function FrameworkDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { frameworks, isLoading, isReady } = useDojoData();
  
  const framework = useMemo(() => {
    if (!slug || !frameworks.length) return null;
    
    const normalizedSlug = slug.toLowerCase();
    return frameworks.find(f => 
      f.name.toLowerCase().replace(/\s+/g, '-') === normalizedSlug ||
      f.name.toLowerCase() === normalizedSlug.replace(/-/g, ' ')
    ) || null;
  }, [slug, frameworks]);
  
  // Find related frameworks by category
  const relatedFrameworks = useMemo(() => {
    if (!framework || !frameworks.length) return [];
    
    return frameworks
      .filter(f => f.name !== framework.name && f.category === framework.category)
      .slice(0, 3);
  }, [framework, frameworks]);
  
  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8 md:py-12 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-6 w-24 mb-4" />
          <Skeleton className="h-12 w-2/3 mb-4" />
          <Skeleton className="h-6 w-1/3 mb-8" />
          <Skeleton className="h-32 mb-6" />
          <Skeleton className="h-64" />
        </div>
      </Layout>
    );
  }
  
  if (!framework && isReady) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Framework Not Found</h2>
          <p className="text-muted-foreground mb-6">
            We couldn't find a framework matching "{slug}".
          </p>
          <Button onClick={() => navigate('/frameworks')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Frameworks
          </Button>
        </div>
      </Layout>
    );
  }
  
  if (!framework) return null;
  
  return (
    <Layout>
      <div className="container py-8 md:py-12 max-w-4xl">
        {/* Back Button */}
        <Link 
          to="/frameworks" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Frameworks
        </Link>
        
        {/* Header with Category Badge */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{framework.name}</h1>
            {framework.creator && (
              <p className="text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Created by {framework.creator}
              </p>
            )}
          </div>
          {framework.category && (
            <span className={cn(
              'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium shrink-0',
              CATEGORY_COLORS[framework.category] || 'bg-muted text-muted-foreground'
            )}>
              {CATEGORY_LABELS[framework.category] || framework.category}
            </span>
          )}
        </div>
        
        {/* TL;DR Card */}
        <div className="p-5 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-lg">TL;DR — Quick Summary</h2>
          </div>
          <p className="text-sm leading-relaxed font-medium">
            {generateTLDR(framework)}
          </p>
        </div>
        
        {/* Complete Overview - End-to-End Explanation */}
        <div className="p-5 rounded-xl border border-border bg-card mb-8">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-lg">Complete Overview</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {generateCompleteOverview(framework)}
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="p-4 rounded-lg border border-border bg-card text-center">
            <div className="text-2xl font-bold text-primary">{framework.mentioned_in?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Episodes Mentioned</div>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card text-center">
            <div className="text-2xl font-bold text-primary">{relatedFrameworks.length}</div>
            <div className="text-xs text-muted-foreground">Related Frameworks</div>
          </div>
        </div>
        
        {/* When to Use */}
        {framework.when_to_use && (
          <section className="mb-8">
            <div className="p-5 rounded-xl border border-border bg-card">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                When to Use This Framework
              </h2>
              <p className="text-sm leading-relaxed">{framework.when_to_use}</p>
            </div>
          </section>
        )}
        
        {/* Real Example */}
        {framework.example && (
          <section className="mb-8">
            <div className="p-5 rounded-xl border border-success/30 bg-success-light">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-success">
                <Lightbulb className="h-5 w-5" />
                Real-World Example
              </h2>
              <p className="text-sm leading-relaxed">{framework.example}</p>
            </div>
          </section>
        )}
        
        {/* Quote from Podcast */}
        {framework.quote && (
          <section className="mb-8">
            <div className="p-5 rounded-xl border border-primary/30 bg-primary/5">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Quote className="h-5 w-5 text-primary" />
                From the Podcast
              </h2>
              <blockquote className="text-sm italic border-l-2 border-primary/40 pl-4 text-muted-foreground">
                "{framework.quote}"
              </blockquote>
            </div>
          </section>
        )}
        
        {/* Key Takeaways */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Key Takeaways
          </h2>
          <div className="space-y-3">
            <div className="p-4 rounded-lg border border-border bg-card flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Category: {CATEGORY_LABELS[framework.category] || framework.category || 'General'}</p>
                <p className="text-xs text-muted-foreground">This framework is commonly used for {framework.category?.replace('_', ' ')} challenges.</p>
              </div>
            </div>
            
            {framework.creator && (
              <div className="p-4 rounded-lg border border-border bg-card flex items-start gap-3">
                <User className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Created by {framework.creator}</p>
                  <p className="text-xs text-muted-foreground">Learn more about the original creator's methodology.</p>
                </div>
              </div>
            )}
            
            <div className="p-4 rounded-lg border border-border bg-card flex items-start gap-3">
              <Podcast className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Mentioned in {framework.mentioned_in?.length || 0} episode{(framework.mentioned_in?.length || 0) !== 1 ? 's' : ''}</p>
                <p className="text-xs text-muted-foreground">Multiple podcast guests have referenced this framework.</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Practice CTA */}
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm">
                <strong>Practice using {framework.name}</strong> in mock interview questions.
              </p>
            </div>
            <Link to="/practice">
              <Button size="sm" className="btn-primary-gradient gap-2 whitespace-nowrap">
                Practice Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Episodes Where Mentioned */}
        {framework.mentioned_in && framework.mentioned_in.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Podcast className="h-5 w-5 text-primary" />
              Mentioned In These Episodes
            </h2>
            <div className="space-y-2">
              {framework.mentioned_in.map((mention, i) => (
                <div 
                  key={i}
                  className="p-3 rounded-lg border border-border bg-card text-sm"
                >
                  <p className="font-medium">{mention.episode_title}</p>
                  <p className="text-muted-foreground text-xs">Guest: {mention.guest_name}</p>
                </div>
              ))}
            </div>
          </section>
        )}
        
        {/* Related Frameworks */}
        {relatedFrameworks.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Related Frameworks
            </h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {relatedFrameworks.map((related) => (
                <Link
                  key={related.name}
                  to={`/frameworks/${encodeURIComponent(related.name.toLowerCase().replace(/\s+/g, '-'))}`}
                  className="group"
                >
                  <div className="p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors">
                    <h3 className="font-medium text-sm group-hover:text-primary transition-colors mb-1">
                      {related.name}
                    </h3>
                    {related.creator && (
                      <p className="text-xs text-muted-foreground">by {related.creator}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
