'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useFilters } from '@/lib/filter-context';
import { loadTalks } from '@/lib/data-loader';
import { searchByPhrase } from '@/lib/search-utils';
import { Talk, SearchResult } from '@/lib/types';
import { SearchResults } from '@/components/search-results';
import { Badge } from '@/components/ui/badge';

export default function PhraseSearchPage() {
  const { filters } = useFilters();
  const [talks, setTalks] = useState<Talk[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  
  const [phrase, setPhrase] = useState('');
  const [scope, setScope] = useState<'talk_text' | 'title'>('talk_text');

  useEffect(() => {
    loadTalks().then(data => {
      setTalks(data);
      setLoading(false);
    });
  }, []);

  const handleSearch = () => {
    if (!phrase.trim()) return;
    
    setSearching(true);
    const result = searchByPhrase(talks, phrase, scope, filters);
    setSearchResult(result);
    setSearching(false);
  };

  const getFilterDescription = () => {
    if (filters.type === 'none') return null;
    if (filters.type === 'speaker') {
      return `Filtered by ${filters.speakers?.length || 0} speaker(s)`;
    }
    if (filters.type === 'conference') {
      return `Filtered by conference: ${filters.conference}`;
    }
    if (filters.type === 'era') {
      return `Filtered by era: ${filters.era}`;
    }
    if (filters.type === 'year') {
      return `Filtered by years: ${filters.yearRange?.[0]} - ${filters.yearRange?.[1]}`;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Navigation />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-8">
            <p>Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Navigation />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold">Phrase Search</h1>
            <p className="text-xl text-muted-foreground">
              Search for talks containing specific phrases
            </p>
          </div>

          {/* Current Filter Badge */}
          {filters.type !== 'none' && (
            <div className="mb-4">
              <Badge variant="secondary" className="text-sm">
                {getFilterDescription()}
              </Badge>
            </div>
          )}

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Search Configuration</CardTitle>
              <CardDescription>
                Enter an exact phrase to search for in conference talks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Phrase Input */}
              <div className="space-y-2">
                <Label htmlFor="phrase">Phrase</Label>
                <Input
                  id="phrase"
                  placeholder="e.g., plan of salvation"
                  value={phrase}
                  onChange={(e) => setPhrase(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && phrase.trim()) {
                      handleSearch();
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the exact phrase you want to find. Search is case-insensitive.
                </p>
              </div>

              {/* Search Scope */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Search Scope</Label>
                <RadioGroup value={scope} onValueChange={(value: any) => setScope(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="talk_text" id="talk_text" />
                    <Label htmlFor="talk_text" className="cursor-pointer">Full Talk Text</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="title" id="title" />
                    <Label htmlFor="title" className="cursor-pointer">Talk Title Only</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Example Searches */}
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium mb-2">Example Searches:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• "plan of salvation"</li>
                  <li>• "gathering of Israel"</li>
                  <li>• "temple ordinances"</li>
                  <li>• "Holy Ghost"</li>
                </ul>
              </div>

              {/* Search Button */}
              <Button 
                onClick={handleSearch} 
                size="lg" 
                className="w-full"
                disabled={searching || !phrase.trim()}
              >
                {searching ? 'Searching...' : 'Phrase Search'}
              </Button>
            </CardContent>
          </Card>

          {/* Search Results */}
          {searchResult && (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Search Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Phrase</p>
                      <p className="text-lg font-semibold">"{phrase}"</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Talks Found</p>
                      <p className="text-lg font-semibold">{searchResult.talks.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total References</p>
                      <p className="text-lg font-semibold">{searchResult.totalReferences}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">References per Talk</p>
                      <p className="text-lg font-semibold">
                        {searchResult.talks.length > 0 
                          ? (searchResult.totalReferences / searchResult.talks.length).toFixed(2)
                          : '0'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <SearchResults 
                result={searchResult} 
                title={`Phrase Search: "${phrase}"`}
              />
            </>
          )}

          {searchResult && searchResult.talks.length === 0 && (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  No talks found containing the phrase "{phrase}". Try a different phrase or adjust your filters.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          {!searchResult && (
            <Card>
              <CardHeader>
                <CardTitle>How to Use</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Enter the exact phrase you want to search for</li>
                  <li>Choose whether to search in full talk text or titles only</li>
                  <li>Click "Phrase Search" to see results</li>
                  <li>Optional: Set filters on the Filters page before searching to narrow results</li>
                </ol>
                <div className="mt-4 rounded-lg bg-muted p-4">
                  <p className="text-sm font-medium mb-2">Note:</p>
                  <p className="text-sm text-muted-foreground">
                    If you have set a filter, the search will only include talks matching both the phrase and the filter criteria.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

