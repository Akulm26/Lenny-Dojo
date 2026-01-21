import { Layout } from '@/components/layout/Layout';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search,
  Building2,
  ArrowRight,
  MessageSquare,
  Lightbulb,
  Target,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDojoData } from '@/contexts/DojoDataContext';

type SortOption = 'mentions' | 'alphabetical' | 'decisions';

export default function Companies() {
  const { companies, isLoading, isReady, sync, status, progressMessage, error } = useDojoData();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('mentions');
  
  const filteredCompanies = useMemo(() => {
    let list = [...companies];
    
    // Filter by search
    if (searchQuery) {
      list = list.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort
    switch (sortBy) {
      case 'mentions':
        list.sort((a, b) => b.episode_count - a.episode_count);
        break;
      case 'alphabetical':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'decisions':
        list.sort((a, b) => b.total_decisions - a.total_decisions);
        break;
    }
    
    return list;
  }, [companies, searchQuery, sortBy]);
  
  const showEmptyState = !isLoading && companies.length === 0;
  
  return (
    <Layout>
      <div className="container py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              Company Success Autopsy
            </h1>
            <p className="text-muted-foreground">
              {isReady
                ? `Deep dive into ${companies.length} companies discussed on the podcast`
                : (progressMessage || 'Loading company intelligence from podcasts...')}
            </p>
          </div>
          
          {status !== 'syncing' && status !== 'processing' && (
            <Button variant="outline" size="sm" onClick={sync} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </Button>
          )}
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              disabled={!isReady}
            />
          </div>
          
          <div className="flex gap-2">
            {(['mentions', 'alphabetical', 'decisions'] as SortOption[]).map((option) => (
              <Button
                key={option}
                variant={sortBy === option ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy(option)}
                disabled={!isReady}
                className={cn(
                  sortBy === option && 'bg-primary hover:bg-primary-hover'
                )}
              >
                {option === 'mentions' ? 'Most Episodes' : option === 'decisions' ? 'Most Decisions' : 'A-Z'}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Loading State */}
        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-5 rounded-xl border border-border bg-card">
                <Skeleton className="h-10 w-10 rounded-lg mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="text-center py-16">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sync paused</h3>
            <p className="text-muted-foreground mb-4">
              {error || 'Something went wrong while extracting intelligence. Please try again.'}
            </p>
            <Button onClick={sync} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry Sync
            </Button>
          </div>
        )}
        
        {/* Empty State */}
        {showEmptyState && status !== 'error' && (
          <div className="text-center py-16">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Companies Yet</h3>
            <p className="text-muted-foreground mb-4">
              Seed the Intelligence Cache in Settings to load company data (no AI calls).
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button asChild className="gap-2">
                <Link to="/settings">
                  <RefreshCw className="h-4 w-4" />
                  Go to Settings
                </Link>
              </Button>
              <Button variant="outline" onClick={sync} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Retry Sync
              </Button>
            </div>
          </div>
        )}
        
        {/* No Search Results */}
        {isReady && searchQuery && filteredCompanies.length === 0 && (
          <div className="text-center py-16">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results for "{searchQuery}"</h3>
            <p className="text-muted-foreground mb-4">
              Try a different search term or browse all companies instead.
            </p>
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Browse All
            </Button>
          </div>
        )}
        
        {/* Companies Grid */}
        {isReady && filteredCompanies.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map((company) => (
              <Link
                key={company.name}
                to={`/companies/${encodeURIComponent(company.name.toLowerCase().replace(/\s+/g, '-'))}`}
                className="group"
              >
                <div className="h-full p-5 rounded-xl border border-border bg-card card-hover">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {company.episode_count} episodes
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {company.name}
                  </h3>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Lightbulb className="h-3.5 w-3.5" />
                      {company.total_decisions} decisions
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {company.total_opinions} opinions
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-muted">
                        <Lightbulb className="h-3 w-3" />
                        Autopsy
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-muted">
                        <Target className="h-3 w-3" />
                        Practice
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
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
