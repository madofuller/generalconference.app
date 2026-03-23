'use client';

import { useState, useMemo } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFilteredFullTalks } from '@/lib/filter-context';
import { Talk } from '@/lib/types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';

interface TensionPair {
  name: string;
  poleA: { label: string; keywords: string[] };
  poleB: { label: string; keywords: string[] };
  color: { a: string; b: string };
}

const TENSIONS: TensionPair[] = [
  {
    name: 'Justice vs. Mercy',
    poleA: { label: 'Justice', keywords: ['justice', 'judgment', 'accountability', 'consequence', 'punishment', 'commandments', 'standards', 'penalty', 'transgression'] },
    poleB: { label: 'Mercy', keywords: ['mercy', 'compassion', 'forgiveness', 'grace', 'understanding', 'patience', 'long-suffering', 'tender mercies', 'clemency'] },
    color: { a: '#EF4444', b: '#10B981' },
  },
  {
    name: 'Obedience vs. Agency',
    poleA: { label: 'Obedience', keywords: ['obedience', 'obey', 'submit', 'follow the prophet', 'duty', 'strict', 'exactness', 'compliance', 'hearken'] },
    poleB: { label: 'Agency', keywords: ['agency', 'choose', 'freedom', 'choice', 'free will', 'moral agency', 'decide', 'liberty', 'self-determination'] },
    color: { a: '#8B5CF6', b: '#F59E0B' },
  },
  {
    name: 'Individual vs. Community',
    poleA: { label: 'Individual', keywords: ['personal', 'individual', 'yourself', 'your own', 'self-reliance', 'personal revelation', 'individual worth', 'self-improvement'] },
    poleB: { label: 'Community', keywords: ['community', 'together', 'united', 'unity', 'fellowship', 'gathering', 'zion', 'one heart', 'collective'] },
    color: { a: '#3B82F6', b: '#EC4899' },
  },
  {
    name: 'Faith vs. Works',
    poleA: { label: 'Faith', keywords: ['faith', 'believe', 'trust in god', 'hope', 'grace', 'saved by', 'miracle', 'spiritual gift'] },
    poleB: { label: 'Works', keywords: ['works', 'action', 'serve', 'labor', 'effort', 'diligence', 'endure', 'strive', 'industrious'] },
    color: { a: '#6366F1', b: '#F97316' },
  },
  {
    name: 'Fear vs. Hope',
    poleA: { label: 'Warning', keywords: ['fear', 'warning', 'danger', 'peril', 'wickedness', 'destruction', 'judgment day', 'woe', 'calamity'] },
    poleB: { label: 'Hope', keywords: ['hope', 'optimism', 'bright future', 'promise', 'joy', 'peace', 'confidence', 'better days', 'rejoice'] },
    color: { a: '#374151', b: '#FBBF24' },
  },
];

function countKeywords(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce((sum, kw) => {
    let count = 0;
    let idx = lower.indexOf(kw);
    while (idx !== -1) { count++; idx = lower.indexOf(kw, idx + kw.length); }
    return sum + count;
  }, 0);
}

function computePendulum(talks: Talk[], tension: TensionPair) {
  const byDecade = new Map<string, { aTotal: number; bTotal: number; count: number }>();

  talks.forEach(t => {
    const text = t.talk || '';
    const aHits = countKeywords(text, tension.poleA.keywords);
    const bHits = countKeywords(text, tension.poleB.keywords);
    if (aHits === 0 && bHits === 0) return;

    const decade = `${Math.floor(t.year / 10) * 10}s`;
    if (!byDecade.has(decade)) byDecade.set(decade, { aTotal: 0, bTotal: 0, count: 0 });
    const d = byDecade.get(decade)!;
    d.aTotal += aHits;
    d.bTotal += bHits;
    d.count++;
  });

  return Array.from(byDecade.entries())
    .map(([decade, d]) => {
      const score = (d.bTotal - d.aTotal) / (d.aTotal + d.bTotal + 1);
      return { decade, score: Math.round(score * 1000) / 1000, aTotal: d.aTotal, bTotal: d.bTotal, talks: d.count };
    })
    .sort((a, b) => a.decade.localeCompare(b.decade));
}

