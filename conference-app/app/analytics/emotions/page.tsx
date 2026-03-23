'use client';

import { useState, useMemo } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFilteredTalks } from '@/lib/filter-context';
import { getEmotionTrends, getEmotionByYear, getAllEmotions } from '@/lib/analytics-utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

const EMOTION_COLORS: Record<string, string> = {
  gratitude: '#10b981', admiration: '#6366f1', joy: '#f59e0b', love: '#ec4899',
  optimism: '#06b6d4', approval: '#8b5cf6', caring: '#14b8a6', excitement: '#f97316',
  pride: '#a78bfa', relief: '#34d399', amusement: '#fbbf24',
  sadness: '#6b7280', anger: '#ef4444', fear: '#991b1b', disappointment: '#9ca3af',
  grief: '#374151', annoyance: '#d97706', disgust: '#7c3aed', nervousness: '#dc2626',
  curiosity: '#0ea5e9', realization: '#3b82f6', surprise: '#eab308', confusion: '#a855f7',
  neutral: '#94a3b8', desire: '#f472b6', remorse: '#64748b', embarrassment: '#fb923c',
  disapproval: '#78716c',
};

export default function EmotionTrendsPage() {
  const { talks, loading } = useFilteredTalks();
  const [view, setView] = useState<'decade' | 'year'>('decade');

  const allEmotions = useMemo(() => getAllEmotions(talks), [talks]);
  const topEmotions = useMemo(() => allEmotions.slice(0, 8).map(e => e.emotion), [allEmotions]);
  const decadeTrends = useMemo(() => getEmotionTrends(talks), [talks]);
  const yearTrends = useMemo(() => getEmotionByYear(talks), [talks]);

  const trendData = view === 'decade' ? decadeTrends : yearTrends;

  // Compute overall emotion pie
  const emotionPie = useMemo(() => {
    return allEmotions.slice(0, 10).map(e => ({
      name: e.emotion,
      value: e.count,
      color: EMOTION_COLORS[e.emotion] || '#94a3b8',
    }));
  }, [allEmotions]);

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Navigation />
        <main className="ml-0 lg:ml-[260px] flex-1 flex items-center justify-center">
          <p className="text-[#524534]">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1 pt-20 lg:pt-0">
        <TopAppBar title="Emotion Trends" subtitle="Track the emotional tone over decades" />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24">

          {/* Overall Emotion Distribution */}
          <div className="grid gap-4 md:gap-8 lg:grid-cols-2 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Overall Emotion Distribution</CardTitle>
                <CardDescription>Primary emotion detected across all talks</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={emotionPie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={130}
                      label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {emotionPie.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Emotion Stats Cards */}
            <Card>
              <CardHeader>
                <CardTitle>Emotion Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allEmotions.slice(0, 12).map(({ emotion, count }) => {
                    const pct = talks.length > 0 ? ((count / talks.length) * 100).toFixed(1) : '0';
                    return (
                      <div key={emotion} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: EMOTION_COLORS[emotion] || '#94a3b8' }} />
                        <span className="capitalize flex-1">{emotion}</span>
                        <span className="text-[#524534] text-sm">{count} talks ({pct}%)</span>
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: EMOTION_COLORS[emotion] || '#94a3b8' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trend Chart */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                  <CardTitle>Emotion Trends Over Time</CardTitle>
                  <CardDescription>Stacked area chart showing emotion prevalence (% of talks)</CardDescription>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setView('decade')}
                    className={`px-3 py-1 text-sm rounded ${view === 'decade' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  >
                    By Decade
                  </button>
                  <button
                    onClick={() => setView('year')}
                    className={`px-3 py-1 text-sm rounded ${view === 'year' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  >
                    By Year
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={450}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis unit="%" />
                  <Tooltip />
                  <Legend />
                  {topEmotions.map(emotion => (
                    <Area
                      key={emotion}
                      type="monotone"
                      dataKey={emotion}
                      stackId="1"
                      stroke={EMOTION_COLORS[emotion] || '#94a3b8'}
                      fill={EMOTION_COLORS[emotion] || '#94a3b8'}
                      fillOpacity={0.6}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
