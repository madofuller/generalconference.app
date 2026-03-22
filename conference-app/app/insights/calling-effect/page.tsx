'use client';

import { useState, useMemo } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFilteredTalks } from '@/lib/filter-context';
import { Talk } from '@/lib/types';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';

const CALLING_RANK: Record<string, number> = {
  'President of the Church': 10,
  'First Counselor in the First Presidency': 9,
  'Second Counselor in the First Presidency': 9,
  'Counselor in the First Presidency': 9,
  'President of the Quorum of the Twelve Apostles': 8,
  'Acting President of the Quorum of the Twelve Apostles': 8,
  'Of the Quorum of the Twelve Apostles': 7,
  'Of the Council of the Twelve': 7,
  'Of the Presidency of the Seventy': 6,
  'Of the First Quorum of the Seventy': 4,
  'Of the Seventy': 4,
  'Of the First Council of the Seventy': 4,
  'Presiding Bishop': 4,
};

function getCallingLabel(calling: string): string {
  if (calling.includes('President of the Church')) return 'Prophet';
  if (calling.includes('First Presidency') || calling.includes('Counselor in the First')) return 'First Presidency';
  if (calling.includes('Quorum of the Twelve') || calling.includes('Council of the Twelve')) return 'Apostle';
  if (calling.includes('Presidency of the Seventy')) return 'Pres. of Seventy';
  if (calling.includes('Seventy') || calling.includes('First Council')) return 'Seventy';
  if (calling.includes('Bishop')) return 'Presiding Bishop';
  if (calling.includes('Relief Society') || calling.includes('Young Women') || calling.includes('Primary')) return 'Auxiliary';
  return 'Other';
}

const POSITIVE_WORDS = ['joy', 'hope', 'peace', 'happy', 'wonderful', 'beautiful', 'blessed', 'grateful', 'thankful', 'rejoice', 'delight', 'love'];
const NEGATIVE_WORDS = ['fear', 'sorrow', 'danger', 'warning', 'wicked', 'sin', 'suffer', 'pain', 'grief', 'trial', 'temptation'];
const STORY_MARKERS = ['i remember', 'story', 'when i was', 'my father', 'my mother', 'one day', 'years ago', 'let me share'];

function countKeywords(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce((sum, kw) => {
    let c = 0; let idx = lower.indexOf(kw);
    while (idx !== -1) { c++; idx = lower.indexOf(kw, idx + kw.length); }
    return sum + c;
  }, 0);
}

function computeMetrics(talks: Talk[]) {
  if (talks.length === 0) return { avgWords: 0, positivity: 50, scriptureRate: 0, storyRate: 0, questionRate: 0 };

  let totalWords = 0;
  let totalScriptures = 0;
  let totalPositive = 0;
  let totalNegative = 0;
  let totalStory = 0;
  let totalQuestions = 0;

  talks.forEach(t => {
    const text = t.talk || '';
    const words = text.split(/\s+/).length;
    totalWords += words;
    totalScriptures += (text.match(/\d+:\d+/g) || []).length;
    totalPositive += countKeywords(text, POSITIVE_WORDS);
    totalNegative += countKeywords(text, NEGATIVE_WORDS);
    totalStory += countKeywords(text, STORY_MARKERS);
    totalQuestions += (text.match(/\?/g) || []).length;
  });

  return {
    avgWords: Math.round(totalWords / talks.length),
    positivity: (totalPositive + totalNegative) > 0 ? Math.round((totalPositive / (totalPositive + totalNegative)) * 100) : 50,
    scriptureRate: totalWords > 0 ? Math.round((totalScriptures / totalWords) * 10000) / 10 : 0,
    storyRate: totalWords > 0 ? Math.round((totalStory / totalWords) * 10000) / 10 : 0,
    questionRate: totalWords > 0 ? Math.round((totalQuestions / totalWords) * 10000) / 10 : 0,
  };
}

interface SpeakerTransition {
  speaker: string;
  totalTalks: number;
  transitions: { year: number; from: string; to: string }[];
  majorTransition: { year: number; from: string; to: string };
  beforeTalks: Talk[];
  afterTalks: Talk[];
}

