'use client';

import { useState, useEffect, useRef } from 'react';
import { useFilteredFullTalks } from '@/lib/filter-context';
import { Talk } from '@/lib/types';

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
  'Pearl of Great Price': ['Moses', 'Abraham', 'Joseph Smith\u2014Matthew', 'Joseph Smith\u2014History', 'Articles of Faith'],
};

const VOLUME_SHORT: Record<string, string> = {
  'Book of Mormon': 'BoM',
  'Doctrine and Covenants': 'D&C',
  'New Testament': 'NT',
  'Old Testament': 'OT',
  'Pearl of Great Price': 'PGP',
};

const BOOK_ABBREVIATIONS: Record<string, string[]> = {
  'Moroni': ['Moroni', 'Moro.', 'Moro'], 'Mormon': ['Mormon', 'Morm.', 'Morm'],
  '1 Nephi': ['1 Nephi', '1 Ne.', '1 Ne', '1Nephi', '1 Nep.'],
  '2 Nephi': ['2 Nephi', '2 Ne.', '2 Ne', '2Nephi', '2 Nep.'],
  '3 Nephi': ['3 Nephi', '3 Ne.', '3 Ne', '3Nephi', '3 Nep.'],
  '4 Nephi': ['4 Nephi', '4 Ne.', '4 Ne', '4Nephi', '4 Nep.'],
  'Helaman': ['Helaman', 'Hel.', 'Hel'], 'Alma': ['Alma'], 'Mosiah': ['Mosiah'],
  'Jacob': ['Jacob'], 'Enos': ['Enos'], 'Ether': ['Ether'],
  'D&C': ['D&C', 'Doctrine and Covenants', 'D. and C.', 'D.&C.'],
  'Matthew': ['Matthew', 'Matt.', 'Matt'], 'Mark': ['Mark'], 'Luke': ['Luke'], 'John': ['John'],
  'Acts': ['Acts'], 'Romans': ['Romans', 'Rom.', 'Rom'],
  '1 Corinthians': ['1 Corinthians', '1 Cor.', '1 Cor'],
  '2 Corinthians': ['2 Corinthians', '2 Cor.', '2 Cor'],
  'Galatians': ['Galatians', 'Gal.', 'Gal'], 'Ephesians': ['Ephesians', 'Eph.', 'Eph'],
  'Philippians': ['Philippians', 'Phil.', 'Philip.'],
  'Colossians': ['Colossians', 'Col.', 'Col'],
  '1 Thessalonians': ['1 Thessalonians', '1 Thes.', '1 Thess.'],
  '2 Thessalonians': ['2 Thessalonians', '2 Thes.', '2 Thess.'],
  '1 Timothy': ['1 Timothy', '1 Tim.', '1 Tim'], '2 Timothy': ['2 Timothy', '2 Tim.', '2 Tim'],
  'Titus': ['Titus'], 'Hebrews': ['Hebrews', 'Heb.', 'Heb'], 'James': ['James'],
  '1 Peter': ['1 Peter', '1 Pet.', '1 Pet'], '2 Peter': ['2 Peter', '2 Pet.', '2 Pet'],
  '1 John': ['1 John'], '2 John': ['2 John'], '3 John': ['3 John'], 'Jude': ['Jude'],
  'Revelation': ['Revelation', 'Rev.', 'Rev'],
  'Genesis': ['Genesis', 'Gen.', 'Gen'], 'Exodus': ['Exodus', 'Ex.', 'Ex'],
  'Leviticus': ['Leviticus', 'Lev.', 'Lev'], 'Numbers': ['Numbers', 'Num.', 'Num'],
  'Deuteronomy': ['Deuteronomy', 'Deut.', 'Deut'],
  'Joshua': ['Joshua', 'Josh.', 'Josh'], 'Judges': ['Judges', 'Judg.'], 'Ruth': ['Ruth'],
  'Isaiah': ['Isaiah', 'Isa.', 'Isa'], 'Jeremiah': ['Jeremiah', 'Jer.', 'Jer'],
  'Ezekiel': ['Ezekiel', 'Ezek.', 'Ezek'], 'Daniel': ['Daniel', 'Dan.', 'Dan'],
  'Psalms': ['Psalms', 'Psalm', 'Ps.', 'Ps'], 'Proverbs': ['Proverbs', 'Prov.', 'Prov'],
  'Job': ['Job'], 'Moses': ['Moses'], 'Abraham': ['Abraham', 'Abr.', 'Abr'],
  'Joseph Smith\u2014History': ['Joseph Smith\u2014History', 'JS\u2014H', 'JS-H', 'Joseph Smith-History'],
  'Joseph Smith\u2014Matthew': ['Joseph Smith\u2014Matthew', 'JS\u2014M', 'JS-M', 'Joseph Smith-Matthew'],
  'Articles of Faith': ['Articles of Faith', 'A of F'],
};

