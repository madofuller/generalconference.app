'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { loadInsights, SpeakerLeaderboardData } from '@/lib/insights';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function LeaderboardContent() {
  const [data, setData] = useState<SpeakerLeaderboardData | null>(null);

  useEffect(() => {
    loadInsights().then(i => setData(i.speakerLeaderboard));
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-[#524534]">Loading...</p>
      </div>
    );
  }

  const top20 = data.speakers.slice(0, 20).map(s => ({
    ...s,
    label: s.speaker.length > 22 ? s.speaker.substring(0, 20) + '...' : s.speaker,
  }));

  return (
    <div className="px-3 md:px-8 lg:px-12 pt-4 md:pt-6 pb-12 md:pb-24 max-w-7xl">

      <Card className="mb-4 md:mb-8 border-blue-200 bg-blue-50/50 overflow-hidden">
        <CardContent className="pt-4 md:pt-6">
          <p className="text-sm md:text-xl font-medium text-blue-900">{data.headline}</p>
        </CardContent>
      </Card>

      {/* Top 20 Bar Chart */}
      <Card className="mb-4 md:mb-8">
        <CardHeader>
          <CardTitle>Top 20 Speakers by Total Talks</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={450}>
            <BarChart data={top20} layout="vertical" margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="label" width={80} tick={{ fontSize: 9 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const s = payload[0].payload;
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg text-sm">
                      <p className="font-bold">{s.speaker}</p>
                      <p>{s.talks} talks across {s.conferences} conferences</p>
                      <p className="text-[#524534]">{s.firstYear}–{s.lastYear} ({s.span} year span)</p>
                      <p className="text-[#524534]">{s.calling}</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="talks" fill="#3b82f6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Full Table */}
      <Card>
        <CardHeader>
          <CardTitle>Full Leaderboard</CardTitle>
          <CardDescription>All speakers with 10+ talks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">#</th>
                  <th className="p-2">Speaker</th>
                  <th className="p-2 text-right">Talks</th>
                  <th className="p-2 text-right hidden sm:table-cell">Conferences</th>
                  <th className="p-2 hidden md:table-cell">Years Active</th>
                  <th className="p-2 hidden lg:table-cell">Calling</th>
                </tr>
              </thead>
              <tbody>
                {data.speakers.filter(s => s.talks >= 10).map((s, i) => (
                  <tr key={s.speaker} className="border-b hover:bg-muted/50">
                    <td className="p-2 text-[#524534]">{i + 1}</td>
                    <td className="p-2 font-medium text-xs md:text-sm">{s.speaker}</td>
                    <td className="p-2 text-right font-bold">{s.talks}</td>
                    <td className="p-2 text-right hidden sm:table-cell">{s.conferences}</td>
                    <td className="p-2 text-[#524534] hidden md:table-cell">{s.firstYear}–{s.lastYear}</td>
                    <td className="p-2 text-[#524534] text-xs hidden lg:table-cell">{s.calling}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
