'use client';

import { useState, useMemo, useEffect } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFilteredFullTalks } from '@/lib/filter-context';
import { Talk, LIVING_APOSTLES, LIVING_SPEAKERS, PRESIDENTS_OF_THE_CHURCH } from '@/lib/types';
import { loadInsights, SpeakerFingerprintData } from '@/lib/insights';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Legend,
} from 'recharts';

const DIMENSIONS = [
  'Sentence Length', 'Questions', 'Scriptures',
  'Stories', 'Direct Address', 'Christ References', 'Exclamations',
] as const;

const STORY_MARKERS = ['i remember', 'story', 'when i was', 'my father', 'my mother', 'one day', 'years ago', 'let me share', 'i recall', 'i was reminded'];
const DIRECT_ADDRESS_WORDS = [' you ', ' your ', ' yours ', ' yourself ', ' yourselves '];
const CHRIST_WORDS = ['jesus', 'christ', 'savior', 'redeemer', 'lord'];
const TOPIC_COLORS = [
  '#1B5E7B', '#f5a623', '#e74c3c', '#2ecc71', '#9b59b6',
  '#1abc9c', '#e67e22', '#3498db',
];

interface SpeakerDNA {
  speaker: string;
  talkCount: number;
  firstYear: number;
  lastYear: number;
  calling: string;
  raw: Record<string, number>;
  normalized: Record<string, number>;
  uniqueness: number;
  isLiving: boolean;
  isApostle: boolean;
  isProphet: boolean;
}

function countKeywords(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce((sum, kw) => {
    let count = 0; let idx = lower.indexOf(kw);
    while (idx !== -1) { count++; idx = lower.indexOf(kw, idx + kw.length); }
    return sum + count;
  }, 0);
}

function computeAllDNA(talks: Talk[]): SpeakerDNA[] {
  const bySpeaker = new Map<string, Talk[]>();
  talks.forEach(t => {
    if (!bySpeaker.has(t.speaker)) bySpeaker.set(t.speaker, []);
    bySpeaker.get(t.speaker)!.push(t);
  });

  const rawData: { speaker: string; talkCount: number; firstYear: number; lastYear: number; calling: string; raw: Record<string, number> }[] = [];

  bySpeaker.forEach((speakerTalks, speaker) => {
    const raw: Record<string, number> = {};
    const allText = speakerTalks.map(t => t.talk || '').join(' ');
    const totalWords = allText.split(/\s+/).length;

    // 1. Sentence Length
    const sentences = allText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    raw['Sentence Length'] = sentences.length > 0 ? sentences.reduce((s, sent) => s + sent.trim().split(/\s+/).length, 0) / sentences.length : 0;

    // 2. Questions
    const questionMarks = (allText.match(/\?/g) || []).length;
    raw['Questions'] = totalWords > 0 ? (questionMarks / totalWords) * 1000 : 0;

    // 3. Scriptures
    const scriptureMatches = (allText.match(/\d+:\d+/g) || []).length;
    raw['Scriptures'] = totalWords > 0 ? (scriptureMatches / totalWords) * 1000 : 0;

    // 4. Stories
    const storyHits = countKeywords(allText, STORY_MARKERS);
    raw['Stories'] = totalWords > 0 ? (storyHits / totalWords) * 1000 : 0;

    // 5. Direct Address ("you/your" language)
    raw['Direct Address'] = totalWords > 0 ? (countKeywords(` ${allText.toLowerCase()} `, DIRECT_ADDRESS_WORDS) / totalWords) * 1000 : 0;

    // 6. Christ References
    raw['Christ References'] = totalWords > 0 ? (countKeywords(allText, CHRIST_WORDS) / totalWords) * 1000 : 0;

    // 7. Exclamations
    const exclamations = (allText.match(/!/g) || []).length;
    raw['Exclamations'] = totalWords > 0 ? (exclamations / totalWords) * 1000 : 0;

    const years = speakerTalks.map(t => t.year);
    const lastCalling = speakerTalks.sort((a, b) => b.year - a.year)[0]?.calling || '';

    rawData.push({
      speaker, talkCount: speakerTalks.length,
      firstYear: Math.min(...years), lastYear: Math.max(...years),
      calling: lastCalling, raw,
    });
  });

  // Normalize
  const mins: Record<string, number> = {};
  const maxs: Record<string, number> = {};
  DIMENSIONS.forEach(dim => {
    const vals = rawData.map(d => d.raw[dim] || 0);
    mins[dim] = Math.min(...vals);
    maxs[dim] = Math.max(...vals);
  });

  return rawData.map(d => {
    const normalized: Record<string, number> = {};
    DIMENSIONS.forEach(dim => {
      const range = maxs[dim] - mins[dim];
      normalized[dim] = range > 0 ? Math.round(((d.raw[dim] - mins[dim]) / range) * 100) : 50;
    });
    const uniqueness = DIMENSIONS.reduce((s, dim) => s + (normalized[dim] - 50) ** 2, 0);

    return {
      ...d, normalized, uniqueness,
      isLiving: LIVING_SPEAKERS.has(d.speaker),
      isApostle: LIVING_APOSTLES.includes(d.speaker),
      isProphet: PRESIDENTS_OF_THE_CHURCH.includes(d.speaker),
    };
  }).sort((a, b) => b.talkCount - a.talkCount);
}

