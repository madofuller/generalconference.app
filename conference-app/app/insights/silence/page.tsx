'use client';

import { useState, useMemo } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFilteredTalks } from '@/lib/filter-context';
import { Talk } from '@/lib/types';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { Ghost, Sparkles, TrendingUp } from 'lucide-react';

const TRACKED_PHRASES = [
  // Clearly faded/vanished
  'free agency', 'mormon', 'mormonism', 'lds church', 'gentiles',
  'lamanites', 'nephites', 'terrestrial kingdom', 'telestial',
  'home teaching', 'visiting teaching', 'ward teaching', 'mutual improvement',
  'stake missionary', 'gold plates', 'urim and thummim', 'great and abominable',
  'iron curtain', 'communist', 'nuclear', 'anti-christ', 'secret combinations',
  'welfare square', 'firesides', 'correlation', 'cultural hall',
  'church welfare program', 'road show', 'gold and green ball',
  'deacons quorum', 'priests quorum', 'mia', 'bee-hive',
  'stake conference', 'satellite broadcast',
  // Clearly risen / new
  'covenant path', 'ministering', 'gathering of israel', 'hear him',
  'come follow me', 'sacred grove', 'mental health', 'self-reliance',
  'temple covenant', 'global church', 'church of jesus christ',
  'family history', 'indexing', 'belonging', 'covenant belonging',
  'tender mercies', 'hasten the work', 'ponderize', 'light the world',
  'because of him', 'i am a child of god', 'press forward',
  'rescue', 'hastening', 'social media', 'internet',
  'gender', 'same-sex', 'transgender', 'addiction',
  'pornography', 'anxiety', 'depression', 'trauma',
  // Things that have shifted/evolved
  'celestial kingdom', 'aaronic priesthood', 'melchizedek priesthood',
  'sacrament meeting', 'relief society', 'young women',
  'primary', 'book of mormon', 'bible', 'restoration',
  'second coming', 'millennium', 'zion',
  'missionary work', 'temple work', 'family home evening',
  'testimony', 'revelation', 'prophet',
];

interface PhraseAnalysis {
  phrase: string;
  decades: { decade: string; count: number }[];
  years: { year: number; count: number }[];
  peakDecade: string;
  peakCount: number;
  lastYear: number;
  firstYear: number;
  totalMentions: number;
  recentCount: number;
  status: 'vanished' | 'risen' | 'active';
  changeRatio: number; // how much it changed (for sorting)
}

function analyzePhrase(talks: Talk[], phrase: string): PhraseAnalysis {
  const byDecade = new Map<string, number>();
  const byYear = new Map<number, number>();
  const lowerPhrase = phrase.toLowerCase();

  talks.forEach(t => {
    const text = (t.talk || '').toLowerCase();
    let count = 0;
    let idx = text.indexOf(lowerPhrase);
    while (idx !== -1) { count++; idx = text.indexOf(lowerPhrase, idx + lowerPhrase.length); }
    if (count > 0) {
      const decade = `${Math.floor(t.year / 10) * 10}s`;
      byDecade.set(decade, (byDecade.get(decade) || 0) + count);
      byYear.set(t.year, (byYear.get(t.year) || 0) + count);
    }
  });

  const decades = Array.from(byDecade.entries())
    .map(([decade, count]) => ({ decade, count }))
    .sort((a, b) => a.decade.localeCompare(b.decade));

  const years = Array.from(byYear.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year);

  const peakEntry = decades.reduce((max, d) => d.count > max.count ? d : max, { decade: '', count: 0 });
  const lastYear = years.length > 0 ? years[years.length - 1].year : 0;
  const firstYear = years.length > 0 ? years[0].year : 0;
  const totalMentions = decades.reduce((s, d) => s + d.count, 0);
  const recentCount = (decades.find(d => d.decade === '2020s')?.count || 0) + (decades.find(d => d.decade === '2010s')?.count || 0);

  const earlyCount = decades.filter(d => d.decade < '2000s').reduce((s, d) => s + d.count, 0);
  const lateCount = decades.filter(d => d.decade >= '2010s').reduce((s, d) => s + d.count, 0);

  let status: 'vanished' | 'risen' | 'active' = 'active';
  const recentDecade = decades.find(d => d.decade === '2020s')?.count || 0;

  if (peakEntry.count > 3 && recentDecade <= Math.max(1, peakEntry.count * 0.15) && lastYear < 2022) {
    status = 'vanished';
  } else if (earlyCount <= 3 && lateCount > 10) {
    status = 'risen';
  }

  const changeRatio = status === 'vanished'
    ? peakEntry.count / Math.max(1, recentDecade)
    : status === 'risen'
    ? lateCount / Math.max(1, earlyCount)
    : 0;

  return { phrase, decades, years, peakDecade: peakEntry.decade, peakCount: peakEntry.count, lastYear, firstYear, totalMentions, recentCount, status, changeRatio };
}

