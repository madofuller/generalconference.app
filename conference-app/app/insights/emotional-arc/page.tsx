'use client';

import { useState, useEffect, useMemo } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFilteredTalks } from '@/lib/filter-context';
import { Talk } from '@/lib/types';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// Text-based emotion detection using keyword clusters
const EMOTION_KEYWORDS: Record<string, string[]> = {
  Joy: ['joy', 'rejoice', 'glad', 'happy', 'happiness', 'delight', 'cheerful', 'jubilant', 'celebrate', 'blessed', 'wonderful', 'magnificent'],
  Love: ['love', 'charity', 'compassion', 'tender', 'beloved', 'cherish', 'affection', 'kindness', 'care', 'embrace', 'dear'],
  Hope: ['hope', 'optimism', 'promise', 'future', 'better days', 'bright', 'confidence', 'look forward', 'anticipate', 'expectation'],
  Reverence: ['sacred', 'holy', 'reverence', 'awe', 'solemn', 'worship', 'divine', 'majesty', 'glory', 'sanctify', 'hallowed'],
  Gratitude: ['grateful', 'thankful', 'gratitude', 'appreciate', 'thanks', 'thanksgiving', 'indebted', 'bless'],
  Sorrow: ['sorrow', 'grief', 'mourn', 'weep', 'tears', 'suffer', 'afflict', 'anguish', 'pain', 'heartbreak', 'trial', 'tribulation'],
  Warning: ['beware', 'warning', 'danger', 'peril', 'wicked', 'sin', 'temptation', 'adversary', 'satan', 'destroy', 'caution'],
  Urgency: ['must', 'urgent', 'now is the time', 'hasten', 'without delay', 'immediately', 'critical', 'vital', 'imperative'],
};

const EMOTION_COLORS: Record<string, string> = {
  Joy: '#FBBF24', Love: '#EC4899', Hope: '#10B981', Reverence: '#8B5CF6',
  Gratitude: '#34D399', Sorrow: '#6B7280', Warning: '#EF4444', Urgency: '#F97316',
};

interface ConferenceOption { label: string; season: string; year: number }

function getConferenceOptions(talks: Talk[]): ConferenceOption[] {
  const set = new Set<string>();
  const opts: ConferenceOption[] = [];
  talks.forEach(t => {
    const key = `${t.season} ${t.year}`;
    if (!set.has(key)) { set.add(key); opts.push({ label: key, season: t.season, year: t.year }); }
  });
  return opts.sort((a, b) => b.year - a.year || (b.season === 'October' ? 1 : -1));
}

function scoreText(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/).length;
  if (words === 0) return 0;
  let hits = 0;
  keywords.forEach(kw => {
    let idx = lower.indexOf(kw);
    while (idx !== -1) { hits++; idx = lower.indexOf(kw, idx + kw.length); }
  });
  return (hits / words) * 1000; // per 1000 words
}