function findTransitions(talks: Talk[]): SpeakerTransition[] {
  const bySpeaker = new Map<string, Talk[]>();
  talks.forEach(t => {
    if (!bySpeaker.has(t.speaker)) bySpeaker.set(t.speaker, []);
    bySpeaker.get(t.speaker)!.push(t);
  });

  const results: SpeakerTransition[] = [];

  bySpeaker.forEach((speakerTalks, speaker) => {
    if (speakerTalks.length < 8) return;
    const sorted = [...speakerTalks].sort((a, b) => a.year - b.year || a.season.localeCompare(b.season));
    const transitions: { year: number; from: string; to: string }[] = [];

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].calling !== sorted[i - 1].calling) {
        transitions.push({ year: sorted[i].year, from: sorted[i - 1].calling, to: sorted[i].calling });
      }
    }
    if (transitions.length === 0) return;

    const major = transitions.reduce((best, t) => {
      const rankChange = (CALLING_RANK[t.to] || 0) - (CALLING_RANK[t.from] || 0);
      const bestChange = (CALLING_RANK[best.to] || 0) - (CALLING_RANK[best.from] || 0);
      return rankChange > bestChange ? t : best;
    }, transitions[0]);

    const beforeTalks = sorted.filter(t => t.year < major.year || (t.year === major.year && t.calling === major.from));
    const afterTalks = sorted.filter(t => t.year > major.year || (t.year === major.year && t.calling !== major.from));

    if (beforeTalks.length >= 3 && afterTalks.length >= 3) {
      results.push({ speaker, totalTalks: speakerTalks.length, transitions, majorTransition: major, beforeTalks, afterTalks });
    }
  });

  return results.sort((a, b) => b.totalTalks - a.totalTalks);
}

