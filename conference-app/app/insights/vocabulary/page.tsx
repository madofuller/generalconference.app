'use client';

import { useState, useEffect } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { loadInsights, VocabularyData } from '@/lib/insights';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function VocabularyPage() {
  const [data, setData] = useState<VocabularyData | null>(null);

  useEffect(() => {
    loadInsights().then(i => setData(i.vocabulary));
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

  const top15 = data.speakers.slice(0, 15).map(s => ({
    ...s,
    label: s.speaker.length > 20 ? s.speaker.substring(0, 18) + '...' : s.speaker,
  }));

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1">
        <TopAppBar title="Most Unique Voice" subtitle="Speakers with the most distinctive vocabulary" />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24 max-w-7xl">

          <Card className="mb-4 md:mb-8 border-indigo-200 bg-indigo-50/50">
            <CardContent className="pt-6">
              <p className="text-xl font-medium text-indigo-900">{data.headline}</p>
            </CardContent>
          </Card>

          {/* Chart */}
          <Card className="mb-4 md:mb-8">
            <CardHeader>
              <CardTitle>Unique Words by Speaker</CardTitle>
              <CardDescription>Words used by this speaker that no other conference speaker has ever used (speakers with 15+ talks)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={500}>
                <BarChart data={top15} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="label" width={150} tick={{ fontSize: 12 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const s = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg text-sm max-w-xs">
                          <p className="font-bold">{s.speaker}</p>
                          <p>{s.uniqueWords} unique words out of {s.totalVocabulary.toLocaleString()} total vocabulary</p>
                          <p className="text-[#524534]">{s.talks} talks, {s.totalWordsSpoken.toLocaleString()} words spoken</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="uniqueWords" fill="#6366f1" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Speaker Detail Cards */}
          <div className="space-y-4">
            {data.speakers.slice(0, 10).map((s, i) => (
              <Card key={s.speaker}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <span className="text-xl md:text-3xl font-bold text-[#524534]">#{i + 1}</span>
                    <div className="flex-1">
                      <CardTitle>{s.speaker}</CardTitle>
                      <CardDescription>{s.talks} talks &middot; {s.uniqueWords} unique words &middot; {s.totalVocabulary.toLocaleString()} total vocabulary</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                {s.sampleUniqueWords.length > 0 && (
                  <CardContent>
                    <p className="text-sm text-[#524534] mb-2">Sample words only they have used:</p>
                    <div className="flex flex-wrap gap-2">
                      {s.sampleUniqueWords.map(word => (
                        <span key={word} className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                          {word}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
