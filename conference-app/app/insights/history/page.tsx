'use client';

import { useState, useEffect } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { loadInsights, ConferenceHistoryData } from '@/lib/insights';

export default function HistoryPage() {
  const [data, setData] = useState<ConferenceHistoryData | null>(null);

  useEffect(() => {
    loadInsights().then(i => setData(i.conferenceHistory || null));
  }, []);

  if (!data) return <div className="flex min-h-screen"><Navigation /><main className="ml-0 lg:ml-[260px] flex-1 flex items-center justify-center" style={{ background: '#fdf9e9' }}><p className="text-[#1c1c13]/40">Loading...</p></main></div>;

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1" style={{ background: '#fdf9e9' }}>
        <TopAppBar title={data.title} subtitle={data.subtitle} />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24">
          {/* Timeline */}
          <div className="relative pl-6 md:pl-0">
            {/* Vertical line — left edge on mobile, behind dots on desktop */}
            <div className="absolute left-[11px] md:left-[31px] top-0 bottom-0 w-0.5 bg-[#f5a623]/30" />

            <div className="space-y-6 md:space-y-8">
              {data.events.map((event, i) => (
                <div key={i} className="relative flex gap-4 md:gap-6 lg:gap-8 items-start">
                  {/* Year Dot */}
                  <div className="relative z-10 flex-shrink-0">
                    {/* Small dot on mobile, large on desktop */}
                    <div className="w-6 h-6 md:w-16 md:h-16 rounded-full bg-[#f5a623] flex items-center justify-center text-white font-extrabold shadow-[0px_4px_12px_rgba(245,166,35,0.3)] md:shadow-[0px_8px_24px_rgba(245,166,35,0.3)] -ml-6 md:ml-0">
                      <span className="hidden md:inline text-sm">{event.year}</span>
                    </div>
                  </div>

                  {/* Card */}
                  <div className="flex-1 min-w-0 bg-white p-4 md:p-6 lg:p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
                    {/* Year badge on mobile (since the dot is too small) */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="md:hidden px-2.5 py-1 rounded-full bg-[#f5a623] text-white text-[11px] font-extrabold">{event.year}</span>
                      <h3 className="text-base md:text-xl font-bold text-[#1c1c13] leading-tight">{event.event}</h3>
                    </div>

                    <div className="grid grid-cols-3 gap-2 md:gap-4 mb-3 md:mb-4">
                      <div>
                        <p className="text-lg md:text-2xl font-extrabold text-[#1B5E7B]">{event.talkCount}</p>
                        <p className="text-[9px] md:text-[10px] uppercase tracking-wider text-[#1c1c13]/40 font-bold">Talks</p>
                      </div>
                      <div>
                        <p className="text-lg md:text-2xl font-extrabold text-[#f5a623]">{event.keywordMentions}</p>
                        <p className="text-[9px] md:text-[10px] uppercase tracking-wider text-[#1c1c13]/40 font-bold">Mentions</p>
                      </div>
                      <div>
                        <p className="text-lg md:text-2xl font-extrabold text-[#1c1c13]/40">{event.avgKeywordMentions}</p>
                        <p className="text-[9px] md:text-[10px] uppercase tracking-wider text-[#1c1c13]/40 font-bold">Avg Year</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                      {event.keywords.map(kw => (
                        <span key={kw} className="px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-[#f8f4e4] text-[#1B5E7B] text-[10px] md:text-xs font-bold">{kw}</span>
                      ))}
                    </div>
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