export default function CallingEffectPage() {
  const { talks, loading } = useFilteredTalks();
  const [selectedSpeaker, setSelectedSpeaker] = useState('');

  const transitionSpeakers = useMemo(() => findTransitions(talks), [talks]);

  const selectedData = transitionSpeakers.find(s => s.speaker === selectedSpeaker);

  const apostleEffect = useMemo(() => {
    const apostles = transitionSpeakers.filter(s =>
      s.majorTransition.to.includes('Twelve') || s.majorTransition.to.includes('Council of the Twelve')
    );
    if (apostles.length === 0) return null;

    const befores = apostles.map(s => computeMetrics(s.beforeTalks));
    const afters = apostles.map(s => computeMetrics(s.afterTalks));
    const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);

    return {
      count: apostles.length,
      metrics: [
        { metric: 'Avg Words/Talk', before: avg(befores.map(m => m.avgWords)), after: avg(afters.map(m => m.avgWords)) },
        { metric: 'Positivity %', before: avg(befores.map(m => m.positivity)), after: avg(afters.map(m => m.positivity)) },
        { metric: 'Scriptures/10k', before: avg(befores.map(m => m.scriptureRate * 10)), after: avg(afters.map(m => m.scriptureRate * 10)) },
        { metric: 'Stories/10k', before: avg(befores.map(m => m.storyRate * 10)), after: avg(afters.map(m => m.storyRate * 10)) },
        { metric: 'Questions/10k', before: avg(befores.map(m => m.questionRate * 10)), after: avg(afters.map(m => m.questionRate * 10)) },
      ],
    };
  }, [transitionSpeakers]);

  const dramaticShifts = useMemo(() => {
    return transitionSpeakers.map(s => {
      const before = computeMetrics(s.beforeTalks);
      const after = computeMetrics(s.afterTalks);
      const magnitude =
        Math.abs(after.avgWords - before.avgWords) / Math.max(before.avgWords, 1) * 50 +
        Math.abs(after.positivity - before.positivity) * 2 +
        Math.abs(after.scriptureRate - before.scriptureRate) * 10 +
        Math.abs(after.storyRate - before.storyRate) * 10;
      return { ...s, before, after, magnitude };
    }).sort((a, b) => b.magnitude - a.magnitude).slice(0, 15);
  }, [transitionSpeakers]);

  if (loading) {
    return (
      <div className="flex min-h-screen"><Navigation />
        <main className="ml-0 lg:ml-[260px] flex-1 flex items-center justify-center"><p className="text-[#524534]">Loading...</p></main>
      </div>
    );
  }

  const selectedBefore = selectedData ? computeMetrics(selectedData.beforeTalks) : null;
  const selectedAfter = selectedData ? computeMetrics(selectedData.afterTalks) : null;

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1">
        <TopAppBar title="The Calling Effect" subtitle="How callings change what leaders say" />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24 max-w-7xl">

          <Card className="mb-6 border-violet-200 bg-violet-50/50">
            <CardContent className="pt-6">
              <p className="text-lg font-medium text-violet-900">
                Does becoming an Apostle change what you talk about? Track how speakers&apos; style, tone, and habits shift when their calling changes.
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            <Card><CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-[#1B5E7B]">{transitionSpeakers.length}</p>
              <p className="text-xs text-[#524534]">Speakers with Transitions</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-[#f5a623]">{apostleEffect?.count || 0}</p>
              <p className="text-xs text-[#524534]">Became Apostles</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className="text-lg font-bold text-[#1B5E7B] truncate">{dramaticShifts[0]?.speaker || '—'}</p>
              <p className="text-xs text-[#524534]">Most Dramatic Shift</p>
            </CardContent></Card>
          </div>

          {/* Apostleship Effect */}
          {apostleEffect && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">The Apostleship Effect</CardTitle>
                <CardDescription>Average changes across {apostleEffect.count} speakers who became Apostles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {apostleEffect.metrics.map(m => {
                    const change = m.after - m.before;
                    const pctChange = m.before > 0 ? Math.round((change / m.before) * 100) : 0;
                    return (
                      <div key={m.metric} className="flex items-center gap-4">
                        <div className="w-32 text-sm text-[#524534]">{m.metric}</div>
                        <div className="flex-1 flex items-center gap-2">
                          <div className="text-sm font-mono text-[#1B5E7B] w-16 text-right">{m.before}</div>
                          <div className="flex-1 h-3 bg-[#f2eede] rounded-full relative">
                            <div className="absolute top-0 left-0 h-full rounded-full bg-[#1B5E7B]/40" style={{ width: `${Math.min(100, (m.before / Math.max(m.before, m.after)) * 100)}%` }} />
                            <div className="absolute top-0 left-0 h-full rounded-full bg-[#f5a623]/60" style={{ width: `${Math.min(100, (m.after / Math.max(m.before, m.after)) * 100)}%` }} />
                          </div>
                          <div className="text-sm font-mono text-[#f5a623] w-16">{m.after}</div>
                          <span className={`text-xs font-bold w-14 text-right ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                            {change > 0 ? '+' : ''}{pctChange}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex gap-4 text-[10px] text-[#524534] mt-2">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#1B5E7B]/40" /> Before</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#f5a623]/60" /> After</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Speaker Explorer */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Speaker Deep Dive</CardTitle>
              <CardDescription>Select a speaker to see their before/after comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedSpeaker} onValueChange={setSelectedSpeaker}>
                <SelectTrigger className="w-full md:w-80 mb-4"><SelectValue placeholder="Choose a speaker..." /></SelectTrigger>
                <SelectContent>
                  {transitionSpeakers.map(s => (
                    <SelectItem key={s.speaker} value={s.speaker}>
                      {s.speaker} — {getCallingLabel(s.majorTransition.from)} &rarr; {getCallingLabel(s.majorTransition.to)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedData && selectedBefore && selectedAfter && (
                <div className="space-y-4">
                  <div className="p-3 bg-[#f8f4e4] rounded-lg">
                    <div className="flex flex-wrap gap-2">
                      {selectedData.transitions.map((t, i) => (
                        <div key={i} className="flex items-center gap-1 text-xs">
                          <span className="text-[#524534] font-mono">{t.year}</span>
                          <span className="px-2 py-0.5 rounded-full bg-[#1B5E7B]/10 text-[#1B5E7B] text-[10px]">{getCallingLabel(t.from)}</span>
                          <span className="text-[#524534]">&rarr;</span>
                          <span className="px-2 py-0.5 rounded-full bg-[#f5a623]/20 text-[#f5a623] text-[10px] font-bold">{getCallingLabel(t.to)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="border-[#1B5E7B]/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-[#1B5E7B]">Before: {getCallingLabel(selectedData.majorTransition.from)}</CardTitle>
                        <CardDescription>{selectedData.beforeTalks.length} talks</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-[#524534]">Avg Words</span><span className="font-bold">{selectedBefore.avgWords.toLocaleString()}</span></div>
                          <div className="flex justify-between"><span className="text-[#524534]">Positivity</span><span className="font-bold">{selectedBefore.positivity}%</span></div>
                          <div className="flex justify-between"><span className="text-[#524534]">Scripture Rate</span><span className="font-bold">{selectedBefore.scriptureRate}/10k words</span></div>
                          <div className="flex justify-between"><span className="text-[#524534]">Story Rate</span><span className="font-bold">{selectedBefore.storyRate}/10k words</span></div>
                          <div className="flex justify-between"><span className="text-[#524534]">Question Rate</span><span className="font-bold">{selectedBefore.questionRate}/10k words</span></div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-[#f5a623]/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-[#f5a623]">After: {getCallingLabel(selectedData.majorTransition.to)}</CardTitle>
                        <CardDescription>{selectedData.afterTalks.length} talks</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          {[
                            { label: 'Avg Words', before: selectedBefore.avgWords, after: selectedAfter.avgWords },
                            { label: 'Positivity', before: selectedBefore.positivity, after: selectedAfter.positivity, suffix: '%' },
                            { label: 'Scripture Rate', before: selectedBefore.scriptureRate, after: selectedAfter.scriptureRate, suffix: '/10k' },
                            { label: 'Story Rate', before: selectedBefore.storyRate, after: selectedAfter.storyRate, suffix: '/10k' },
                            { label: 'Question Rate', before: selectedBefore.questionRate, after: selectedAfter.questionRate, suffix: '/10k' },
                          ].map(m => {
                            const change = m.after - m.before;
                            const pct = m.before > 0 ? Math.round((change / m.before) * 100) : 0;
                            return (
                              <div key={m.label} className="flex justify-between">
                                <span className="text-[#524534]">{m.label}</span>
                                <span className="font-bold">
                                  {typeof m.after === 'number' ? (Number.isInteger(m.after) ? m.after.toLocaleString() : m.after) : m.after}{m.suffix || ''}
                                  <span className={`ml-1 text-xs ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                    ({change > 0 ? '+' : ''}{pct}%)
                                  </span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Timeline */}
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Talk Length Over Time</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={[...selectedData.beforeTalks, ...selectedData.afterTalks]
                          .sort((a, b) => a.year - b.year)
                          .map(t => ({ year: t.year, words: (t.talk || '').split(/\s+/).length }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" />
                          <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ background: '#fdf9e9', border: '1px solid #e5e0d5', borderRadius: 8, fontSize: 12 }} />
                          <ReferenceLine x={selectedData.majorTransition.year} stroke="#f5a623" strokeDasharray="5 5" label={{ value: 'Transition', fontSize: 10, fill: '#f5a623' }} />
                          <Line type="monotone" dataKey="words" stroke="#1B5E7B" strokeWidth={2} dot={{ r: 2 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Most Dramatic */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Most Dramatic Shifts</CardTitle>
              <CardDescription>Speakers whose style changed most after a calling change</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {dramaticShifts.map((s, i) => (
                  <div key={s.speaker}
                    className="flex items-center gap-3 py-2 border-b border-[#f2eede] cursor-pointer hover:bg-[#f8f4e4] rounded px-2"
                    onClick={() => setSelectedSpeaker(s.speaker)}>
                    <span className="text-sm font-bold text-[#1B5E7B] w-6">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.speaker}</p>
                      <p className="text-[10px] text-[#524534]">
                        {getCallingLabel(s.majorTransition.from)} &rarr; {getCallingLabel(s.majorTransition.to)} ({s.majorTransition.year})
                      </p>
                    </div>
                    <div className="text-right text-[10px] text-[#524534] hidden sm:block">
                      <div>{s.before.avgWords.toLocaleString()} &rarr; {s.after.avgWords.toLocaleString()} words</div>
                      <div>{s.before.positivity}% &rarr; {s.after.positivity}% positive</div>
                      <div>{s.before.scriptureRate} &rarr; {s.after.scriptureRate} scriptures</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-6">
              <p className="text-xs text-amber-800">
                <strong>Methodology:</strong> Calling transitions are detected by changes in the &quot;calling&quot; field across talks sorted chronologically.
                Metrics use keyword counting: positivity = positive/(positive+negative) keywords, scripture rate = chapter:verse patterns,
                stories = narrative markers. This shows correlation, not causation — changes may reflect evolving focus or broader church trends.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
