'use client';

import { useState, useEffect, useMemo } from 'react';
import { loadInsights, ServiceTimelinesData } from '@/lib/insights';
import { LIVING_SPEAKERS } from '@/lib/types';

export function ServiceContent() {
  const [data, setData] = useState<ServiceTimelinesData | null>(null);
  const [livingOnly, setLivingOnly] = useState(false);

  useEffect(() => {
    loadInsights().then(i => setData(i.serviceTimelines || null));
  }, []);

  const speakers = useMemo(() => {
    if (!data) return [];
    let list = data.speakers;
    if (livingOnly) {
      list = list.filter(s => LIVING_SPEAKERS.has(s.speaker));
    }
    return list.slice(0, 40);
  }, [data, livingOnly]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-[#1c1c13]/40">Loading...</p>
      </div>
    );
  }

  const minYear = speakers.length > 0 ? Math.min(...speakers.map(s => s.firstYear)) : 1970;
  const maxYear = speakers.length > 0 ? Math.max(...speakers.map(s => s.lastYear)) : new Date().getFullYear();
  const range = maxYear - minYear || 1;

  // Generate decade tick marks that fit the actual data range
  const startDecade = Math.floor(minYear / 10) * 10;
  const endDecade = Math.ceil(maxYear / 10) * 10;
  const ticks: number[] = [];
  for (let y = startDecade; y <= endDecade; y += 10) {
    ticks.push(y);
  }

  return (
    <div className="px-3 md:px-8 lg:px-12 pt-4 md:pt-6 pb-12 md:pb-24 max-w-7xl">

      {/* Living Toggle */}
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
        <span className="text-xs text-[#524534]">{speakers.length} speakers</span>
      </div>

      <div className="bg-white p-4 md:p-6 lg:p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 mb-4">Conference Appearance Timeline</h3>

        {speakers.length === 0 ? (
          <p className="text-sm text-[#524534] py-8 text-center">No speakers found</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[420px]">
              {/* Year axis header */}
              <div className="flex items-center mb-2">
                <div className="w-[90px] md:w-[160px] shrink-0" />
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
                <div className="w-16 md:w-24 shrink-0" />
              </div>

              {/* Speaker bars */}
              <div className="space-y-1.5">
                {speakers.map(s => {
                  const left = ((s.firstYear - minYear) / range) * 100;
                  const width = ((s.lastYear - s.firstYear) / range) * 100;
                  return (
                    <div key={s.speaker} className="flex items-center gap-2">
                      <span className="text-[10px] md:text-[11px] font-bold text-[#1c1c13] w-[90px] md:w-[160px] text-right truncate shrink-0">{s.speaker}</span>
                      <div className="flex-1 relative h-5">
                        {/* Grid lines */}
                        {ticks.map(y => {
                          const pct = ((y - minYear) / range) * 100;
                          if (pct <= 0 || pct >= 100) return null;
                          return <div key={y} className="absolute top-0 h-full w-px bg-[#1c1c13]/5" style={{ left: `${pct}%` }} />;
                        })}
                        {/* Bar */}
                        <div
                          className="absolute h-full rounded-full transition-all"
                          style={{
                            left: `${left}%`,
                            width: `${Math.max(width, 0.4)}%`,
                            background: '#1B5E7B',
                          }}
                          title={`${s.firstYear}–${s.lastYear} (${s.span} years, ${s.talks} talks, ${s.conferences} conferences)`}
                        />
                      </div>
                      <span className="text-[9px] md:text-[10px] text-[#1c1c13]/40 w-16 md:w-24 text-right shrink-0">{s.span}yr · {s.talks}</span>
                    </div>
                  );
                })}
              </div>

              {/* Bottom year axis */}
              <div className="flex items-center mt-2">
                <div className="w-[90px] md:w-[160px] shrink-0" />
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
                <div className="w-16 md:w-24 shrink-0" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
