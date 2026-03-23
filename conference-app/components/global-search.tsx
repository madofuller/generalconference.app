'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { loadTalks, loadFullTalks } from '@/lib/data-loader';
import { Talk, DataEra } from '@/lib/types';
import { useFilters } from '@/lib/filter-context';

// All navigable pages
const PAGES = [
  { name: 'Home', href: '/', section: 'Pages', icon: 'home', keywords: 'home landing start' },
  { name: 'The Big Picture', href: '/overall', section: 'Pages', icon: 'dashboard', keywords: 'overview stats analytics dashboard' },
  { name: 'Search', href: '/search', section: 'Search', icon: 'search', keywords: 'search word phrase scripture find text quote' },
  { name: 'Word Search', href: '/search?tab=words', section: 'Search', icon: 'text_fields', keywords: 'word search find text boolean' },
  { name: 'Phrase Search', href: '/search?tab=phrases', section: 'Search', icon: 'format_quote', keywords: 'phrase search exact quote' },
  { name: 'Scripture Search', href: '/search?tab=scriptures', section: 'Search', icon: 'menu_book', keywords: 'scripture bible book of mormon reference' },
  { name: 'Topics Explorer', href: '/topics', section: 'Search', icon: 'category', keywords: 'topics themes categories' },
  { name: 'Emotions Explorer', href: '/emotions', section: 'Search', icon: 'mood', keywords: 'emotions feelings sentiment' },
  { name: 'Browse Talks', href: '/search?tab=talks', section: 'Search', icon: 'description', keywords: 'talks browse read conference viewer' },
  { name: 'People Directory', href: '/people', section: 'People', icon: 'groups', keywords: 'people apostle seventies women roster directory' },
  { name: 'Apostle Profiles', href: '/people?tab=apostles', section: 'People', icon: 'shield_person', keywords: 'apostle profiles quorum twelve' },
  { name: 'Apostle Timeline', href: '/people?tab=timeline', section: 'People', icon: 'timeline', keywords: 'apostle timeline history called served' },
  { name: 'The Seventies', href: '/people?tab=seventies', section: 'People', icon: 'diversity_1', keywords: 'seventies general authority' },
  { name: "Women Leaders", href: '/people?tab=women', section: 'People', icon: 'person_celebrate', keywords: 'women leaders relief society young women primary' },
  { name: "Who's Due to Speak", href: '/people?tab=roster', section: 'People', icon: 'assignment_ind', keywords: 'roster speakers due overdue list all' },
  { name: 'Speaker Insights', href: '/speakers', section: 'People', icon: 'route', keywords: 'speaker journey insights leaderboard service careers' },
  { name: 'Speaker Journeys', href: '/speakers?tab=journeys', section: 'People', icon: 'route', keywords: 'speaker journey individual profile' },
  { name: 'Speaker Leaderboard', href: '/speakers?tab=leaderboard', section: 'People', icon: 'leaderboard', keywords: 'leaderboard most talks prolific' },
  { name: 'Longest Serving', href: '/speakers?tab=service', section: 'People', icon: 'timeline', keywords: 'longest serving years service' },
  { name: 'Paths of Service', href: '/speakers?tab=careers', section: 'People', icon: 'moving', keywords: 'careers callings service paths timeline' },
  { name: 'Who Speaks Alike', href: '/speakers?tab=similarity', section: 'People', icon: 'compare_arrows', keywords: 'similarity compare speakers alike' },
  { name: 'Speaker Fingerprint', href: '/speakers?tab=fingerprint', section: 'People', icon: 'fingerprint', keywords: 'vocabulary unique words speaker style fingerprint' },
  { name: 'Scripture Insights', href: '/scripture-insights', section: 'Insights', icon: 'menu_book', keywords: 'scripture references cited habits influence' },
  { name: 'Name of Christ', href: '/insights/christ', section: 'Insights', icon: 'favorite', keywords: 'jesus christ name mentions tracker' },
  { name: 'Language Evolution', href: '/insights/language', section: 'Insights', icon: 'translate', keywords: 'language phrases evolution rising falling words' },
  { name: 'Talk Length', href: '/insights/talk-length', section: 'Insights', icon: 'schedule', keywords: 'talk length duration words minutes' },
  { name: "Women's Trends", href: '/insights/women', section: 'Insights', icon: 'trending_up', keywords: 'women voices trends female speakers' },
  { name: 'New Voices', href: '/insights/new-voices', section: 'Insights', icon: 'person_add', keywords: 'new speakers first time voices debut' },
  { name: 'Prophet Eras', href: '/insights/prophet-eras', section: 'Insights', icon: 'church', keywords: 'prophet era president church leadership' },
  { name: 'April vs October', href: '/insights/april-vs-october', section: 'Deep Dives', icon: 'compare', keywords: 'april october season comparison' },
  { name: 'How Talks Begin', href: '/insights/openings', section: 'Deep Dives', icon: 'start', keywords: 'openings first words begin start' },
  { name: 'Topic Pairs', href: '/insights/topic-pairs', section: 'Deep Dives', icon: 'hub', keywords: 'topic pairs co-occurring together' },
  { name: 'Through History', href: '/insights/history', section: 'Deep Dives', icon: 'history_edu', keywords: 'history events timeline historical context' },
  { name: 'Emotional Arc', href: '/insights/emotional-arc', section: 'Discoveries', icon: 'show_chart', keywords: 'emotional arc flow conference weekend feelings' },
  { name: 'Doctrinal Pendulum', href: '/insights/doctrinal-pendulum', section: 'Discoveries', icon: 'balance', keywords: 'doctrinal pendulum justice mercy agency obedience tension' },
  { name: 'Lost & Found', href: '/insights/silence', section: 'Discoveries', icon: 'swap_horiz', keywords: 'lost found vanished risen phrases disappeared emerged language' },
  { name: 'Talk DNA', href: '/insights/talk-dna', section: 'Discoveries', icon: 'fingerprint', keywords: 'dna fingerprint radar chart speaker dimensions' },
  { name: 'The Calling Effect', href: '/insights/calling-effect', section: 'Discoveries', icon: 'swap_vert', keywords: 'calling effect apostle transition change before after' },
  { name: 'Thematic Shifts', href: '/insights/repetition', section: 'Discoveries', icon: 'swap_horiz', keywords: 'thematic shifts themes rising falling emphasis change pivot' },
  { name: 'Conference Wordle', href: '/games/wordle', section: 'Games', icon: 'grid_on', keywords: 'wordle word daily guess' },
  { name: 'Connections', href: '/games/connections', section: 'Games', icon: 'apps', keywords: 'connections group category nyt' },
  { name: 'Decade Detective', href: '/games/decade-detective', section: 'Games', icon: 'history_edu', keywords: 'decade detective guess era year' },
  { name: 'Real or Fake?', href: '/games/title-or-not', section: 'Games', icon: 'psychology', keywords: 'real fake title guess' },
  { name: 'Finish the Quote', href: '/games/finish-quote', section: 'Games', icon: 'edit_note', keywords: 'finish quote complete prophet' },
  { name: 'Trivia', href: '/games/trivia', section: 'Games', icon: 'quiz', keywords: 'trivia quiz game fun' },
  { name: 'Bingo', href: '/games/bingo', section: 'Games', icon: 'grid_view', keywords: 'bingo game card conference' },
];

