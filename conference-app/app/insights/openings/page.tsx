'use client';

import { useState, useEffect, useMemo } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { loadInsights, TalkOpeningsData } from '@/lib/insights';
import { useFilteredFullTalks } from '@/lib/filter-context';
import { Talk } from '@/lib/types';

const TYPE_COLORS: Record<string, string> = {
  'greeting': 'bg-green-100 text-green-700',
  'scripture/quote': 'bg-blue-100 text-blue-700',
  'personal story': 'bg-amber-100 text-amber-700',
  'doctrinal statement': 'bg-sky-100 text-sky-700',
  'gratitude/testimony': 'bg-yellow-100 text-yellow-700',
  'humor': 'bg-pink-100 text-pink-700',
  'question': 'bg-indigo-100 text-indigo-700',
  'historical reference': 'bg-stone-100 text-stone-700',
  'reference to speaker': 'bg-purple-100 text-purple-700',
  'seasonal/topical': 'bg-teal-100 text-teal-700',
  'poem/hymn': 'bg-rose-100 text-rose-700',
  'definition/wordplay': 'bg-cyan-100 text-cyan-700',
  'exhortation': 'bg-orange-100 text-orange-700',
  'narrative/parable': 'bg-lime-100 text-lime-700',
  'other': 'bg-gray-100 text-gray-600',
};