export default function SilencePage() {
  const { talks, loading } = useFilteredTalks();
  const [selectedPhrase, setSelectedPhrase] = useState<string | null>(null);
  const [tab, setTab] = useState<'vanished' | 'risen' | 'all'>('vanished');

  const analyses = useMemo(() => {
    if (talks.length === 0) return [];
    return TRACKED_PHRASES.map(p => analyzePhrase(talks, p)).filter(a => a.totalMentions > 0);
  }, [talks]);

  const vanished = useMemo(() => analyses.filter(a => a.status === 'vanished').sort((a, b) => b.changeRatio - a.changeRatio), [analyses]);
  const risen = useMemo(() => analyses.filter(a => a.status === 'risen').sort((a, b) => b.changeRatio - a.changeRatio), [analyses]);

  const detail = selectedPhrase ? analyses.find(a => a.phrase === selectedPhrase) : null;

  if (loading) {
    return (
      <div className="flex min-h-screen"><Navigation />
        <main className="ml-0 lg:ml-[260px] flex-1 flex items-center justify-center"><p className="text-[#524534]">Loading...</p></main>
      </div>
    );
  }

  const allDecades = [...new Set(analyses.flatMap(a => a.decades.map(d => d.decade)))].sort();
  const displayList = tab === 'vanished' ? vanished : tab === 'risen' ? risen : analyses.sort((a, b) => b.totalMentions - a.totalMentions);

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1">
        <TopAppBar title="The Silence" subtitle="What stopped being said" />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24 max-w-7xl">

          <Card className="mb-6 border-violet-200 bg-violet-50/50">
            <CardContent className="pt-6">
              <p className="text-lg font-medium text-violet-900">
                Some phrases were fixtures of conference, then silently vanished. Others emerged from nowhere.
                This is the graveyard of conference language — and the nursery of the new.
              </p>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card><CardContent className="pt-4 text-center">
              <Ghost className="h-5 w-5 mx-auto mb-1 text-gray-400" />
              <p className="text-2xl font-bold text-gray-600">{vanished.length}</p>
              <p className="text-xs text-[#524534]">Vanished</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <Sparkles className="h-5 w-5 mx-auto mb-1 text-[#f5a623]" />
              <p className="text-2xl font-bold text-[#f5a623]">{risen.length}</p>
              <p className="text-xs text-[#524534]">Risen</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-[#1B5E7B]" />
              <p className="text-2xl font-bold text-[#1B5E7B]">{analyses.length}</p>
              <p className="text-xs text-[#524534]">Total Tracked</p>
            </CardContent></Card>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {([['vanished', `Vanished (${vanished.length})`], ['risen', `Risen (${risen.length})`], ['all', 'All Phrases']] as const).map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${tab === key ? (key === 'vanished' ? 'bg-gray-600 text-white' : key === 'risen' ? 'bg-[#f5a623] text-white' : 'bg-[#1B5E7B] text-white') : 'bg-[#f8f4e4] text-[#524534] hover:bg-[#1B5E7B]/10'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Phrase Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {displayList.map(a => {
              const isVanished = a.status === 'vanished';
              const isRisen = a.status === 'risen';
              const yearsSinceLastMention = 2026 - a.lastYear;
              const opacity = isVanished ? Math.max(0.5, 1 - yearsSinceLastMention * 0.02) : 1;

              return (
                <Card
                  key={a.phrase}
                  className={`cursor-pointer transition-all hover:shadow-md ${selectedPhrase === a.phrase ? 'ring-2' : ''} ${isVanished ? 'border-gray-300' : isRisen ? 'border-[#f5a623]/30' : ''}`}
                  style={{ opacity, ...(selectedPhrase === a.phrase ? { '--tw-ring-color': isVanished ? '#6B7280' : '#f5a623' } as React.CSSProperties : {}) }}
                  onClick={() => setSelectedPhrase(selectedPhrase === a.phrase ? null : a.phrase)}
                >
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-base font-serif italic text-[#1c1c13]">&ldquo;{a.phrase}&rdquo;</p>
                      {isVanished && <Ghost className="h-4 w-4 text-gray-400 shrink-0 ml-2" />}
                      {isRisen && <Sparkles className="h-4 w-4 text-[#f5a623] shrink-0 ml-2" />}
                    </div>

                    <div className="flex justify-between text-[10px] text-[#524534] mb-2">
                      <span>{isVanished ? `Peak: ${a.peakDecade}` : `First: ${a.firstYear}`}</span>
                      <span className="font-bold" style={{ color: isVanished ? '#6B7280' : isRisen ? '#f5a623' : '#1B5E7B' }}>
                        {a.totalMentions.toLocaleString()} total
                      </span>
                      <span>{isVanished ? `Last: ${a.lastYear}` : `Latest: ${a.lastYear}`}</span>
                    </div>

                    {/* Sparkline */}
                    <div className="flex items-end gap-[2px] h-6">
                      {allDecades.map(d => {
                        const count = a.decades.find(ad => ad.decade === d)?.count || 0;
                        const maxCount = a.peakCount || 1;
                        const height = count > 0 ? Math.max(2, (count / maxCount) * 24) : 0;
                        const color = isVanished ? '#6B7280' : isRisen ? '#f5a623' : '#1B5E7B';
                        return (
                          <div key={d} className="flex-1 flex items-end" title={`${d}: ${count}`}>
                            <div className="w-full rounded-t-sm" style={{ height: `${height}px`, background: count > 0 ? color : '#f2eede' }} />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[8px] text-[#524534]/40 mt-0.5">
                      <span>{allDecades[0]}</span>
                      <span>{allDecades[allDecades.length - 1]}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Detail View */}
          {detail && (
            <Card className="mb-6 border-[#1B5E7B]/20">
              <CardHeader>
                <CardTitle className="text-lg">&ldquo;{detail.phrase}&rdquo;</CardTitle>
                <CardDescription>
                  {detail.totalMentions.toLocaleString()} total mentions &middot; {detail.firstYear}&ndash;{detail.lastYear} &middot; Peak: {detail.peakDecade} ({detail.peakCount}x)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-bold mb-2 text-[#524534]">By Decade</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={detail.decades}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" />
                        <XAxis dataKey="decade" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: '#fdf9e9', border: '1px solid #e5e0d5', borderRadius: 8, fontSize: 12 }} />
                        <Bar dataKey="count" fill={detail.status === 'vanished' ? '#6B7280' : detail.status === 'risen' ? '#f5a623' : '#1B5E7B'} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold mb-2 text-[#524534]">By Year</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={detail.years}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" />
                        <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: '#fdf9e9', border: '1px solid #e5e0d5', borderRadius: 8, fontSize: 12 }} />
                        <Area type="monotone" dataKey="count" fill={detail.status === 'vanished' ? '#6B7280' : '#f5a623'} fillOpacity={0.3} stroke={detail.status === 'vanished' ? '#6B7280' : '#f5a623'} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline Heatmap */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Language Lifecycle</CardTitle>
              <CardDescription>When each phrase was most active</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  <div className="flex items-center gap-0 mb-1">
                    <div className="w-40 text-[10px] text-[#524534] font-medium">Phrase</div>
                    {allDecades.map(d => (
                      <div key={d} className="flex-1 text-[8px] text-center text-[#524534]">{d}</div>
                    ))}
                  </div>
                  {[...vanished.slice(0, 12), ...risen.slice(0, 8)].map(a => (
                    <div key={a.phrase} className="flex items-center gap-0 py-[2px] cursor-pointer hover:bg-[#f8f4e4]"
                      onClick={() => setSelectedPhrase(a.phrase)}>
                      <div className="w-40 text-[10px] text-[#1c1c13] truncate pr-2 flex items-center gap-1">
                        {a.status === 'vanished' ? <Ghost className="h-3 w-3 text-gray-400 shrink-0" /> : <Sparkles className="h-3 w-3 text-[#f5a623] shrink-0" />}
                        {a.phrase}
                      </div>
                      {allDecades.map(d => {
                        const count = a.decades.find(ad => ad.decade === d)?.count || 0;
                        const maxCount = a.peakCount || 1;
                        const intensity = count > 0 ? Math.max(0.15, count / maxCount) : 0;
                        const color = a.status === 'vanished' ? `rgba(107,114,128,${intensity})` : `rgba(245,166,35,${intensity})`;
                        return (
                          <div key={d} className="flex-1 px-[1px]">
                            <div className="h-4 rounded-sm" style={{ background: count > 0 ? color : '#f8f4e4' }} title={`${a.phrase} ${d}: ${count}`} />
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-6">
              <p className="text-xs text-amber-800">
                <strong>Methodology:</strong> Phrases are counted via case-insensitive substring matching in talk text.
                &quot;Vanished&quot; = less than 15% of peak decade usage and last mentioned before 2022.
                &quot;Risen&quot; = minimal pre-2000 usage (&le;3 mentions) with significant recent mentions (&gt;10 since 2010).
                Some disappearances reflect deliberate rebranding (e.g., &quot;Mormon&quot; &rarr; &quot;Church of Jesus Christ&quot;).
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