interface SearchResult {
  type: 'page' | 'speaker' | 'talk' | 'scripture';
  title: string;
  subtitle?: string;
  href: string;
  icon: string;
  section: string;
}

// Scripture book names for detection — order matters (longer first to avoid partial matches)
const SCRIPTURE_BOOKS = [
  '1 Corinthians', '2 Corinthians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', '1 Chronicles', '2 Chronicles',
  '1 Samuel', '2 Samuel', '1 Kings', '2 Kings',
  '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
  '1 Nephi', '2 Nephi', '3 Nephi', '4 Nephi',
  'Doctrine and Covenants', 'Song of Solomon',
  'Joseph Smith—History', 'Joseph Smith—Matthew',
  'Joseph Smith-History', 'Joseph Smith-Matthew',
  'JS—H', 'JS-H', 'JS—M', 'JS-M',
  'Articles of Faith', 'Words of Mormon',
  'Ecclesiastes', 'Deuteronomy', 'Philippians', 'Colossians',
  'Lamentations', 'Revelation',
  'Galatians', 'Ephesians', 'Habakkuk', 'Zephaniah',
  'Zechariah', 'Nehemiah', 'Leviticus',
  'Matthew', 'Genesis', 'Exodus', 'Numbers', 'Joshua', 'Judges',
  'Helaman', 'Mosiah', 'Mormon', 'Moroni',
  'Abraham', 'Isaiah', 'Jeremiah', 'Ezekiel', 'Daniel',
  'Proverbs', 'Psalms', 'Psalm',
  'Romans', 'Hebrews', 'Malachi', 'Haggai',
  'Obadiah', 'Philemon',
  'Hosea', 'Micah', 'Nahum', 'Jonah', 'Ether',
  'Jacob', 'James', 'Titus',
  'Moses', 'Alma', 'Mark', 'Luke', 'John', 'Acts',
  'Joel', 'Amos', 'Ruth', 'Ezra', 'Jude', 'Enos',
  'Job', 'D&C',
];

