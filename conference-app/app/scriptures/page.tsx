'use client';

import { useState, useEffect } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useFilters, useFilteredFullTalks } from '@/lib/filter-context';
import { Talk } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

// Common scripture books with abbreviations used in talks
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

// Common abbreviations for scripture books
const BOOK_ABBREVIATIONS: Record<string, string[]> = {
  'Moroni': ['Moroni', 'Moro.', 'Moro'],
  'Mormon': ['Mormon', 'Morm.', 'Morm'],
  '1 Nephi': ['1 Nephi', '1 Ne.', '1 Ne', '1Nephi', '1 Nep.'],
  '2 Nephi': ['2 Nephi', '2 Ne.', '2 Ne', '2Nephi', '2 Nep.'],
  '3 Nephi': ['3 Nephi', '3 Ne.', '3 Ne', '3Nephi', '3 Nep.'],
  '4 Nephi': ['4 Nephi', '4 Ne.', '4 Ne', '4Nephi', '4 Nep.'],
  'Helaman': ['Helaman', 'Hel.', 'Hel'],
  'Alma': ['Alma'],
  'Mosiah': ['Mosiah'],
  'Jacob': ['Jacob'],
  'Enos': ['Enos'],
  'Ether': ['Ether'],
  'D&C': ['D&C', 'Doctrine and Covenants', 'D. and C.', 'D.&C.'],
  'Matthew': ['Matthew', 'Matt.', 'Matt'],
  'Mark': ['Mark'],
  'Luke': ['Luke'],
  'John': ['John'],
  'Acts': ['Acts'],
  'Romans': ['Romans', 'Rom.', 'Rom'],
  '1 Corinthians': ['1 Corinthians', '1 Cor.', '1 Cor'],
  '2 Corinthians': ['2 Corinthians', '2 Cor.', '2 Cor'],
  'Galatians': ['Galatians', 'Gal.', 'Gal'],
  'Ephesians': ['Ephesians', 'Eph.', 'Eph'],
  'Philippians': ['Philippians', 'Phil.', 'Philip.'],
  'Colossians': ['Colossians', 'Col.', 'Col'],
  '1 Thessalonians': ['1 Thessalonians', '1 Thes.', '1 Thess.'],
  '2 Thessalonians': ['2 Thessalonians', '2 Thes.', '2 Thess.'],
  '1 Timothy': ['1 Timothy', '1 Tim.', '1 Tim'],
  '2 Timothy': ['2 Timothy', '2 Tim.', '2 Tim'],
  'Titus': ['Titus'],
  'Hebrews': ['Hebrews', 'Heb.', 'Heb'],
  'James': ['James'],
  '1 Peter': ['1 Peter', '1 Pet.', '1 Pet'],
  '2 Peter': ['2 Peter', '2 Pet.', '2 Pet'],
  '1 John': ['1 John'],
  '2 John': ['2 John'],
  '3 John': ['3 John'],
  'Jude': ['Jude'],
  'Revelation': ['Revelation', 'Rev.', 'Rev'],
  'Genesis': ['Genesis', 'Gen.', 'Gen'],
  'Exodus': ['Exodus', 'Ex.', 'Ex'],
  'Leviticus': ['Leviticus', 'Lev.', 'Lev'],
  'Numbers': ['Numbers', 'Num.', 'Num'],
  'Deuteronomy': ['Deuteronomy', 'Deut.', 'Deut'],
  'Joshua': ['Joshua', 'Josh.', 'Josh'],
  'Judges': ['Judges', 'Judg.'],
  'Ruth': ['Ruth'],
  'Isaiah': ['Isaiah', 'Isa.', 'Isa'],
  'Jeremiah': ['Jeremiah', 'Jer.', 'Jer'],
  'Ezekiel': ['Ezekiel', 'Ezek.', 'Ezek'],
  'Daniel': ['Daniel', 'Dan.', 'Dan'],
  'Psalms': ['Psalms', 'Psalm', 'Ps.', 'Ps'],
  'Proverbs': ['Proverbs', 'Prov.', 'Prov'],
  'Job': ['Job'],
  'Moses': ['Moses'],
  'Abraham': ['Abraham', 'Abr.', 'Abr'],
  'Joseph Smith—History': ['Joseph Smith—History', 'JS—H', 'JS-H', 'Joseph Smith-History'],
  'Joseph Smith—Matthew': ['Joseph Smith—Matthew', 'JS—M', 'JS-M', 'Joseph Smith-Matthew'],
  'Articles of Faith': ['Articles of Faith', 'A of F'],
};

