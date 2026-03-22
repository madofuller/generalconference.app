'use client';

import { useState, useEffect } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { loadInsights, NewVoicesData } from '@/lib/insights';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function NewVoicesPage() {
  const [data, setData] = useState<NewVoicesData | null>(null);

  useEffect(() => {
    loadInsights().then(i => setData(i.newVoices));
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
        <TopAppBar title="New Voices" subtitle="First-time conference speakers over the decades" />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24 max-w-7xl">

          <Card className="mb-4 md:mb-8 border-sky-200 bg-sky-50/50">
            <CardContent className="pt-6">
              <p className="text-xl font-medium text-sky-900">{data.headline}</p>
            </CardContent>
          </Card>

          <Card className="mb-4 md:mb-8">
            <CardHeader>
              <CardTitle>First-Time Speakers by Decade</CardTitle>
              <CardDescription>Speakers who gave their first conference talk in each decade</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data.byDecade}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="decade" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="newSpeakers" fill="#0ea5e9" radius={[6, 6, 0, 0]} name="New Speakers" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Decade Detail Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.byDecade.map(d => (
              <Card key={d.decade}>
                <CardHeader>
                  <CardTitle className="text-xl">{d.decade}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#524534]">New speakers</span>
                      <span className="font-bold text-sky-600">{d.newSpeakers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#524534]">Total speakers</span>
                      <span className="font-medium">{d.totalSpeakers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#524534]">Total talks</span>
                      <span className="font-medium">{d.totalTalks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#524534]">% first-timers</span>
                      <span className="font-medium">{Math.round(d.newSpeakers / d.totalSpeakers * 100)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
