'use client';

import { useState, useEffect } from 'react';
import { loadInsights, CareerProgressionsData, CareerProgression } from '@/lib/insights';
import { useFilteredTalks } from '@/lib/filter-context';

const CALLING_RANK: Record<string, number> = {
  'President of the Church': 10,
  'First Counselor in the First Presidency': 9,
  'Second Counselor in the First Presidency': 9,
  'Counselor in the First Presidency': 9,
  'President of the Quorum of the Twelve Apostles': 8,
  'Acting President of the Quorum of the Twelve Apostles': 8,
  'Of the Quorum of the Twelve Apostles': 7,
  'Of the Council of the Twelve': 7,
  'Of the Presidency of the Seventy': 6,
  'Of the Presidency of the First Quorum of the Seventy': 6,
  'Assistant to the Quorum of the Twelve Apostles': 5,
  'Assistant to the Council of the Twelve': 5,
  'Of the Seventy': 4,
  'Of the First Quorum of the Seventy': 4,
  'Of the First Council of the Seventy': 4,
  'Presiding Bishop': 4,
  'Relief Society General President': 3,
  'Young Women General President': 3,
  'Primary General President': 3,
  'Young Men General President': 3,
  'Sunday School General President': 3,
};

function getCallingColor(calling: string): string {
  if (calling.includes('President of the Church')) return 'bg-amber-500 text-white';
  if (calling.includes('First Presidency') || calling.includes('Counselor in the First')) return 'bg-amber-400 text-white';
  if (calling.includes('Quorum of the Twelve') || calling.includes('Council of the Twelve')) return 'bg-blue-500 text-white';
  if (calling.includes('President of the Quorum')) return 'bg-blue-600 text-white';
  if (calling.includes('Presidency of the Seventy')) return 'bg-teal-500 text-white';
  if (calling.includes('Seventy') || calling.includes('First Council')) return 'bg-teal-400 text-white';
  if (calling.includes('Assistant')) return 'bg-sky-400 text-white';
  if (calling.includes('Bishop')) return 'bg-indigo-400 text-white';
  if (calling.includes('Relief Society') || calling.includes('Young Women') || calling.includes('Primary')) return 'bg-pink-400 text-white';
  if (calling.includes('Emeritus')) return 'bg-gray-400 text-white';
  return 'bg-stone-300 text-stone-700';
}

function getCallingShort(calling: string): string {
  if (calling.includes('President of the Church')) return 'Prophet';
  if (calling.includes('First Counselor in the First')) return '1st Counselor FP';
  if (calling.includes('Second Counselor in the First')) return '2nd Counselor FP';
  if (calling.includes('Counselor in the First')) return 'Counselor FP';
  if (calling.includes('President of the Quorum')) return 'President Q12';
  if (calling.includes('Acting President of the Quorum')) return 'Acting Pres Q12';
  if (calling.includes('Quorum of the Twelve') || calling.includes('Council of the Twelve')) return 'Apostle';
  if (calling.includes('Presidency of the Seventy')) return 'Pres. of 70';
  if (calling.includes('Assistant to')) return 'Asst. to Q12';
  if (calling.includes('Seventy') || calling.includes('First Council') || calling.includes('First Quorum')) return 'Seventy';
  if (calling.includes('Presiding Bishop')) return 'Presiding Bishop';
  if (calling.includes('Emeritus')) return 'Emeritus';
  if (calling.includes('Relief Society')) return 'RS President';
  if (calling.includes('Young Women')) return 'YW President';
  if (calling.includes('Primary')) return 'Primary Pres.';
  return calling.substring(0, 20);
}

