'use client';

import { useState, useEffect } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { loadInsights, TopicPairsData } from '@/lib/insights';

export default function TopicPairsPage() {
  const [data, setData] = useState<TopicPairsData | null>(null);

  useEffect(() => {
    loadInsights().then(i => setData(i.topicPairs || null));
  }, []);

  if (!data) return <div className="flex min-h-screen"><Navigation /><main className="ml-0 lg:ml-[260px] flex-1 flex items-center justify-center" style={{ background: '#fdf9e9' }}><p className="text-[#1c1c13]/40">Loading...</p></main></div>;

  const maxCount = data.pairs[0]?.count || 1;

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1 pt-20 lg:pt-0" style={{ background: '#fdf9e9' }}>
        <TopAppBar title={data.title} subtitle={data.subtitle} />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24">
          <div className="bg-white p-4 md:p-6 lg:p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 mb-6">Most Frequently Paired Topics</h3>
            <p className="text-sm text-[#1c1c13]/60 mb-4 md:mb-8">Topics that appear together in the same conference talk</p>
            <div className="space-y-3">
              {data.pairs.map((p, i) => {
                const width = (p.count / maxCount) * 100;
                return (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-lg font-extrabold text-[#1c1c13]/20 w-8 text-right">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-3 py-1 rounded-full bg-[#f5a623]/15 text-[#1B5E7B] text-xs font-bold capitalize">{p.topic1}</span>
                        <span className="text-[#1c1c13]/20">+</span>
                        <span className="px-3 py-1 rounded-full bg-[#1B5E7B]/10 text-[#1B5E7B] text-xs font-bold capitalize">{p.topic2}</span>
                      </div>
                      <div className="h-2 bg-[#f8f4e4] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${width}%`, background: 'linear-gradient(90deg, #f5a623, #1B5E7B)' }} />
                      </div>
                    </div>
                    <span className="text-sm font-extrabold text-[#1c1c13] w-16 text-right">{p.count.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
