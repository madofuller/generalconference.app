'use client';

import { useState, useMemo } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFilteredTalks } from '@/lib/filter-context';
import { Talk } from '@/lib/types';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

// Keyword-based topic detection (since topic classification isn't in the CSV)
const THEME_KEYWORDS: Record<string, string[]> = {
  'Faith': ['faith', 'believe', 'trust in god', 'mustard seed'],
  'Repentance': ['repent', 'repentance', 'forgiveness', 'forgive', 'change of heart'],
  'Atonement': ['atonement', 'atone', 'redeem', 'redemption', 'savior', 'calvary', 'gethsemane'],
  'Temple': ['temple', 'endowment', 'sealing', 'ordinance'],
  'Family': ['family', 'marriage', 'husband', 'wife', 'children', 'parent', 'home'],
  'Prayer': ['prayer', 'pray', 'kneel', 'heavenly father'],
  'Scripture': ['scripture', 'book of mormon', 'bible', 'doctrine and covenants'],
  'Service': ['service', 'serve', 'ministering', 'neighbor', 'charity'],
  'Missionary': ['missionary', 'mission', 'preach', 'gospel', 'convert', 'baptize'],
  'Obedience': ['obedience', 'obey', 'commandment', 'law of god'],
  'Priesthood': ['priesthood', 'authority', 'keys', 'ordain'],
  'Prophets': ['prophet', 'seer', 'revelator', 'revelation', 'living prophet'],
  'Second Coming': ['second coming', 'millennium', 'last days', 'signs of the times'],
  'Trials': ['trial', 'adversity', 'affliction', 'suffer', 'endure', 'tribulation'],
  'Love': ['love', 'charity', 'compassion', 'kindness'],
  'Hope': ['hope', 'optimism', 'bright future', 'promise'],
  'Tithing': ['tithing', 'tithe', 'fast offering', 'consecrate'],
  'Sabbath': ['sabbath', 'sabbath day', 'lord\'s day', 'sacrament meeting'],
  'Holy Ghost': ['holy ghost', 'holy spirit', 'spirit', 'comforter', 'still small voice'],
  'Covenant': ['covenant', 'promise', 'oath', 'covenant path'],
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
      if (hits > 0) {
        // Normalize per 1000 words
        p.themes[theme] = (p.themes[theme] || 0) + (hits / words) * 1000;
      }
    });
  });

  // Normalize theme values by talk count
  map.forEach(p => {
    Object.keys(p.themes).forEach(theme => {
      p.themes[theme] = Math.round((p.themes[theme] / p.talkCount) * 100) / 100;
    });
  });

  return Array.from(map.values()).sort((a, b) => a.year - b.year || a.season.localeCompare(b.season));
}

