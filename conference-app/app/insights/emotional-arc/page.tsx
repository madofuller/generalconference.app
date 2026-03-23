'use client';

import { useState, useEffect, useMemo } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { useFilteredFullTalks } from '@/lib/filter-context';
import { Talk } from '@/lib/types';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const EMOTION_KEYWORDS: Record<string, string[]> = {
  Joy: ['joy', 'rejoice', 'glad', 'happy', 'happiness', 'delight', 'cheerful', 'celebrate', 'blessed', 'wonderful'],
  Love: ['love', 'charity', 'compassion', 'tender', 'beloved', 'cherish', 'affection', 'kindness', 'care', 'embrace'],
  Hope: ['hope', 'optimism', 'promise', 'future', 'better days', 'bright', 'confidence', 'look forward', 'anticipate'],
  Reverence: ['sacred', 'holy', 'reverence', 'awe', 'solemn', 'worship', 'divine', 'majesty', 'glory', 'sanctify'],
  Gratitude: ['grateful', 'thankful', 'gratitude', 'appreciate', 'thanks', 'thanksgiving', 'bless'],
  Sorrow: ['sorrow', 'grief', 'mourn', 'weep', 'tears', 'suffer', 'afflict', 'anguish', 'pain', 'trial', 'tribulation'],
  Warning: ['beware', 'warning', 'danger', 'peril', 'wicked', 'sin', 'temptation', 'adversary', 'satan', 'destroy'],
  Urgency: ['must', 'urgent', 'now is the time', 'hasten', 'without delay', 'immediately', 'critical', 'imperative'],
};

const EMOTION_COLORS: Record<string, string> = {
  Joy: '#FBBF24', Love: '#EC4899', Hope: '#10B981', Reverence: '#8B5CF6',
  Gratitude: '#34D399', Sorrow: '#6B7280', Warning: '#EF4444', Urgency: '#F97316',
};

type SpeakerFilter = 'prophets-apostles' | 'all';

const FP_Q12_PATTERN = /president of the church|first presidency|quorum of the twelve|council of the twelve/i;

function isFPorQ12(calling: string): boolean {
  return FP_Q12_PATTERN.test(calling);
}

interface ConferenceOption { label: string; season: string; year: number }