function detectScriptureQuery(q: string): { book: string; ref: string } | null {
  const lower = q.toLowerCase().trim();
  for (const book of SCRIPTURE_BOOKS) {
    if (lower.startsWith(book.toLowerCase())) {
      return { book, ref: q.trim() };
    }
  }
  // Also check common abbreviations
  const abbrMap: Record<string, string> = {
    '1 ne': '1 Nephi', '2 ne': '2 Nephi', '3 ne': '3 Nephi', '4 ne': '4 Nephi',
    'hel': 'Helaman', 'moro': 'Moroni', 'morm': 'Mormon',
    'matt': 'Matthew', 'rom': 'Romans', 'gen': 'Genesis', 'ex': 'Exodus',
    'deut': 'Deuteronomy', 'isa': 'Isaiah', 'jer': 'Jeremiah', 'rev': 'Revelation',
    'heb': 'Hebrews', 'gal': 'Galatians', 'eph': 'Ephesians', 'phil': 'Philippians',
    'col': 'Colossians', 'prov': 'Proverbs', 'ps': 'Psalms',
    '1 cor': '1 Corinthians', '2 cor': '2 Corinthians',
    '1 tim': '1 Timothy', '2 tim': '2 Timothy',
    '1 pet': '1 Peter', '2 pet': '2 Peter',
    'abr': 'Abraham', 'd&c': 'D&C',
  };
  for (const [abbr, book] of Object.entries(abbrMap)) {
    if (lower.startsWith(abbr + ' ') || lower === abbr) {
      const suffix = q.trim().slice(abbr.length);
      return { book, ref: book + suffix };
    }
  }
  return null;
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[#f5a623]/30 text-[#1c1c13] rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

const ERA_OPTIONS: { value: DataEra; label: string; shortLabel: string; icon: string }[] = [
  { value: 'modern', label: '1971 Onward', shortLabel: '1971+', icon: 'verified' },
  { value: 'historical', label: '1880 – 1970', shortLabel: '1880s', icon: 'history_edu' },
  { value: 'all', label: 'All Years', shortLabel: 'All', icon: 'select_all' },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [indexTalks, setIndexTalks] = useState<Talk[]>([]);
  const [fullTalks, setFullTalks] = useState<Talk[]>([]);
  const [indexLoaded, setIndexLoaded] = useState(false);
  const [fullLoaded, setFullLoaded] = useState(false);
  const [loadingFull, setLoadingFull] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { dataEra, setDataEra, filterTalks } = useFilters();

  // Load index (metadata only) on first open — fast
  useEffect(() => {
    if (open && !indexLoaded) {
      loadTalks().then(t => { setIndexTalks(t); setIndexLoaded(true); });
    }
  }, [open, indexLoaded]);

  // Load full talks (with text) when user types a scripture ref or 4+ chars — lazy
  const needsFullText = useMemo(() => {
    const q = query.toLowerCase().trim();
    return q.length >= 4 || detectScriptureQuery(q) !== null;
  }, [query]);

  useEffect(() => {
    if (open && needsFullText && !fullLoaded && !loadingFull) {
      setLoadingFull(true);
      loadFullTalks().then(t => { setFullTalks(t); setFullLoaded(true); setLoadingFull(false); });
    }
  }, [open, needsFullText, fullLoaded, loadingFull]);

  // Apply era filter — use index for metadata, full for text search
  const talks = useMemo(() => filterTalks(indexTalks), [filterTalks, indexTalks]);
  const talksWithText = useMemo(() => filterTalks(fullTalks), [filterTalks, fullTalks]);

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIdx(0);
    }
  }, [open]);

  // Compute unique speakers
  const speakers = useMemo(() => {
    const map = new Map<string, { count: number; firstYear: number; lastYear: number; calling: string }>();
    talks.forEach(t => {
      const existing = map.get(t.speaker);
      if (!existing) {
        map.set(t.speaker, { count: 1, firstYear: t.year, lastYear: t.year, calling: t.calling });
      } else {
        existing.count++;
        existing.firstYear = Math.min(existing.firstYear, t.year);
        existing.lastYear = Math.max(existing.lastYear, t.year);
        if (t.year >= existing.lastYear) existing.calling = t.calling;
      }
    });
    return map;
  }, [talks]);

  // Search results
  const results: SearchResult[] = useMemo(() => {
    if (!query.trim()) {
      // Show popular pages when empty
      return PAGES.slice(0, 8).map(p => ({
        type: 'page' as const, title: p.name, href: p.href, icon: p.icon, section: p.section,
      }));
    }

    const q = query.toLowerCase().trim();
    const out: SearchResult[] = [];

    // Search pages
    PAGES.forEach(p => {
      if (p.name.toLowerCase().includes(q) || p.keywords.includes(q) || p.section.toLowerCase().includes(q)) {
        out.push({ type: 'page', title: p.name, subtitle: p.section, href: p.href, icon: p.icon, section: 'Pages' });
      }
    });

    // Scripture search — detect if query looks like a scripture reference
    const scriptureMatch = detectScriptureQuery(q);
    if (scriptureMatch && talksWithText.length > 0) {
      const searchRef = scriptureMatch.ref.toLowerCase();
      const matchingTalks: { talk: Talk; snippet: string }[] = [];
      for (const t of talksWithText) {
        if (matchingTalks.length >= 15) break;
        const text = (t.talk || '').toLowerCase();
        const idx = text.indexOf(searchRef);
        if (idx !== -1) {
          const snippet = (t.talk || '').slice(Math.max(0, idx - 40), idx + searchRef.length + 60).trim();
          matchingTalks.push({ talk: t, snippet });
        }
      }
      if (matchingTalks.length > 0) {
        out.push({
          type: 'scripture', title: `${scriptureMatch.ref} — ${matchingTalks.length} talks`,
          subtitle: `Found in ${matchingTalks.length} conference talks · Open full scripture search`,
          href: `/scriptures?q=${encodeURIComponent(scriptureMatch.ref)}`,
          icon: 'menu_book', section: `Scripture: ${scriptureMatch.ref}`,
        });
        matchingTalks.slice(0, 8).forEach(({ talk: t, snippet }) => {
          out.push({
            type: 'scripture', title: t.title,
            subtitle: `${t.speaker} · ${t.season} ${t.year} · "...${snippet}..."`,
            href: t.url || `/scriptures?q=${encodeURIComponent(scriptureMatch.ref)}`,
            icon: 'auto_stories', section: `Scripture: ${scriptureMatch.ref}`,
          });
        });
      } else if (loadingFull) {
        out.push({
          type: 'scripture', title: `Searching for ${scriptureMatch.ref}...`,
          subtitle: 'Loading full talk text for scripture search',
          href: `/scriptures?q=${encodeURIComponent(scriptureMatch.ref)}`,
          icon: 'hourglass_top', section: `Scripture: ${scriptureMatch.ref}`,
        });
      }
    } else if (scriptureMatch && !fullLoaded) {
      out.push({
        type: 'scripture', title: `Search for ${scriptureMatch.ref}`,
        subtitle: loadingFull ? 'Loading talk text...' : 'Loading scripture data...',
        href: `/scriptures?q=${encodeURIComponent(scriptureMatch.ref)}`,
        icon: loadingFull ? 'hourglass_top' : 'menu_book', section: `Scripture: ${scriptureMatch.ref}`,
      });
    }

    // Search speakers
    speakers.forEach((info, name) => {
      if (name.toLowerCase().includes(q)) {
        out.push({
          type: 'speaker', title: name,
          subtitle: `${info.count} talks · ${info.firstYear}–${info.lastYear} · ${info.calling}`,
          href: `/speakers?speaker=${encodeURIComponent(name)}`,
          icon: 'person', section: 'Speakers',
        });
      }
    });

    // Search talk titles (limit to 15 for performance)
    if (q.length >= 3) {
      let talkCount = 0;
      for (const t of talks) {
        if (talkCount >= 15) break;
        if (t.title.toLowerCase().includes(q)) {
          out.push({
            type: 'talk', title: t.title,
            subtitle: `${t.speaker} · ${t.season} ${t.year}`,
            href: t.url || `/talks?search=${encodeURIComponent(t.title)}`,
            icon: 'article', section: 'Talks',
          });
          talkCount++;
        }
      }
    }

    // Search talk text (only if few title matches, limit to 10)
    if (q.length >= 4 && out.filter(r => r.type === 'talk').length < 5 && talksWithText.length > 0) {
      let textCount = 0;
      for (const t of talksWithText) {
        if (textCount >= 10) break;
        if (out.some(r => r.type === 'talk' && r.title === t.title)) continue;
        if ((t.talk || '').toLowerCase().includes(q)) {
          const idx = (t.talk || '').toLowerCase().indexOf(q);
          const snippet = (t.talk || '').slice(Math.max(0, idx - 30), idx + q.length + 50).trim();
          out.push({
            type: 'talk', title: t.title,
            subtitle: `${t.speaker} · ${t.season} ${t.year} · "...${snippet}..."`,
            href: t.url || `/talks?search=${encodeURIComponent(t.title)}`,
            icon: 'text_snippet', section: 'In Talk Text',
          });
          textCount++;
        }
      }
    }

    return out;
  }, [query, speakers, talks, talksWithText, loadingFull, fullLoaded]);

  // Reset selection on results change
  useEffect(() => { setSelectedIdx(0); }, [results]);

  const navigate = useCallback((result: SearchResult) => {
    setOpen(false);
    if (result.href.startsWith('http')) {
      window.open(result.href, '_blank');
    } else {
      router.push(result.href);
    }
  }, [router]);

  // Keyboard nav
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIdx]) {
      e.preventDefault();
      navigate(results[selectedIdx]);
    }
  };

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  if (!open) return null;

  // Group results by section
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.section]) acc[r.section] = [];
    acc[r.section].push(r);
    return acc;
  }, {});

  let flatIdx = -1;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh]" onClick={() => setOpen(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl mx-4 bg-[#fdf9e9] rounded-2xl shadow-[0_25px_60px_rgba(27,94,123,0.25)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#e5e0d5]">
          <span className="material-symbols-outlined text-[#1B5E7B] text-xl">search</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search talks, speakers, pages..."
            className="flex-1 bg-transparent text-[#1c1c13] text-base placeholder:text-[#1c1c13]/30 outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 bg-[#f2eede] rounded-md text-[10px] text-[#524534] font-mono">
            ESC
          </kbd>
        </div>

        {/* Era Toggle */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-[#e5e0d5] bg-[#f8f4e4]/50">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#1c1c13]/30 mr-1">Era</span>
          {ERA_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setDataEra(opt.value)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all',
                dataEra === opt.value
                  ? 'bg-[#1B5E7B] text-white shadow-sm'
                  : 'text-[#1c1c13]/40 hover:text-[#1B5E7B] hover:bg-[#f5a623]/10'
              )}
            >
              <span className="material-symbols-outlined text-sm">{opt.icon}</span>
              <span className="hidden sm:inline">{opt.label}</span>
              <span className="sm:hidden">{opt.shortLabel}</span>
            </button>
          ))}
          <span className="ml-auto text-[10px] text-[#524534]/40">
            {talks.length.toLocaleString()} talks
          </span>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[55vh] overflow-y-auto py-2">
          {results.length === 0 && query.trim() && (
            <div className="px-5 py-8 text-center">
              <span className="material-symbols-outlined text-3xl text-[#1c1c13]/20 mb-2 block">search_off</span>
              <p className="text-sm text-[#524534]">No results for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-[#524534]/60 mt-1">Try a speaker name, talk title, or keyword</p>
            </div>
          )}

          {Object.entries(grouped).map(([section, items]) => (
            <div key={section}>
              <div className="px-5 pt-3 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1c1c13]/30">{section}</span>
              </div>
              {items.map(result => {
                flatIdx++;
                const idx = flatIdx;
                const isSelected = idx === selectedIdx;
                return (
                  <button
                    key={`${result.type}-${result.href}-${result.title}-${idx}`}
                    className={cn(
                      'w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors',
                      isSelected ? 'bg-[#1B5E7B]/10' : 'hover:bg-[#f8f4e4]'
                    )}
                    onClick={() => navigate(result)}
                    onMouseEnter={() => setSelectedIdx(idx)}
                  >
                    <span className={cn(
                      'material-symbols-outlined text-lg shrink-0',
                      isSelected ? 'text-[#1B5E7B]' : 'text-[#1c1c13]/30'
                    )}>
                      {result.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm truncate', isSelected ? 'text-[#1B5E7B] font-medium' : 'text-[#1c1c13]')}>
                        {highlightMatch(result.title, query)}
                      </p>
                      {result.subtitle && (
                        <p className="text-[11px] text-[#524534]/60 truncate">{result.subtitle}</p>
                      )}
                    </div>
                    {isSelected && (
                      <span className="material-symbols-outlined text-base text-[#1B5E7B]/40">arrow_forward</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {!query.trim() && (
            <div className="px-5 py-3 border-t border-[#e5e0d5] mt-2">
              <p className="text-[10px] text-[#524534]/40 text-center">
                Searching {talks.length.toLocaleString()} talks, {speakers.size} speakers, and {PAGES.length} pages
                {dataEra !== 'all' && ` (${dataEra === 'modern' ? '1971+' : '1880–1970'})`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SearchTrigger() {
  const [, setOpen] = useState(false);

  // This component just renders the trigger button.
  // We use a custom event to open the search since state is in GlobalSearch.
  const handleClick = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f8f4e4] hover:bg-[#f5a623]/15 transition-all text-[#1c1c13]/50 hover:text-[#1B5E7B] group"
      title="Search (⌘K)"
    >
      <span className="material-symbols-outlined text-base">search</span>
      <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Search</span>
      <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#f2eede] rounded text-[9px] text-[#524534]/50 font-mono ml-1">
        ⌘K
      </kbd>
    </button>
  );
}