export function CareersContent() {
  const { talks } = useFilteredTalks();
  const [data, setData] = useState<CareerProgressionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSpeaker, setSelectedSpeaker] = useState<CareerProgression | null>(null);
  const [filter, setFilter] = useState<'all' | 'prophets' | 'apostles' | 'seventy'>('all');

  const buildFallbackCareerData = (): CareerProgressionsData => {
    const bySpeaker = new Map<string, { year: number; season: string; calling: string }[]>();
    for (const t of talks) {
      const speaker = (t.speaker || '').trim();
      if (!speaker) continue;
      const calling = (t.calling || '').trim();
      if (!calling || calling === 'No Calling Found') continue;
      if (!bySpeaker.has(speaker)) bySpeaker.set(speaker, []);
      bySpeaker.get(speaker)!.push({ year: t.year, season: t.season || 'April', calling });
    }

    const speakers: CareerProgression[] = Array.from(bySpeaker.entries())
      .map(([speaker, entries]) => {
        const sorted = [...entries].sort((a, b) => a.year - b.year || (a.season === 'April' ? -1 : 1));
        const milestones = sorted.filter((e, i) =>
          i === 0 || e.calling !== sorted[i - 1].calling
        );
        const years = sorted.map(e => e.year);
        return {
          speaker,
          totalTalks: sorted.length,
          totalCallings: new Set(sorted.map(e => e.calling)).size,
          firstYear: Math.min(...years),
          lastYear: Math.max(...years),
          currentCalling: sorted[sorted.length - 1]?.calling || '',
          milestones,
        };
      })
      .filter(s => s.milestones.length > 0)
      .sort((a, b) => b.totalTalks - a.totalTalks);

    return {
      title: 'Calling Progressions',
      subtitle: 'How leaders have served over time',
      headline: 'Career progression built from talk metadata',
      speakers,
    };
  };

  useEffect(() => {
    loadInsights()
      .then(i => {
        if (i.careerProgressions && i.careerProgressions.speakers?.length) {
          setData(i.careerProgressions);
        } else {
          setData(buildFallbackCareerData());
        }
      })
      .finally(() => setIsLoading(false));
  }, [talks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-[#1c1c13]/40">Loading...</p>
      </div>
    );
  }

  if (!data || data.speakers.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-[#1c1c13]/40">No calling progression data available.</p>
      </div>
    );
  }

  let filtered = data.speakers;
  if (filter === 'prophets') filtered = filtered.filter(s => s.milestones.some(m => m.calling.includes('President of the Church')));
  if (filter === 'apostles') filtered = filtered.filter(s => s.milestones.some(m => m.calling.includes('Twelve') || m.calling.includes('Council of the Twelve')));
  if (filter === 'seventy') filtered = filtered.filter(s => s.milestones.some(m => m.calling.includes('Seventy')));

  return (
    <div className="px-3 md:px-8 lg:px-12 pt-4 md:pt-6 pb-12 md:pb-24">
      {/* Headline */}
      <div className="bg-white p-3 md:p-6 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] mb-4 md:mb-8">
        <p className="text-sm md:text-lg font-bold text-[#1c1c13]">{data.headline}</p>
        <p className="text-sm text-[#1c1c13]/60 mt-1">Click any leader to see how their callings have unfolded over time</p>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-4 md:mb-8">
        {[
          { key: 'all', label: 'All Leaders' },
          { key: 'prophets', label: 'Prophets' },
          { key: 'apostles', label: 'Apostles' },
          { key: 'seventy', label: 'Seventy' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as typeof filter)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              filter === f.key
                ? 'bg-[#1B5E7B] text-white'
                : 'bg-white text-[#1c1c13]/60 hover:bg-[#f8f4e4]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 lg:gap-8">
        {/* Speaker List */}
        <div className="md:col-span-5 space-y-2 max-h-[70vh] overflow-y-auto pr-2">
          {filtered.map(s => (
            <button
              key={s.speaker}
              onClick={() => setSelectedSpeaker(s)}
              className={`w-full text-left p-3 md:p-4 rounded-xl transition-all ${
                selectedSpeaker?.speaker === s.speaker
                  ? 'bg-[#1B5E7B] text-white shadow-lg'
                  : 'bg-white hover:bg-[#f8f4e4] shadow-[0px_4px_12px_rgba(27,94,123,0.04)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">{s.speaker}</p>
                  <p className={`text-xs ${selectedSpeaker?.speaker === s.speaker ? 'text-white/70' : 'text-[#1c1c13]/40'}`}>
                    {s.totalCallings} callings served &middot; {s.totalTalks} talks &middot; {s.firstYear}–{s.lastYear}
                  </p>
                </div>
                <div className="flex gap-1">
                  {s.milestones.slice(-3).map((m, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full ${getCallingColor(m.calling).split(' ')[0]}`} />
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Career Detail */}
        <div className="md:col-span-7">
          {!selectedSpeaker ? (
            <div className="bg-white p-6 md:p-12 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] text-center">
              <span className="material-symbols-outlined text-[#1c1c13]/20 text-6xl mb-4 block">timeline</span>
              <p className="text-[#1c1c13]/40 font-medium">Select a leader to see their path of service</p>
            </div>
          ) : (
            <div className="bg-white p-3 md:p-6 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] sticky top-24">
              <h3 className="text-lg md:text-2xl font-extrabold text-[#1c1c13] mb-1">{selectedSpeaker.speaker}</h3>
              <p className="text-sm text-[#1c1c13]/60 mb-6">
                {selectedSpeaker.totalTalks} talks &middot; {selectedSpeaker.totalCallings} callings served &middot; {selectedSpeaker.firstYear}–{selectedSpeaker.lastYear}
              </p>

              {/* Timeline */}
              <div className="relative">
                <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-[#ece8d9]" />
                <div className="space-y-3">
                  {selectedSpeaker.milestones.map((m, i) => {
                    const isLast = i === selectedSpeaker.milestones.length - 1;
                    return (
                      <div key={i} className="flex items-start gap-3 relative">
                        <div className={`w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${getCallingColor(m.calling)}`}>
                          <span className="text-[10px] font-extrabold">{i + 1}</span>
                        </div>
                        <div className={`flex-1 p-3 md:p-4 rounded-xl ${isLast ? 'bg-[#f8f4e4] border-2 border-[#f5a623]/30' : 'bg-[#fdf9e9]'}`}>
                          <div className="flex items-center justify-between">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${getCallingColor(m.calling)}`}>
                              {getCallingShort(m.calling)}
                            </span>
                            <span className="text-xs font-bold text-[#1c1c13]/40">{m.season} {m.year}</span>
                          </div>
                          <p className="text-xs text-[#1c1c13]/60 mt-2">{m.calling}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