export default function DoctrinalPendulumPage() {
  const { talks, loading } = useFilteredFullTalks();
  const [selectedIdx, setSelectedIdx] = useState(0);

  const allData = useMemo(() => TENSIONS.map(t => ({ tension: t, data: computePendulum(talks, t) })), [talks]);

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Navigation />
        <main className="ml-0 lg:ml-[260px] flex-1 flex items-center justify-center"><p className="text-[#524534]">Loading...</p></main>
      </div>
    );
  }

  const selected = allData[selectedIdx];
  const currentDecade = selected.data[selected.data.length - 1];
  const historicalAvg = selected.data.length > 0
    ? selected.data.reduce((s, d) => s + d.score, 0) / selected.data.length
    : 0;

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1">
        <TopAppBar title="The Doctrinal Pendulum" subtitle="How emphasis swings between theological tensions" />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24 max-w-7xl">

          <Card className="mb-4 md:mb-6 border-violet-200 bg-violet-50/50 overflow-hidden">
            <CardContent className="pt-4 md:pt-6">
              <p className="text-sm md:text-lg font-medium text-violet-900">
                Conference emphasis swings between theological poles over the decades. See the cyclical nature of doctrinal emphasis that members intuitively feel.
              </p>
            </CardContent>
          </Card>

          {/* Overview Grid */}
          <h2 className="text-lg font-bold text-[#1c1c13] mb-3">All Tensions at a Glance</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {allData.map((item, i) => (
              <Card
                key={item.tension.name}
                className={`cursor-pointer transition-all hover:shadow-md ${i === selectedIdx ? 'ring-2 ring-[#1B5E7B]' : ''}`}
                onClick={() => setSelectedIdx(i)}
              >
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm">{item.tension.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-[10px] text-[#524534] mb-1">
                    <span>{item.tension.poleA.label}</span>
                    <span>{item.tension.poleB.label}</span>
                  </div>
                  <ResponsiveContainer width="100%" height={60}>
                    <AreaChart data={item.data}>
                      <ReferenceLine y={0} stroke="#9CA3AF" strokeDasharray="2 2" />
                      <Area type="monotone" dataKey="score" stroke={item.tension.color.b} fill={item.tension.color.b} fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Deep Dive */}
          <h2 className="text-lg font-bold text-[#1c1c13] mb-3">Deep Dive: {selected.tension.name}</h2>

          <div className="grid md:grid-cols-3 gap-3 mb-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-xs text-[#524534]">Current Lean</p>
                <p className="text-xl font-bold" style={{ color: currentDecade?.score > 0 ? selected.tension.color.b : selected.tension.color.a }}>
                  {currentDecade?.score > 0 ? selected.tension.poleB.label : selected.tension.poleA.label}
                </p>
                <p className="text-xs text-[#524534]">{currentDecade?.decade}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-xs text-[#524534]">Score</p>
                <p className="text-xl font-bold text-[#1B5E7B]">{currentDecade?.score?.toFixed(3)}</p>
                <p className="text-xs text-[#524534]">-1 = {selected.tension.poleA.label}, +1 = {selected.tension.poleB.label}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-xs text-[#524534]">Historical Average</p>
                <p className="text-xl font-bold text-[#f5a623]">{historicalAvg.toFixed(3)}</p>
                <p className="text-xs text-[#524534]">Across all decades</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="flex justify-between text-xs font-bold text-[#524534] mb-2">
                <span style={{ color: selected.tension.color.a }}>{selected.tension.poleA.label}</span>
                <span style={{ color: selected.tension.color.b }}>{selected.tension.poleB.label}</span>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={selected.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" />
                  <XAxis dataKey="decade" tick={{ fontSize: 11 }} />
                  <YAxis domain={[-0.5, 0.5]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#fdf9e9', border: '1px solid #e5e0d5', borderRadius: 8, fontSize: 12 }}
                    formatter={(value: number | undefined) => [(value ?? 0).toFixed(3), 'Score']}
                  />
                  <ReferenceLine y={0} stroke="#1c1c13" strokeWidth={2} label={{ value: 'Balance', fontSize: 10, fill: '#524534' }} />
                  <ReferenceLine y={historicalAvg} stroke="#f5a623" strokeDasharray="5 5" label={{ value: 'Avg', fontSize: 10, fill: '#f5a623' }} />
                  <defs>
                    <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={selected.tension.color.b} stopOpacity={0.5} />
                      <stop offset="50%" stopColor={selected.tension.color.b} stopOpacity={0.05} />
                      <stop offset="50%" stopColor={selected.tension.color.a} stopOpacity={0.05} />
                      <stop offset="100%" stopColor={selected.tension.color.a} stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="score" stroke="#1B5E7B" strokeWidth={2} fill="url(#splitColor)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Decade Detail Table */}
          <Card className="mb-4">
            <CardHeader><CardTitle className="text-base">Decade Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e5e0d5]">
                      <th className="text-left py-2 text-[#524534] font-medium">Decade</th>
                      <th className="text-right py-2 text-[#524534] font-medium">{selected.tension.poleA.label} Hits</th>
                      <th className="text-right py-2 text-[#524534] font-medium">{selected.tension.poleB.label} Hits</th>
                      <th className="text-right py-2 text-[#524534] font-medium">Score</th>
                      <th className="text-right py-2 text-[#524534] font-medium">Lean</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.data.map(d => (
                      <tr key={d.decade} className="border-b border-[#f2eede]">
                        <td className="py-1.5 font-medium">{d.decade}</td>
                        <td className="text-right">{d.aTotal.toLocaleString()}</td>
                        <td className="text-right">{d.bTotal.toLocaleString()}</td>
                        <td className="text-right font-mono">{d.score.toFixed(3)}</td>
                        <td className="text-right">
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{
                            background: (d.score > 0 ? selected.tension.color.b : selected.tension.color.a) + '20',
                            color: d.score > 0 ? selected.tension.color.b : selected.tension.color.a
                          }}>
                            {d.score > 0 ? selected.tension.poleB.label : selected.tension.poleA.label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Keyword Reference */}
          <Card className="mb-4">
            <CardHeader><CardTitle className="text-base">Tracked Keywords</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold mb-2" style={{ color: selected.tension.color.a }}>{selected.tension.poleA.label}</p>
                  <div className="flex flex-wrap gap-1">
                    {selected.tension.poleA.keywords.map(k => (
                      <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-[#f8f4e4] text-[#524534]">{k}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold mb-2" style={{ color: selected.tension.color.b }}>{selected.tension.poleB.label}</p>
                  <div className="flex flex-wrap gap-1">
                    {selected.tension.poleB.keywords.map(k => (
                      <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-[#f8f4e4] text-[#524534]">{k}</span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-6">
              <p className="text-xs text-amber-800">
                <strong>Methodology:</strong> Each talk is scored by counting keyword hits for both poles, then normalized to a -1 to +1 scale.
                Scores are averaged by decade. This is a heuristic analysis — keyword presence doesn&apos;t capture full theological nuance.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
