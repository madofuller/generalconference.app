'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useFilters } from '@/lib/filter-context';
import { loadTalks } from '@/lib/data-loader';
import { Talk } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

// Common scripture books
const SCRIPTURE_BOOKS = {
  'Book of Mormon': ['1 Nephi', '2 Nephi', 'Jacob', 'Enos', 'Jarom', 'Omni', 'Words of Mormon', 
                     'Mosiah', 'Alma', 'Helaman', '3 Nephi', '4 Nephi', 'Mormon', 'Ether', 'Moroni'],
  'Doctrine and Covenants': ['D&C'],
  'New Testament': ['Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians',
                    'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
                    '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
                    '1 John', '2 John', '3 John', 'Jude', 'Revelation'],
  'Old Testament': ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
                    '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
                    'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
                    'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
                    'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'],
  'Pearl of Great Price': ['Moses', 'Abraham', 'Joseph Smith—Matthew', 'Joseph Smith—History', 'Articles of Faith'],
};

export default function ScripturesPage() {
  const { filters } = useFilters();
  const [talks, setTalks] = useState<Talk[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Talk[]>([]);
  
  const [selectedVolume, setSelectedVolume] = useState('');
  const [selectedBook, setSelectedBook] = useState('');
  const [chapter, setChapter] = useState('');
  const [verse, setVerse] = useState('');
  const [verseEnd, setVerseEnd] = useState('');

  useEffect(() => {
    loadTalks().then(data => {
      setTalks(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    // Reset book when volume changes
    setSelectedBook('');
    setChapter('');
    setVerse('');
    setVerseEnd('');
  }, [selectedVolume]);

  const availableBooks = selectedVolume ? SCRIPTURE_BOOKS[selectedVolume as keyof typeof SCRIPTURE_BOOKS] : [];

  const handleSearch = () => {
    setSearching(true);
    
    // Build search pattern
    let searchPattern = '';
    if (selectedBook) {
      searchPattern = selectedBook;
      if (chapter) {
        searchPattern += ` ${chapter}`;
        if (verse) {
          searchPattern += `:${verse}`;
          if (verseEnd) {
            searchPattern += `-${verseEnd}`;
          }
        }
      }
    }
    
    // Search in footnotes and talk text
    const results = talks.filter(talk => {
      const searchText = `${talk.footnotes} ${talk.talk}`.toLowerCase();
      return searchText.includes(searchPattern.toLowerCase());
    });
    
    setSearchResults(results);
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
            <h1 className="mb-2 text-4xl font-bold">Scriptures</h1>
            <p className="text-xl text-muted-foreground">
              Search for conference talks that reference specific scriptures
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
              <CardTitle>Scripture Search</CardTitle>
              <CardDescription>
                Select a scripture volume, book, chapter, and optionally verse(s)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Volume Selection */}
              <div className="space-y-2">
                <Label>Scripture Volume</Label>
                <Select value={selectedVolume} onValueChange={setSelectedVolume}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a volume" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(SCRIPTURE_BOOKS).map(volume => (
                      <SelectItem key={volume} value={volume}>
                        {volume}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Book Selection */}
              {selectedVolume && (
                <div className="space-y-2">
                  <Label>Book</Label>
                  <Select value={selectedBook} onValueChange={setSelectedBook}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a book" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBooks.map(book => (
                        <SelectItem key={book} value={book}>
                          {book}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Chapter Input */}
              {selectedBook && (
                <div className="space-y-2">
                  <Label htmlFor="chapter">Chapter (optional)</Label>
                  <Input
                    id="chapter"
                    type="number"
                    min="1"
                    placeholder="Enter chapter number"
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                  />
                </div>
              )}

              {/* Verse Input */}
              {selectedBook && chapter && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="verse">Verse (optional)</Label>
                    <Input
                      id="verse"
                      type="number"
                      min="1"
                      placeholder="Start verse"
                      value={verse}
                      onChange={(e) => setVerse(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="verseEnd">End Verse (optional)</Label>
                    <Input
                      id="verseEnd"
                      type="number"
                      min="1"
                      placeholder="End verse"
                      value={verseEnd}
                      onChange={(e) => setVerseEnd(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Current Selection Display */}
              {selectedBook && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm font-medium mb-2">Current Selection:</p>
                  <p className="text-lg font-semibold">
                    {selectedBook}
                    {chapter && ` ${chapter}`}
                    {verse && `:${verse}`}
                    {verseEnd && `-${verseEnd}`}
                  </p>
                </div>
              )}

              {/* Search Button */}
              <Button 
                onClick={handleSearch} 
                size="lg" 
                className="w-full"
                disabled={searching || !selectedBook}
              >
                {searching ? 'Searching...' : 'Search'}
              </Button>
            </CardContent>
          </Card>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Search Results</CardTitle>
                  <CardDescription>
                    Found {searchResults.length} talk(s) referencing this scripture
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Talks</p>
                      <p className="text-3xl font-bold">{searchResults.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Unique Speakers</p>
                      <p className="text-3xl font-bold">
                        {new Set(searchResults.map(t => t.speaker)).size}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Conferences</p>
                      <p className="text-3xl font-bold">
                        {new Set(searchResults.map(t => `${t.season} ${t.year}`)).size}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Matching Talks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {searchResults.slice(0, 50).map((talk, idx) => (
                      <div key={idx} className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{talk.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {talk.speaker} • {talk.season} {talk.year}
                            </p>
                            <Badge variant="outline">{talk.calling}</Badge>
                          </div>
                          <a
                            href={talk.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Button variant="outline" size="sm">
                              View Talk
                            </Button>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                  {searchResults.length > 50 && (
                    <p className="mt-4 text-sm text-muted-foreground text-center">
                      Showing first 50 of {searchResults.length} talks
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {searchResults.length === 0 && selectedBook && !searching && (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  No talks found referencing this scripture. Try a different scripture or adjust your filters.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          {!selectedBook && (
            <Card>
              <CardHeader>
                <CardTitle>How to Use</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Select a scripture volume (e.g., Book of Mormon, New Testament)</li>
                  <li>Choose a specific book from that volume</li>
                  <li>Optionally specify a chapter number</li>
                  <li>Optionally specify verse(s) for more precise searches</li>
                  <li>Click "Search" to find all talks referencing that scripture</li>
                </ol>
                <div className="mt-4 rounded-lg bg-muted p-4">
                  <p className="text-sm font-medium mb-2">Note:</p>
                  <p className="text-sm text-muted-foreground">
                    Scripture references are found by searching both the talk text and footnotes. 
                    The search looks for mentions of the scripture reference in various formats.
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

