'use client';

import { useState, useEffect } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { loadInsights, TalkOpeningsData } from '@/lib/insights';

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

export default function OpeningsPage() {
  const [data, setData] = useState<TalkOpeningsData | null>(null);

  useEffect(() => {
    loadInsights().then(i => setData(i.talkOpenings || null));
  }, []);

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
            <div className="flex flex-wrap gap-3 mt-6">
              {Object.entries(TYPE_COLORS).map(([type, cls]) => (
                <span key={type} className={`px-3 py-1 rounded-full text-xs font-bold ${cls}`}>{type}</span>
              ))}
            </div>
          </div>

          {/* Sample Openings */}
          <div className="bg-white p-4 md:p-6 lg:p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 mb-6">Sample Opening Lines</h3>
            <div className="space-y-4">
              {data.samples.map((s, i) => (
                <div key={i} className="p-4 rounded-lg bg-[#f8f4e4] border-l-4 border-[#f5a623]">
                  <p className="text-sm italic text-[#1c1c13] mb-2">&ldquo;{s.opening}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#1B5E7B]">{s.speaker}</span>
                    <span className="text-xs text-[#1c1c13]/40">{s.year}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${TYPE_COLORS[s.type] || 'bg-gray-100'}`}>{s.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
