import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useDojoData } from '@/contexts/DojoDataContext';
import { 
  Building2, 
  BookOpen, 
  Search, 
  Lightbulb,
  Quote,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'company' | 'framework' | 'concept';
  name: string;
  category?: string;
  description: string;
  insight?: string;
  quote?: string;
  applicability?: string;
  url: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  prioritization: 'text-purple-600',
  strategy: 'text-blue-600',
  growth: 'text-green-600',
  metrics: 'text-orange-600',
  design: 'text-pink-600',
  execution: 'text-cyan-600',
  leadership: 'text-amber-600',
  ai_ml: 'text-emerald-600',
};

export function SpotlightSearch() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const navigate = useNavigate();
  const { companies, frameworks, isReady } = useDojoData();

  // Cmd+K to open
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Build searchable index
  const searchIndex = useMemo((): SearchResult[] => {
    if (!isReady) return [];

    const results: SearchResult[] = [];

    // Add companies
    for (const company of companies) {
      const topDecision = company.decisions[0];
      const topOpinion = company.opinions[0];
      
      results.push({
        id: `company-${company.name}`,
        type: 'company',
        name: company.name,
        description: `${company.episode_count} episodes • ${company.total_decisions} decisions`,
        insight: topOpinion?.opinion || topDecision?.why || 'Company featured in Lenny\'s Podcast',
        quote: topOpinion?.quote || topDecision?.quote,
        applicability: topDecision ? `Learn from their ${topDecision.what}` : undefined,
        url: `/companies/${encodeURIComponent(company.name.toLowerCase().replace(/\s+/g, '-'))}`
      });
    }

    // Add frameworks
    for (const framework of frameworks) {
      results.push({
        id: `framework-${framework.name}`,
        type: 'framework',
        name: framework.name,
        category: framework.category,
        description: framework.explanation?.slice(0, 100) + '...' || 'Product management framework',
        insight: framework.explanation,
        quote: framework.quote,
        applicability: framework.when_to_use,
        url: `/frameworks/${encodeURIComponent(framework.name.toLowerCase().replace(/\s+/g, '-'))}`
      });
    }

    // Add common PM concepts as virtual entries
    const concepts = [
      { name: 'Product-Market Fit', desc: 'The degree to which a product satisfies market demand', category: 'growth' },
      { name: 'North Star Metric', desc: 'The single metric that best captures the core value your product delivers', category: 'metrics' },
      { name: 'A/B Testing', desc: 'Comparing two versions to see which performs better', category: 'execution' },
      { name: 'User Research', desc: 'Understanding user needs through interviews and observation', category: 'design' },
      { name: 'Roadmap Planning', desc: 'Strategic planning of product features and timeline', category: 'strategy' },
    ];

    for (const concept of concepts) {
      // Check if already exists as a framework
      if (!frameworks.some(f => f.name.toLowerCase() === concept.name.toLowerCase())) {
        results.push({
          id: `concept-${concept.name}`,
          type: 'concept',
          name: concept.name,
          category: concept.category,
          description: concept.desc,
          insight: concept.desc,
          url: `/frameworks`
        });
      }
    }

    return results;
  }, [companies, frameworks, isReady]);

  // Filter results
  const filteredResults = useMemo(() => {
    if (!search.trim()) return searchIndex.slice(0, 10);

    const query = search.toLowerCase();
    return searchIndex
      .filter(result => 
        result.name.toLowerCase().includes(query) ||
        result.description.toLowerCase().includes(query) ||
        result.category?.toLowerCase().includes(query)
      )
      .slice(0, 15);
  }, [search, searchIndex]);

  const handleSelect = useCallback((result: SearchResult) => {
    setSelectedResult(result);
  }, []);

  const handleNavigate = useCallback((url: string) => {
    setOpen(false);
    setSearch('');
    setSelectedResult(null);
    navigate(url);
  }, [navigate]);

  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {
      company: [],
      framework: [],
      concept: []
    };

    for (const result of filteredResults) {
      groups[result.type].push(result);
    }

    return groups;
  }, [filteredResults]);

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-lg border border-border transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search companies, frameworks, concepts..." 
          value={search}
          onValueChange={setSearch}
        />
        <CommandList className="max-h-[400px]">
          <CommandEmpty>
            <div className="py-6 text-center">
              <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No results found for "{search}"</p>
            </div>
          </CommandEmpty>

          {/* Selected result preview */}
          {selectedResult && (
            <>
              <div className="p-4 border-b border-border bg-muted/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {selectedResult.type === 'company' && <Building2 className="h-4 w-4 text-primary" />}
                      {selectedResult.type === 'framework' && <BookOpen className="h-4 w-4 text-primary" />}
                      {selectedResult.type === 'concept' && <Lightbulb className="h-4 w-4 text-primary" />}
                      <span className="font-semibold">{selectedResult.name}</span>
                      {selectedResult.category && (
                        <span className={cn('text-xs capitalize', CATEGORY_COLORS[selectedResult.category])}>
                          {selectedResult.category.replace('_', '/')}
                        </span>
                      )}
                    </div>

                    {/* Insight */}
                    {selectedResult.insight && (
                      <div className="mb-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <Sparkles className="h-3 w-3" />
                          Key Insight
                        </div>
                        <p className="text-sm line-clamp-2">{selectedResult.insight}</p>
                      </div>
                    )}

                    {/* Applicability */}
                    {selectedResult.applicability && (
                      <div className="mb-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <Lightbulb className="h-3 w-3" />
                          When to Apply
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{selectedResult.applicability}</p>
                      </div>
                    )}

                    {/* Quote */}
                    {selectedResult.quote && (
                      <div className="mt-2 p-2 rounded bg-primary/5 border-l-2 border-primary">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <Quote className="h-3 w-3" />
                          Expert Quote
                        </div>
                        <p className="text-xs italic line-clamp-2">"{selectedResult.quote}"</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleNavigate(selectedResult.url)}
                    className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
                  >
                    View Details
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <CommandSeparator />
            </>
          )}

          {/* Companies */}
          {groupedResults.company.length > 0 && (
            <CommandGroup heading="Companies">
              {groupedResults.company.map((result) => (
                <CommandItem
                  key={result.id}
                  value={result.name}
                  onSelect={() => handleSelect(result)}
                  className="cursor-pointer"
                >
                  <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{result.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{result.description}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Frameworks */}
          {groupedResults.framework.length > 0 && (
            <CommandGroup heading="Frameworks">
              {groupedResults.framework.map((result) => (
                <CommandItem
                  key={result.id}
                  value={result.name}
                  onSelect={() => handleSelect(result)}
                  className="cursor-pointer"
                >
                  <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{result.name}</p>
                      {result.category && (
                        <span className={cn('text-xs capitalize', CATEGORY_COLORS[result.category])}>
                          {result.category.replace('_', '/')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{result.description}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Concepts */}
          {groupedResults.concept.length > 0 && (
            <CommandGroup heading="Concepts">
              {groupedResults.concept.map((result) => (
                <CommandItem
                  key={result.id}
                  value={result.name}
                  onSelect={() => handleSelect(result)}
                  className="cursor-pointer"
                >
                  <Lightbulb className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{result.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{result.description}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>

        <div className="border-t border-border p-2 text-xs text-muted-foreground flex items-center justify-between">
          <span>Type to search across all content</span>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">↑↓</kbd>
            <span>navigate</span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">↵</kbd>
            <span>select</span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">esc</kbd>
            <span>close</span>
          </div>
        </div>
      </CommandDialog>
    </>
  );
}