interface ScriptureSnippet {
  quote: string;
  reference: string;
  context: 'talk' | 'footnotes';
}

interface TalkWithSnippets {
  talk: Talk;
  snippets: ScriptureSnippet[];
}

/**
 * Extract snippets of text surrounding each scripture reference match.
 * Looks for quoted text near the reference, or falls back to surrounding sentences.
 */
function extractSnippets(talk: Talk, searchPattern: string, book: string): ScriptureSnippet[] {
  const snippets: ScriptureSnippet[] = [];
  const abbrevs = BOOK_ABBREVIATIONS[book] || [book];

  // Build patterns to search: "Book chapter:verse" and abbreviation variants
  const patternsToSearch: string[] = [searchPattern.toLowerCase()];
  if (book !== searchPattern) {
    // Also search abbreviations with the chapter/verse suffix
    const suffix = searchPattern.slice(book.length); // e.g., " 32:21"
    for (const abbrev of abbrevs) {
      if (abbrev.toLowerCase() !== book.toLowerCase()) {
        patternsToSearch.push((abbrev + suffix).toLowerCase());
      }
    }
  } else {
    // No chapter specified — search all abbreviations
    for (const abbrev of abbrevs) {
      if (abbrev.toLowerCase() !== book.toLowerCase()) {
        patternsToSearch.push(abbrev.toLowerCase());
      }
    }
  }

  const talkText = talk.talk || '';

  for (const pattern of patternsToSearch) {
    let searchIdx = 0;
    const textLower = talkText.toLowerCase();

    while (searchIdx < textLower.length) {
      const matchIdx = textLower.indexOf(pattern, searchIdx);
      if (matchIdx === -1) break;

      // Extract context around the match
      const snippet = extractContextAroundMatch(talkText, matchIdx, pattern.length);
      if (snippet && !snippets.some(s => s.quote === snippet.quote)) {
        snippets.push({ ...snippet, context: 'talk' });
      }

      searchIdx = matchIdx + pattern.length;
      if (snippets.length >= 5) break; // Cap per talk
    }

    if (snippets.length >= 5) break;
  }

  return snippets;
}

/**
 * Given a match position in the talk text, extract the most relevant surrounding context.
 * Strategy: Always start with the sentence containing the reference. Then check if there's
 * a quoted scripture passage immediately before the citation (e.g., "wickedness never was
 * happiness." (Alma 41:10.)) — if so, include it. This avoids grabbing unrelated quoted
 * text that happens to be nearby.
 */