interface ScriptureSnippet { quote: string; reference: string; context: 'talk' | 'footnotes'; }
interface TalkWithSnippets { talk: Talk; snippets: ScriptureSnippet[]; }

function extractSnippets(talk: Talk, searchPattern: string, book: string): ScriptureSnippet[] {
  const snippets: ScriptureSnippet[] = [];
  const abbrevs = BOOK_ABBREVIATIONS[book] || [book];
  const patternsToSearch: string[] = [searchPattern.toLowerCase()];
  if (book !== searchPattern) {
    const suffix = searchPattern.slice(book.length);
    for (const abbrev of abbrevs) {
      if (abbrev.toLowerCase() !== book.toLowerCase()) patternsToSearch.push((abbrev + suffix).toLowerCase());
    }
  } else {
    for (const abbrev of abbrevs) {
      if (abbrev.toLowerCase() !== book.toLowerCase()) patternsToSearch.push(abbrev.toLowerCase());
    }
  }
  const talkText = talk.talk || '';
  for (const pattern of patternsToSearch) {
    let searchIdx = 0;
    const textLower = talkText.toLowerCase();
    while (searchIdx < textLower.length) {
      const matchIdx = textLower.indexOf(pattern, searchIdx);
      if (matchIdx === -1) break;
      const snippet = extractContextAroundMatch(talkText, matchIdx, pattern.length);
      if (snippet && !snippets.some(s => s.quote === snippet.quote)) snippets.push({ ...snippet, context: 'talk' });
      searchIdx = matchIdx + pattern.length;
      if (snippets.length >= 5) break;
    }
    if (snippets.length >= 5) break;
  }
  return snippets;
}

