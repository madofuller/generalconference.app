'use client';

import { useState, useMemo } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { useFilteredTalks } from '@/lib/filter-context';
import { LIVING_SPEAKERS } from '@/lib/types';

const APOSTLE_CALLINGS = [
  'Of the Quorum of the Twelve Apostles',
  'President of the Quorum of the Twelve Apostles',
  'Acting President of the Quorum of the Twelve Apostles',
  'President of the Church',
  'First Counselor in the First Presidency',
  'Second Counselor in the First Presidency',
  'First Counselor',
  'Second Counselor',
  'President of The Church of Jesus Christ of Latter-day Saints',
];

function isApostleCalling(calling: string): boolean {
  if (!calling) return false;
  const lower = calling.toLowerCase();
  return APOSTLE_CALLINGS.some(c => lower.includes(c.toLowerCase())) ||
    lower.includes('quorum of the twelve') ||
    lower.includes('first presidency') ||
    (lower.includes('president of the church') && !lower.includes('brigham young'));
}

interface SpeakerSpan {
  speaker: string;
  firstYear: number;
  lastYear: number;
  span: number;
  talks: number;
  conferences: number;
}

export default function ServicePage() {
  const { talks, loading } = useFilteredTalks();
  const [livingOnly, setLivingOnly] = useState(false);

  const speakers = useMemo(() => {
    if (talks.length === 0) return [];

    // Filter to only apostle/First Presidency talks
    const apostleTalks = talks.filter(t => isApostleCalling(t.calling));

    // Group by speaker
    const speakerMap = new Map<string, { years: Set<number>; confs: Set<string>; talkCount: number }>();
    apostleTalks.forEach(t => {
      if (!speakerMap.has(t.speaker)) {
        speakerMap.set(t.speaker, { years: new Set(), confs: new Set(), talkCount: 0 });
      }
      const entry = speakerMap.get(t.speaker)!;
      entry.years.add(t.year);
      entry.confs.add(`${t.season} ${t.year}`);
      entry.talkCount++;
    });

    let list: SpeakerSpan[] = [...speakerMap.entries()].map(([speaker, data]) => {
      const years = [...data.years].sort();
      return {
        speaker,
        firstYear: years[0],
        lastYear: years[years.length - 1],
        span: years[years.length - 1] - years[0],
        talks: data.talkCount,
        conferences: data.confs.size,
      };
    });

    if (livingOnly) {
      list = list.filter(s => LIVING_SPEAKERS.has(s.speaker));
    }

    list.sort((a, b) => b.span - a.span);
    return list.slice(0, 40);
  }, [talks, livingOnly]);

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Navigation />
        <main className="ml-0 lg:ml-[260px] flex-1 flex items-center justify-center" style={{ background: '#fdf9e9' }}>
          <p className="text-[#1c1c13]/40">Loading...</p>
        </main>
      </div>
    );
  }

  const minYear = speakers.length > 0 ? Math.min(...speakers.map(s => s.firstYear)) : 1970;
  const maxYear = speakers.length > 0 ? Math.max(...speakers.map(s => s.lastYear)) : new Date().getFullYear();
  const range = maxYear - minYear || 1;

  const startDecade = Math.floor(minYear / 10) * 10;
  const endDecade = Math.ceil(maxYear / 10) * 10;
  const ticks: number[] = [];
  for (let y = startDecade; y <= endDecade; y += 10) {
    ticks.push(y);
  }

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1 pt-20 lg:pt-0" style={{ background: '#fdf9e9' }}>
        <TopAppBar title="Longest Serving Apostles" subtitle="Conference appearances as members of the Quorum of the Twelve and First Presidency" />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24 max-w-7xl">

          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setLivingOnly(!livingOnly)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                livingOnly
                  ? 'bg-[#f5a623] text-white shadow-md'
                  : 'bg-[#f8f4e4] text-[#1c1c13]/50 hover:bg-[#f5a623]/20'
              }`}
            >
              <span className="material-symbols-outlined text-base">{livingOnly ? 'person' : 'groups'}</span>
              {livingOnly ? 'Living Only' : 'All Speakers'}
            </button>
            <span className="text-xs text-[#524534]">{speakers.length} apostles</span>
          </div>

          <div className="bg-white p-4 md:p-6 lg:p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 mb-4">Apostolic Service Timeline</h3>

            {speakers.length === 0 ? (
              <p className="text-sm text-[#524534] py-8 text-center">No speakers found</p>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  {/* Year axis header */}
                  <div className="flex items-center mb-2">
                    <div className="w-[160px] shrink-0" />
                    <div className="flex-1 relative h-5">
                      {ticks.map(y => {
                        const pct = ((y - minYear) / range) * 100;
                        if (pct < 0 || pct > 100) return null;
                        return (
                          <span
                            key={y}
                            className="absolute text-[10px] text-[#1c1c13]/30 font-bold -translate-x-1/2"
                            style={{ left: `${pct}%` }}
                          >
                            {y}
                          </span>
                        );
                      })}
                    </div>
                    <div className="w-24 shrink-0" />
                  </div>

                  {/* Speaker bars */}
                  <div className="space-y-1.5">
                    {speakers.map(s => {
                      const left = ((s.firstYear - minYear) / range) * 100;
                      const width = ((s.lastYear - s.firstYear) / range) * 100;
                      return (
                        <div key={s.speaker} className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-[#1c1c13] w-[160px] text-right truncate shrink-0">{s.speaker}</span>
                          <div className="flex-1 relative h-5">
                            {ticks.map(y => {
                              const pct = ((y - minYear) / range) * 100;
                              if (pct <= 0 || pct >= 100) return null;
                              return <div key={y} className="absolute top-0 h-full w-px bg-[#1c1c13]/5" style={{ left: `${pct}%` }} />;
                            })}
                            <div
                              className="absolute h-full rounded-full transition-all"
                              style={{
                                left: `${left}%`,
                                width: `${Math.max(width, 0.4)}%`,
                                background: 'linear-gradient(90deg, #f5a623, #1B5E7B)',
                              }}
                              title={`${s.firstYear}–${s.lastYear} (${s.span} years, ${s.talks} talks, ${s.conferences} conferences)`}
                            />
                          </div>
                          <span className="text-[10px] text-[#1c1c13]/40 w-24 text-right shrink-0">{s.span}yr · {s.talks} talks</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom year axis */}
                  <div className="flex items-center mt-2">
                    <div className="w-[160px] shrink-0" />
                    <div className="flex-1 relative h-5">
                      {ticks.map(y => {
                        const pct = ((y - minYear) / range) * 100;
                        if (pct < 0 || pct > 100) return null;
                        return (
                          <span
                            key={y}
                            className="absolute text-[10px] text-[#1c1c13]/30 font-bold -translate-x-1/2"
                            style={{ left: `${pct}%` }}
                          >
                            {y}
                          </span>
                        );
                      })}
                    </div>
                    <div className="w-24 shrink-0" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
