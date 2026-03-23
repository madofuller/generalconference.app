'use client';

import { useState, useEffect, useMemo } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { loadInsights, SilenceData, SilencePhraseAnalysis } from '@/lib/insights';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { Ghost, Sparkles, TrendingUp } from 'lucide-react';

export default function SilencePage() {
  const [data, setData] = useState<SilenceData | null>(null);
  const [selectedPhrase, setSelectedPhrase] = useState<string | null>(null);
  const [tab, setTab] = useState<'vanished' | 'risen' | 'all'>('vanished');

  useEffect(() => {
    loadInsights().then(i => setData(i.silence || null));
  }, []);

  const vanished = useMemo(() =>
    data?.phrases.filter(a => a.status === 'vanished').sort((a, b) => b.changeRatio - a.changeRatio) || [],
  [data]);

  const risen = useMemo(() =>
    data?.phrases.filter(a => a.status === 'risen').sort((a, b) => b.changeRatio - a.changeRatio) || [],
  [data]);

  const detail = selectedPhrase ? data?.phrases.find(a => a.phrase === selectedPhrase) : null;

  if (!data) {
    return (
      <div className="flex min-h-screen"><Navigation />
        <main className="ml-0 lg:ml-[260px] flex-1 flex items-center justify-center"><p className="text-[#524534]">Loading...</p></main>
      </div>
    );
  }

  const allDecades = data.allDecades;
  const displayList = tab === 'vanished' ? vanished : tab === 'risen' ? risen : [...data.phrases].sort((a, b) => b.totalMentions - a.totalMentions);

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 min-w-0 lg:ml-[260px] min-h-screen flex-1">
        <TopAppBar title="Lost & Found" subtitle="Phrases that vanished and emerged in conference" />
        <div className="px-3 md:px-8 lg:px-12 pb-12 md:pb-24 max-w-7xl">

          <div className="bg-violet-50 border border-violet-200 p-3 md:p-5 rounded-xl mb-4 md:mb-6">
            <p className="text-xs md:text-base font-medium text-violet-900">
              Conference language evolves. Some phrases have quietly disappeared.
              Others have surged in recent years.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4 md:mb-6">
            {[
              { icon: Ghost, color: 'text-gray-400', valueColor: 'text-gray-600', value: vanished.length, label: 'Vanished' },
              { icon: Sparkles, color: 'text-[#f5a623]', valueColor: 'text-[#f5a623]', value: risen.length, label: 'Risen' },
              { icon: TrendingUp, color: 'text-[#1B5E7B]', valueColor: 'text-[#1B5E7B]', value: data.phrases.length, label: 'Tracked' },
            ].map(s => (
              <div key={s.label} className="bg-white p-2.5 md:p-4 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] text-center">
                <s.icon className={`h-4 w-4 mx-auto mb-0.5 ${s.color}`} />
                <p className={`text-lg md:text-2xl font-bold ${s.valueColor}`}>{s.value}</p>
                <p className="text-[9px] md:text-[10px] uppercase tracking-wider text-[#524534] font-bold">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1.5 mb-4">
            {([['vanished', `Vanished (${vanished.length})`], ['risen', `Risen (${risen.length})`], ['all', 'All']] as const).map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${tab === key ? (key === 'vanished' ? 'bg-gray-600 text-white' : key === 'risen' ? 'bg-[#f5a623] text-white' : 'bg-[#1B5E7B] text-white') : 'bg-[#f8f4e4] text-[#524534] hover:bg-[#1B5E7B]/10'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Phrase Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4 md:mb-6">
            {displayList.map(a => (
              <PhraseCard key={a.phrase} a={a} allDecades={allDecades} selected={selectedPhrase === a.phrase}
                onSelect={() => setSelectedPhrase(selectedPhrase === a.phrase ? null : a.phrase)} />
            ))}
          </div>

          {/* Detail View */}
          {detail && (
            <div className="bg-white p-3 md:p-6 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] border border-[#1B5E7B]/20 mb-4 md:mb-6">
              <h3 className="text-sm md:text-lg font-bold text-[#1c1c13] mb-0.5">&ldquo;{detail.phrase}&rdquo;</h3>
              <p className="text-[10px] md:text-xs text-[#524534] mb-3">
                {detail.totalMentions.toLocaleString()} mentions &middot; {detail.firstYear}&ndash;{detail.lastYear} &middot; Peak: {detail.peakDecade} ({detail.peakCount}x)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                <div>
                  <h4 className="text-[10px] md:text-xs font-bold text-[#524534] mb-1">By Decade</h4>
                  <div className="-ml-2">
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={detail.decades} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" />
                        <XAxis dataKey="decade" tick={{ fontSize: 8 }} interval={0} angle={-40} textAnchor="end" height={35} />
                        <YAxis tick={{ fontSize: 8 }} width={25} />
                        <Tooltip contentStyle={{ background: '#fdf9e9', border: '1px solid #e5e0d5', borderRadius: 8, fontSize: 11 }} />
                        <Bar dataKey="count" fill={detail.status === 'vanished' ? '#6B7280' : detail.status === 'risen' ? '#f5a623' : '#1B5E7B'} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] md:text-xs font-bold text-[#524534] mb-1">By Year</h4>
                  <div className="-ml-2">
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={detail.years} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" />
                        <XAxis dataKey="year" tick={{ fontSize: 8 }} />
                        <YAxis tick={{ fontSize: 8 }} width={25} />
                        <Tooltip contentStyle={{ background: '#fdf9e9', border: '1px solid #e5e0d5', borderRadius: 8, fontSize: 11 }} />
                        <Area type="monotone" dataKey="count" fill={detail.status === 'vanished' ? '#6B7280' : '#f5a623'} fillOpacity={0.3} stroke={detail.status === 'vanished' ? '#6B7280' : '#f5a623'} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Heatmap */}
          <div className="bg-white p-3 md:p-6 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] mb-4 md:mb-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 mb-1">Language Lifecycle</h3>
            <p className="text-[10px] text-[#524534] mb-3">When each phrase was most active</p>
            <div className="overflow-x-auto">
              <div style={{ minWidth: Math.max(300, allDecades.length * 36 + 100) }}>
                {/* Header */}
                <div className="flex items-center mb-0.5">
                  <div className="w-24 md:w-36 shrink-0 text-[8px] md:text-[9px] text-[#524534] font-bold">Phrase</div>
                  {allDecades.map(d => (
                    <div key={d} className="flex-1 text-[7px] md:text-[8px] text-center text-[#524534]">{d.replace('s', '')}</div>
                  ))}
                </div>
                {/* Rows */}
                {[...vanished.slice(0, 10), ...risen.slice(0, 6)].map(a => (
                  <div key={a.phrase} className="flex items-center py-[1.5px] cursor-pointer hover:bg-[#f8f4e4] rounded"
                    onClick={() => setSelectedPhrase(a.phrase)}>
                    <div className="w-24 md:w-36 shrink-0 text-[8px] md:text-[9px] text-[#1c1c13] truncate pr-1 flex items-center gap-0.5">
                      {a.status === 'vanished' ? <Ghost className="h-2 w-2 text-gray-400 shrink-0" /> : <Sparkles className="h-2 w-2 text-[#f5a623] shrink-0" />}
                      <span className="truncate">{a.phrase}</span>
                    </div>
                    {allDecades.map(d => {
                      const count = a.decades.find(ad => ad.decade === d)?.count || 0;
                      const intensity = count > 0 ? Math.max(0.15, count / (a.peakCount || 1)) : 0;
                      const color = a.status === 'vanished' ? `rgba(107,114,128,${intensity})` : `rgba(245,166,35,${intensity})`;
                      return (
                        <div key={d} className="flex-1 px-[0.5px]">
                          <div className="h-3 md:h-4 rounded-sm" style={{ background: count > 0 ? color : '#f8f4e4' }} />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 md:p-5 rounded-xl">
            <p className="text-[10px] md:text-xs text-amber-800">
              <strong>Methodology:</strong> Phrases counted via case-insensitive substring matching.
              &quot;Vanished&quot; = less than 15% of peak usage, last mentioned before 2022.
              &quot;Risen&quot; = recent usage (2010+) at least 3x the pre-2000 usage with 5+ mentions.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function PhraseCard({ a, allDecades, selected, onSelect }: {
  a: SilencePhraseAnalysis; allDecades: string[]; selected: boolean; onSelect: () => void;
}) {
  const isVanished = a.status === 'vanished';
  const isRisen = a.status === 'risen';
  const yearsSince = 2026 - a.lastYear;
  const opacity = isVanished ? Math.max(0.5, 1 - yearsSince * 0.02) : 1;

  return (
    <div
      className={`bg-white p-2.5 md:p-3.5 rounded-xl shadow-[0px_4px_16px_rgba(27,94,123,0.04)] cursor-pointer transition-all hover:shadow-md ${selected ? 'ring-2' : ''} ${isVanished ? 'border border-gray-200' : isRisen ? 'border border-[#f5a623]/20' : 'border border-[#ece8d9]'}`}
      style={{ opacity, ...(selected ? { '--tw-ring-color': isVanished ? '#6B7280' : '#f5a623' } as React.CSSProperties : {}) }}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-1">
        <p className="text-[13px] md:text-sm font-serif italic text-[#1c1c13] leading-tight">&ldquo;{a.phrase}&rdquo;</p>
        {isVanished && <Ghost className="h-3 w-3 text-gray-400 shrink-0 ml-1" />}
        {isRisen && <Sparkles className="h-3 w-3 text-[#f5a623] shrink-0 ml-1" />}
      </div>

      <div className="flex justify-between text-[9px] text-[#524534] mb-1.5">
        <span>{isVanished ? `Peak ${a.peakDecade}` : `From ${a.firstYear}`}</span>
        <span className="font-bold" style={{ color: isVanished ? '#6B7280' : isRisen ? '#f5a623' : '#1B5E7B' }}>
          {a.totalMentions}
        </span>
        <span>{isVanished ? `Last ${a.lastYear}` : `${a.lastYear}`}</span>
      </div>

      {/* Sparkline */}
      <div className="flex items-end gap-[1px] h-4 md:h-5">
        {allDecades.map(d => {
          const count = a.decades.find(ad => ad.decade === d)?.count || 0;
          const height = count > 0 ? Math.max(1, (count / (a.peakCount || 1)) * 16) : 0;
          const color = isVanished ? '#6B7280' : isRisen ? '#f5a623' : '#1B5E7B';
          return (
            <div key={d} className="flex-1 flex items-end">
              <div className="w-full rounded-t-sm" style={{ height: `${height}px`, background: count > 0 ? color : '#f2eede' }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
