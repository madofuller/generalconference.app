'use client';

import { Navigation, TopAppBar } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFilteredTalks } from '@/lib/filter-context';
import { getDecadeStats, getFunFacts, getAllTopics, getAllEmotions } from '@/lib/analytics-utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#1B5E7B', '#f5a623', '#00668a', '#8455ef', '#40c2fd'];

export default function AnalyticsDashboard() {
  const { talks, loading } = useFilteredTalks();

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

  const totalTalks = talks.length;
  const uniqueSpeakers = new Set(talks.map(t => t.speaker)).size;
  const years = talks.map(t => t.year).filter(Boolean);
  const yearRange = years.length > 0 ? `${Math.min(...years)} - ${Math.max(...years)}` : 'N/A';
  const totalConferences = new Set(talks.map(t => `${t.season} ${t.year}`)).size;

  const decadeStats = getDecadeStats(talks);
  const funFacts = getFunFacts(talks);
  const topTopics = getAllTopics(talks).slice(0, 10);
  const topEmotions = getAllEmotions(talks).slice(0, 10);

  // Top speakers
  const speakerCounts = new Map<string, number>();
  talks.forEach(t => speakerCounts.set(t.speaker, (speakerCounts.get(t.speaker) || 0) + 1));
  const topSpeakers = Array.from(speakerCounts.entries())
    .map(([speaker, count]) => ({ speaker: speaker.length > 20 ? speaker.substring(0, 18) + '...' : speaker, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1 pt-20 lg:pt-0">
        <TopAppBar title="Analytics Dashboard" subtitle="Key stats and insights" />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24">

          {/* Key Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Talks</CardDescription>
                <CardTitle className="text-xl md:text-3xl">{totalTalks.toLocaleString()}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Unique Speakers</CardDescription>
                <CardTitle className="text-xl md:text-3xl">{uniqueSpeakers}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Conferences</CardDescription>
                <CardTitle className="text-xl md:text-3xl">{totalConferences}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Year Range</CardDescription>
                <CardTitle className="text-xl md:text-3xl">{yearRange}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Fun Facts */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Interesting Facts</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {funFacts.map((fact, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-[#524534] font-mono">{i + 1}.</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:gap-8 lg:grid-cols-2 mb-8">
            {/* Top Speakers */}
            <Card>
              <CardHeader>
                <CardTitle>Most Prolific Speakers</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topSpeakers} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="speaker" width={140} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1B5E7B" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Topics */}
            <Card>
              <CardHeader>
                <CardTitle>Most Common Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie data={topTopics} dataKey="count" nameKey="topic" cx="50%" cy="50%" outerRadius={140} label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`} labelLine={false}>
                      {topTopics.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Decade Stats */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Stats by Decade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Decade</th>
                      <th className="text-right p-2">Talks</th>
                      <th className="text-right p-2">Speakers</th>
                      <th className="text-left p-2">Top Topic</th>
                      <th className="text-left p-2">Top Emotion</th>
                      <th className="text-right p-2">Avg Length</th>
                    </tr>
                  </thead>
                  <tbody>
                    {decadeStats.map(d => (
                      <tr key={d.decade} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{d.decade}</td>
                        <td className="text-right p-2">{d.talkCount}</td>
                        <td className="text-right p-2">{d.uniqueSpeakers}</td>
                        <td className="p-2">{d.topTopic}</td>
                        <td className="p-2 capitalize">{d.topEmotion}</td>
                        <td className="text-right p-2">{(d.avgTalkLength / 1000).toFixed(1)}k chars</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Talks per Decade */}
          <Card>
            <CardHeader>
              <CardTitle>Talks per Decade</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={decadeStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="decade" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="talkCount" fill="#f5a623" radius={[4, 4, 0, 0]} name="Talks" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
