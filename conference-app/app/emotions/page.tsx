'use client';

import { useState, useEffect, useMemo } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFilteredTalks } from '@/lib/filter-context';
import {
  getAllEmotions,
  getEmotionStats,
  getEmotionTrends,
  getTalksByEmotion,
  getRelatedEmotions,
  getEmotionCategory,
  EMOTION_CATEGORIES,
  EMOTION_COLORS
} from '@/lib/emotion-utils';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Luminescent Sanctuary emotion palette
const SANCTUARY_COLORS: Record<string, string> = {
  'joy': '#F5A623',
  'love': '#F8BBD0',
  'gratitude': '#A3D9A5',
  'admiration': '#D1C4E9',
  'optimism': '#B3E5FC',
  'caring': '#B2DFDB',
  'approval': '#C8E6C9',
  'excitement': '#FFE0B2',
  'pride': '#E1BEE7',
  'amusement': '#FFF9C4',
  'relief': '#DCEDC8',
  'curiosity': '#B3E5FC',
  'realization': '#C5CAE9',
  'surprise': '#F8BBD0',
  'neutral': '#E0E0E0',
  'confusion': '#CFD8DC',
  'sadness': '#90A4AE',
  'fear': '#BCAAA4',
  'anger': '#EF9A9A',
  'annoyance': '#FFAB91',
  'disappointment': '#B0BEC5',
  'disapproval': '#CE93D8',
  'disgust': '#A1887F',
  'embarrassment': '#F48FB1',
  'grief': '#78909C',
  'nervousness': '#B0BEC5',
  'remorse': '#EF9A9A',
  'desire': '#FFAB91',
};

const TOP_EMOTIONS_COLORS = ['#F5A623', '#F8BBD0', '#A3D9A5', '#D1C4E9', '#B3E5FC', '#B2DFDB', '#C8E6C9', '#FFE0B2'];

// Archetype data
const ARCHETYPES = [
  { name: 'Radiance of Faith', emotions: ['joy', 'gratitude', 'approval'], icon: 'wb_sunny', color: '#F5A623' },
  { name: 'Tender Compassion', emotions: ['love', 'caring', 'sadness'], icon: 'favorite', color: '#F8BBD0' },
  { name: 'Pioneer Reverence', emotions: ['admiration', 'gratitude', 'pride'], icon: 'church', color: '#D1C4E9' },
  { name: 'Undaunted Hope', emotions: ['optimism', 'excitement', 'joy'], icon: 'explore', color: '#B3E5FC' },
];