function extractContextAroundMatch(text: string, matchIdx: number, matchLen: number): { quote: string; reference: string } | null {
  const refInParens = findParenCitation(text, matchIdx, matchLen);
  const reference = refInParens || text.slice(matchIdx, matchIdx + matchLen);
  const sentenceStart = findSentenceStart(text, matchIdx);
  const sentenceEnd = findSentenceEnd(text, matchIdx + matchLen);
  let contextStart = sentenceStart;
  let contextEnd = sentenceEnd;
  const parenIdx = refInParens ? text.lastIndexOf('(', matchIdx + 5) : -1;
  if (parenIdx > 0) {
    const beforeParen = text.slice(Math.max(0, parenIdx - 20), parenIdx);
    if (/["\u201d]\s*$/.test(beforeParen)) {
      const closeQuoteIdx = parenIdx - (beforeParen.length - beforeParen.search(/["\u201d]\s*$/));
      const searchFrom = Math.max(0, closeQuoteIdx - 500);
      const beforeClose = text.slice(searchFrom, closeQuoteIdx);
      const lastOpen = Math.max(beforeClose.lastIndexOf('\u201c'), beforeClose.lastIndexOf('"'));
      if (lastOpen !== -1) {
        const absOpenIdx = searchFrom + lastOpen;
        const quotedText = text.slice(absOpenIdx, closeQuoteIdx + 1).trim();
        if (quotedText.length > 15 && quotedText.length < 500) contextStart = Math.min(absOpenIdx, sentenceStart);
      }
    }
  }
  const prevStart = findSentenceStart(text, Math.max(0, contextStart - 2));
  const prevSentence = text.slice(prevStart, contextStart).trim();
  if (prevSentence.length > 0 && prevSentence.length < 200) contextStart = prevStart;
  let snippet = text.slice(contextStart, contextEnd).trim();
  if (snippet.length > 600) {
    const matchRelative = matchIdx - contextStart;
    const start = Math.max(0, matchRelative - 250);
    const end = Math.min(snippet.length, matchRelative + 250);
    snippet = (start > 0 ? '\u2026' : '') + snippet.slice(start, end).trim() + (end < snippet.length ? '\u2026' : '');
  }
  if (snippet.length < 10) return null;
  return { quote: snippet, reference };
}

function findParenCitation(text: string, matchIdx: number, matchLen: number): string | null {
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
  for (let i = fromIdx - 1; i >= Math.max(0, fromIdx - 400); i--) {
    if ((text[i] === '.' || text[i] === '!' || text[i] === '?') && text[i + 1] === ' ') return i + 2;
    if (text[i] === '\n') return i + 1;
  }
  return Math.max(0, fromIdx - 200);
}

function findSentenceEnd(text: string, fromIdx: number): number {
  for (let i = fromIdx; i < Math.min(text.length, fromIdx + 300); i++) {
    if (text[i] === ')' && (text[i + 1] === ' ' || text[i + 1] === '\n' || i + 1 >= text.length)) return i + 1;
    if ((text[i] === '.' || text[i] === '!' || text[i] === '?') &&
        (text[i + 1] === ' ' || text[i + 1] === '\n' || text[i + 1] === '"' || text[i + 1] === '\u201d' || i + 1 >= text.length)) {
      if (text[i] === '.' && i + 1 < text.length && /\d/.test(text[i + 1])) continue;
      return i + 1;
    }
  }
  return Math.min(text.length, fromIdx + 200);
}

function HighlightedSnippet({ text, searchPattern, book }: { text: string; searchPattern: string; book: string }) {
  const abbrevs = BOOK_ABBREVIATIONS[book] || [book];
  const suffix = searchPattern.slice(book.length);
  const allPatterns = [searchPattern, ...abbrevs.map(a => a + suffix)].filter(Boolean);
  const escaped = allPatterns.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) => {
        if (regex.test(part)) { regex.lastIndex = 0; return <mark key={i} className="bg-[#f5a623]/30 text-[#1c1c13] rounded px-0.5 font-semibold">{part}</mark>; }
        regex.lastIndex = 0;
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

export function ScriptureSearchContent() {
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setSelectedBook(''); setChapter(''); setVerse(''); setVerseEnd(''); }, [selectedVolume]);
  useEffect(() => { setChapter(''); setVerse(''); setVerseEnd(''); }, [selectedBook]);

  const availableBooks = selectedVolume ? SCRIPTURE_BOOKS[selectedVolume as keyof typeof SCRIPTURE_BOOKS] : [];

  const currentSelection = selectedBook
    ? `${selectedBook}${chapter ? ` ${chapter}` : ''}${verse ? `:${verse}` : ''}${verseEnd ? `\u2013${verseEnd}` : ''}`
    : '';

  // Auto-search whenever selection changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!selectedBook || talks.length === 0) {
      setSearchResults([]);
      setSearchPattern('');
      return;
    }

    debounceRef.current = setTimeout(() => {
      setSearching(true);
      setExpandedTalks(new Set());

      requestAnimationFrame(() => {
        let pattern = selectedBook;
        if (chapter) { pattern += ` ${chapter}`; if (verse) { pattern += `:${verse}`; if (verseEnd) pattern += `\u2013${verseEnd}`; } }
        setSearchPattern(pattern);

        const abbrevs = BOOK_ABBREVIATIONS[selectedBook] || [selectedBook];
        const suffix = pattern.slice(selectedBook.length);
        const allPatterns = [pattern.toLowerCase()];
        for (const abbrev of abbrevs) {
          const variant = (abbrev + suffix).toLowerCase();
          if (!allPatterns.includes(variant)) allPatterns.push(variant);
        }

        // Also search with hyphen variants for verse ranges
        if (verseEnd) {
          const hyphenPattern = `${selectedBook}${chapter ? ` ${chapter}` : ''}${verse ? `:${verse}` : ''}-${verseEnd}`;
          const hyphenLower = hyphenPattern.toLowerCase();
          if (!allPatterns.includes(hyphenLower)) allPatterns.push(hyphenLower);
          for (const abbrev of abbrevs) {
            const variant = (abbrev + hyphenPattern.slice(selectedBook.length)).toLowerCase();
            if (!allPatterns.includes(variant)) allPatterns.push(variant);
          }
        }

        const results: TalkWithSnippets[] = [];
        for (const talk of talks) {
          const searchText = `${talk.footnotes || ''} ${talk.talk || ''}`.toLowerCase();
          if (allPatterns.some(p => searchText.includes(p))) {
            results.push({ talk, snippets: extractSnippets(talk, pattern, selectedBook) });
          }
        }

        setSearchResults(results);
        setSearching(false);
      });
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [selectedBook, chapter, verse, verseEnd, talks]);

  const toggleExpanded = (idx: number) => {
    setExpandedTalks(prev => { const next = new Set(prev); if (next.has(idx)) next.delete(idx); else next.add(idx); return next; });
  };

  if (loading) {
    return <div className="px-4 md:px-8 lg:px-12 py-20 flex items-center justify-center"><p className="text-[#1c1c13]/40">Loading talk data...</p></div>;
  }

  return (
    <div className="px-4 md:px-8 lg:px-12 pt-4 md:pt-6 pb-12 md:pb-24">
      {/* Volume pills */}
      <div className="bg-white p-4 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] mb-4 space-y-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1c1c13]/40 mb-2">Volume</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(SCRIPTURE_BOOKS).map(vol => (
              <button
                key={vol}
                onClick={() => setSelectedVolume(vol === selectedVolume ? '' : vol)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                  selectedVolume === vol
                    ? 'bg-[#1B5E7B] text-white'
                    : 'bg-[#f8f4e4] text-[#1c1c13]/50 hover:bg-[#1B5E7B]/10'
                }`}
              >
                <span className="hidden sm:inline">{vol}</span>
                <span className="sm:hidden">{VOLUME_SHORT[vol] || vol}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Book pills */}
        {selectedVolume && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1c1c13]/40 mb-2">Book</p>
            <div className="flex flex-wrap gap-1.5">
              {availableBooks.map(book => (
                <button
                  key={book}
                  onClick={() => setSelectedBook(book === selectedBook ? '' : book)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider transition-all ${
                    selectedBook === book
                      ? 'bg-[#f5a623] text-white'
                      : 'bg-[#f8f4e4] text-[#1c1c13]/50 hover:bg-[#f5a623]/10'
                  }`}
                >
                  {book}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chapter/Verse inline */}
        {selectedBook && (
          <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-[#ece8d9]">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1c1c13]/40 mb-1 block">Chapter</label>
              <input
                type="number" min="1" placeholder="Ch"
                value={chapter} onChange={e => setChapter(e.target.value)}
                className="w-20 px-3 py-2 rounded-xl border border-[#ece8d9] bg-[#fdf9e9] text-sm focus:outline-none focus:border-[#1B5E7B] focus:ring-2 focus:ring-[#1B5E7B]/10"
              />
            </div>
            {chapter && (
              <>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1c1c13]/40 mb-1 block">Verse</label>
                  <input
                    type="number" min="1" placeholder="Start"
                    value={verse} onChange={e => setVerse(e.target.value)}
                    className="w-20 px-3 py-2 rounded-xl border border-[#ece8d9] bg-[#fdf9e9] text-sm focus:outline-none focus:border-[#1B5E7B] focus:ring-2 focus:ring-[#1B5E7B]/10"
                  />
                </div>
                {verse && (
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1c1c13]/40 mb-1 block">To</label>
                    <input
                      type="number" min="1" placeholder="End"
                      value={verseEnd} onChange={e => setVerseEnd(e.target.value)}
                      className="w-20 px-3 py-2 rounded-xl border border-[#ece8d9] bg-[#fdf9e9] text-sm focus:outline-none focus:border-[#1B5E7B] focus:ring-2 focus:ring-[#1B5E7B]/10"
                    />
                  </div>
                )}
              </>
            )}

            {/* Current selection badge + spinner */}
            <div className="flex items-center gap-3 ml-auto">
              {currentSelection && (
                <span className="px-3 py-2 bg-[#1B5E7B]/10 text-[#1B5E7B] rounded-full text-xs font-bold">
                  {currentSelection}
                </span>
              )}
              {searching && (
                <span className="material-symbols-outlined text-[#f5a623] text-xl animate-spin">progress_activity</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results summary */}
      {searchResults.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Talks Found', value: searchResults.length.toLocaleString() },
            { label: 'Unique Speakers', value: new Set(searchResults.map(r => r.talk.speaker)).size.toLocaleString() },
            { label: 'With Quotes', value: searchResults.filter(r => r.snippets.length > 0).length.toLocaleString() },
          ].map(item => (
            <div key={item.label} className="bg-white p-4 rounded-xl shadow-[0px_4px_16px_rgba(27,94,123,0.04)] text-center">
              <p className="text-xl md:text-2xl font-bold text-[#1c1c13]">{item.value}</p>
              <p className="text-[10px] uppercase tracking-wider text-[#1c1c13]/40 font-bold">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Results list */}
      {searchResults.length > 0 && (
        <div className="space-y-2">
          {searchResults.slice(0, 50).map((result, idx) => {
            const { talk, snippets } = result;
            const isExpanded = expandedTalks.has(idx);
            const visibleSnippets = isExpanded ? snippets : snippets.slice(0, 1);
            return (
              <div key={idx} className="bg-white rounded-xl p-3 sm:p-4 shadow-[0px_4px_16px_rgba(27,94,123,0.04)] hover:shadow-[0px_8px_24px_rgba(27,94,123,0.08)] transition-all">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-[#1c1c13] leading-tight">{talk.title}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                      <span className="text-xs font-medium text-[#1B5E7B]">{talk.speaker}</span>
                      <span className="text-[10px] text-[#1c1c13]/30">&middot;</span>
                      <span className="text-[10px] text-[#1c1c13]/40">{talk.season} {talk.year}</span>
                      {talk.calling && talk.calling !== 'No Calling Found' && (
                        <>
                          <span className="text-[10px] text-[#1c1c13]/30">&middot;</span>
                          <span className="text-[10px] text-[#1c1c13]/40">{talk.calling}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {talk.url && (
                    <a href={talk.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#1B5E7B] bg-[#1B5E7B]/5 hover:bg-[#1B5E7B]/10 transition-colors shrink-0">
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                      View
                    </a>
                  )}
                </div>
                {snippets.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {visibleSnippets.map((snippet, si) => (
                      <div key={si} className="rounded-lg bg-[#fdf9e9] border-l-3 border-[#f5a623] pl-3 sm:pl-4 pr-3 py-2.5 sm:py-3">
                        <p className="text-xs sm:text-sm text-[#1c1c13]/80 leading-relaxed italic">
                          <HighlightedSnippet text={snippet.quote} searchPattern={searchPattern} book={selectedBook} />
                        </p>
                        {snippet.reference && (
                          <p className="text-[10px] sm:text-xs text-[#1B5E7B] font-semibold mt-1.5">{snippet.reference}</p>
                        )}
                      </div>
                    ))}
                    {snippets.length > 1 && (
                      <button onClick={() => toggleExpanded(idx)}
                        className="text-xs font-medium text-[#1B5E7B] hover:text-[#f5a623] transition-colors flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">{isExpanded ? 'expand_less' : 'expand_more'}</span>
                        {isExpanded ? 'Show less' : `${snippets.length - 1} more quote${snippets.length - 1 > 1 ? 's' : ''}`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {searchResults.length > 50 && (
            <p className="text-sm text-[#1c1c13]/40 text-center pt-2">Showing first 50 of {searchResults.length} talks</p>
          )}
        </div>
      )}

      {/* No results */}
      {searchResults.length === 0 && searchPattern && !searching && (
        <div className="bg-white p-8 rounded-xl text-center shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
          <span className="material-symbols-outlined text-4xl text-[#1c1c13]/20 mb-2">search_off</span>
          <p className="text-sm text-[#1c1c13]/40">No talks found referencing {searchPattern}</p>
        </div>
      )}

      {/* Empty state */}
      {!searchPattern && !selectedVolume && (
        <div className="bg-white p-8 md:p-12 rounded-xl text-center shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
          <span className="material-symbols-outlined text-5xl text-[#1c1c13]/15 mb-3">menu_book</span>
          <h3 className="text-lg font-bold text-[#1c1c13]/60 mb-2">Scripture Search</h3>
          <p className="text-sm text-[#1c1c13]/40 max-w-md mx-auto">
            Select a volume and book above — results appear instantly as you narrow your search.
          </p>
        </div>
      )}
    </div>
  );
}