function computePeriodDNA(speakerTalks: Talk[], period: 'all' | 'early' | 'late'): Record<string, number> | null {
  if (speakerTalks.length < 4) return null;
  const sorted = [...speakerTalks].sort((a, b) => a.year - b.year);
  const mid = Math.floor(sorted.length / 2);
  const subset = period === 'early' ? sorted.slice(0, mid) : period === 'late' ? sorted.slice(mid) : sorted;
  if (subset.length === 0) return null;

  const allText = subset.map(t => t.talk || '').join(' ');
  const totalWords = allText.split(/\s+/).length;
  if (totalWords < 100) return null;

  const sentences = allText.split(/[.!?]+/).filter(s => s.trim().length > 0);

  return {
    'Sentence Length': sentences.length > 0 ? sentences.reduce((s, sent) => s + sent.trim().split(/\s+/).length, 0) / sentences.length : 0,
    'Questions': ((allText.match(/\?/g) || []).length / totalWords) * 1000,
    'Scriptures': (allText.match(/\d+:\d+/g) || []).length / totalWords * 1000,
    'Stories': countKeywords(allText, STORY_MARKERS) / totalWords * 1000,
    'Direct Address': countKeywords(` ${allText.toLowerCase()} `, DIRECT_ADDRESS_WORDS) / totalWords * 1000,
    'Christ References': countKeywords(allText, CHRIST_WORDS) / totalWords * 1000,
    'Exclamations': ((allText.match(/!/g) || []).length / totalWords) * 1000,
  };
}

type SortMode = 'talks' | 'living' | 'apostles' | 'prophets' | 'unique' | 'recent';

