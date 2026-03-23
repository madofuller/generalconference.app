'use client';

import { useState, useMemo } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFilteredFullTalks } from '@/lib/filter-context';
import { Talk } from '@/lib/types';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const THEME_KEYWORDS: Record<string, string[]> = {
  'Faith': ['faith', 'believe', 'trust in god'],
  'Repentance': ['repent', 'repentance', 'change of heart'],
  'Atonement': ['atonement', 'redeem', 'redemption', 'gethsemane', 'calvary'],
  'Temple': ['temple', 'endowment', 'sealing'],
  'Family': ['family', 'marriage', 'children', 'parent', 'home'],
  'Prayer': ['prayer', 'pray', 'heavenly father'],
  'Scripture': ['scripture', 'book of mormon', 'bible', 'doctrine and covenants'],
  'Service': ['service', 'serve', 'ministering', 'charity'],
  'Missionary': ['missionary', 'mission', 'preach', 'convert'],
  'Obedience': ['obedience', 'obey', 'commandment'],
  'Priesthood': ['priesthood', 'authority', 'keys'],
  'Prophets': ['prophet', 'revelation', 'living prophet'],
  'Second Coming': ['second coming', 'millennium', 'last days'],
  'Trials': ['trial', 'adversity', 'affliction', 'endure'],
  'Love': ['love', 'charity', 'compassion'],
  'Tithing': ['tithing', 'tithe', 'fast offering'],
  'Sabbath': ['sabbath', 'sacrament meeting'],
  'Holy Ghost': ['holy ghost', 'holy spirit', 'still small voice'],
  'Covenant': ['covenant', 'covenant path'],
  'Mental Health': ['mental health', 'anxiety', 'depression', 'addiction', 'trauma'],
};

const THEME_COLORS: Record<string, string> = {
  'Faith': '#1B5E7B', 'Repentance': '#8B5CF6', 'Atonement': '#EC4899', 'Temple': '#f5a623',
  'Family': '#10B981', 'Prayer': '#6366F1', 'Scripture': '#14B8A6', 'Service': '#F97316',
  'Missionary': '#F97316', 'Obedience': '#78716C', 'Priesthood': '#0EA5E9', 'Prophets': '#A855F7',
  'Second Coming': '#7C3AED', 'Trials': '#475569', 'Love': '#DB2777', 'Tithing': '#84CC16',
  'Sabbath': '#06B6D4', 'Holy Ghost': '#6366F1', 'Covenant': '#B45309', 'Mental Health': '#E11D48',
};

interface ConferenceProfile {
  key: string;
  year: number;
  season: string;
  themes: Record<string, number>;
  talkCount: number;
}

function buildProfiles(talks: Talk[]): ConferenceProfile[] {
  const map = new Map<string, ConferenceProfile>();
  talks.forEach(t => {
    const key = `${t.season} ${t.year}`;
    if (!map.has(key)) map.set(key, { key, year: t.year, season: t.season, themes: {}, talkCount: 0 });
    const p = map.get(key)!;
    p.talkCount++;
    const text = (t.talk || '').toLowerCase();
    const words = text.split(/\s+/).length;
    if (words < 50) return;
    Object.entries(THEME_KEYWORDS).forEach(([theme, keywords]) => {
      let hits = 0;
      keywords.forEach(kw => {
        let idx = text.indexOf(kw);
        while (idx !== -1) { hits++; idx = text.indexOf(kw, idx + kw.length); }
      });
      if (hits > 0) p.themes[theme] = (p.themes[theme] || 0) + (hits / words) * 1000;
    });
  });

  map.forEach(p => {
    Object.keys(p.themes).forEach(theme => {
      p.themes[theme] = Math.round((p.themes[theme] / p.talkCount) * 100) / 100;
    });
  });

  return Array.from(map.values()).sort((a, b) => a.year - b.year || a.season.localeCompare(b.season));
}

