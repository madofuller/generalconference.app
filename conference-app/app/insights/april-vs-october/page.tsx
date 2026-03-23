'use client';

import { useState, useEffect } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { loadInsights, AprilVsOctoberData } from '@/lib/insights';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function AprilVsOctoberPage() {
  const [data, setData] = useState<AprilVsOctoberData | null>(null);

  useEffect(() => {
    loadInsights().then(i => setData(i.aprilVsOctober || null));
  }, []);

  if (!data) return <div className="flex min-h-screen"><Navigation /><main className="ml-0 lg:ml-[260px] flex-1 flex items-center justify-center" style={{ background: '#fdf9e9' }}><p className="text-[#1c1c13]/40">Loading...</p></main></div>;

  const comparison = [
    { metric: 'Total Talks', april: data.april.totalTalks, october: data.october.totalTalks },
    { metric: 'Avg Words/Talk', april: data.april.avgWords, october: data.october.avgWords },
    { metric: 'Christ Mentions/Talk', april: data.april.avgChristMentions, october: data.october.avgChristMentions },
    { metric: 'Unique Speakers', april: data.april.uniqueSpeakers, october: data.october.uniqueSpeakers },
  ];

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1" style={{ background: '#fdf9e9' }}>
        <TopAppBar title={data.title} subtitle={data.subtitle} />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24">
          {/* Comparison Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-10">
            {comparison.map(c => (
              <div key={c.metric} className="bg-white p-6 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#1c1c13]/40 font-bold mb-3">{c.metric}</p>
                <div className="flex justify-between items-end">
                  <div className="text-center">
                    <p className="text-2xl font-extrabold text-[#E8B931]">{c.april}</p>
                    <p className="text-[10px] text-[#E8B931] font-bold">APRIL</p>
                  </div>
                  <span className="text-[#1c1c13]/20 text-lg">vs</span>
                  <div className="text-center">
                    <p className="text-2xl font-extrabold text-[#2B7A9E]">{c.october}</p>
                    <p className="text-[10px] text-[#2B7A9E] font-bold">OCTOBER</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Talks Per Year */}
          <div className="bg-white p-4 md:p-6 lg:p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] mb-6 md:mb-10">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 mb-4">Talks Per Session by Year</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data.byYear}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ece8d9" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="aprilTalks" fill="#E8B931" name="April" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="octoberTalks" fill="#2B7A9E" name="October" radius={[2, 2, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Avg Words */}
          <div className="bg-white p-4 md:p-6 lg:p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 mb-4">Avg Words Per Talk by Year</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data.byYear.filter(d => d.aprilAvgWords > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ece8d9" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="aprilAvgWords" fill="#E8B931" name="April" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="octoberAvgWords" fill="#2B7A9E" name="October" radius={[2, 2, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
