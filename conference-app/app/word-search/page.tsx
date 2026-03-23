'use client';

import { useState } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useFilters, useFilteredTalks } from '@/lib/filter-context';
import { searchByWord } from '@/lib/search-utils';
import { SearchResult } from '@/lib/types';
import { SearchResults } from '@/components/search-results';
import { Badge } from '@/components/ui/badge';

export default function WordSearchPage() {
  const { filters } = useFilters();
  const { talks, loading } = useFilteredTalks();
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

  const [anyWords, setAnyWords] = useState('');
  const [allWords, setAllWords] = useState('');
  const [noneWords, setNoneWords] = useState('');
  const [scope, setScope] = useState<'talk_text' | 'title'>('talk_text');

  const handleSearch = () => {
    setSearching(true);
    
    const anyWordsList = anyWords.trim() ? anyWords.trim().split(/\s+/) : [];
    const allWordsList = allWords.trim() ? allWords.trim().split(/\s+/) : [];
    const noneWordsList = noneWords.trim() ? noneWords.trim().split(/\s+/) : [];
    
    const result = searchByWord(talks, anyWordsList, allWordsList, noneWordsList, scope, filters);
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
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1 pt-20 lg:pt-0">
        <TopAppBar title="Word Search" subtitle="Boolean word search across all talks" />
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
                Use ANY, ALL, and NONE to create complex search queries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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

              {/* ANY Words */}
              <div className="space-y-2">
                <Label htmlFor="any">ANY (at least one of these words)</Label>
                <Input
                  id="any"
                  placeholder="e.g., faith hope charity"
                  value={anyWords}
                  onChange={(e) => setAnyWords(e.target.value)}
                />
                <p className="text-xs text-[#524534]">
                  Separate words with spaces. Talk must contain at least one of these words.
                </p>
              </div>

              {/* ALL Words */}
              <div className="space-y-2">
                <Label htmlFor="all">ALL (must contain all of these words)</Label>
                <Input
                  id="all"
                  placeholder="e.g., Israel"
                  value={allWords}
                  onChange={(e) => setAllWords(e.target.value)}
                />
                <p className="text-xs text-[#524534]">
                  Separate words with spaces. Talk must contain all of these words.
                </p>
              </div>

              {/* NONE Words */}
              <div className="space-y-2">
                <Label htmlFor="none">NONE (exclude talks with these words)</Label>
                <Input
                  id="none"
                  placeholder="e.g., pride"
                  value={noneWords}
                  onChange={(e) => setNoneWords(e.target.value)}
                />
                <p className="text-xs text-[#524534]">
                  Separate words with spaces. Talk must not contain any of these words.
                </p>
              </div>

              {/* Search Logic Explanation */}
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium mb-2">Search Logic:</p>
                <p className="text-sm text-[#524534]">
                  Results = (ANY) AND (ALL) AND NOT (NONE)
                </p>
                <p className="text-xs text-[#524534] mt-2">
                  Example: For "gathering of Israel" - set ANY: "gather gathering scatter scattering", ALL: "Israel", NONE: (empty)
                </p>
              </div>

              {/* Search Button */}
              <Button 
                onClick={handleSearch} 
                size="lg" 
                className="w-full"
                disabled={searching || (!anyWords && !allWords)}
              >
                {searching ? 'Searching...' : 'Search'}
              </Button>
            </CardContent>
          </Card>

          {/* Search Results */}
          {searchResult && (
            <SearchResults 
              result={searchResult} 
              title="Word Search Results"
            />
          )}

          {searchResult && searchResult.talks.length === 0 && (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-[#524534]">
                  No talks found matching your search criteria. Try adjusting your search terms or filters.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}