function extractContextAroundMatch(
  text: string,
  matchIdx: number,
  matchLen: number
): { quote: string; reference: string } | null {
  // Find the parenthetical citation containing our match, e.g., "(See Mosiah 23:21.)"
  const refInParens = findParenCitation(text, matchIdx, matchLen);
  const reference = refInParens || text.slice(matchIdx, matchIdx + matchLen);

  // Find the sentence that contains the reference
  const sentenceStart = findSentenceStart(text, matchIdx);
  const sentenceEnd = findSentenceEnd(text, matchIdx + matchLen);
  let contextStart = sentenceStart;
  let contextEnd = sentenceEnd;

  // Check if there's a quoted scripture passage immediately before the citation.
  // Pattern: "quoted text" (Book ch:vs) — the closing quote should be within ~20 chars
  // before the opening paren of the citation.
  const parenIdx = refInParens ? text.lastIndexOf('(', matchIdx + 5) : -1;
  if (parenIdx > 0) {
    // Look for a closing quote just before the paren
    const beforeParen = text.slice(Math.max(0, parenIdx - 20), parenIdx);
    const hasCloseQuote = /["\u201d]\s*$/.test(beforeParen);

    if (hasCloseQuote) {
      // Find the matching opening quote
      const closeQuoteIdx = parenIdx - (beforeParen.length - beforeParen.search(/["\u201d]\s*$/)) ;
      const searchFrom = Math.max(0, closeQuoteIdx - 500);
      const beforeClose = text.slice(searchFrom, closeQuoteIdx);

      // Find last opening quote
      const lastSmartOpen = beforeClose.lastIndexOf('\u201c');
      const lastStraightOpen = beforeClose.lastIndexOf('"');
      const lastOpen = Math.max(lastSmartOpen, lastStraightOpen);

      if (lastOpen !== -1) {
        const absOpenIdx = searchFrom + lastOpen;
        const quotedText = text.slice(absOpenIdx, closeQuoteIdx + 1).trim();
        // Only use if it's a reasonable scripture quote (not too short, not too long)
        if (quotedText.length > 15 && quotedText.length < 500) {
          // Include the quoted passage + the sentence with the citation
          contextStart = Math.min(absOpenIdx, sentenceStart);
        }
      }
    }
  }

  // Also grab the previous sentence for more context
  const prevStart = findSentenceStart(text, Math.max(0, contextStart - 2));
  // Only include prev sentence if it's short enough to not bloat the snippet
  const prevSentence = text.slice(prevStart, contextStart).trim();
  if (prevSentence.length > 0 && prevSentence.length < 200) {
    contextStart = prevStart;
  }

  let snippet = text.slice(contextStart, contextEnd).trim();

  if (snippet.length > 600) {
    // Trim to a reasonable length centered on the match
    const matchRelative = matchIdx - contextStart;
    const start = Math.max(0, matchRelative - 250);
    const end = Math.min(snippet.length, matchRelative + 250);
    snippet = (start > 0 ? '\u2026' : '') + snippet.slice(start, end).trim() + (end < snippet.length ? '\u2026' : '');
  }

  if (snippet.length < 10) return null;
  return { quote: snippet, reference };
}

function findParenCitation(text: string, matchIdx: number, matchLen: number): string | null {
  // Look for parentheses surrounding the match
  const searchStart = Math.max(0, matchIdx - 5);
  const searchEnd = Math.min(text.length, matchIdx + matchLen + 30);
  const region = text.slice(searchStart, searchEnd);
  const parenOpen = region.lastIndexOf('(', matchIdx - searchStart + 5);
  if (parenOpen === -1) return null;
  const parenClose = region.indexOf(')', parenOpen);
  if (parenClose === -1) return null;
  return region.slice(parenOpen, parenClose + 1);
}

function findSentenceStart(text: string, fromIdx: number): number {
  // Walk backwards to find a sentence boundary
  for (let i = fromIdx - 1; i >= Math.max(0, fromIdx - 400); i--) {
    if ((text[i] === '.' || text[i] === '!' || text[i] === '?') && text[i + 1] === ' ') {
      return i + 2;
    }
    if (text[i] === '\n') {
      return i + 1;
    }
  }
  return Math.max(0, fromIdx - 200);
}

function findSentenceEnd(text: string, fromIdx: number): number {
  // Walk forward to find sentence end after closing paren
  for (let i = fromIdx; i < Math.min(text.length, fromIdx + 300); i++) {
    if (text[i] === ')' && (text[i + 1] === ' ' || text[i + 1] === '\n' || i + 1 >= text.length)) {
      return i + 1;
    }
    if ((text[i] === '.' || text[i] === '!' || text[i] === '?') &&
        (text[i + 1] === ' ' || text[i + 1] === '\n' || text[i + 1] === '"' || text[i + 1] === '\u201d' || i + 1 >= text.length)) {
      // Check if this period is part of a citation like "Moro. 10:5" — skip those
      if (text[i] === '.' && i + 1 < text.length && /\d/.test(text[i + 1])) continue;
      return i + 1;
    }
  }
  return Math.min(text.length, fromIdx + 200);
}

/**
 * Highlight the scripture reference within a snippet
 */
function HighlightedSnippet({ text, searchPattern, book }: { text: string; searchPattern: string; book: string }) {
  const abbrevs = BOOK_ABBREVIATIONS[book] || [book];
  const suffix = searchPattern.slice(book.length);
  const allPatterns = [searchPattern, ...abbrevs.map(a => a + suffix)].filter(Boolean);

  // Build a regex that matches any of the patterns (case insensitive)
  const escaped = allPatterns.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');

  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) => {
        if (regex.test(part)) {
          // Reset lastIndex since we're reusing the regex
          regex.lastIndex = 0;
          return (
            <mark key={i} className="bg-[#f5a623]/30 text-[#1c1c13] rounded px-0.5 font-semibold">
              {part}
            </mark>
          );
        }
        regex.lastIndex = 0;
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

export default function ScripturesPage() {
  const { filters } = useFilters();
  const { talks, loading } = useFilteredFullTalks();
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<TalkWithSnippets[]>([]);
  const [expandedTalks, setExpandedTalks] = useState<Set<number>>(new Set());

  const [selectedVolume, setSelectedVolume] = useState('');
  const [selectedBook, setSelectedBook] = useState('');
  const [chapter, setChapter] = useState('');
  const [verse, setVerse] = useState('');
  const [verseEnd, setVerseEnd] = useState('');
  const [searchPattern, setSearchPattern] = useState('');

  useEffect(() => {
    setSelectedBook('');
    setChapter('');
    setVerse('');
    setVerseEnd('');
  }, [selectedVolume]);

  const availableBooks = selectedVolume ? SCRIPTURE_BOOKS[selectedVolume as keyof typeof SCRIPTURE_BOOKS] : [];

  const handleSearch = () => {
    setSearching(true);
    setExpandedTalks(new Set());

    // Build search pattern
    let pattern = '';
    if (selectedBook) {
      pattern = selectedBook;
      if (chapter) {
        pattern += ` ${chapter}`;
        if (verse) {
          pattern += `:${verse}`;
          if (verseEnd) {
            pattern += `-${verseEnd}`;
          }
        }
      }
    }
    setSearchPattern(pattern);

    // Get all abbreviations for the book
    const abbrevs = BOOK_ABBREVIATIONS[selectedBook] || [selectedBook];
    const suffix = pattern.slice(selectedBook.length); // chapter:verse part

    // Build all pattern variants
    const allPatterns = [pattern.toLowerCase()];
    for (const abbrev of abbrevs) {
      const variant = (abbrev + suffix).toLowerCase();
      if (!allPatterns.includes(variant)) {
        allPatterns.push(variant);
      }
    }

    // Search in footnotes and talk text, extract snippets
    const results: TalkWithSnippets[] = [];

    for (const talk of talks) {
      const searchText = `${talk.footnotes} ${talk.talk}`.toLowerCase();
      const matches = allPatterns.some(p => searchText.includes(p));

      if (matches) {
        const snippets = extractSnippets(talk, pattern, selectedBook);
        results.push({ talk, snippets });
      }
    }

    setSearchResults(results);
    setSearching(false);
  };

  const toggleExpanded = (idx: number) => {
    setExpandedTalks(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const getFilterDescription = () => {
    if (filters.type === 'none') return null;
    if (filters.type === 'speaker') return `Filtered by ${filters.speakers?.length || 0} speaker(s)`;
    if (filters.type === 'conference') return `Filtered by conference: ${filters.conference}`;
    if (filters.type === 'era') return `Filtered by era: ${filters.era}`;
    if (filters.type === 'year') return `Filtered by years: ${filters.yearRange?.[0]} - ${filters.yearRange?.[1]}`;
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
        <TopAppBar title="Scripture Search" subtitle="Find talks by scripture references" />
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
              <CardTitle>Scripture Search</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Select a scripture volume, book, chapter, and optionally verse(s)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Volume Selection */}
              <div className="space-y-2">
                <Label>Scripture Volume</Label>
                <Select value={selectedVolume} onValueChange={setSelectedVolume}>
                  <SelectTrigger className="w-full">
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
                      <p className="text-sm text-[#524534]">Total Talks</p>
                      <p className="text-xl md:text-3xl font-bold">{searchResults.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#524534]">Unique Speakers</p>
                      <p className="text-xl md:text-3xl font-bold">
                        {new Set(searchResults.map(r => r.talk.speaker)).size}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[#524534]">With Inline Quotes</p>
                      <p className="text-xl md:text-3xl font-bold">
                        {searchResults.filter(r => r.snippets.length > 0).length}
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
                  <div className="space-y-3">
                    {searchResults.slice(0, 50).map((result, idx) => {
                      const { talk, snippets } = result;
                      const isExpanded = expandedTalks.has(idx);
                      const visibleSnippets = isExpanded ? snippets : snippets.slice(0, 1);

                      return (
                        <div key={idx} className="rounded-lg border p-3 sm:p-4 hover:bg-muted/50 transition-colors">
                          {/* Talk header */}
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold mb-1 text-sm sm:text-base">{talk.title}</h3>
                              <p className="text-xs sm:text-sm text-[#524534] mb-2">
                                {talk.speaker} &bull; {talk.season} {talk.year}
                              </p>
                              <Badge variant="outline" className="text-xs">{talk.calling}</Badge>
                            </div>
                            <a
                              href={talk.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0"
                            >
                              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                View Talk
                              </Button>
                            </a>
                          </div>

                          {/* Scripture quote snippets */}
                          {snippets.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {visibleSnippets.map((snippet, si) => (
                                <div
                                  key={si}
                                  className="rounded-lg bg-[#fdf9e9] border-l-3 border-[#f5a623] pl-3 sm:pl-4 pr-3 py-2.5 sm:py-3"
                                >
                                  <p className="text-xs sm:text-sm text-[#1c1c13]/80 leading-relaxed italic">
                                    <HighlightedSnippet
                                      text={snippet.quote}
                                      searchPattern={searchPattern}
                                      book={selectedBook}
                                    />
                                  </p>
                                  {snippet.reference && (
                                    <p className="text-[10px] sm:text-xs text-[#1B5E7B] font-semibold mt-1.5">
                                      {snippet.reference}
                                    </p>
                                  )}
                                </div>
                              ))}
                              {snippets.length > 1 && (
                                <button
                                  onClick={() => toggleExpanded(idx)}
                                  className="text-xs font-medium text-[#1B5E7B] hover:text-[#f5a623] transition-colors flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-sm">
                                    {isExpanded ? 'expand_less' : 'expand_more'}
                                  </span>
                                  {isExpanded
                                    ? 'Show less'
                                    : `${snippets.length - 1} more quote${snippets.length - 1 > 1 ? 's' : ''}`}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {searchResults.length > 50 && (
                    <p className="mt-4 text-sm text-[#524534] text-center">
                      Showing first 50 of {searchResults.length} talks
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {searchResults.length === 0 && selectedBook && !searching && searchPattern && (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-[#524534]">
                  No talks found referencing this scripture. Try a different scripture or adjust your filters.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          {!searchPattern && (
            <Card>
              <CardHeader>
                <CardTitle>How to Use</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-sm sm:text-base">
                  <li>Select a scripture volume (e.g., Book of Mormon)</li>
                  <li>Choose a specific book from that volume</li>
                  <li>Optionally specify a chapter number</li>
                  <li>Optionally specify verse(s) for precision</li>
                  <li>Click &quot;Search&quot; to find matching talks</li>
                </ol>
                <div className="mt-4 rounded-lg bg-[#fdf9e9] border-l-3 border-[#f5a623] pl-4 pr-3 py-3">
                  <p className="text-sm font-medium mb-1">Inline Quotes</p>
                  <p className="text-sm text-[#524534]">
                    Results now show the exact passage from the talk where the scripture is referenced,
                    so you can see how each speaker used the verse in context.
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
