'use client';

import { useState } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useFilters, useFilteredTalks } from '@/lib/filter-context';
import { searchByPhrase } from '@/lib/search-utils';
import { SearchResult } from '@/lib/types';
import { SearchResults } from '@/components/search-results';
import { Badge } from '@/components/ui/badge';

export default function PhraseSearchPage() {
  const { filters } = useFilters();
  const { talks, loading } = useFilteredTalks();
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

  const [phrase, setPhrase] = useState('');
  const [scope, setScope] = useState<'talk_text' | 'title'>('talk_text');

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
      <div className="flex min-h-screen">
        <Navigation />
        <main className="ml-0 lg:ml-[260px] flex-1 flex items-center justify-center">
          <p className="text-[#524534]">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1">
        <TopAppBar title="Phrase Search" subtitle="Find exact phrases in talks" />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24">

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
                <p className="text-xs text-[#524534]">
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
                <ul className="text-sm text-[#524534] space-y-1">
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
                      <p className="text-sm text-[#524534]">Phrase</p>
                      <p className="text-lg font-semibold">"{phrase}"</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#524534]">Talks Found</p>
                      <p className="text-lg font-semibold">{searchResult.talks.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#524534]">Total References</p>
                      <p className="text-lg font-semibold">{searchResult.totalReferences}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#524534]">References per Talk</p>
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
                <p className="text-center text-[#524534]">
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
                  <p className="text-sm text-[#524534]">
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



