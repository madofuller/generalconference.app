'use client';

import { useState, useEffect } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { loadInsights, LanguageEvolutionData } from '@/lib/insights';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function LanguagePage() {
  const [data, setData] = useState<LanguageEvolutionData | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    loadInsights().then(i => setData(i.languageEvolution));
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

  const rising = data.phrases.filter(p => p.trend === 'rising');
  const falling = data.phrases.filter(p => p.trend === 'falling');
  const stable = data.phrases.filter(p => p.trend === 'stable');
  const selectedPhrase = data.phrases.find(p => p.phrase === selected);

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1">
        <TopAppBar title="Language of Conference" subtitle="How the words of conference have evolved" />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24 max-w-7xl">

          <Card className="mb-4 md:mb-8 border-violet-200 bg-violet-50/50 overflow-hidden">
            <CardContent className="pt-4 md:pt-6">
              <p className="text-sm md:text-xl font-medium text-violet-900">{data.headline}</p>
            </CardContent>
          </Card>

          {/* Rising Phrases */}
          <div className="mb-4 md:mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" /> Rising
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rising.map(p => (
                <Card
                  key={p.phrase}
                  className={`cursor-pointer transition-all hover:shadow-md ${selected === p.phrase ? 'ring-2 ring-[#1B5E7B]' : ''}`}
                  onClick={() => setSelected(selected === p.phrase ? null : p.phrase)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">&ldquo;{p.phrase}&rdquo;</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-[#524534]">{p.earlyCount} pre-1990</span>
                      <span className="text-green-500 font-bold">&rarr; {p.lateCount} since 2015</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Falling Phrases */}
          <div className="mb-4 md:mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" /> Fading
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {falling.map(p => (
                <Card
                  key={p.phrase}
                  className={`cursor-pointer transition-all hover:shadow-md ${selected === p.phrase ? 'ring-2 ring-[#1B5E7B]' : ''}`}
                  onClick={() => setSelected(selected === p.phrase ? null : p.phrase)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">&ldquo;{p.phrase}&rdquo;</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-[#524534]">{p.earlyCount} pre-1990</span>
                      <span className="text-red-500 font-bold">&rarr; {p.lateCount} since 2015</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Stable Phrases */}
          {stable.length > 0 && (
            <div className="mb-4 md:mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Minus className="h-5 w-5 text-gray-500" /> Steady
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {stable.map(p => (
                  <Card
                    key={p.phrase}
                    className={`cursor-pointer transition-all hover:shadow-md ${selected === p.phrase ? 'ring-2 ring-[#1B5E7B]' : ''}`}
                    onClick={() => setSelected(selected === p.phrase ? null : p.phrase)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">&ldquo;{p.phrase}&rdquo;</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-[#524534]">
                        <span>{p.earlyCount} pre-1990</span>
                        <span>&rarr; {p.lateCount} since 2015</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Detail Chart */}
          {selectedPhrase && (
            <Card>
              <CardHeader>
                <CardTitle>&ldquo;{selectedPhrase.phrase}&rdquo; by Decade</CardTitle>
                <CardDescription>Number of talks containing this phrase</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={selectedPhrase.byDecade}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="decade" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} talks`, 'Count']} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