function computeArc(talks: Talk[], season: string, year: number) {
  const confTalks = talks.filter(t => t.season === season && t.year === year);

  const arcData = confTalks.map((t, i) => {
    const text = t.talk || '';
    const scores: Record<string, number> = {};
    Object.entries(EMOTION_KEYWORDS).forEach(([emotion, keywords]) => {
      scores[emotion] = Math.round(scoreText(text, keywords) * 100) / 100;
    });

    const dominant = Object.entries(scores).reduce((best, [e, s]) => s > best[1] ? [e, s] as [string, number] : best, ['', 0]);

    return {
      index: i,
      speaker: t.speaker.split(' ').pop() || t.speaker,
      fullSpeaker: t.speaker,
      title: t.title,
      dominantEmotion: dominant[0] || 'neutral',
      ...scores,
    };
  });

  // Dominant across conference
  const emotionTotals: Record<string, number> = {};
  arcData.forEach(d => {
    Object.keys(EMOTION_KEYWORDS).forEach(e => {
      emotionTotals[e] = (emotionTotals[e] || 0) + ((d as unknown as Record<string, number>)[e] || 0);
    });
  });
  const dominant = Object.entries(emotionTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

  // Most emotional talk
  const mostEmotional = arcData.reduce((best, d) => {
    const total = Object.keys(EMOTION_KEYWORDS).reduce((s, e) => s + ((d as unknown as Record<string, number>)[e] || 0), 0);
    const bestTotal = Object.keys(EMOTION_KEYWORDS).reduce((s, e) => s + ((best as unknown as Record<string, number>)[e] || 0), 0);
    return total > bestTotal ? d : best;
  }, arcData[0]);

  return { arcData, dominant, mostEmotional, talkCount: confTalks.length };
}

export default function EmotionalArcPage() {
  const { talks, loading } = useFilteredTalks();
  const [conf1, setConf1] = useState('');
  const [conf2, setConf2] = useState('');
  const [compareMode, setCompareMode] = useState(false);

  const options = useMemo(() => getConferenceOptions(talks), [talks]);
  useEffect(() => { if (options.length > 0 && !conf1) setConf1(options[0].label); }, [options, conf1]);

  const parsed1 = useMemo(() => {
    const opt = options.find(o => o.label === conf1);
    return opt ? computeArc(talks, opt.season, opt.year) : null;
  }, [talks, conf1, options]);

  const parsed2 = useMemo(() => {
    if (!compareMode) return null;
    const opt = options.find(o => o.label === conf2);
    return opt ? computeArc(talks, opt.season, opt.year) : null;
  }, [talks, conf2, compareMode, options]);

  if (loading) {
    return (
      <div className="flex min-h-screen"><Navigation />
        <main className="ml-0 lg:ml-[260px] flex-1 flex items-center justify-center"><p className="text-[#524534]">Loading...</p></main>
      </div>
    );
  }

  const renderArc = (data: ReturnType<typeof computeArc>, label: string) => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-[#1B5E7B]">{data.talkCount}</p>
          <p className="text-xs text-[#524534]">Talks</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-lg font-bold capitalize" style={{ color: EMOTION_COLORS[data.dominant] || '#1B5E7B' }}>{data.dominant}</p>
          <p className="text-xs text-[#524534]">Dominant Tone</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-sm font-bold text-[#1B5E7B] truncate">{data.mostEmotional?.fullSpeaker}</p>
          <p className="text-xs text-[#524534]">Most Emotional Talk</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-lg font-bold text-[#f5a623]">{label}</p>
          <p className="text-xs text-[#524534]">Conference</p>
        </CardContent></Card>
      </div>

      {/* Stacked Area */}
      <Card>
        <CardHeader><CardTitle className="text-base">Emotional Flow</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data.arcData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" />
              <XAxis dataKey="speaker" tick={{ fontSize: 9 }} interval={Math.max(0, Math.floor(data.arcData.length / 12))} />
              <YAxis tick={{ fontSize: 10 }} label={{ value: 'per 1k words', angle: -90, position: 'insideLeft', fontSize: 9, fill: '#524534' }} />
              <Tooltip
                contentStyle={{ background: '#fdf9e9', border: '1px solid #e5e0d5', borderRadius: 8, fontSize: 12 }}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullSpeaker || ''}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {Object.entries(EMOTION_COLORS).map(([emotion, color]) => (
                <Area key={emotion} type="monotone" dataKey={emotion} stackId="1" stroke={color} fill={color} fillOpacity={0.5} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Individual Lines */}
      <Card>
        <CardHeader><CardTitle className="text-base">Individual Emotion Tracks</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.arcData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" />
              <XAxis dataKey="speaker" tick={{ fontSize: 9 }} interval={Math.max(0, Math.floor(data.arcData.length / 12))} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#fdf9e9', border: '1px solid #e5e0d5', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {Object.entries(EMOTION_COLORS).map(([emotion, color]) => (
                <Line key={emotion} type="monotone" dataKey={emotion} stroke={color} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Talk List */}
      <Card>
        <CardHeader><CardTitle className="text-base">Talk-by-Talk</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {data.arcData.map((d, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 border-b border-[#f2eede] last:border-0">
                <span className="text-xs text-[#524534] w-6 text-right">{i + 1}</span>
                <span className="text-sm font-medium text-[#1c1c13] flex-1 truncate">{d.fullSpeaker}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold capitalize"
                  style={{ background: (EMOTION_COLORS[d.dominantEmotion] || '#999') + '20', color: EMOTION_COLORS[d.dominantEmotion] || '#999' }}>
                  {d.dominantEmotion}
                </span>
                <div className="flex gap-0.5 w-28">
                  {Object.keys(EMOTION_KEYWORDS).map(e => {
                    const val = (d as unknown as Record<string, number>)[e] || 0;
                    return <div key={e} className="h-3 rounded-sm" style={{ width: `${Math.max(1, val * 3)}px`, background: EMOTION_COLORS[e] }} title={`${e}: ${val.toFixed(1)}`} />;
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1">
        <TopAppBar title="Emotional Arc of Conference" subtitle="How emotions flow across a conference weekend" />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24 max-w-7xl">
          <Card className="mb-6 border-violet-200 bg-violet-50/50">
            <CardContent className="pt-6">
              <p className="text-lg font-medium text-violet-900">
                Every conference weekend has an emotional shape. Does it start somber and build to hope? Where are the emotional peaks?
              </p>
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Select value={conf1} onValueChange={setConf1}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Select conference" /></SelectTrigger>
              <SelectContent>{options.map(o => <SelectItem key={o.label} value={o.label}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
            <button onClick={() => setCompareMode(!compareMode)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${compareMode ? 'bg-[#f5a623] text-white' : 'bg-[#f8f4e4] text-[#524534] hover:bg-[#f5a623]/20'}`}>
              {compareMode ? 'Single View' : 'Compare Two'}
            </button>
            {compareMode && (
              <Select value={conf2} onValueChange={setConf2}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Compare with..." /></SelectTrigger>
                <SelectContent>{options.filter(o => o.label !== conf1).map(o => <SelectItem key={o.label} value={o.label}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            )}
          </div>

          {!compareMode && parsed1 && renderArc(parsed1, conf1)}
          {compareMode && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div>{parsed1 && renderArc(parsed1, conf1)}</div>
              <div>{parsed2 ? renderArc(parsed2, conf2) : <p className="text-[#524534] text-center mt-12">Select a second conference</p>}</div>
            </div>
          )}

          <Card className="mt-8 border-amber-200 bg-amber-50/50">
            <CardContent className="pt-6">
              <p className="text-xs text-amber-800">
                <strong>Methodology:</strong> Emotions are detected by counting keyword hits in each talk&apos;s text (e.g., &quot;rejoice,&quot; &quot;sorrow,&quot; &quot;beware&quot;),
                normalized per 1,000 words. This is a heuristic — context and tone are not captured. Talk order matches dataset appearance.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
