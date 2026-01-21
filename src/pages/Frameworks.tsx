import { Layout } from '@/components/layout/Layout';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search,
  BookOpen,
  ArrowRight,
  User,
  Podcast
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Framework, FrameworkCategory } from '@/types';

// Demo frameworks data - in production this would come from transcript processing
const DEMO_FRAMEWORKS: Partial<Framework>[] = [
  { id: 'rice', name: 'RICE Framework', creator: 'Intercom', category: 'prioritization', description: 'Reach, Impact, Confidence, Effort scoring for prioritization', episodes: ['ep1'] },
  { id: 'north-star', name: 'North Star Metric', creator: null, category: 'metrics', description: 'Single metric that best captures the core value your product delivers', episodes: ['ep2', 'ep3'] },
  { id: 'jobs-to-be-done', name: 'Jobs to Be Done', creator: 'Clayton Christensen', category: 'strategy', description: 'Understanding what job customers hire your product to do', episodes: ['ep4'] },
  { id: 'working-backwards', name: 'Working Backwards', creator: 'Amazon', category: 'execution', description: 'Start with the press release and work backwards to the product', episodes: ['ep5'] },
  { id: 'okrs', name: 'OKRs', creator: 'Andy Grove', category: 'execution', description: 'Objectives and Key Results for goal setting', episodes: ['ep6', 'ep7'] },
  { id: 'iceberg', name: 'Iceberg Model', creator: null, category: 'strategy', description: 'Surface events, patterns, structures, and mental models', episodes: ['ep8'] },
  { id: 'lean-startup', name: 'Lean Startup', creator: 'Eric Ries', category: 'execution', description: 'Build-Measure-Learn feedback loop', episodes: ['ep9'] },
  { id: 'pirate-metrics', name: 'Pirate Metrics (AARRR)', creator: 'Dave McClure', category: 'growth', description: 'Acquisition, Activation, Retention, Revenue, Referral', episodes: ['ep10'] },
  { id: 'kano-model', name: 'Kano Model', creator: 'Noriaki Kano', category: 'prioritization', description: 'Categorizing features by customer satisfaction', episodes: ['ep11'] },
  { id: 'design-thinking', name: 'Design Thinking', creator: 'IDEO', category: 'design', description: 'Human-centered approach to innovation', episodes: ['ep12'] },
];

const CATEGORY_LABELS: Record<FrameworkCategory, string> = {
  prioritization: 'Prioritization',
  strategy: 'Strategy',
  growth: 'Growth',
  metrics: 'Metrics',
  design: 'Design',
  execution: 'Execution',
  leadership: 'Leadership',
  ai_ml: 'AI/ML',
};

const CATEGORY_COLORS: Record<FrameworkCategory, string> = {
  prioritization: 'bg-purple-100 text-purple-700 border-purple-200',
  strategy: 'bg-blue-100 text-blue-700 border-blue-200',
  growth: 'bg-green-100 text-green-700 border-green-200',
  metrics: 'bg-orange-100 text-orange-700 border-orange-200',
  design: 'bg-pink-100 text-pink-700 border-pink-200',
  execution: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  leadership: 'bg-amber-100 text-amber-700 border-amber-200',
  ai_ml: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export default function Frameworks() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FrameworkCategory | 'all'>('all');
  
  const categories = useMemo(() => {
    const cats = new Set(DEMO_FRAMEWORKS.map(f => f.category).filter(Boolean));
    return Array.from(cats) as FrameworkCategory[];
  }, []);
  
  const filteredFrameworks = useMemo(() => {
    let frameworks = [...DEMO_FRAMEWORKS];
    
    // Filter by search
    if (searchQuery) {
      frameworks = frameworks.filter(f => 
        f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.creator?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      frameworks = frameworks.filter(f => f.category === selectedCategory);
    }
    
    return frameworks;
  }, [searchQuery, selectedCategory]);
  
  return (
    <Layout>
      <div className="container py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              Framework Library
            </h1>
            <p className="text-muted-foreground">
              {DEMO_FRAMEWORKS.length}+ PM frameworks mentioned by podcast guests
            </p>
          </div>
        </div>
        
        {/* Search and Category Filters */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search frameworks, creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className={cn(
                selectedCategory === 'all' && 'bg-primary hover:bg-primary-hover'
              )}
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  selectedCategory === cat && 'bg-primary hover:bg-primary-hover'
                )}
              >
                {CATEGORY_LABELS[cat]}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Frameworks Grid */}
        {filteredFrameworks.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No frameworks found</h3>
            <p className="text-muted-foreground mb-4">
              Try a different search term or category.
            </p>
            <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
              Show All Frameworks
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFrameworks.map((framework) => (
              <Link
                key={framework.id}
                to={`/frameworks/${framework.id}`}
                className="group"
              >
                <div className="h-full p-5 rounded-xl border border-border bg-card card-hover flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    {framework.category && (
                      <span className={cn(
                        'interview-badge text-xs',
                        CATEGORY_COLORS[framework.category]
                      )}>
                        {CATEGORY_LABELS[framework.category]}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Podcast className="h-3 w-3" />
                      {framework.episodes?.length || 0}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                    {framework.name}
                  </h3>
                  
                  {framework.creator && (
                    <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {framework.creator}
                    </p>
                  )}
                  
                  <p className="text-sm text-muted-foreground flex-1 line-clamp-2">
                    {framework.description}
                  </p>
                  
                  <div className="flex items-center justify-end pt-3 mt-3 border-t border-border">
                    <span className="text-sm text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                      Learn more <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
