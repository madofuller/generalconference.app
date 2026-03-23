'use client';

import { useState, useEffect } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { loadInsights, ScriptureHabitsData } from '@/lib/insights';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function ScriptureHabitsPage() {
  const [data, setData] = useState<ScriptureHabitsData | null>(null);

  useEffect(() => {
    loadInsights().then(i => setData(i.scriptureHabits || null));
  }, []);

  if (!data) return <div className="flex min-h-screen"><Navigation /><main className="ml-0 lg:ml-[260px] flex-1 flex items-center justify-center" style={{ background: '#fdf9e9' }}><p className="text-[#1c1c13]/40">Loading...</p></main></div>;

  const chartData = data.speakers.slice(0, 20).map(s => ({
    speaker: s.speaker.length > 18 ? s.speaker.substring(0, 16) + '...' : s.speaker,
    'Book of Mormon': s.bomPct,
    'D&C': s.dcPct,
    'New Testament': s.ntPct,
    'Old Testament': s.otPct,
  }));

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1 pt-20 lg:pt-0" style={{ background: '#fdf9e9' }}>
        <TopAppBar title={data.title} subtitle={data.subtitle} />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24">
          {/* Stacked Bar Chart */}
          <div className="bg-white p-4 md:p-6 lg:p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] mb-6 md:mb-10">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 mb-4">Scripture Volume Breakdown by Speaker (%)</h3>
            <ResponsiveContainer width="100%" height={600}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ece8d9" />
                <XAxis type="number" unit="%" />
                <YAxis type="category" dataKey="speaker" width={140} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Book of Mormon" stackId="a" fill="#3b82f6" />
                <Bar dataKey="D&C" stackId="a" fill="#6366f1" />
                <Bar dataKey="New Testament" stackId="a" fill="#ef4444" />
                <Bar dataKey="Old Testament" stackId="a" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detail Table */}
          <div className="bg-white p-4 md:p-6 lg:p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 mb-4">Raw Numbers</h3>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#ece8d9]">
                  <th className="text-left p-2 text-[10px] uppercase tracking-wider text-[#1c1c13]/40">Speaker</th>
                  <th className="text-right p-2 text-[10px] uppercase tracking-wider text-blue-500">BoM</th>
                  <th className="text-right p-2 text-[10px] uppercase tracking-wider text-indigo-500">D&C</th>
                  <th className="text-right p-2 text-[10px] uppercase tracking-wider text-red-500">NT</th>
                  <th className="text-right p-2 text-[10px] uppercase tracking-wider text-amber-500">OT</th>
                  <th className="text-right p-2 text-[10px] uppercase tracking-wider text-[#1c1c13]/40">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.speakers.slice(0, 30).map(s => (
                  <tr key={s.speaker} className="border-b border-[#ece8d9]/50 hover:bg-[#f8f4e4]/50">
                    <td className="p-2 font-medium text-[#1c1c13]">{s.speaker}</td>
                    <td className="p-2 text-right">{s.bookOfMormon}</td>
                    <td className="p-2 text-right">{s.doctrineCovenants}</td>
                    <td className="p-2 text-right">{s.newTestament}</td>
                    <td className="p-2 text-right">{s.oldTestament}</td>
                    <td className="p-2 text-right font-bold">{s.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
