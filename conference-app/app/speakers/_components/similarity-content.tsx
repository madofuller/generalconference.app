'use client';

import { useState, useEffect } from 'react';
import { loadInsights, SpeakerSimilarityData } from '@/lib/insights';

export function SimilarityContent() {
  const [data, setData] = useState<SpeakerSimilarityData | null>(null);

  useEffect(() => {
    loadInsights().then(i => setData(i.speakerSimilarity || null));
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-[#1c1c13]/40">Loading...</p>
      </div>
    );
  }

  return (
    <div className="px-3 md:px-8 lg:px-12 pt-4 md:pt-6 pb-12 md:pb-24">
      <div className="bg-white p-4 md:p-6 lg:p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 mb-6">Most Similar Speaker Pairs</h3>
        <p className="text-sm text-[#1c1c13]/60 mb-4 md:mb-8">Based on vocabulary frequency analysis (cosine similarity). Higher = more similar word choices.</p>
        <div className="space-y-4">
          {data.pairs.map((p, i) => {
            const pct = Math.round(p.similarity * 100);
            return (
              <div key={i} className="flex items-center gap-2 md:gap-4">
                <span className="text-sm md:text-lg font-extrabold text-[#1c1c13]/20 w-6 md:w-8 text-right shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1 md:gap-3 mb-1">
                    <span className="font-bold text-[#1c1c13] text-xs md:text-sm">{p.speaker1}</span>
                    <span className="material-symbols-outlined text-[#f5a623] text-xs md:text-sm">compare_arrows</span>
                    <span className="font-bold text-[#1c1c13] text-xs md:text-sm">{p.speaker2}</span>
                  </div>
                  <div className="h-2 bg-[#f8f4e4] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: '#1B5E7B' }}
                    />
                  </div>
                </div>
                <span className="text-xs md:text-sm font-extrabold text-[#1B5E7B] w-12 md:w-16 text-right shrink-0">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