function cosine(a: Record<string, number>, b: Record<string, number>): number {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dot = 0, na = 0, nb = 0;
  keys.forEach(k => { const va = a[k] || 0, vb = b[k] || 0; dot += va * vb; na += va * va; nb += vb * vb; });
  return na > 0 && nb > 0 ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

export default function RepetitionPage() {
  const { talks, loading } = useFilteredTalks();
  const [selectedConf, setSelectedConf] = useState('');

  const profiles = useMemo(() => buildProfiles(talks), [talks]);

  // Conference-to-conference continuity
  const continuity = useMemo(() => {
    const result: { key: string; year: number; similarity: number }[] = [];
    for (let i = 1; i < profiles.length; i++) {
      const sim = cosine(profiles[i].themes, profiles[i - 1].themes);
      result.push({ key: profiles[i].key, year: profiles[i].year, similarity: Math.round(sim * 1000) / 1000 });
    }
    return result;
  }, [profiles]);

  // Most echoed: count high-similarity connections
  const mostEchoed = useMemo(() => {
    const echoCount = new Map<string, number>();
    profiles.forEach(p => echoCount.set(p.key, 0));

    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        const sim = cosine(profiles[i].themes, profiles[j].themes);
        if (sim > 0.85) {
          echoCount.set(profiles[i].key, (echoCount.get(profiles[i].key) || 0) + 1);
          echoCount.set(profiles[j].key, (echoCount.get(profiles[j].key) || 0) + 1);
        }
      }
    }

    return profiles
      .map(p => ({ ...p, echoCount: echoCount.get(p.key) || 0 }))
      .sort((a, b) => b.echoCount - a.echoCount)
      .slice(0, 15);
  }, [profiles]);

  // Watershed moments
  const watersheds = useMemo(() => {
    const result: { key: string; year: number; avgSim: number; drop: number }[] = [];
    for (let i = 3; i < profiles.length; i++) {
      const sims = [];
      for (let j = Math.max(0, i - 3); j < i; j++) {
        sims.push(cosine(profiles[i].themes, profiles[j].themes));
      }
      const avgSim = sims.reduce((a, b) => a + b, 0) / sims.length;

      if (i > 3) {
        const prevSims = [];
        for (let j = Math.max(0, i - 4); j < i - 1; j++) {
          prevSims.push(cosine(profiles[i - 1].themes, profiles[j].themes));
        }
        const prevAvg = prevSims.reduce((a, b) => a + b, 0) / prevSims.length;
        const drop = prevAvg - avgSim;
        if (drop > 0.02) {
          result.push({ key: profiles[i].key, year: profiles[i].year, avgSim, drop });
        }
      }
    }
    return result.sort((a, b) => b.drop - a.drop).slice(0, 10);
  }, [profiles]);

  // Decade similarity heatmap
  const { decades, matrix: decadeMatrix } = useMemo(() => {
    const decades = [...new Set(profiles.map(p => `${Math.floor(p.year / 10) * 10}s`))].sort();
    const decadeThemes = new Map<string, Record<string, number>>();

    profiles.forEach(p => {
      const decade = `${Math.floor(p.year / 10) * 10}s`;
      if (!decadeThemes.has(decade)) decadeThemes.set(decade, {});
      const dp = decadeThemes.get(decade)!;
      Object.entries(p.themes).forEach(([t, c]) => { dp[t] = (dp[t] || 0) + c; });
    });

    const matrix: { decade1: string; decade2: string; similarity: number }[] = [];
    for (let i = 0; i < decades.length; i++) {
      for (let j = i; j < decades.length; j++) {
        const a = decadeThemes.get(decades[i]) || {};
        const b = decadeThemes.get(decades[j]) || {};
        matrix.push({ decade1: decades[i], decade2: decades[j], similarity: Math.round(cosine(a, b) * 100) });
      }
    }
    return { decades, matrix };
  }, [profiles]);

  // Selected conference details
  const selectedProfile = profiles.find(p => p.key === selectedConf);
  const selectedSimilar = useMemo(() => {
    if (!selectedProfile) return [];
    return profiles
      .filter(p => p.key !== selectedConf)
      .map(p => ({ conference: p.key, similarity: cosine(selectedProfile.themes, p.themes) }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);
  }, [profiles, selectedProfile, selectedConf]);

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
        <TopAppBar title="Rhythm of Repetition" subtitle="Which conferences echo through time" />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24 max-w-7xl">

          <Card className="mb-6 border-violet-200 bg-violet-50/50">
            <CardContent className="pt-6">
              <p className="text-lg font-medium text-violet-900">
                Some conferences echo through decades. Others mark sharp turns. Discover the rhythm of repetition and the watershed moments of conference discourse.
              </p>
            </CardContent>
          </Card>

          {/* Continuity Timeline */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Conference-to-Conference Continuity</CardTitle>
              <CardDescription>How thematically similar each conference is to the one before it. Dips = sharp thematic shifts.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={continuity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0.5, 1]} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: '#fdf9e9', border: '1px solid #e5e0d5', borderRadius: 8, fontSize: 12 }}
                    formatter={(value: number | undefined) => [((value ?? 0) * 100).toFixed(1) + '%', 'Similarity']}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.key || ''}
                  />
                  <Line type="monotone" dataKey="similarity" stroke="#1B5E7B" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Most Echoed */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Most Echoed Conferences</CardTitle>
              <CardDescription>Conferences with the most thematic connections to other conferences (similarity &gt; 85%)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={mostEchoed}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" />
                  <XAxis dataKey="key" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#fdf9e9', border: '1px solid #e5e0d5', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="echoCount" fill="#1B5E7B" radius={[4, 4, 0, 0]} name="Echo Connections" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Decade Heatmap */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Decade Similarity Heatmap</CardTitle>
              <CardDescription>How thematically similar each decade is to every other</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-[400px]">
                  <div className="flex items-center">
                    <div className="w-14" />
                    {decades.map(d => <div key={d} className="flex-1 text-[9px] text-center text-[#524534] font-medium">{d}</div>)}
                  </div>
                  {decades.map(d1 => (
                    <div key={d1} className="flex items-center">
                      <div className="w-14 text-[9px] text-[#524534] font-medium">{d1}</div>
                      {decades.map(d2 => {
                        const entry = decadeMatrix.find(m =>
                          (m.decade1 === d1 && m.decade2 === d2) || (m.decade1 === d2 && m.decade2 === d1)
                        );
                        const sim = entry?.similarity || 0;
                        return (
                          <div key={d2} className="flex-1 aspect-square m-0.5 rounded-sm flex items-center justify-center"
                            style={{ background: `rgba(27,94,123,${sim / 100})` }}
                            title={`${d1} × ${d2}: ${sim}%`}>
                            <span className="text-[8px] font-mono" style={{ color: sim > 60 ? 'white' : '#524534' }}>{sim}</span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Watersheds */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Watershed Moments</CardTitle>
              <CardDescription>Conferences that broke most sharply from their predecessors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {watersheds.map((w, i) => (
                  <div key={w.key} className="flex items-center gap-3 py-2 border-b border-[#f2eede]">
                    <span className="text-sm font-bold text-[#f5a623] w-6">{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#1c1c13]">{w.key}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#524534]">Drop: <span className="font-bold text-red-500">{(w.drop * 100).toFixed(1)}%</span></p>
                    </div>
                  </div>
                ))}
                {watersheds.length === 0 && <p className="text-sm text-[#524534]">No significant watershed moments detected.</p>}
              </div>
            </CardContent>
          </Card>

          {/* Conference Explorer */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Conference Explorer</CardTitle>
              <CardDescription>Select a conference to find its thematic twins</CardDescription>
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

              {selectedProfile && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-bold mb-2 text-[#1B5E7B]">Top Themes</h3>
                    <div className="space-y-1">
                      {Object.entries(selectedProfile.themes)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10)
                        .map(([theme, score]) => (
                          <div key={theme} className="flex justify-between items-center py-1 border-b border-[#f2eede]">
                            <span className="text-sm">{theme}</span>
                            <span className="text-xs font-bold text-[#1B5E7B]">{score.toFixed(1)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold mb-2 text-[#f5a623]">Most Similar Conferences</h3>
                    <div className="space-y-1">
                      {selectedSimilar.map(s => (
                        <div key={s.conference} className="flex justify-between items-center py-1 border-b border-[#f2eede]">
                          <span className="text-sm">{s.conference}</span>
                          <span className="text-xs font-bold text-[#f5a623]">{(s.similarity * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-6">
              <p className="text-xs text-amber-800">
                <strong>Methodology:</strong> Themes are detected by counting keyword clusters in each talk&apos;s text across 20 categories
                (faith, repentance, temple, family, etc.), normalized per 1,000 words. Conference similarity uses cosine similarity
                of theme frequency vectors. Watersheds are detected by drops in rolling similarity to preceding conferences.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