export default function RepetitionPage() {
  const { talks, loading } = useFilteredFullTalks();
  const [selectedConf, setSelectedConf] = useState('');

  const profiles = useMemo(() => buildProfiles(talks), [talks]);

  // Compute global averages per theme
  const globalAvg = useMemo(() => {
    const sums: Record<string, number> = {};
    const counts: Record<string, number> = {};
    profiles.forEach(p => {
      Object.entries(p.themes).forEach(([t, v]) => {
        sums[t] = (sums[t] || 0) + v;
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    const avg: Record<string, number> = {};
    Object.keys(sums).forEach(t => { avg[t] = sums[t] / (counts[t] || 1); });
    return avg;
  }, [profiles]);

  // Compute deviation scores for each conference (z-score-like: how many avg-units above/below)
  const deviations = useMemo(() => {
    // Compute stddev per theme
    const stddevs: Record<string, number> = {};
    Object.keys(globalAvg).forEach(theme => {
      const vals = profiles.map(p => p.themes[theme] || 0);
      const mean = globalAvg[theme];
      const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
      stddevs[theme] = Math.sqrt(variance) || 1;
    });

    return profiles.map(p => {
      const devs: Record<string, number> = {};
      let totalDeviation = 0;
      Object.keys(globalAvg).forEach(theme => {
        const z = ((p.themes[theme] || 0) - globalAvg[theme]) / stddevs[theme];
        devs[theme] = Math.round(z * 100) / 100;
        totalDeviation += z * z;
      });
      return { ...p, deviations: devs, uniquenessScore: Math.round(Math.sqrt(totalDeviation) * 10) / 10 };
    });
  }, [profiles, globalAvg]);

  // Most unusual conferences (highest deviation from average)
  const mostUnusual = useMemo(() =>
    [...deviations].sort((a, b) => b.uniquenessScore - a.uniquenessScore).slice(0, 12),
  [deviations]);

  // Theme trends over time (by decade)
  const themeTrends = useMemo(() => {
    const decades = [...new Set(profiles.map(p => `${Math.floor(p.year / 10) * 10}s`))].sort();
    const themes = Object.keys(THEME_KEYWORDS);
    return decades.map(decade => {
      const decadeProfiles = profiles.filter(p => `${Math.floor(p.year / 10) * 10}s` === decade);
      const row: Record<string, string | number> = { decade };
      themes.forEach(theme => {
        const vals = decadeProfiles.map(p => p.themes[theme] || 0);
        row[theme] = Math.round((vals.reduce((a, b) => a + b, 0) / (vals.length || 1)) * 100) / 100;
      });
      return row;
    });
  }, [profiles]);

  // Biggest risers and fallers (compare first half to second half of data)
  const risersAndFallers = useMemo(() => {
    const midpoint = Math.floor(profiles.length / 2);
    const early = profiles.slice(0, midpoint);
    const late = profiles.slice(midpoint);

    const themes = Object.keys(THEME_KEYWORDS);
    const changes = themes.map(theme => {
      const earlyAvg = early.reduce((s, p) => s + (p.themes[theme] || 0), 0) / (early.length || 1);
      const lateAvg = late.reduce((s, p) => s + (p.themes[theme] || 0), 0) / (late.length || 1);
      const change = earlyAvg > 0 ? ((lateAvg - earlyAvg) / earlyAvg) * 100 : lateAvg > 0 ? 100 : 0;
      return { theme, earlyAvg: Math.round(earlyAvg * 100) / 100, lateAvg: Math.round(lateAvg * 100) / 100, change: Math.round(change) };
    }).filter(c => Math.abs(c.change) > 5);

    changes.sort((a, b) => b.change - a.change);
    return changes;
  }, [profiles]);

  // Conference-to-conference theme change (what shifted most between consecutive conferences)
  const continuityShifts = useMemo(() => {
    const result: { key: string; year: number; biggestShift: string; shiftAmount: number }[] = [];
    for (let i = 1; i < profiles.length; i++) {
      let biggestShift = '';
      let biggestAmount = 0;
      Object.keys(THEME_KEYWORDS).forEach(theme => {
        const prev = profiles[i - 1].themes[theme] || 0;
        const curr = profiles[i].themes[theme] || 0;
        const diff = Math.abs(curr - prev);
        if (diff > biggestAmount) { biggestAmount = diff; biggestShift = theme; }
      });
      result.push({ key: profiles[i].key, year: profiles[i].year, biggestShift, shiftAmount: Math.round(biggestAmount * 100) / 100 });
    }
    return result;
  }, [profiles]);

  // Sharp pivots — conferences where the biggest shift was unusually large
  const sharpPivots = useMemo(() => {
    if (continuityShifts.length === 0) return [];
    const avgShift = continuityShifts.reduce((s, c) => s + c.shiftAmount, 0) / continuityShifts.length;
    return continuityShifts
      .filter(c => c.shiftAmount > avgShift * 1.8)
      .sort((a, b) => b.shiftAmount - a.shiftAmount)
      .slice(0, 10);
  }, [continuityShifts]);

  // Selected conference detail
  const selectedDev = deviations.find(d => d.key === selectedConf);

  if (loading) {
    return (
      <div className="flex min-h-screen"><Navigation />
        <main className="ml-0 lg:ml-[260px] flex-1 flex items-center justify-center"><p className="text-[#524534]">Loading...</p></main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1">
        <TopAppBar title="Thematic Shifts" subtitle="How conference emphasis changes over time" />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24 max-w-7xl">

          <Card className="mb-4 md:mb-6 border-[#1B5E7B]/20 bg-[#1B5E7B]/5">
            <CardContent className="pt-4 md:pt-6">
              <p className="text-sm md:text-base font-medium text-[#1B5E7B]">
                Conference themes shift across decades. Some topics surge while others fade.
                Which conferences broke the mold? What&apos;s rising and falling?
              </p>
            </CardContent>
          </Card>

          {/* Rising & Falling Themes */}
          <Card className="mb-4 md:mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm md:text-base">Rising & Falling Themes</CardTitle>
              <CardDescription className="text-xs">Comparing first half vs. second half of conference history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {risersAndFallers.map(c => {
                  const isRising = c.change > 0;
                  const barWidth = Math.min(Math.abs(c.change), 300);
                  return (
                    <div key={c.theme} className="flex items-center gap-2 md:gap-3">
                      <span className="text-xs font-medium text-[#1c1c13] w-24 md:w-32 shrink-0 truncate">{c.theme}</span>
                      <div className="flex-1 flex items-center gap-1">
                        {!isRising && (
                          <div className="flex-1 flex justify-end">
                            <div className="h-5 rounded-l-full bg-red-400/60" style={{ width: `${barWidth / 3}%` }} />
                          </div>
                        )}
                        <span className={`text-[10px] md:text-xs font-bold w-14 text-center shrink-0 ${isRising ? 'text-emerald-600' : 'text-red-500'}`}>
                          {isRising ? '+' : ''}{c.change}%
                        </span>
                        {isRising && (
                          <div className="flex-1">
                            <div className="h-5 rounded-r-full bg-emerald-400/60" style={{ width: `${barWidth / 3}%` }} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Theme Evolution by Decade */}
          <Card className="mb-4 md:mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm md:text-base">Theme Evolution by Decade</CardTitle>
              <CardDescription className="text-xs">Average mentions per 1,000 words per talk</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="-mx-2 md:mx-0">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={themeTrends} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" />
                    <XAxis dataKey="decade" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} width={30} />
                    <Tooltip contentStyle={{ background: '#fdf9e9', border: '1px solid #e5e0d5', borderRadius: 8, fontSize: 11 }} />
                    {['Temple', 'Family', 'Covenant', 'Mental Health', 'Missionary', 'Priesthood', 'Second Coming', 'Trials'].map(theme => (
                      <Line key={theme} type="monotone" dataKey={theme} stroke={THEME_COLORS[theme] || '#999'} strokeWidth={2} dot={{ r: 2 }} name={theme} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[9px] text-[#1c1c13]/30 mt-1">Showing 8 themes with most movement. Select a conference below for the full breakdown.</p>
            </CardContent>
          </Card>

          {/* Most Unusual Conferences */}
          <Card className="mb-4 md:mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm md:text-base">Most Distinctive Conferences</CardTitle>
              <CardDescription className="text-xs">Conferences that deviated most from the all-time average theme mix</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={mostUnusual} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" />
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="key" width={110} tick={{ fontSize: 9 }} />
                  <Tooltip
                    contentStyle={{ background: '#fdf9e9', border: '1px solid #e5e0d5', borderRadius: 8, fontSize: 11 }}
                    formatter={(v: number | undefined) => [`${v ?? 0}`, 'Uniqueness Score']}
                  />
                  <Bar dataKey="uniquenessScore" fill="#8B5CF6" radius={[0, 6, 6, 0]} name="Uniqueness" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sharp Pivots */}
          <Card className="mb-4 md:mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm md:text-base">Sharpest Pivots</CardTitle>
              <CardDescription className="text-xs">Conferences where a single theme swung the most vs. the prior conference</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sharpPivots.map((w, i) => (
                  <div key={w.key} className="flex items-center gap-2 md:gap-3 py-2 border-b border-[#f2eede] last:border-0">
                    <span className="text-sm font-bold text-[#f5a623] w-5 md:w-6 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-medium text-[#1c1c13]">{w.key}</p>
                      <p className="text-[10px] text-[#524534]">Biggest swing: <span className="font-bold" style={{ color: THEME_COLORS[w.biggestShift] || '#1B5E7B' }}>{w.biggestShift}</span></p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs md:text-sm font-bold text-[#1B5E7B]">{w.shiftAmount}</p>
                      <p className="text-[9px] text-[#524534]">shift</p>
                    </div>
                  </div>
                ))}
                {sharpPivots.length === 0 && <p className="text-sm text-[#524534]">No sharp pivots detected.</p>}
              </div>
            </CardContent>
          </Card>

          {/* Conference Explorer */}
          <Card className="mb-4 md:mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm md:text-base">Conference Deep Dive</CardTitle>
              <CardDescription className="text-xs">Select a conference to see what made it distinctive</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedConf} onValueChange={setSelectedConf}>
                <SelectTrigger className="w-full md:w-64 mb-4"><SelectValue placeholder="Choose a conference..." /></SelectTrigger>
                <SelectContent>
                  {[...profiles].reverse().map(p => (
                    <SelectItem key={p.key} value={p.key}>{p.key} ({p.talkCount} talks)</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedDev && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-center">
                      <p className="text-2xl md:text-3xl font-extrabold text-[#8B5CF6]">{selectedDev.uniquenessScore}</p>
                      <p className="text-[9px] uppercase tracking-wider text-[#524534] font-bold">Uniqueness</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl md:text-3xl font-extrabold text-[#1B5E7B]">{selectedDev.talkCount}</p>
                      <p className="text-[9px] uppercase tracking-wider text-[#524534] font-bold">Talks</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1c1c13]/40 mb-2">Theme Emphasis vs. Average</h3>
                    <div className="space-y-1.5">
                      {Object.entries(selectedDev.deviations)
                        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                        .slice(0, 12)
                        .map(([theme, z]) => {
                          const isAbove = z > 0;
                          const width = Math.min(Math.abs(z) * 20, 100);
                          return (
                            <div key={theme} className="flex items-center gap-2">
                              <span className="text-[11px] font-medium text-[#1c1c13] w-28 shrink-0 truncate">{theme}</span>
                              <div className="flex-1 flex items-center h-4">
                                <div className="w-1/2 flex justify-end pr-1">
                                  {!isAbove && <div className="h-3 rounded-l bg-red-400/70" style={{ width: `${width}%` }} />}
                                </div>
                                <div className="w-px h-4 bg-[#1c1c13]/20" />
                                <div className="w-1/2 pl-1">
                                  {isAbove && <div className="h-3 rounded-r bg-emerald-500/70" style={{ width: `${width}%` }} />}
                                </div>
                              </div>
                              <span className={`text-[10px] font-bold w-10 text-right ${isAbove ? 'text-emerald-600' : 'text-red-500'}`}>
                                {isAbove ? '+' : ''}{z.toFixed(1)}σ
                              </span>
                            </div>
                          );
                        })}
                    </div>
                    <p className="text-[8px] text-[#1c1c13]/30 mt-2">σ = standard deviations from the all-time conference average</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-4 md:pt-6">
              <p className="text-[10px] md:text-xs text-amber-800">
                <strong>Methodology:</strong> 20 theme categories are detected via keyword matching, normalized per 1,000 words.
                Uniqueness uses z-scores (standard deviations from the all-time mean). Pivots measure the largest single-theme
                swing between consecutive conferences.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