function getConferenceOptions(talks: Talk[]): ConferenceOption[] {
  const set = new Set<string>();
  const opts: ConferenceOption[] = [];
  talks.forEach(t => {
    const key = `${t.season} ${t.year}`;
    if (!set.has(key) && t.talk && t.talk.length > 100) { set.add(key); opts.push({ label: key, season: t.season, year: t.year }); }
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
  return (hits / words) * 1000;
}

/** Build the leadership roster for a conference from all prior talk data */
function buildLeadershipRoster(allTalks: Talk[], season: string, year: number) {
  // Get all talks from this conference
  const confTalks = allTalks.filter(t => t.season === season && t.year === year);
  const spokeName = new Set(confTalks.map(t => t.speaker));

  // Find all speakers who had an FP/Q12 calling at or before this conference
  // Use the most recent calling for each speaker up to this conference
  const leaderMap = new Map<string, { calling: string; firstSeen: number }>();
  allTalks
    .filter(t => t.year < year || (t.year === year && (t.season === 'April' || t.season === season)))
    .filter(t => isFPorQ12(t.calling || ''))
    .forEach(t => {
      const existing = leaderMap.get(t.speaker);
      if (!existing || t.year > existing.firstSeen || (t.year === existing.firstSeen)) {
        leaderMap.set(t.speaker, { calling: t.calling || '', firstSeen: existing ? Math.min(existing.firstSeen, t.year) : t.year });
      }
    });

  // Also include anyone at THIS conference with FP/Q12 calling
  confTalks.filter(t => isFPorQ12(t.calling || '')).forEach(t => {
    const existing = leaderMap.get(t.speaker);
    if (!existing) {
      leaderMap.set(t.speaker, { calling: t.calling || '', firstSeen: t.year });
    } else {
      leaderMap.set(t.speaker, { calling: t.calling || '', firstSeen: existing.firstSeen });
    }
  });

  // Filter out people who died/were released before this conference
  // Use a tight heuristic: if they didn't speak at this conference AND their last talk
  // was more than 2 years before, they're likely deceased or released.
  // Also count how many consecutive conferences they've missed.
  const activeLeaders: { name: string; calling: string; firstSeen: number; spoke: boolean }[] = [];
  leaderMap.forEach(({ calling, firstSeen }, name) => {
    const speakerTalks = allTalks.filter(t => t.speaker === name);
    const lastTalkYear = Math.max(...speakerTalks.map(t => t.year));
    const spoke = spokeName.has(name);

    // If they spoke at this conference, definitely include
    if (spoke) {
      activeLeaders.push({ name, calling, firstSeen, spoke: true });
      return;
    }

    // If their last talk was more than 2 years before this conference, exclude
    if (lastTalkYear < year - 2) return;

    // If they missed more than 3 consecutive conference sessions, exclude
    const recentConferences = new Set<string>();
    for (let y = year - 2; y <= year; y++) {
      recentConferences.add(`April-${y}`);
      recentConferences.add(`October-${y}`);
    }
    const spokeRecently = speakerTalks.some(t =>
      recentConferences.has(`${t.season}-${t.year}`) && t.year >= year - 1
    );
    if (!spokeRecently && lastTalkYear < year) return;

    activeLeaders.push({ name, calling, firstSeen, spoke: false });
  });

  // Sort by seniority (firstSeen = first time they appeared with FP/Q12 calling)
  activeLeaders.sort((a, b) => {
    // President first
    const aIsPresident = a.calling.toLowerCase().includes('president of the church');
    const bIsPresident = b.calling.toLowerCase().includes('president of the church');
    if (aIsPresident && !bIsPresident) return -1;
    if (bIsPresident && !aIsPresident) return 1;
    // First Presidency before Quorum
    const aIsFP = a.calling.toLowerCase().includes('first presidency');
    const bIsFP = b.calling.toLowerCase().includes('first presidency');
    if (aIsFP && !bIsFP) return -1;
    if (bIsFP && !aIsFP) return 1;
    // Then by seniority (earlier first seen = more senior)
    return a.firstSeen - b.firstSeen;
  });

  return activeLeaders;
}

interface ArcDataPoint {
  index: number;
  speaker: string;
  fullSpeaker: string;
  title: string;
  calling: string;
  dominantEmotion: string;
  [key: string]: string | number;
}

// Titles that are procedural, not real talks
const PROCEDURAL_TITLES = /sustaining|statistical|auditing|church audit|solemn assembly/i;

function computeArc(talks: Talk[], season: string, year: number, speakerFilter: SpeakerFilter = 'prophets-apostles') {
  let confTalks = talks.filter(t =>
    t.season === season && t.year === year && t.talk && t.talk.length > 50 &&
    !PROCEDURAL_TITLES.test(t.title) && !t.speaker.startsWith('Presented')
  );
  if (speakerFilter === 'prophets-apostles') {
    confTalks = confTalks.filter(t => isFPorQ12(t.calling || ''));
  }

  // Build seniority order for sorting
  const seniorityMap = new Map<string, number>();
  talks
    .filter(t => isFPorQ12(t.calling || '') && (t.year < year || (t.year === year)))
    .forEach(t => {
      if (!seniorityMap.has(t.speaker)) {
        seniorityMap.set(t.speaker, t.year);
      } else {
        seniorityMap.set(t.speaker, Math.min(seniorityMap.get(t.speaker)!, t.year));
      }
    });

  // Sort talks by apostolic seniority (earliest FP/Q12 appearance first)
  confTalks.sort((a, b) => {
    const senA = seniorityMap.get(a.speaker) ?? 9999;
    const senB = seniorityMap.get(b.speaker) ?? 9999;
    // President first
    const aIsPres = (a.calling || '').toLowerCase().includes('president of the church');
    const bIsPres = (b.calling || '').toLowerCase().includes('president of the church');
    if (aIsPres && !bIsPres) return -1;
    if (bIsPres && !aIsPres) return 1;
    // FP before Q12
    const aIsFP = (a.calling || '').toLowerCase().includes('first presidency');
    const bIsFP = (b.calling || '').toLowerCase().includes('first presidency');
    if (aIsFP && !bIsFP) return -1;
    if (bIsFP && !aIsFP) return 1;
    // Then seniority
    if (senA !== senB) return senA - senB;
    return 0;
  });

  // Track speaker label counts to disambiguate duplicates (e.g., Eyring speaks twice)
  const labelCounts = new Map<string, number>();
  const arcData: ArcDataPoint[] = confTalks.map((t, i) => {
    const text = t.talk || '';
    const scores: Record<string, number> = {};
    Object.entries(EMOTION_KEYWORDS).forEach(([emotion, keywords]) => {
      scores[emotion] = Math.round(scoreText(text, keywords) * 100) / 100;
    });
    const dominant = Object.entries(scores).reduce((best, [e, s]) => s > best[1] ? [e, s] as [string, number] : best, ['', 0]);
    const lastName = t.speaker.split(' ').pop() || t.speaker;
    const count = (labelCounts.get(lastName) || 0) + 1;
    labelCounts.set(lastName, count);
    return {
      index: i,
      speaker: count > 1 ? `${lastName} (${count})` : lastName,
      fullSpeaker: t.speaker,
      title: t.title,
      calling: t.calling || '',
      dominantEmotion: dominant[0] || 'neutral',
      ...scores,
    };
  });

  const emotionTotals: Record<string, number> = {};
  arcData.forEach(d => {
    Object.keys(EMOTION_KEYWORDS).forEach(e => {
      emotionTotals[e] = (emotionTotals[e] || 0) + (Number(d[e]) || 0);
    });
  });
  const dominant = Object.entries(emotionTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

  const mostEmotional = arcData.length > 0 ? arcData.reduce((best, d) => {
    const total = Object.keys(EMOTION_KEYWORDS).reduce((s, e) => s + (Number(d[e]) || 0), 0);
    const bestTotal = Object.keys(EMOTION_KEYWORDS).reduce((s, e) => s + (Number(best[e]) || 0), 0);
    return total > bestTotal ? d : best;
  }, arcData[0]) : null;

  return { arcData, dominant, mostEmotional, talkCount: confTalks.length };
}

export default function EmotionalArcPage() {
  const { talks, loading } = useFilteredFullTalks();
  const [conf1, setConf1] = useState('');
  const [conf2, setConf2] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [speakerFilter, setSpeakerFilter] = useState<SpeakerFilter>('prophets-apostles');

  const options = useMemo(() => getConferenceOptions(talks), [talks]);
  useEffect(() => { if (options.length > 0 && !conf1) setConf1(options[0].label); }, [options, conf1]);

  const opt1 = useMemo(() => options.find(o => o.label === conf1), [options, conf1]);
  const opt2 = useMemo(() => options.find(o => o.label === conf2), [options, conf2]);

  const parsed1 = useMemo(() => opt1 ? computeArc(talks, opt1.season, opt1.year, speakerFilter) : null, [talks, opt1, speakerFilter]);
  const parsed2 = useMemo(() => {
    if (!compareMode || !opt2) return null;
    return computeArc(talks, opt2.season, opt2.year, speakerFilter);
  }, [talks, opt2, compareMode, speakerFilter]);

  const roster1 = useMemo(() => opt1 ? buildLeadershipRoster(talks, opt1.season, opt1.year) : [], [talks, opt1]);
  const roster2 = useMemo(() => {
    if (!compareMode || !opt2) return [];
    return buildLeadershipRoster(talks, opt2.season, opt2.year);
  }, [talks, opt2, compareMode]);

  if (loading) {
    return (
      <div className="flex min-h-screen"><Navigation />
        <main className="ml-0 lg:ml-[260px] flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-[#8B5CF6] text-5xl animate-pulse">show_chart</span>
            <p className="text-[#524534] mt-4 text-sm">Loading conference talks...</p>
          </div>
        </main>
      </div>
    );
  }

  const renderRoster = (roster: ReturnType<typeof buildLeadershipRoster>, label: string) => {
    if (roster.length === 0) return null;

    const fp = roster.filter(r => r.calling.toLowerCase().includes('president of the church') || r.calling.toLowerCase().includes('first presidency'));
    const q12 = roster.filter(r => !fp.includes(r));

    return (
      <div className="bg-white p-3 md:p-6 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 mb-3">
          Leadership at {label}
        </h3>

        {fp.length > 0 && (
          <div className="mb-3">
            <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-[#f5a623] mb-1.5">First Presidency</p>
            <div className="flex flex-wrap gap-1.5">
              {fp.map(r => (
                <span key={r.name} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] md:text-xs font-medium transition-all ${
                  r.spoke
                    ? 'bg-[#1B5E7B] text-white shadow-sm'
                    : 'bg-[#f8f4e4] text-[#1c1c13]/40'
                }`}>
                  {r.spoke && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                  {r.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {q12.length > 0 && (
          <div>
            <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-[#8B5CF6] mb-1.5">Quorum of the Twelve</p>
            <div className="flex flex-wrap gap-1.5">
              {q12.map(r => (
                <span key={r.name} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] md:text-xs font-medium transition-all ${
                  r.spoke
                    ? 'bg-[#8B5CF6] text-white shadow-sm'
                    : 'bg-[#f8f4e4] text-[#1c1c13]/40'
                }`}>
                  {r.spoke && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                  {r.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-[8px] md:text-[9px] text-[#1c1c13]/30 mt-2">
          Highlighted = gave a talk &middot; Ordered by seniority
        </p>
      </div>
    );
  };

  const renderArc = (data: ReturnType<typeof computeArc>, label: string) => {
    if (data.arcData.length === 0) {
      return (
        <div className="bg-white p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] text-center">
          <span className="material-symbols-outlined text-4xl text-[#1c1c13]/20 mb-2">show_chart</span>
          <p className="text-sm text-[#524534]">No talk data available for {label}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
          {[
            { value: data.talkCount, label: 'Talks', color: '#1B5E7B' },
            { value: data.dominant, label: 'Dominant Tone', color: EMOTION_COLORS[data.dominant] || '#1B5E7B' },
            { value: data.mostEmotional?.fullSpeaker || '—', label: 'Most Emotional', color: '#1B5E7B' },
            { value: label, label: 'Conference', color: '#f5a623' },
          ].map(stat => (
            <div key={stat.label} className="bg-white p-3 md:p-4 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] text-center">
              <p className="text-sm md:text-lg font-bold truncate capitalize" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-[9px] md:text-[10px] uppercase tracking-wider text-[#524534] font-bold">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Stacked Area */}
        <div className="bg-white p-3 md:p-6 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 mb-1">Emotional Makeup</h3>
          <p className="text-[10px] text-[#1c1c13]/40 mb-3">The full emotional composition of each talk, stacked. Taller = more emotionally dense. See the mix of joy, sorrow, warning, etc. in each address. Speakers with multiple talks appear more than once.</p>
          <div className="-mx-2 md:mx-0">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={data.arcData} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" />
                <XAxis dataKey="speaker" tick={{ fontSize: 8 }} interval={0} angle={-55} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 9 }} width={24} />
                <Tooltip
                  contentStyle={{ background: '#fdf9e9', border: '1px solid #e5e0d5', borderRadius: 8, fontSize: 11 }}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullSpeaker || ''}
                />
                {Object.entries(EMOTION_COLORS).map(([emotion, color]) => (
                  <Area key={emotion} type="monotone" dataKey={emotion} stackId="1" stroke={color} fill={color} fillOpacity={0.5} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Legend below chart for mobile */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {Object.entries(EMOTION_COLORS).map(([emotion, color]) => (
              <div key={emotion} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                <span className="text-[9px] text-[#1c1c13]/60">{emotion}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Individual Lines */}
        <div className="bg-white p-3 md:p-6 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 mb-1">Individual Emotion Tracks</h3>
          <p className="text-[10px] text-[#1c1c13]/40 mb-3">Each emotion as its own line — track where hope builds, sorrow peaks, or warnings cluster across the weekend.</p>
          <div className="-mx-2 md:mx-0">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.arcData} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" />
                <XAxis dataKey="speaker" tick={{ fontSize: 8 }} interval={0} angle={-55} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 9 }} width={24} />
                <Tooltip contentStyle={{ background: '#fdf9e9', border: '1px solid #e5e0d5', borderRadius: 8, fontSize: 11 }} />
                {Object.entries(EMOTION_COLORS).map(([emotion, color]) => (
                  <Line key={emotion} type="monotone" dataKey={emotion} stroke={color} strokeWidth={1.5} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Talk List */}
        <div className="bg-white p-3 md:p-6 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 mb-3">Talk-by-Talk (seniority order)</h3>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {data.arcData.map((d, i) => (
              <div key={i} className="flex items-center gap-2 md:gap-3 py-1.5 border-b border-[#f2eede] last:border-0">
                <span className="text-[10px] md:text-xs text-[#524534] w-5 md:w-6 text-right shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs md:text-sm font-medium text-[#1c1c13] block truncate">{d.fullSpeaker}</span>
                  <span className="text-[10px] text-[#524534] block truncate">{d.title}</span>
                </div>
                <span className="text-[9px] md:text-[10px] px-1.5 md:px-2 py-0.5 rounded-full font-bold capitalize shrink-0"
                  style={{ background: (EMOTION_COLORS[d.dominantEmotion] || '#999') + '20', color: EMOTION_COLORS[d.dominantEmotion] || '#999' }}>
                  {d.dominantEmotion}
                </span>
                <div className="hidden sm:flex gap-0.5 w-28 shrink-0">
                  {Object.keys(EMOTION_KEYWORDS).map(e => {
                    const val = Number(d[e]) || 0;
                    return <div key={e} className="h-3 rounded-sm" style={{ width: `${Math.max(1, val * 3)}px`, background: EMOTION_COLORS[e] }} title={`${e}: ${val.toFixed(1)}`} />;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1 pt-20 lg:pt-0">
        <TopAppBar title="Emotional Arc" subtitle="How emotions flow across a conference weekend" />
        <div className="mx-auto w-full min-w-0 max-w-7xl px-4 md:px-8 lg:px-12 pb-12 md:pb-24">
          <div className="bg-[#8B5CF6]/5 border border-[#8B5CF6]/20 p-4 md:p-6 rounded-xl mb-4 md:mb-6">
            <p className="text-sm md:text-base font-medium text-[#8B5CF6]">
              Every conference weekend has an emotional shape. Does it start somber and build to hope? Where are the emotional peaks?
            </p>
          </div>

          {/* Controls */}
          <div className="bg-white p-3 md:p-4 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] mb-4 md:mb-6 space-y-2 md:space-y-3">
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
              <select
                value={conf1}
                onChange={e => setConf1(e.target.value)}
                className="w-full sm:w-44 px-3 py-2 rounded-lg border border-[#ece8d9] bg-[#fdf9e9] text-sm focus:outline-none focus:border-[#1B5E7B]"
              >
                {options.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
              </select>
              <div className="flex gap-1">
                {([
                  { key: 'prophets-apostles' as SpeakerFilter, label: 'Prophets & Apostles' },
                  { key: 'all' as SpeakerFilter, label: 'All Speakers' },
                ]).map(f => (
                  <button key={f.key} onClick={() => setSpeakerFilter(f.key)}
                    className={`px-2.5 md:px-3 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all ${speakerFilter === f.key ? 'bg-[#1B5E7B] text-white' : 'bg-[#f8f4e4] text-[#524534] hover:bg-[#1B5E7B]/10'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
              <button onClick={() => setCompareMode(!compareMode)}
                className={`px-3 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all ${compareMode ? 'bg-[#f5a623] text-white' : 'bg-[#f8f4e4] text-[#524534] hover:bg-[#f5a623]/20'}`}>
                {compareMode ? 'Single View' : 'Compare Two'}
              </button>
            </div>
            {compareMode && (
              <select
                value={conf2}
                onChange={e => setConf2(e.target.value)}
                className="w-full sm:w-44 px-3 py-2 rounded-lg border border-[#ece8d9] bg-[#fdf9e9] text-sm focus:outline-none focus:border-[#1B5E7B]"
              >
                <option value="">Compare with...</option>
                {options.filter(o => o.label !== conf1).map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
              </select>
            )}
          </div>

          {!compareMode && (
            <div className="space-y-4">
              {renderRoster(roster1, conf1)}
              {parsed1 && renderArc(parsed1, conf1)}
            </div>
          )}
          {compareMode && (
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60">{conf1}</p>
                {renderRoster(roster1, conf1)}
                {parsed1 && renderArc(parsed1, conf1)}
              </div>
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f5a623]/80">{conf2 || 'Select a conference'}</p>
                {roster2.length > 0 && renderRoster(roster2, conf2)}
                {parsed2 ? renderArc(parsed2, conf2) : <p className="text-[#524534] text-center py-8 text-sm">Select a second conference above</p>}
              </div>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 p-4 md:p-6 rounded-xl mt-6 md:mt-8">
            <p className="text-[10px] md:text-xs text-amber-800">
              <strong>Methodology:</strong> Emotions are detected by counting keyword hits in each talk&apos;s text (e.g., &quot;rejoice,&quot; &quot;sorrow,&quot; &quot;beware&quot;),
              normalized per 1,000 words. Talks and leaders are ordered by apostolic seniority. Leadership roster is inferred from calling data in the talk records.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