export default function EmotionsPage() {
  const { talks, loading } = useFilteredTalks();
  const [selectedEmotion, setSelectedEmotion] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [temporalMode, setTemporalMode] = useState<'decade' | 'session'>('decade');

  const hasEmotions = useMemo(() => talks.filter(t => t.primary_emotion && t.primary_emotion !== 'Error').length > 0, [talks]);

  const emotions = useMemo(() => {
    const emotionData = talks.filter(t => t.primary_emotion && t.primary_emotion !== 'Error');
    return emotionData.length > 0 ? getAllEmotions(emotionData) : [];
  }, [talks]);

  useEffect(() => {
    if (emotions.length > 0 && !selectedEmotion) {
      setSelectedEmotion(emotions[0]);
    }
  }, [emotions, selectedEmotion]);

  const filteredTalks = talks.filter(t => t.primary_emotion);

  const filteredEmotions = selectedCategory === 'all'
    ? emotions
    : emotions.filter(e => {
        const emotionsInCat = EMOTION_CATEGORIES[selectedCategory as keyof typeof EMOTION_CATEGORIES] || [];
        return emotionsInCat.includes(e as any);
      });

  // Overall emotion statistics
  const emotionStats = emotions.map(emotion => getEmotionStats(filteredTalks, emotion))
    .sort((a, b) => b.count - a.count);

  // Selected emotion analysis
  const selectedEmotionStats = selectedEmotion ? getEmotionStats(filteredTalks, selectedEmotion) : null;
  const selectedEmotionTrends = selectedEmotion ? getEmotionTrends(filteredTalks, selectedEmotion) : [];
  const selectedEmotionTalks = selectedEmotion ? getTalksByEmotion(filteredTalks, selectedEmotion) : [];
  const relatedEmotions = selectedEmotion ? getRelatedEmotions(filteredTalks, selectedEmotion, 10) : [];

  // Emotion comparison
  const [compareEmotions, setCompareEmotions] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<any[]>([]);

  const addEmotionToComparison = (emotion: string) => {
    if (!compareEmotions.includes(emotion) && compareEmotions.length < 5) {
      setCompareEmotions([...compareEmotions, emotion]);
    }
  };

  const removeEmotionFromComparison = (emotion: string) => {
    setCompareEmotions(compareEmotions.filter(e => e !== emotion));
  };

  useEffect(() => {
    if (compareEmotions.length > 0) {
      const allYears = new Set<number>();
      compareEmotions.forEach(emotion => {
        const trends = getEmotionTrends(filteredTalks, emotion);
        trends.forEach(t => allYears.add(t.year));
      });

      const data = Array.from(allYears).sort().map(year => {
        const entry: any = { year };
        compareEmotions.forEach(emotion => {
          const trends = getEmotionTrends(filteredTalks, emotion);
          const yearData = trends.find(t => t.year === year);
          entry[emotion] = yearData ? yearData.count : 0;
        });
        return entry;
      });

      setComparisonData(data);
    }
  }, [compareEmotions, filteredTalks]);

  // Category counts for donut chart
  const categoryCounts = Object.keys(EMOTION_CATEGORIES).map(category => {
    const emotionsInCat = EMOTION_CATEGORIES[category as keyof typeof EMOTION_CATEGORIES];
    const count = filteredTalks.filter(t =>
      t.primary_emotion && emotionsInCat.includes(t.primary_emotion as any)
    ).length;
    return { name: category, value: count };
  }).filter(c => c.value > 0);

  const CATEGORY_COLORS = ['#F5A623', '#EF9A9A', '#B3E5FC', '#D1C4E9', '#E0E0E0'];

  // Temporal (decade) data for area chart
  const temporalData = useMemo(() => {
    if (filteredTalks.length === 0) return [];
    const topEmotions = emotionStats.slice(0, 6).map(s => s.emotion);

    if (temporalMode === 'decade') {
      const decades = new Map<number, Record<string, number>>();
      filteredTalks.forEach(t => {
        const decade = Math.floor(t.year / 10) * 10;
        if (!decades.has(decade)) decades.set(decade, {});
        const d = decades.get(decade)!;
        const emo = t.primary_emotion || '';
        if (topEmotions.includes(emo)) {
          d[emo] = (d[emo] || 0) + 1;
        }
      });
      return Array.from(decades.entries()).sort((a, b) => a[0] - b[0]).map(([decade, counts]) => {
        const total = Object.values(counts).reduce((s, v) => s + v, 0);
        const entry: any = { label: `${decade}s`, total };
        topEmotions.forEach(e => { entry[e] = counts[e] || 0; });
        return entry;
      });
    } else {
      // By session (spring/fall per year, aggregate by 5-year blocks)
      const blocks = new Map<string, Record<string, number>>();
      filteredTalks.forEach(t => {
        const blockStart = Math.floor(t.year / 5) * 5;
        const key = `${blockStart}-${blockStart + 4}`;
        if (!blocks.has(key)) blocks.set(key, {});
        const d = blocks.get(key)!;
        const emo = t.primary_emotion || '';
        if (topEmotions.includes(emo)) {
          d[emo] = (d[emo] || 0) + 1;
        }
      });
      return Array.from(blocks.entries()).sort().map(([label, counts]) => {
        const total = Object.values(counts).reduce((s, v) => s + v, 0);
        const entry: any = { label, total };
        topEmotions.forEach(e => { entry[e] = counts[e] || 0; });
        return entry;
      });
    }
  }, [filteredTalks, emotionStats, temporalMode]);

  const topEmotionNames = emotionStats.slice(0, 6).map(s => s.emotion);

  // Active tab state for sub-sections
  const [activeTab, setActiveTab] = useState<'overview' | 'explore' | 'compare' | 'categories'>('overview');

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Navigation />
        <main className="ml-0 lg:ml-[260px] min-h-screen flex-1 bg-[#fdf9e9]">
          <TopAppBar title="The Heart of Conference" subtitle="Emotional insights from over 4,000 addresses" />
          <div className="px-4 md:px-8 lg:px-12 pb-20 flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-[#f5a623] border-t-transparent animate-spin" />
              <p className="text-sm font-medium text-[#1c1c13]/60">Loading emotional insights...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!hasEmotions) {
    return (
      <div className="flex min-h-screen">
        <Navigation />
        <main className="ml-0 lg:ml-[260px] min-h-screen flex-1 bg-[#fdf9e9]">
          <TopAppBar title="The Heart of Conference" subtitle="Emotional insights from over 4,000 addresses" />
          <div className="px-4 md:px-8 lg:px-12 pb-20 space-y-12">
            <div className="bg-white rounded-xl p-5 md:p-8 lg:p-10 shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
              <h2 className="text-xl font-bold text-[#1c1c13] mb-2">Emotions Coming Soon</h2>
              <p className="text-sm text-[#1c1c13]/60">
                This feature requires AI-classified emotion data that hasn&apos;t been generated yet.
                Once ready, you&apos;ll be able to explore the emotional landscape of 50+ years of General Conference &mdash; see which emotions dominate different eras, compare speakers, and discover patterns.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Donut chart data
  const donutData = emotionStats.slice(0, 8).map((s, i) => ({
    name: s.emotion,
    value: s.count,
    color: SANCTUARY_COLORS[s.emotion] || TOP_EMOTIONS_COLORS[i % TOP_EMOTIONS_COLORS.length],
  }));

  const maxCount = emotionStats.length > 0 ? emotionStats[0].count : 1;

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1 bg-[#fdf9e9]">
        <TopAppBar title="The Heart of Conference" subtitle="Emotional insights from over 4,000 addresses" />

        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-20 space-y-6 md:space-y-12">

          {/* Methodology Note */}
          <div className="bg-white/60 rounded-xl px-6 py-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-[#1B5E7B] mt-0.5" style={{ fontSize: 18 }}>info</span>
            <p className="text-xs text-[#524534]/70 leading-relaxed">
              <span className="font-bold text-[#524534]">Methodology: </span>
              Emotion classifications are based on AI analysis of representative samples from each talk (title + selected sentences),
              not the full text. Results provide valuable insights into emotional trends, though they may not reflect every emotional nuance.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'overview' as const, label: 'Overview', icon: 'dashboard' },
              { key: 'explore' as const, label: 'Explore Emotion', icon: 'search' },
              { key: 'compare' as const, label: 'Compare', icon: 'compare_arrows' },
              { key: 'categories' as const, label: 'Categories', icon: 'category' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'bg-[#1B5E7B] text-white shadow-[0px_4px_16px_rgba(27,94,123,0.25)]'
                    : 'bg-white text-[#524534] hover:bg-[#f5a623]/10 shadow-[0px_2px_8px_rgba(27,94,123,0.04)]'
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ==================== OVERVIEW TAB ==================== */}
          {activeTab === 'overview' && (
            <>
              {/* Hero Bento Grid */}
              <section>
                <p className="text-xs font-bold uppercase tracking-widest text-[#524534] mb-4">Emotion Distribution</p>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">

                  {/* Left: SVG Donut */}
                  <div className="col-span-1 md:col-span-5 bg-white rounded-xl p-4 md:p-6 lg:p-8 shadow-[0px_12px_32px_rgba(27,94,123,0.06)] flex flex-col items-center justify-center">
                    <div className="relative w-[260px] h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={donutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={75}
                            outerRadius={115}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                          >
                            {donutData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: '#fff',
                              border: 'none',
                              borderRadius: 12,
                              boxShadow: '0 8px 24px rgba(27,94,123,0.1)',
                              fontSize: 12
                            }}
                            formatter={(value, name) => [`${(value ?? 0).toLocaleString()} talks`, name ?? '']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Center label */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-[#1c1c13]">{filteredTalks.length.toLocaleString()}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#524534]/60">Talks Analyzed</span>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-6">
                      {donutData.map(d => (
                        <div key={d.name} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-xs text-[#1c1c13]/70 capitalize">{d.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Dominant Tones */}
                  <div className="col-span-1 md:col-span-7 bg-white rounded-xl p-4 md:p-6 lg:p-8 shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
                    <h3 className="text-lg font-bold text-[#1c1c13] mb-1">Dominant Tones</h3>
                    <p className="text-xs text-[#524534]/60 mb-6">Primary emotions detected across all conference addresses</p>

                    <div className="space-y-4">
                      {emotionStats.slice(0, 8).map((stat, i) => {
                        const pct = (stat.count / maxCount) * 100;
                        const color = SANCTUARY_COLORS[stat.emotion] || TOP_EMOTIONS_COLORS[i % TOP_EMOTIONS_COLORS.length];
                        return (
                          <div key={stat.emotion} className="group">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-semibold text-[#1c1c13] capitalize">{stat.emotion}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-[#524534]/50">{stat.count.toLocaleString()} talks</span>
                                <span className="text-sm font-bold text-[#1B5E7B]">{stat.percentage.toFixed(0)}%</span>
                              </div>
                            </div>
                            <div className="h-2.5 bg-[#fdf9e9] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${pct}%`, backgroundColor: color }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>

              {/* Temporal Waves */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#524534]">Temporal Waves</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTemporalMode('decade')}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                        temporalMode === 'decade'
                          ? 'bg-[#1B5E7B] text-white'
                          : 'bg-white text-[#524534] hover:bg-[#f5a623]/10'
                      }`}
                    >
                      By Decade
                    </button>
                    <button
                      onClick={() => setTemporalMode('session')}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                        temporalMode === 'session'
                          ? 'bg-[#1B5E7B] text-white'
                          : 'bg-white text-[#524534] hover:bg-[#f5a623]/10'
                      }`}
                    >
                      By Session
                    </button>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 md:p-6 lg:p-8 shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
                  <h3 className="text-lg font-bold text-[#1c1c13] mb-1">Emotional Arc Over Time</h3>
                  <p className="text-xs text-[#524534]/60 mb-6">How the emotional landscape of conference has shifted</p>
                  <ResponsiveContainer width="100%" height={360}>
                    <AreaChart data={temporalData}>
                      <defs>
                        {topEmotionNames.map((emo, i) => (
                          <linearGradient key={emo} id={`grad-${emo}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={SANCTUARY_COLORS[emo] || TOP_EMOTIONS_COLORS[i]} stopOpacity={0.6} />
                            <stop offset="100%" stopColor={SANCTUARY_COLORS[emo] || TOP_EMOTIONS_COLORS[i]} stopOpacity={0.05} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5a623" strokeOpacity={0.1} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#524534' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#524534' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: '#fff',
                          border: 'none',
                          borderRadius: 12,
                          boxShadow: '0 8px 24px rgba(27,94,123,0.1)',
                          fontSize: 12
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 11 }}
                        formatter={(value) => <span className="capitalize text-[#524534]">{value}</span>}
                      />
                      {topEmotionNames.map((emo, i) => (
                        <Area
                          key={emo}
                          type="monotone"
                          dataKey={emo}
                          stackId="1"
                          stroke={SANCTUARY_COLORS[emo] || TOP_EMOTIONS_COLORS[i]}
                          fill={`url(#grad-${emo})`}
                          strokeWidth={2}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Bottom Asymmetric Grid */}
              <section>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
                  {/* Left column */}
                  <div className="col-span-1 md:col-span-5 space-y-4 md:space-y-6">
                    {/* Spiritual Synthesis */}
                    <div className="bg-white rounded-xl p-4 md:p-6 lg:p-8 shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
                      <p className="text-xs font-bold uppercase tracking-widest text-[#524534] mb-3">Spiritual Synthesis</p>
                      <h3 className="text-lg font-bold text-[#1c1c13] mb-3">The Emotional Signature of Conference</h3>
                      <p className="text-sm text-[#1c1c13]/60 leading-relaxed mb-4">
                        Across {filteredTalks.length.toLocaleString()} addresses, the dominant emotional thread is
                        <span className="font-bold text-[#1B5E7B] capitalize"> {emotionStats[0]?.emotion || 'joy'}</span>,
                        appearing in {emotionStats[0]?.percentage.toFixed(1)}% of talks. Combined with{' '}
                        <span className="capitalize">{emotionStats[1]?.emotion}</span> and{' '}
                        <span className="capitalize">{emotionStats[2]?.emotion}</span>,
                        these three emotions form the spiritual heartbeat of General Conference.
                      </p>
                      <div className="flex gap-2">
                        {emotionStats.slice(0, 3).map(s => (
                          <span key={s.emotion} className="px-3 py-1 rounded-full text-xs font-bold capitalize"
                            style={{ backgroundColor: (SANCTUARY_COLORS[s.emotion] || '#F5A623') + '30', color: '#1B5E7B' }}>
                            {s.emotion}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Deep Dive Action Card */}
                    <div
                      className="bg-gradient-to-br from-[#f5a623] to-[#d4920f] rounded-xl p-4 md:p-6 lg:p-8 shadow-[0px_12px_32px_rgba(27,94,123,0.15)] cursor-pointer hover:shadow-[0px_16px_40px_rgba(27,94,123,0.25)] transition-all duration-300"
                      onClick={() => { setSelectedEmotion(emotionStats[0]?.emotion || 'joy'); setActiveTab('explore'); }}
                    >
                      <span className="material-symbols-outlined text-white/80 mb-3" style={{ fontSize: 32 }}>explore</span>
                      <h3 className="text-lg font-bold text-white mb-1">Deep Dive into {emotionStats[0]?.emotion ? emotionStats[0].emotion.charAt(0).toUpperCase() + emotionStats[0].emotion.slice(1) : 'Joy'}</h3>
                      <p className="text-sm text-white/80">Explore the most prevalent emotion across decades of spiritual counsel</p>
                      <div className="mt-4 flex items-center gap-2 text-white/90 text-xs font-bold uppercase tracking-widest">
                        <span>Explore Now</span>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Emotional Archetypes */}
                  <div className="col-span-1 md:col-span-7">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#524534] mb-4">Emotional Archetypes</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ARCHETYPES.map(arch => {
                        const totalCount = arch.emotions.reduce((sum, emo) => {
                          const stat = emotionStats.find(s => s.emotion === emo);
                          return sum + (stat?.count || 0);
                        }, 0);
                        return (
                          <div key={arch.name} className="bg-white rounded-xl p-6 shadow-[0px_12px_32px_rgba(27,94,123,0.06)] hover:shadow-[0px_16px_40px_rgba(27,94,123,0.1)] transition-all duration-300 group cursor-pointer"
                            onClick={() => { setSelectedEmotion(arch.emotions[0]); setActiveTab('explore'); }}>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: arch.color + '30' }}>
                              <span className="material-symbols-outlined" style={{ color: arch.color, fontSize: 20 }}>{arch.icon}</span>
                            </div>
                            <h4 className="font-bold text-[#1c1c13] text-sm mb-1">{arch.name}</h4>
                            <p className="text-xs text-[#524534]/60 mb-3">{totalCount.toLocaleString()} talks embody this pattern</p>
                            <div className="flex gap-1.5">
                              {arch.emotions.map(emo => (
                                <span key={emo} className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider capitalize"
                                  style={{ backgroundColor: (SANCTUARY_COLORS[emo] || '#E0E0E0') + '40', color: '#1B5E7B' }}>
                                  {emo}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>

              {/* Emotion Statistics Table */}
              <section>
                <p className="text-xs font-bold uppercase tracking-widest text-[#524534] mb-4">Full Emotion Rankings</p>
                <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#fdf9e9]">
                        <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#524534]">Rank</th>
                        <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#524534]">Emotion</th>
                        <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#524534]">Category</th>
                        <th className="text-right px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#524534]">Count</th>
                        <th className="text-right px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#524534]">Share</th>
                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#524534]">Distribution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emotionStats.slice(0, 20).map((stat, idx) => {
                        const pct = (stat.count / maxCount) * 100;
                        const color = SANCTUARY_COLORS[stat.emotion] || '#E0E0E0';
                        return (
                          <tr key={idx} className="hover:bg-[#fdf9e9]/60 cursor-pointer transition-colors"
                              onClick={() => { setSelectedEmotion(stat.emotion); setActiveTab('explore'); }}>
                            <td className="px-6 py-3 text-sm font-bold text-[#1B5E7B]">{idx + 1}</td>
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                                <span className="text-sm font-semibold text-[#1c1c13] capitalize">{stat.emotion}</span>
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#fdf9e9] text-[#1B5E7B]">
                                {getEmotionCategory(stat.emotion)}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-right text-sm text-[#1c1c13]/70">{stat.count.toLocaleString()}</td>
                            <td className="px-6 py-3 text-right text-sm font-bold text-[#1B5E7B]">{stat.percentage.toFixed(1)}%</td>
                            <td className="px-6 py-3 w-40">
                              <div className="h-1.5 bg-[#fdf9e9] rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {/* ==================== EXPLORE TAB ==================== */}
          {activeTab === 'explore' && (
            <>
              <section>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
                  <div className="col-span-1 md:col-span-4 bg-white rounded-xl p-6 shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#524534] mb-4">Select an Emotion</p>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-[#524534]/70">Filter by Category</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="rounded-xl border-[#f5a623]/20 focus:ring-[#f5a623]/30">
                            <SelectValue placeholder="All Categories" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {Object.keys(EMOTION_CATEGORIES).map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-[#524534]/70">Emotion</Label>
                        <Select value={selectedEmotion} onValueChange={setSelectedEmotion}>
                          <SelectTrigger className="rounded-xl border-[#f5a623]/20 focus:ring-[#f5a623]/30">
                            <SelectValue placeholder="Choose an emotion" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredEmotions.map(emotion => (
                              <SelectItem key={emotion} value={emotion} className="capitalize">
                                {emotion}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {selectedEmotionStats && (
                    <>
                      <div className="col-span-1 md:col-span-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { label: 'Total Talks', value: selectedEmotionStats.count.toLocaleString(), icon: 'article' },
                          { label: 'Percentage', value: `${selectedEmotionStats.percentage.toFixed(1)}%`, icon: 'percent' },
                          { label: 'Avg Confidence', value: `${(selectedEmotionStats.avgScore * 100).toFixed(0)}%`, icon: 'verified' },
                          { label: 'Category', value: getEmotionCategory(selectedEmotion), icon: 'category' },
                        ].map(card => (
                          <div key={card.label} className="bg-white rounded-xl p-5 shadow-[0px_12px_32px_rgba(27,94,123,0.06)] flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="material-symbols-outlined text-[#1B5E7B]" style={{ fontSize: 18 }}>{card.icon}</span>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[#524534]/60">{card.label}</span>
                            </div>
                            <span className="text-2xl font-bold text-[#1c1c13] capitalize">{card.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </section>

              {selectedEmotionStats && (
                <>
                  <section>
                    <div className="bg-white rounded-xl p-4 md:p-6 lg:p-8 shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
                      <h3 className="text-lg font-bold text-[#1c1c13] mb-1 capitalize">"{selectedEmotion}" Trend Over Time</h3>
                      <p className="text-xs text-[#524534]/60 mb-6">How this emotion has manifested across the decades</p>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={selectedEmotionTrends}>
                          <defs>
                            <linearGradient id="gradSelected" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={SANCTUARY_COLORS[selectedEmotion] || '#F5A623'} stopOpacity={0.4} />
                              <stop offset="100%" stopColor={SANCTUARY_COLORS[selectedEmotion] || '#F5A623'} stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f5a623" strokeOpacity={0.1} />
                          <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#524534' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#524534' }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ background: '#fff', border: 'none', borderRadius: 12, boxShadow: '0 8px 24px rgba(27,94,123,0.1)', fontSize: 12 }} />
                          <Area type="monotone" dataKey="count" stroke={SANCTUARY_COLORS[selectedEmotion] || '#F5A623'} fill="url(#gradSelected)" strokeWidth={2.5} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </section>

                  {relatedEmotions.length > 0 && (
                    <section>
                      <div className="bg-white rounded-xl p-4 md:p-6 lg:p-8 shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
                        <p className="text-xs font-bold uppercase tracking-widest text-[#524534] mb-4">Related Emotions</p>
                        <div className="flex flex-wrap gap-2">
                          {relatedEmotions.map(re => (
                            <button
                              key={re.emotion}
                              className="px-4 py-2 rounded-full text-xs font-bold capitalize transition-all duration-300 hover:shadow-[0px_4px_16px_rgba(27,94,123,0.15)]"
                              style={{
                                backgroundColor: (SANCTUARY_COLORS[re.emotion] || '#E0E0E0') + '30',
                                color: '#1B5E7B'
                              }}
                              onClick={() => setSelectedEmotion(re.emotion)}
                            >
                              {re.emotion} ({re.frequency})
                            </button>
                          ))}
                        </div>
                      </div>
                    </section>
                  )}

                  <section>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#524534] mb-4">Recent Talks with "{selectedEmotion}"</p>
                    <div className="space-y-3">
                      {selectedEmotionTalks
                        .sort((a, b) => b.year - a.year)
                        .slice(0, 10)
                        .map((talk, idx) => (
                          <div key={idx} className="bg-white rounded-xl p-5 shadow-[0px_12px_32px_rgba(27,94,123,0.06)] hover:shadow-[0px_16px_40px_rgba(27,94,123,0.1)] transition-all duration-300">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="font-bold text-[#1c1c13] text-sm mb-1">{talk.title}</h3>
                                <p className="text-xs text-[#524534]/60 mb-2">
                                  {talk.speaker} &middot; {talk.season} {talk.year}
                                </p>
                                <div className="flex gap-2 items-center">
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#fdf9e9] text-[#1B5E7B]">
                                    {talk.calling}
                                  </span>
                                  <span className="text-[10px] text-[#524534]/50 font-medium">
                                    Confidence: {((talk.primary_emotion_score || 0) * 100).toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                              <a href={talk.url} target="_blank" rel="noopener noreferrer"
                                className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[#fdf9e9] text-[#1B5E7B] hover:bg-[#f5a623]/20 transition-all duration-300">
                                View Talk
                              </a>
                            </div>
                          </div>
                        ))}
                    </div>
                  </section>
                </>
              )}
            </>
          )}

          {/* ==================== COMPARE TAB ==================== */}
          {activeTab === 'compare' && (
            <>
              <section>
                <div className="bg-white rounded-xl p-4 md:p-6 lg:p-8 shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#524534] mb-4">Compare Multiple Emotions</p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-[#524534]/70">Add Emotion (up to 5)</Label>
                      <Select onValueChange={addEmotionToComparison} value="">
                        <SelectTrigger className="rounded-xl border-[#f5a623]/20 focus:ring-[#f5a623]/30 max-w-sm">
                          <SelectValue placeholder="Choose an emotion to add" />
                        </SelectTrigger>
                        <SelectContent>
                          {emotions.filter(e => !compareEmotions.includes(e)).map(emotion => (
                            <SelectItem key={emotion} value={emotion} className="capitalize">
                              {emotion}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {compareEmotions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {compareEmotions.map(emotion => (
                          <button
                            key={emotion}
                            className="px-4 py-2 rounded-full text-xs font-bold capitalize transition-all duration-300 flex items-center gap-2"
                            style={{
                              backgroundColor: (SANCTUARY_COLORS[emotion] || '#E0E0E0') + '30',
                              color: '#1B5E7B'
                            }}
                            onClick={() => removeEmotionFromComparison(emotion)}
                          >
                            {emotion}
                            <span className="text-[#1B5E7B]/50">x</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {compareEmotions.length > 0 && (
                <section>
                  <div className="bg-white rounded-xl p-4 md:p-6 lg:p-8 shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
                    <h3 className="text-lg font-bold text-[#1c1c13] mb-1">Emotion Comparison Chart</h3>
                    <p className="text-xs text-[#524534]/60 mb-6">Side-by-side trends over time</p>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={comparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f5a623" strokeOpacity={0.1} />
                        <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#524534' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#524534' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#fff', border: 'none', borderRadius: 12, boxShadow: '0 8px 24px rgba(27,94,123,0.1)', fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value) => <span className="capitalize text-[#524534]">{value}</span>} />
                        {compareEmotions.map((emotion, idx) => (
                          <Line
                            key={emotion}
                            type="monotone"
                            dataKey={emotion}
                            stroke={SANCTUARY_COLORS[emotion] || EMOTION_COLORS[emotion] || TOP_EMOTIONS_COLORS[idx % TOP_EMOTIONS_COLORS.length]}
                            strokeWidth={2.5}
                            dot={false}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              )}
            </>
          )}

          {/* ==================== CATEGORIES TAB ==================== */}
          {activeTab === 'categories' && (
            <>
              <section>
                <div className="bg-white rounded-xl p-4 md:p-6 lg:p-8 shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
                  <h3 className="text-lg font-bold text-[#1c1c13] mb-1">Emotion Categories Distribution</h3>
                  <p className="text-xs text-[#524534]/60 mb-6">How emotions group into broader categories</p>
                  <div className="flex items-center justify-center">
                    <div className="relative w-[320px] h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryCounts}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={140}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                            label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {categoryCounts.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: '#fff', border: 'none', borderRadius: 12, boxShadow: '0 8px 24px rgba(27,94,123,0.1)', fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <p className="text-xs font-bold uppercase tracking-widest text-[#524534] mb-4">Category Breakdown</p>
                <div className="grid gap-6 md:grid-cols-2">
                  {Object.entries(EMOTION_CATEGORIES).map(([category, categoryEmotions], ci) => {
                    const count = filteredTalks.filter(t =>
                      t.primary_emotion && categoryEmotions.includes(t.primary_emotion as any)
                    ).length;
                    const percentage = filteredTalks.length > 0 ? (count / filteredTalks.length) * 100 : 0;
                    const color = CATEGORY_COLORS[ci % CATEGORY_COLORS.length];

                    return (
                      <div key={category} className="bg-white rounded-xl p-6 shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                            <h4 className="font-bold text-[#1c1c13] text-sm">{category}</h4>
                          </div>
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#fdf9e9] text-[#1B5E7B]">
                            {count.toLocaleString()} talks
                          </span>
                        </div>
                        <div className="h-1.5 bg-[#fdf9e9] rounded-full overflow-hidden mb-4">
                          <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: color }} />
                        </div>
                        <p className="text-xs text-[#524534]/60 mb-3">{percentage.toFixed(1)}% of all talks</p>
                        <div className="flex flex-wrap gap-1.5">
                          {categoryEmotions.map(emotion => {
                            const emotionCount = filteredTalks.filter(t => t.primary_emotion === emotion).length;
                            return emotionCount > 0 ? (
                              <button
                                key={emotion}
                                className="px-2.5 py-1 rounded-full text-[10px] font-bold capitalize transition-all duration-200 hover:shadow-sm"
                                style={{
                                  backgroundColor: (SANCTUARY_COLORS[emotion] || '#E0E0E0') + '30',
                                  color: '#1B5E7B'
                                }}
                                onClick={() => { setSelectedEmotion(emotion); setActiveTab('explore'); }}
                              >
                                {emotion} ({emotionCount})
                              </button>
                            ) : null;
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
