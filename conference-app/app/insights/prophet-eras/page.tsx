'use client';

import { useState, useEffect } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { loadInsights, ProphetErasData } from '@/lib/insights';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ProphetErasPage() {
  const [data, setData] = useState<ProphetErasData | null>(null);

  useEffect(() => {
    loadInsights().then(i => setData(i.prophetEras));
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
        <TopAppBar title="Each Prophet's Era" subtitle="How conference themes shift with each prophet" />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24 max-w-7xl">

          <Card className="mb-4 md:mb-8 border-yellow-200 bg-yellow-50/50 overflow-hidden">
            <CardContent className="pt-4 md:pt-6">
              <p className="text-sm md:text-xl font-medium text-yellow-900">{data.headline}</p>
            </CardContent>
          </Card>

          {/* Christ Mentions Comparison */}
          <Card className="mb-4 md:mb-8">
            <CardHeader>
              <CardTitle>Christ Mentions Per Talk by Era</CardTitle>
              <CardDescription>Average references to Jesus Christ, Savior, Redeemer per talk</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.eras}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="prophet" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="christMentionsPerTalk" fill="#eab308" radius={[6, 6, 0, 0]} name="Avg mentions" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Era Cards */}
          <div className="space-y-4 md:space-y-6">
            {data.eras.map(era => (
              <Card key={era.prophet}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{era.prophet}</CardTitle>
                      <CardDescription>{era.startYear}–{era.endYear}</CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{era.totalTalks}</p>
                      <p className="text-xs text-[#524534]">talks</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-[#524534]">Speakers</p>
                      <p className="text-lg font-bold">{era.uniqueSpeakers}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#524534]">Avg words/talk</p>
                      <p className="text-lg font-bold">{era.avgWordsPerTalk.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#524534]">Christ mentions/talk</p>
                      <p className="text-lg font-bold">{era.christMentionsPerTalk}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#524534]">Est. talk length</p>
                      <p className="text-lg font-bold">{Math.round(era.avgWordsPerTalk / 150)}m</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-[#524534] mb-2">Defining words of this era:</p>
                    <div className="flex flex-wrap gap-2">
                      {era.topWords.map(word => (
                        <span key={word} className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">
                          {word}
                        </span>
                      ))}
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
