'use client';

import { useState, useEffect } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { loadInsights, ServiceTimelinesData } from '@/lib/insights';

export default function ServicePage() {
  const [data, setData] = useState<ServiceTimelinesData | null>(null);

  useEffect(() => {
    loadInsights().then(i => setData(i.serviceTimelines || null));
  }, []);

  if (!data) return <div className="flex min-h-screen"><Navigation /><main className="ml-0 lg:ml-[260px] flex-1 flex items-center justify-center" style={{ background: '#fdf9e9' }}><p className="text-[#1c1c13]/40">Loading...</p></main></div>;

  const minYear = Math.min(...data.speakers.map(s => s.firstYear));
  const maxYear = Math.max(...data.speakers.map(s => s.lastYear));
  const range = maxYear - minYear;

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1" style={{ background: '#fdf9e9' }}>
        <TopAppBar title={data.title} subtitle={data.subtitle} />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24">
          <div className="bg-white p-4 md:p-6 lg:p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 mb-6">Conference Appearance Timeline</h3>
            <div className="overflow-x-auto">
            {/* Year axis */}
            <div className="flex items-center mb-4 pl-[180px] min-w-[600px]">
              {[1970, 1980, 1990, 2000, 2010, 2020].map(y => (
                <div key={y} className="text-[10px] text-[#1c1c13]/30 font-bold" style={{ position: 'absolute', left: `calc(180px + ${((y - minYear) / range) * 100}% * 0.85)` }}>{y}</div>
              ))}
            </div>
            <div className="space-y-2 mt-8 min-w-[600px]">
              {data.speakers.slice(0, 30).map(s => {
                const left = ((s.firstYear - minYear) / range) * 85;
                const width = ((s.lastYear - s.firstYear) / range) * 85;
                return (
                  <div key={s.speaker} className="flex items-center gap-4">
                    <span className="text-xs font-bold text-[#1c1c13] w-[160px] text-right truncate">{s.speaker}</span>
                    <div className="flex-1 relative h-6">
                      <div
                        className="absolute h-full rounded-full"
                        style={{
                          left: `${left}%`,
                          width: `${Math.max(width, 0.5)}%`,
                          background: 'linear-gradient(90deg, #f5a623, #1B5E7B)',
                        }}
                        title={`${s.firstYear}–${s.lastYear} (${s.span} years, ${s.talks} talks)`}
                      />
                    </div>
                    <span className="text-xs text-[#1c1c13]/40 w-24 text-right">{s.span}yr / {s.talks} talks</span>
                  </div>
                );
              })}
            </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
