'use client';

import { useState, useEffect } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { loadInsights, TalkLengthData } from '@/lib/insights';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function TalkLengthPage() {
  const [data, setData] = useState<TalkLengthData | null>(null);

  useEffect(() => {
    loadInsights().then(i => setData(i.talkLength));
  }, []);

  if (!data) {
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
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1">
        <TopAppBar title="Talks Are Getting Shorter" subtitle="How talk length has changed over time" />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24 max-w-7xl">

          <Card className="mb-4 md:mb-8 border-amber-200 bg-amber-50/50 overflow-hidden">
            <CardContent className="pt-4 md:pt-6">
              <p className="text-sm md:text-xl font-medium text-amber-900">{data.headline}</p>
            </CardContent>
          </Card>

          {/* Decade Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-4 md:mb-8">
            {data.byDecade.map(d => (
              <Card key={d.decade}>
                <CardHeader className="pb-1">
                  <CardDescription>{d.decade}</CardDescription>
                  <CardTitle className="text-2xl">{d.avgMinutes}m</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-[#524534]">{d.avgWords} avg words</p>
                  <p className="text-xs text-[#524534]">{d.talkCount} talks</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Yearly Trend */}
          <Card className="mb-4 md:mb-8">
            <CardHeader>
              <CardTitle>Average Words Per Talk by Year</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data.byYear}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`${value} words`, 'Avg per talk']}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Line type="monotone" dataKey="avgWords" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Talks Per Conference */}
          <Card className="mb-4 md:mb-8">
            <CardHeader>
              <CardTitle>Talks Per Year</CardTitle>
              <CardDescription>Conference is also including fewer talks overall</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.byYear}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="talkCount" fill="#fbbf24" radius={[4, 4, 0, 0]} name="Talks" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-[#524534]">
                This trend reflects a deliberate shift toward shorter, more focused messages. Conferences in the 1970s
                sometimes had 50+ talks per session. Today, each conference features about 35 talks, giving each speaker
                a focused window to deliver their message.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
