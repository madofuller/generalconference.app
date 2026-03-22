'use client';

import { useState, useEffect } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { loadInsights, ChristTrackerData } from '@/lib/insights';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function ChristTrackerPage() {
  const [data, setData] = useState<ChristTrackerData | null>(null);

  useEffect(() => {
    loadInsights().then(i => setData(i.christTracker));
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
        <TopAppBar title="The Name of Christ" subtitle="How Christ is referenced across conference" />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24 max-w-7xl">

          <Card className="mb-4 md:mb-8 border-rose-200 bg-rose-50/50">
            <CardContent className="pt-6">
              <p className="text-xl font-medium text-rose-900">{data.headline}</p>
            </CardContent>
          </Card>

          {/* Main Line Chart */}
          <Card className="mb-4 md:mb-8">
            <CardHeader>
              <CardTitle>Average Christ/Savior/Redeemer Mentions Per Talk</CardTitle>
              <CardDescription>Each point represents one year of conference</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data.byYear}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`${value} mentions`, 'Avg per talk']}
                    labelFormatter={(label) => `Year: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgMentions"
                    stroke="#e11d48"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Decade Summary */}
          <Card className="mb-4 md:mb-8">
            <CardHeader>
              <CardTitle>By Decade</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.byDecade}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="decade" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} avg mentions`, 'Per talk']} />
                  <Bar dataKey="avgMentions" fill="#e11d48" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-[#524534]">
                This trend accelerated dramatically under President Nelson, who made the proper use of the Church&apos;s name
                and the centrality of Jesus Christ a hallmark of his administration. The 2020s show nearly 25 mentions of
                Christ per talk — a clear, measurable shift in how speakers frame their messages.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
