import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/lib/i18n';
import { useLocation } from 'wouter';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface SearchResult {
  id: string;
  type: 'project' | 'post';
  title: string;
  description: string;
  rank: number;
  category?: string;
  status?: string;
  thumbnailUrl?: string;
}

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { locale, t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: results, isLoading, isError } = useQuery<{ results: SearchResult[]; count: number }>({
    queryKey: ['/api/search', query, locale],
    enabled: query.length >= 2,
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&language=${locale}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Search failed');
      }
      return data;
    },
    retry: false,
  });

  const { data: suggestions } = useQuery<{ suggestions: string[] }>({
    queryKey: ['/api/search/suggestions', query, locale],
    enabled: query.length >= 2,
    queryFn: async () => {
      const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}&language=${locale}`);
      if (!res.ok) throw new Error('Suggestions failed');
      return res.json();
    },
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'project') {
      setLocation(`/projects?id=${result.id}`);
    } else {
      setLocation(`/social?post=${result.id}`);
    }
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={t('common.search')}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-9 pr-20 glass-card"
          data-testid="search-input"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
              className="p-1 hover:bg-muted/50 rounded"
              data-testid="search-clear"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      {isOpen && query.length >= 2 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 glass-card border-[#00D1FF]/20 max-h-96 overflow-y-auto">
          <div className="p-2">
            {results && results.results.length > 0 ? (
              <div className="space-y-1">
                {results.results.slice(0, 8).map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className="w-full text-left p-3 rounded-lg hover:bg-muted/50 smooth-transition group"
                    data-testid={`search-result-${result.type}-${result.id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate group-hover:text-[#00D1FF] smooth-transition">
                            {result.title}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {result.type === 'project' ? t('project.title') : 'Post'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {result.description}
                        </p>
                        {result.category && (
                          <span className="text-xs text-[#7B2CFF] mt-1 inline-block">
                            {result.category}
                          </span>
                        )}
                      </div>
                      {result.thumbnailUrl && (
                        <img
                          src={result.thumbnailUrl}
                          alt={result.title}
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {isLoading 
                  ? t('common.loading') 
                  : isError 
                  ? 'Erreur de recherche. Essayez un autre terme.' 
                  : 'Aucun résultat trouvé'}
              </div>
            )}

            {suggestions && suggestions.suggestions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/30">
                <p className="text-xs text-muted-foreground mb-2">Suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setQuery(suggestion)}
                      className="px-2 py-1 text-xs bg-muted/50 hover:bg-muted rounded-md smooth-transition"
                      data-testid={`search-suggestion-${suggestion}`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
