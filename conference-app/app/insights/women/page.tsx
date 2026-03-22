'use client';

import { useState, useEffect } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { loadInsights, WomensVoicesData } from '@/lib/insights';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function WomensVoicesPage() {
  const [data, setData] = useState<WomensVoicesData | null>(null);

  useEffect(() => {
    loadInsights().then(i => setData(i.womensVoices));
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
        <TopAppBar title="Women's Voices" subtitle="Women speakers in General Conference" />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24 max-w-7xl">

          <Card className="mb-4 md:mb-8 border-pink-200 bg-pink-50/50">
            <CardContent className="pt-6">
              <p className="text-xl font-medium text-pink-900">{data.headline}</p>
            </CardContent>
          </Card>

          {/* By Decade */}
          <Card className="mb-4 md:mb-8">
            <CardHeader>
              <CardTitle>Talks by Women Organization Leaders Per Decade</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.byDecade}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="decade" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="talks" fill="#ec4899" radius={[6, 6, 0, 0]} name="Talks" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Percentage Over Time */}
          <Card className="mb-4 md:mb-8">
            <CardHeader>
              <CardTitle>% of Total Conference Talks</CardTitle>
              <CardDescription>Women organization leaders as a share of all conference talks per year</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.byYear.filter(d => d.talks > 0)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis unit="%" />
                  <Tooltip formatter={(value) => [`${value}%`, '% of talks']} />
                  <Line type="monotone" dataKey="pctOfTotal" stroke="#ec4899" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Women Speakers */}
          <Card>
            <CardHeader>
              <CardTitle>Most Frequent Women Organization Speakers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.topSpeakers.map((s, i) => (
                  <div key={s.speaker} className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-[#524534] w-8">{i + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium">{s.speaker}</p>
                      <p className="text-sm text-[#524534]">{s.calling} &middot; {s.firstYear}–{s.lastYear}</p>
                    </div>
                    <span className="text-lg font-bold">{s.talks} talks</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
