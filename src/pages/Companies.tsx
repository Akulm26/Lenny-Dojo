import { Layout } from '@/components/layout/Layout';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search,
  Building2,
  ArrowRight,
  MessageSquare,
  Lightbulb,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Company } from '@/types';

// Demo companies data - in production this would come from the transcript processing
const DEMO_COMPANIES: Partial<Company>[] = [
  { id: 'airbnb', name: 'Airbnb', mention_count: 24, episodes: ['ep1', 'ep2'] },
  { id: 'stripe', name: 'Stripe', mention_count: 18, episodes: ['ep3'] },
  { id: 'slack', name: 'Slack', mention_count: 15, episodes: ['ep4', 'ep5'] },
  { id: 'spotify', name: 'Spotify', mention_count: 14, episodes: ['ep6'] },
  { id: 'notion', name: 'Notion', mention_count: 12, episodes: ['ep7', 'ep8'] },
  { id: 'figma', name: 'Figma', mention_count: 11, episodes: ['ep9'] },
  { id: 'duolingo', name: 'Duolingo', mention_count: 10, episodes: ['ep10'] },
  { id: 'uber', name: 'Uber', mention_count: 9, episodes: ['ep11', 'ep12'] },
  { id: 'netflix', name: 'Netflix', mention_count: 8, episodes: ['ep13'] },
  { id: 'shopify', name: 'Shopify', mention_count: 7, episodes: ['ep14'] },
  { id: 'dropbox', name: 'Dropbox', mention_count: 6, episodes: ['ep15'] },
  { id: 'pinterest', name: 'Pinterest', mention_count: 5, episodes: ['ep16'] },
];

type SortOption = 'mentions' | 'alphabetical' | 'recent';

export default function Companies() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('mentions');
  
  const filteredCompanies = useMemo(() => {
    let companies = [...DEMO_COMPANIES];
    
    // Filter by search
    if (searchQuery) {
      companies = companies.filter(c => 
        c.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort
    switch (sortBy) {
      case 'mentions':
        companies.sort((a, b) => (b.mention_count || 0) - (a.mention_count || 0));
        break;
      case 'alphabetical':
        companies.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'recent':
        // In production, sort by most recently discussed
        break;
    }
    
    return companies;
  }, [searchQuery, sortBy]);
  
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
              Deep dive into {DEMO_COMPANIES.length}+ companies discussed on the podcast
            </p>
          </div>
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
            />
          </div>
          
          <div className="flex gap-2">
            {(['mentions', 'alphabetical'] as SortOption[]).map((option) => (
              <Button
                key={option}
                variant={sortBy === option ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy(option)}
                className={cn(
                  sortBy === option && 'bg-primary hover:bg-primary-hover'
                )}
              >
                {option === 'mentions' ? 'Most Mentioned' : 'A-Z'}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Companies Grid */}
        {filteredCompanies.length === 0 ? (
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
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map((company) => (
              <Link
                key={company.id}
                to={`/companies/${company.id}`}
                className="group"
              >
                <div className="h-full p-5 rounded-xl border border-border bg-card card-hover">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {company.mention_count} mentions
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {company.name}
                  </h3>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {company.episodes?.length || 0} episodes
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-muted">
                        <Lightbulb className="h-3 w-3" />
                        Decisions
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