export default function TalkDNAPage() {
  const { talks, loading } = useFilteredFullTalks();
  const [fpData, setFpData] = useState<SpeakerFingerprintData | null>(null);
  const [view, setView] = useState<'gallery' | 'detail' | 'compare' | 'ranking' | 'evolution'>('gallery');
  const [selected, setSelected] = useState('');
  const [compare, setCompare] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('talks');

  useEffect(() => {
    loadInsights().then(i => setFpData(i.speakerFingerprints || null));
  }, []);

  const dna = useMemo(() => computeAllDNA(talks), [talks]);
  const fpMap = useMemo(() => {
    if (!fpData) return new Map();
    return new Map(fpData.speakers.map(s => [s.speaker, s]));
  }, [fpData]);

  const sortedDNA = useMemo(() => {
    const list = [...dna];
    switch (sortMode) {
      case 'living': return list.filter(d => d.isLiving).sort((a, b) => b.talkCount - a.talkCount);
      case 'apostles': return list.filter(d => d.isApostle).sort((a, b) => b.talkCount - a.talkCount);
      case 'prophets': return list.filter(d => d.isProphet).sort((a, b) => b.talkCount - a.talkCount);
      case 'unique': return list.sort((a, b) => b.uniqueness - a.uniqueness);
      case 'recent': return list.sort((a, b) => b.lastYear - a.lastYear);
      default: return list.sort((a, b) => b.talkCount - a.talkCount);
    }
  }, [dna, sortMode]);

  const selectedDNA = dna.find(d => d.speaker === selected);
  const compareDNA = dna.find(d => d.speaker === compare);
  const selectedFp = selected ? fpMap.get(selected) : null;
  const ranked = useMemo(() => [...dna].sort((a, b) => b.uniqueness - a.uniqueness), [dna]);

  // Career evolution data
  const speakerTalks = useMemo(() => selected ? talks.filter(t => t.speaker === selected) : [], [talks, selected]);
  const earlyDNA = useMemo(() => computePeriodDNA(speakerTalks, 'early'), [speakerTalks]);
  const lateDNA = useMemo(() => computePeriodDNA(speakerTalks, 'late'), [speakerTalks]);

  if (loading) {
    return (
      <div className="flex min-h-screen"><Navigation />
        <main className="ml-0 lg:ml-[260px] flex-1 flex items-center justify-center"><p className="text-[#524534]">Loading...</p></main>
      </div>
    );
  }

  const RadarFP = ({ data, color = '#1B5E7B', compData, compColor = '#f5a623', size = 250 }: {
    data: Record<string, number>; color?: string; compData?: Record<string, number> | null; compColor?: string; size?: number
  }) => {
    const radarData = DIMENSIONS.map(dim => ({
      dim: dim.length > 12 ? dim.replace(' ', '\n') : dim,
      value: data[dim] || 0,
      ...(compData ? { comp: compData[dim] || 0 } : {}),
    }));
    return (
      <ResponsiveContainer width="100%" height={size}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="#e5e0d5" />
          <PolarAngleAxis dataKey="dim" tick={{ fontSize: 8, fill: '#524534' }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 7 }} />
          <Radar dataKey="value" stroke={color} fill={color} fillOpacity={0.25} strokeWidth={2} />
          {compData && <Radar dataKey="comp" stroke={compColor} fill={compColor} fillOpacity={0.15} strokeWidth={2} />}
        </RadarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1 pt-20 lg:pt-0">
        <TopAppBar title="Talk DNA Fingerprints" subtitle="The unique signature of every speaker" />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24 max-w-7xl">

          <Card className="mb-4 md:mb-6 border-violet-200 bg-violet-50/50 overflow-hidden">
            <CardContent className="pt-4 md:pt-6">
              <p className="text-sm md:text-lg font-medium text-violet-900">
                Every speaker has a unique &quot;fingerprint&quot; across 7 dimensions. Browse the gallery, compare speakers, and see how fingerprints evolve over a career.
              </p>
            </CardContent>
          </Card>

          {/* View Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(['gallery', 'detail', 'compare', 'evolution', 'ranking'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${view === v ? 'bg-[#1B5E7B] text-white' : 'bg-[#f8f4e4] text-[#524534] hover:bg-[#1B5E7B]/10'}`}>
                {v === 'gallery' ? 'Gallery' : v === 'detail' ? 'Detail' : v === 'compare' ? 'Compare' : v === 'evolution' ? 'Career Evolution' : 'Most Unique'}
              </button>
            ))}
          </div>

          {/* Gallery */}
          {view === 'gallery' && (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                {([
                  ['talks', 'Most Talks'], ['living', 'Living'], ['apostles', 'Apostles'],
                  ['prophets', 'Prophets'], ['unique', 'Most Unique'], ['recent', 'Most Recent'],
                ] as [SortMode, string][]).map(([key, label]) => (
                  <button key={key} onClick={() => setSortMode(key)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${sortMode === key ? 'bg-[#f5a623] text-white' : 'bg-[#f8f4e4] text-[#524534] hover:bg-[#f5a623]/20'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {sortedDNA.slice(0, 30).map(d => (
                  <Card key={d.speaker} className="cursor-pointer hover:shadow-md transition-all"
                    onClick={() => { setSelected(d.speaker); setView('detail'); }}>
                    <CardContent className="pt-3 pb-2 px-2">
                      <RadarFP data={d.normalized} size={140} />
                      <p className="text-[10px] font-bold text-center text-[#1c1c13] truncate">{d.speaker}</p>
                      <p className="text-[9px] text-center text-[#524534]">{d.talkCount} talks &middot; {d.firstYear}&ndash;{d.lastYear}</p>
                      {d.isApostle && <p className="text-[8px] text-center text-[#f5a623] font-bold">Apostle</p>}
                      {d.isProphet && <p className="text-[8px] text-center text-amber-600 font-bold">Prophet</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Detail */}
          {view === 'detail' && (
            <div>
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger className="w-full md:w-80 mb-4"><SelectValue placeholder="Select a speaker..." /></SelectTrigger>
                <SelectContent>{dna.map(d => <SelectItem key={d.speaker} value={d.speaker}>{d.speaker} ({d.talkCount} talks)</SelectItem>)}</SelectContent>
              </Select>
              {selectedDNA && (
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{selectedDNA.speaker}</CardTitle>
                      <CardDescription>{selectedDNA.talkCount} talks &middot; {selectedDNA.firstYear}&ndash;{selectedDNA.lastYear} &middot; {selectedDNA.calling}</CardDescription>
                    </CardHeader>
                    <CardContent><RadarFP data={selectedDNA.normalized} size={300} /></CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-base">Dimension Breakdown</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {DIMENSIONS.map(dim => {
                          const val = selectedDNA.normalized[dim];
                          return (
                            <div key={dim}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-[#524534]">{dim}</span>
                                <span className="font-bold text-[#1B5E7B]">{val}</span>
                              </div>
                              <div className="h-2 bg-[#f2eede] rounded-full relative">
                                <div className="h-full rounded-full bg-[#1B5E7B]" style={{ width: `${val}%` }} />
                                <div className="absolute top-0 h-full w-0.5 bg-[#f5a623]" style={{ left: '50%' }} title="Average" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 p-3 bg-[#f8f4e4] rounded-lg text-xs text-[#524534]">
                        <p><strong>Most distinctive:</strong> {DIMENSIONS.reduce((best, dim) => Math.abs(selectedDNA.normalized[dim] - 50) > Math.abs(selectedDNA.normalized[best] - 50) ? dim : best, DIMENSIONS[0])}</p>
                        <p className="mt-1"><strong>Uniqueness rank:</strong> #{ranked.findIndex(r => r.speaker === selectedDNA.speaker) + 1} of {ranked.length}</p>
                      </div>

                      {selectedFp && selectedFp.signaturePhrases.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-[#f5a623]/10">
                          <p className="text-xs font-bold uppercase tracking-wider text-[#1c1c13]/40 mb-2">Signature Phrases</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedFp.signaturePhrases.slice(0, 6).map((p: { phrase: string; ratio: number }) => (
                              <span key={p.phrase} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1B5E7B]/10 text-[#1B5E7B] text-[11px] font-medium">
                                &ldquo;{p.phrase}&rdquo;
                                <span className="text-[#f5a623] font-bold">{p.ratio}x</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedFp && (
                        <div className="mt-4 pt-4 border-t border-[#f5a623]/10">
                          <p className="text-xs font-bold uppercase tracking-wider text-[#1c1c13]/40 mb-2">Topic Emphasis</p>
                          <div className="space-y-2">
                            {Object.entries(selectedFp.topicProfile)
                              .map(([topic, value]) => ({ topic, value: value as number, global: (fpData?.globalTopicProfile?.[topic] || 0) as number }))
                              .filter(t => t.global > 0)
                              .map(t => ({ ...t, ratio: t.value / t.global }))
                              .sort((a, b) => b.ratio - a.ratio)
                              .slice(0, 5)
                              .map((t, i) => {
                                const pct = Math.min(t.ratio * 50, 100);
                                const delta = Math.round((t.ratio - 1) * 100);
                                return (
                                  <div key={t.topic}>
                                    <div className="flex justify-between text-[11px] mb-0.5">
                                      <span className="font-medium text-[#1c1c13]">{t.topic}</span>
                                      <span className="text-[#1B5E7B] font-bold">{delta >= 0 ? '+' : ''}{delta}%</span>
                                    </div>
                                    <div className="h-1.5 bg-[#f8f4e4] rounded-full overflow-hidden">
                                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: TOPIC_COLORS[i % TOPIC_COLORS.length] }} />
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* Compare */}
          {view === 'compare' && (
            <div>
              <div className="flex flex-wrap gap-3 mb-4">
                <Select value={selected} onValueChange={setSelected}>
                  <SelectTrigger className="w-64"><SelectValue placeholder="Speaker 1..." /></SelectTrigger>
                  <SelectContent>{dna.map(d => <SelectItem key={d.speaker} value={d.speaker}>{d.speaker}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={compare} onValueChange={setCompare}>
                  <SelectTrigger className="w-64"><SelectValue placeholder="Speaker 2..." /></SelectTrigger>
                  <SelectContent>{dna.filter(d => d.speaker !== selected).map(d => <SelectItem key={d.speaker} value={d.speaker}>{d.speaker}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {selectedDNA && compareDNA && (
                <Card>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={400}>
                      <RadarChart data={DIMENSIONS.map(dim => ({
                        dim, [selectedDNA.speaker.split(' ').slice(-1)[0]]: selectedDNA.normalized[dim],
                        [compareDNA.speaker.split(' ').slice(-1)[0]]: compareDNA.normalized[dim],
                      }))}>
                        <PolarGrid stroke="#e5e0d5" />
                        <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10, fill: '#524534' }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 8 }} />
                        <Radar name={selectedDNA.speaker} dataKey={selectedDNA.speaker.split(' ').slice(-1)[0]} stroke="#1B5E7B" fill="#1B5E7B" fillOpacity={0.2} strokeWidth={2} />
                        <Radar name={compareDNA.speaker} dataKey={compareDNA.speaker.split(' ').slice(-1)[0]} stroke="#f5a623" fill="#f5a623" fillOpacity={0.2} strokeWidth={2} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Career Evolution */}
          {view === 'evolution' && (
            <div>
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger className="w-full md:w-80 mb-4"><SelectValue placeholder="Select a speaker..." /></SelectTrigger>
                <SelectContent>{dna.filter(d => d.talkCount >= 10).map(d => <SelectItem key={d.speaker} value={d.speaker}>{d.speaker} ({d.talkCount} talks)</SelectItem>)}</SelectContent>
              </Select>
              {selectedDNA && earlyDNA && lateDNA && (
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-[#1B5E7B]">Early Career</CardTitle>
                      <CardDescription>First half of talks ({selectedDNA.firstYear}&ndash;{Math.round((selectedDNA.firstYear + selectedDNA.lastYear) / 2)})</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RadarFP data={Object.fromEntries(DIMENSIONS.map(d => {
                        const range = (Math.max(...dna.map(s => s.raw[d])) - Math.min(...dna.map(s => s.raw[d]))) || 1;
                        const min = Math.min(...dna.map(s => s.raw[d]));
                        return [d, Math.round(((earlyDNA[d] - min) / range) * 100)];
                      }))} size={280} />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-[#f5a623]">Late Career</CardTitle>
                      <CardDescription>Second half of talks ({Math.round((selectedDNA.firstYear + selectedDNA.lastYear) / 2)}&ndash;{selectedDNA.lastYear})</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RadarFP data={Object.fromEntries(DIMENSIONS.map(d => {
                        const range = (Math.max(...dna.map(s => s.raw[d])) - Math.min(...dna.map(s => s.raw[d]))) || 1;
                        const min = Math.min(...dna.map(s => s.raw[d]));
                        return [d, Math.round(((lateDNA[d] - min) / range) * 100)];
                      }))} color="#f5a623" size={280} />
                    </CardContent>
                  </Card>
                </div>
              )}
              {selected && (!earlyDNA || !lateDNA) && (
                <p className="text-sm text-[#524534] text-center py-8">Need at least 10 talks for career evolution. Select a speaker with more talks.</p>
              )}
            </div>
          )}

          {/* Ranking */}
          {view === 'ranking' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Most Unique Speakers</CardTitle>
                <CardDescription>Ranked by deviation from average across all dimensions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {ranked.slice(0, 30).map((d, i) => (
                    <div key={d.speaker}
                      className="flex items-center gap-3 py-2 border-b border-[#f2eede] cursor-pointer hover:bg-[#f8f4e4] rounded px-2"
                      onClick={() => { setSelected(d.speaker); setView('detail'); }}>
                      <span className="text-sm font-bold text-[#1B5E7B] w-6">{i + 1}</span>
                      <div className="w-16 h-16 shrink-0"><RadarFP data={d.normalized} size={64} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1c1c13] truncate">{d.speaker}</p>
                        <p className="text-[10px] text-[#524534]">
                          {d.talkCount} talks &middot; {d.firstYear}&ndash;{d.lastYear}
                          {d.isApostle && ' · Apostle'}{d.isProphet && ' · Prophet'}
                        </p>
                      </div>
                      <div className="hidden md:flex gap-1">
                        {DIMENSIONS.map(dim => (
                          <div key={dim} className="w-2 h-8 rounded-sm"
                            style={{ background: `rgba(27,94,123,${d.normalized[dim] / 100})` }}
                            title={`${dim}: ${d.normalized[dim]}`} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mt-8 border-amber-200 bg-amber-50/50">
            <CardContent className="pt-6">
              <p className="text-xs text-amber-800">
                <strong>Methodology:</strong> Seven dimensions computed from talk text: sentence length (average words per sentence), questions (question marks per 1000 words),
                scriptures (chapter:verse references per 1000 words), stories (narrative markers per 1000 words), direct address (&quot;you/your&quot; language per 1000 words),
                Christ references (Jesus/Christ terms per 1000 words), and exclamations (exclamation marks per 1000 words).
                All normalized 0-100 across all speakers in the loaded talk set.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
