import { Layout } from '@/components/layout/Layout';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search,
  BookOpen,
  ArrowRight,
  User,
  Podcast,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDojoData } from '@/contexts/DojoDataContext';

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

export default function Frameworks() {
  const { frameworks, isLoading, isReady, sync, status } = useDojoData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const categories = useMemo(() => {
    const cats = new Set(frameworks.map(f => f.category).filter(Boolean));
    return Array.from(cats);
  }, [frameworks]);
  
  const filteredFrameworks = useMemo(() => {
    let list = [...frameworks];
    
    // Filter by search
    if (searchQuery) {
      list = list.filter(f => 
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.explanation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.creator?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      list = list.filter(f => f.category === selectedCategory);
    }
    
    return list;
  }, [frameworks, searchQuery, selectedCategory]);
  
  const showEmptyState = !isLoading && frameworks.length === 0;
  
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
              {isReady 
                ? `${frameworks.length} PM frameworks mentioned by podcast guests`
                : 'Loading frameworks from podcasts...'
              }
            </p>
          </div>
          
          {status !== 'syncing' && status !== 'processing' && (
            <Button variant="outline" size="sm" onClick={sync} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </Button>
          )}
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
              disabled={!isReady}
            />
          </div>
          
          {categories.length > 0 && (
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
                  {CATEGORY_LABELS[cat] || cat}
                </Button>
              ))}
            </div>
          )}
        </div>
        
        {/* Loading State */}
        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-5 rounded-xl border border-border bg-card">
                <Skeleton className="h-6 w-20 rounded-full mb-3" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        )}
        
        {/* Empty State */}
        {showEmptyState && (
          <div className="text-center py-16">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Frameworks Yet</h3>
            <p className="text-muted-foreground mb-4">
              Sync the podcast transcripts to extract framework intelligence.
            </p>
            <Button onClick={sync} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Start Sync
            </Button>
          </div>
        )}
        
        {/* No Search Results */}
        {isReady && (searchQuery || selectedCategory !== 'all') && filteredFrameworks.length === 0 && frameworks.length > 0 && (
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
        )}
        
        {/* Frameworks Grid */}
        {isReady && filteredFrameworks.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFrameworks.map((framework) => (
              <Link
                key={framework.name}
                to={`/frameworks/${encodeURIComponent(framework.name.toLowerCase().replace(/\s+/g, '-'))}`}
                className="group"
              >
                <div className="h-full p-5 rounded-xl border border-border bg-card card-hover flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    {framework.category && (
                      <span className={cn(
                        'interview-badge text-xs',
                        CATEGORY_COLORS[framework.category] || 'bg-muted text-muted-foreground'
                      )}>
                        {CATEGORY_LABELS[framework.category] || framework.category}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Podcast className="h-3 w-3" />
                      {framework.mentioned_in?.length || 0}
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
                    {framework.explanation}
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