function classifyOpening(text: string): string {
  const lower = text.toLowerCase();

  // Question
  if (/^(have you|what |why |how |do you|can you|when |where |who |is it|are we|could |would |should |isn't|aren't|doesn't)/.test(lower) ||
      (text.indexOf('?') !== -1 && text.indexOf('?') < 120)) {
    return 'question';
  }

  // Scripture/Quote with references
  if (/\b(nephi|alma|mosiah|helaman|moroni|mormon|ether|d&c|doctrine and covenants|matthew|mark|luke|john|acts|romans|corinthians|galatians|ephesians|philippians|colossians|timothy|hebrews|james|peter|revelation|genesis|exodus|isaiah|jeremiah|psalms|proverbs|moses|abraham)\b/i.test(lower.slice(0, 200))) {
    return 'scripture/quote';
  }
  if (/^[""\u201c]/.test(text.trim()) || /^(the (savior|lord|prophet|scriptures?|book of|bible)|in the scriptures|we read in)/i.test(lower)) {
    return 'scripture/quote';
  }

  // Humor
  if (/\b(laugh|funny|joke|humor|chuckle|smiled|amusing)\b/i.test(lower.slice(0, 200)) ||
      /\b(i('m| am) reminded of a (story|time)|a man walked|there('s| is) a story)\b/i.test(lower.slice(0, 200))) {
    return 'humor';
  }

  // Personal story
  if (/^(recently|a few (years|months|weeks|days) ago|last (year|month|week|summer|fall)|when i was|years ago|some (years|time) ago|i remember|growing up|as a (young|child|boy|girl|teenager))/i.test(lower)) {
    return 'personal story';
  }
  if (/\b(my (wife|husband|father|mother|son|daughter|family|grandfather|grandmother))\b/i.test(lower.slice(0, 150))) {
    return 'personal story';
  }

  // Historical reference
  if (/\b(in (18|19)\d\d|years ago.*(history|pioneer|early (church|saints))|joseph smith|brigham young|on (this|that) day in)\b/i.test(lower.slice(0, 200))) {
    return 'historical reference';
  }

  // Greeting (generic "brothers and sisters" openings)
  if (/^(my (dear|beloved)|dear (brothers|sisters)|brothers and sisters|brethren)/i.test(lower)) {
    return 'greeting';
  }

  // Gratitude/Testimony
  if (/^(i('m| am) (grateful|thankful)|i (thank|express|testify|bear|know)|with gratitude|i want to (thank|express))/i.test(lower)) {
    return 'gratitude/testimony';
  }

  // Seasonal/topical
  if (/^(this (morning|afternoon|evening|easter|christmas)|today (we|is|marks)|as we (gather|meet|celebrate)|it('s| is) (easter|christmas|a beautiful))/i.test(lower)) {
    return 'seasonal/topical';
  }

  // Poem/hymn
  if (/\b(poem|hymn|verse|stanza|we (just )?sang|the (choir|hymn))\b/i.test(lower.slice(0, 150))) {
    return 'poem/hymn';
  }

  // Reference to previous speaker
  if (/\b(as (president|elder|sister|bishop|brother) \w+ (said|mentioned|taught|reminded)|following|after (that|such|the) (wonderful|inspiring|beautiful))\b/i.test(lower.slice(0, 200))) {
    return 'reference to speaker';
  }

  // Doctrinal statement
  if (/^(the (gospel|atonement|plan of|priesthood|church|restoration|savior|holy ghost|lord|spirit)|one of the|a (fundamental|basic|central|key)|god|jesus christ|our heavenly father)/i.test(lower)) {
    return 'doctrinal statement';
  }

  // Narrative/parable
  if (/^(there (was|once|lived)|a (man|woman|boy|girl|young|certain)|once upon|imagine|picture|consider the)/i.test(lower)) {
    return 'narrative/parable';
  }

  return 'other';
}

function extractOpening(talk: Talk): string | null {
  const text = talk.talk;
  if (!text || text.length < 50) return null;

  // Skip talks that start with metadata-like content
  const trimmed = text.trim();

  // Get first ~2 sentences (up to 300 chars, ending at a sentence boundary)
  let end = 300;
  for (let i = 80; i < Math.min(trimmed.length, 350); i++) {
    if ((trimmed[i] === '.' || trimmed[i] === '!' || trimmed[i] === '?') &&
        i + 1 < trimmed.length && (trimmed[i + 1] === ' ' || trimmed[i + 1] === '\n' || trimmed[i + 1] === '"')) {
      if (i > 60) { // At least 60 chars
        end = i + 1;
        // Try to get one more sentence if short
        if (end < 120) continue;
        break;
      }
    }
  }

  let opening = trimmed.substring(0, end).trim();

  // Clean up encoding issues
  opening = opening.replace(/[\ufffd\u0000-\u001f]/g, '');
  opening = opening.replace(/\s+/g, ' ');

  if (opening.length < 30) return null;

  return opening;
}

export default function OpeningsPage() {
  const [data, setData] = useState<TalkOpeningsData | null>(null);
  const { talks: fullTalks, loading: loadingFull } = useFilteredFullTalks();
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadInsights().then(i => setData(i.talkOpenings || null));
  }, []);

  // Build live opening lines from actual talk data
  const liveOpenings = useMemo(() => {
    if (fullTalks.length === 0) return [];

    const openings: { opening: string; speaker: string; year: number; season: string; title: string; type: string; url: string }[] = [];

    // Shuffle talks for variety, then extract openings
    const shuffled = [...fullTalks].sort(() => Math.random() - 0.5);
    const seen = new Set<string>(); // Avoid duplicate speakers

    for (const talk of shuffled) {
      if (openings.length >= 200) break;
      if (seen.has(talk.speaker)) continue;

      const opening = extractOpening(talk);
      if (!opening) continue;

      const type = classifyOpening(opening);

      // Skip generic greetings that are just "My beloved brothers and sisters" with nothing interesting
      if (type === 'greeting' && opening.length < 80) continue;

      seen.add(talk.speaker);
      openings.push({
        opening,
        speaker: talk.speaker,
        year: talk.year,
        season: talk.season,
        title: talk.title,
        type,
        url: talk.url || '',
      });
    }

    return openings;
  }, [fullTalks]);

  const filteredOpenings = useMemo(() => {
    if (filterType === 'all') return liveOpenings;
    return liveOpenings.filter(o => o.type === filterType);
  }, [liveOpenings, filterType]);

  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    liveOpenings.forEach(o => counts.set(o.type, (counts.get(o.type) || 0) + 1));
    return Array.from(counts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [liveOpenings]);

  if (!data) return <div className="flex min-h-screen"><Navigation /><main className="ml-0 lg:ml-[260px] flex-1 flex items-center justify-center" style={{ background: '#fdf9e9' }}><p className="text-[#1c1c13]/40">Loading...</p></main></div>;

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1" style={{ background: '#fdf9e9' }}>
        <TopAppBar title={data.title} subtitle={data.subtitle} />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24">

          {/* Opening Types by Decade */}
          <div className="bg-white p-4 md:p-6 lg:p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] mb-6 md:mb-10">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 mb-6">How Talks Open by Decade</h3>
            <div className="space-y-4">
              {data.byDecade.map((d: Record<string, unknown>) => {
                const decade = d.decade as string;
                const types = Object.entries(d).filter(([k]) => k !== 'decade');
                return (
                  <div key={decade}>
                    <p className="text-sm font-bold text-[#1c1c13] mb-2">{decade}</p>
                    <div className="flex gap-1 h-8 rounded-full overflow-hidden">
                      {types.sort((a, b) => (b[1] as number) - (a[1] as number)).map(([type, pct]) => (
                        <div
                          key={type}
                          className={`${TYPE_COLORS[type] || 'bg-gray-100'} flex items-center justify-center text-[9px] font-bold`}
                          style={{ width: `${pct}%`, minWidth: (pct as number) > 5 ? 'auto' : '0' }}
                          title={`${type}: ${pct}%`}
                        >
                          {(pct as number) > 8 ? `${type} ${pct}%` : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2 mt-6">
              {Object.entries(TYPE_COLORS).map(([type, cls]) => (
                <span key={type} className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${cls}`}>{type}</span>
              ))}
            </div>
          </div>

          {/* Live Opening Lines */}
          <div className="bg-white p-4 md:p-6 lg:p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60">Opening Lines from Talks</h3>
              {loadingFull && <p className="text-xs text-[#1c1c13]/40 animate-pulse">Loading full talk text...</p>}
            </div>

            {/* Type filter pills */}
            {liveOpenings.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-6">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                    filterType === 'all'
                      ? 'bg-[#1B5E7B] text-white'
                      : 'bg-[#f8f4e4] text-[#1c1c13]/50 hover:bg-[#1B5E7B]/10'
                  }`}
                >
                  All ({liveOpenings.length})
                </button>
                {typeCounts.map(({ type, count }) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type === filterType ? 'all' : type)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                      filterType === type
                        ? 'bg-[#1B5E7B] text-white'
                        : `${TYPE_COLORS[type] || 'bg-gray-100'} hover:opacity-80`
                    }`}
                  >
                    {type} ({count})
                  </button>
                ))}
              </div>
            )}

            {/* Opening cards */}
            <div className="space-y-3">
              {filteredOpenings.slice(0, 30).map((s, i) => (
                <div key={i} className="p-4 rounded-xl bg-[#fdf9e9] border-l-4 border-[#f5a623] hover:shadow-md transition-all">
                  <p className="text-sm text-[#1c1c13] leading-relaxed mb-3">
                    <span className="text-[#1c1c13]/30 text-lg leading-none">&ldquo;</span>
                    {s.opening}
                    {s.opening.length >= 290 && '...'}
                    <span className="text-[#1c1c13]/30 text-lg leading-none">&rdquo;</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-[#1B5E7B]">{s.speaker}</span>
                    <span className="text-[10px] text-[#1c1c13]/30">&middot;</span>
                    <span className="text-[10px] text-[#1c1c13]/40">{s.title}</span>
                    <span className="text-[10px] text-[#1c1c13]/30">&middot;</span>
                    <span className="text-[10px] text-[#1c1c13]/40">{s.season} {s.year}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${TYPE_COLORS[s.type] || 'bg-gray-100'}`}>
                      {s.type}
                    </span>
                    {s.url && (
                      <a href={s.url} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] font-bold text-[#1B5E7B]/50 hover:text-[#1B5E7B] transition-colors ml-auto">
                        Read talk &rarr;
                      </a>
                    )}
                  </div>
                </div>
              ))}

              {filteredOpenings.length === 0 && !loadingFull && (
                <p className="text-sm text-[#1c1c13]/40 text-center py-8">No openings found for this type</p>
              )}

              {filteredOpenings.length > 30 && (
                <p className="text-xs text-[#1c1c13]/30 text-center pt-2">
                  Showing 30 of {filteredOpenings.length} openings
                </p>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
