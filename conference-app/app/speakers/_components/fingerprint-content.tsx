'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { loadInsights, SpeakerFingerprintData, SpeakerFingerprint, SpeakerStyle } from '@/lib/insights';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

function FpSpeakerSearch({ speakers, value, onChange, placeholder }: {
  speakers: { name: string; detail: string }[]; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return speakers.slice(0, 50);
    const q = query.toLowerCase();
    return speakers.filter(s => s.name.toLowerCase().includes(q)).slice(0, 50);
  }, [speakers, query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#1c1c13]/30 text-lg">search</span>
        <input
          type="text"
          placeholder={placeholder}
          value={open ? query : (value || query)}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="w-full pl-10 pr-8 py-3 rounded-xl border border-[#ece8d9] bg-white text-sm focus:outline-none focus:border-[#1B5E7B] focus:ring-2 focus:ring-[#1B5E7B]/10"
        />
        {value && (
          <button onClick={() => { onChange(''); setQuery(''); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[#ece8d9]">
            <span className="material-symbols-outlined text-[#1c1c13]/40 text-base">close</span>
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-30 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-[#ece8d9] rounded-xl shadow-lg">
          {filtered.map(s => (
            <button key={s.name} onClick={() => { onChange(s.name); setQuery(''); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-[#f8f4e4] transition-colors flex justify-between ${s.name === value ? 'bg-[#1B5E7B]/10 font-bold text-[#1B5E7B]' : 'text-[#1c1c13]'}`}>
              <span>{s.name}</span>
              <span className="text-[#1c1c13]/30 text-xs">{s.detail}</span>
            </button>
          ))}
          {filtered.length >= 50 && (
            <p className="px-4 py-2 text-[10px] text-[#1c1c13]/40">Type more to narrow results...</p>
          )}
        </div>
      )}
    </div>
  );
}

const STYLE_LABELS: Record<string, string> = {
  avgSentenceLength: 'Sentence Length',
  questionRate: 'Questions',
  scriptureRate: 'Scriptures',
  storyRate: 'Stories',
  youRate: 'Direct Address',
  christRate: 'Christ References',
  exclamationRate: 'Exclamations',
};

const TOPIC_COLORS = [
  '#1B5E7B', '#f5a623', '#e74c3c', '#2ecc71', '#9b59b6',
  '#1abc9c', '#e67e22', '#3498db', '#e91e63', '#00bcd4',
  '#ff9800', '#4caf50', '#673ab7', '#009688', '#ff5722', '#607d8b',
];

function normalizeStyle(style: SpeakerStyle | Record<string, number>, globalStyle: SpeakerStyle | Record<string, number>) {
  const result: Record<string, number> = {};
  const s = style as Record<string, number>;
  const g = globalStyle as Record<string, number>;
  for (const key of Object.keys(STYLE_LABELS)) {
    const global = g[key] || 1;
    result[key] = Math.min(Math.round((s[key] / global) * 50), 100);
  }
  return result;
}

function RadarCard({ speaker, globalStyle, globalTopic }: {
  speaker: SpeakerFingerprint;
  globalStyle: SpeakerStyle | Record<string, number>;
  globalTopic: Record<string, number>;
}) {
  const normalized = normalizeStyle(speaker.style, globalStyle);
  const radarData = Object.entries(STYLE_LABELS).map(([key, label]) => ({
    metric: label,
    value: normalized[key],
    avg: 50,
  }));

  // Topic lean: top 6 topics by deviation from average
  const topicDeviation = Object.entries(speaker.topicProfile)
    .map(([topic, val]) => ({
      topic,
      value: val,
      global: globalTopic[topic] || 0,
      ratio: (globalTopic[topic] || 0) > 0 ? val / globalTopic[topic] : 0,
    }))
    .sort((a, b) => b.ratio - a.ratio);

  return (
    <div className="grid gap-4 md:gap-6 md:grid-cols-2">
      {/* Style Radar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Rhetorical Style</CardTitle>
          <CardDescription>vs. average speaker (50 = average)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e0d0" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9, fill: '#1c1c13' }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Average" dataKey="avg" stroke="#d4c9a8" fill="#d4c9a8" fillOpacity={0.15} strokeDasharray="4 4" />
              <Radar name={speaker.speaker.split(' ').pop()} dataKey="value" stroke="#1B5E7B" fill="#1B5E7B" fillOpacity={0.25} strokeWidth={2} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Topic Lean */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Topic Emphasis</CardTitle>
          <CardDescription>How much more (or less) than average</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {topicDeviation.slice(0, 8).map((t, i) => {
              const pct = Math.min(t.ratio * 50, 100);
              const isAbove = t.ratio > 1;
              return (
                <div key={t.topic}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="font-medium text-[#1c1c13]">{t.topic}</span>
                    <span className={isAbove ? 'text-[#1B5E7B] font-bold' : 'text-[#1c1c13]/40'}>
                      {t.ratio >= 1 ? '+' : ''}{Math.round((t.ratio - 1) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-[#f8f4e4] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: TOPIC_COLORS[i % TOPIC_COLORS.length],
                        opacity: isAbove ? 1 : 0.3,
                      }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#f5a623]/10">
              <div className="w-3 h-0.5 bg-[#d4c9a8]" style={{ borderTop: '1px dashed #d4c9a8' }} />
              <span className="text-[10px] text-[#1c1c13]/40">50% = conference average</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function FingerprintContent() {
  const [data, setData] = useState<SpeakerFingerprintData | null>(null);
  const [selectedSpeaker, setSelectedSpeaker] = useState('');
  const [compareSpeaker, setCompareSpeaker] = useState('');

  useEffect(() => {
    loadInsights().then(i => {
      const fp = i.speakerFingerprints;
      if (fp) {
        setData(fp);
        if (fp.speakers.length > 0) setSelectedSpeaker(fp.speakers[0].speaker);
      }
    });
  }, []);

  const speakerMap = useMemo(() => {
    if (!data) return new Map<string, SpeakerFingerprint>();
    return new Map(data.speakers.map(s => [s.speaker, s]));
  }, [data]);

  const selected = speakerMap.get(selectedSpeaker);
  const compared = speakerMap.get(compareSpeaker);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-[#524534]">Loading...</p>
      </div>
    );
  }

  const top15 = data.speakers.slice(0, 15).map(s => ({
    speaker: s.speaker,
    label: s.speaker.length > 20 ? s.speaker.substring(0, 18) + '...' : s.speaker,
    score: s.distinctivenessScore,
  }));

  return (
    <div className="px-3 md:px-8 lg:px-12 pt-4 md:pt-6 pb-12 md:pb-24 max-w-7xl">

      {/* Distinctiveness Leaderboard */}
      <Card className="mb-6 shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
        <CardHeader>
          <CardTitle>Most Distinctive Voices</CardTitle>
          <CardDescription>Speakers whose style deviates most from the conference average (speakers with 10+ talks)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={top15} layout="vertical" margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d0" />
              <XAxis type="number" domain={[0, 'auto']} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="label" width={80} tick={{ fontSize: 9 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const s = payload[0].payload;
                  const fp = speakerMap.get(s.speaker);
                  return (
                    <div className="bg-white border border-[#e5e0d0] rounded-lg p-3 shadow-lg text-sm max-w-xs">
                      <p className="font-bold text-[#1c1c13]">{s.speaker}</p>
                      <p className="text-[#1B5E7B] font-semibold">Distinctiveness: {s.score}</p>
                      {fp && (
                        <>
                          <p className="text-[#1c1c13]/60">{fp.talks} talks, {fp.totalWords.toLocaleString()} words</p>
                          <p className="text-[#1c1c13]/60">Top topic: {fp.topTopic} ({Math.round((fp.topTopicRatio - 1) * 100)}% above avg)</p>
                        </>
                      )}
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="score"
                fill="#1B5E7B"
                radius={[0, 6, 6, 0]}
                cursor="pointer"
                onClick={(d: any) => d && setSelectedSpeaker(d.speaker)}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Speaker Selector */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-[#1B5E7B] mb-4">Select Speakers</p>
        <div className="grid gap-3 md:grid-cols-2">
          <FpSpeakerSearch
            speakers={data.speakers.map(s => ({ name: s.speaker, detail: `${s.talks} talks, score: ${s.distinctivenessScore}` }))}
            value={selectedSpeaker}
            onChange={setSelectedSpeaker}
            placeholder="Search for a speaker..."
          />
          <FpSpeakerSearch
            speakers={data.speakers.filter(s => s.speaker !== selectedSpeaker).map(s => ({ name: s.speaker, detail: `${s.talks} talks` }))}
            value={compareSpeaker}
            onChange={setCompareSpeaker}
            placeholder="Compare with..."
          />
        </div>
      </div>

      {/* Selected Speaker Fingerprint */}
      {selected && (
        <div className="space-y-6">
          {/* Header Card */}
          <Card className="bg-white shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#1c1c13]">{selected.speaker}</h2>
                  <p className="text-sm text-[#1c1c13]/60">{selected.talks} talks &middot; {selected.totalWords.toLocaleString()} total words</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-extrabold text-[#1B5E7B]">{selected.distinctivenessScore}</div>
                  <div className="text-[10px] uppercase tracking-wider text-[#1c1c13]/40 font-bold">Distinctiveness</div>
                </div>
              </div>

              {/* Signature Phrases */}
              {selected.signaturePhrases.length > 0 && (
                <div className="mt-5 pt-5 border-t border-[#f5a623]/10">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#1c1c13]/40 mb-3">Signature Phrases</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.signaturePhrases.map(p => (
                      <span
                        key={p.phrase}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1B5E7B]/10 text-[#1B5E7B] text-xs font-medium"
                      >
                        &ldquo;{p.phrase}&rdquo;
                        <span className="text-[#f5a623] font-bold">{p.ratio}x</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick style highlights */}
              <div className="mt-5 pt-5 border-t border-[#f5a623]/10 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Avg Sentence', value: `${selected.style.avgSentenceLength} words`, compare: data.globalStyle.avgSentenceLength },
                  { label: 'Questions', value: `${selected.style.questionRate}/1k words`, compare: data.globalStyle.questionRate },
                  { label: 'Scriptures', value: `${selected.style.scriptureRate}/1k words`, compare: data.globalStyle.scriptureRate },
                  { label: 'Stories', value: `${selected.style.storyRate}/1k words`, compare: data.globalStyle.storyRate },
                ].map(m => (
                  <div key={m.label} className="text-center">
                    <div className="text-lg font-bold text-[#1c1c13]">{m.value}</div>
                    <div className="text-[10px] uppercase tracking-wider text-[#1c1c13]/40 font-bold">{m.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Radar + Topic Charts */}
          <RadarCard speaker={selected} globalStyle={data.globalStyle} globalTopic={data.globalTopicProfile} />

          {/* Compare Side-by-Side */}
          {compared && compared.speaker !== 'none' && (
            <>
              <div className="flex items-center gap-3 mt-8">
                <div className="h-px flex-1 bg-[#f5a623]/20" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#1c1c13]/40">Compared With</span>
                <div className="h-px flex-1 bg-[#f5a623]/20" />
              </div>

              <Card className="bg-white shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
                <CardContent className="pt-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-[#1c1c13]">{compared.speaker}</h2>
                      <p className="text-sm text-[#1c1c13]/60">{compared.talks} talks &middot; {compared.totalWords.toLocaleString()} total words</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-extrabold text-[#1B5E7B]">{compared.distinctivenessScore}</div>
                      <div className="text-[10px] uppercase tracking-wider text-[#1c1c13]/40 font-bold">Distinctiveness</div>
                    </div>
                  </div>
                  {compared.signaturePhrases.length > 0 && (
                    <div className="mt-5 pt-5 border-t border-[#f5a623]/10">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#1c1c13]/40 mb-3">Signature Phrases</p>
                      <div className="flex flex-wrap gap-2">
                        {compared.signaturePhrases.map(p => (
                          <span key={p.phrase} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f5a623]/10 text-[#835500] text-xs font-medium">
                            &ldquo;{p.phrase}&rdquo;
                            <span className="text-[#f5a623] font-bold">{p.ratio}x</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <RadarCard speaker={compared} globalStyle={data.globalStyle} globalTopic={data.globalTopicProfile} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
