'use client';

import { useState, useEffect } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { loadInsights, RosterEntry } from '@/lib/insights';

export default function RosterPage() {
  const [roster, setRoster] = useState<RosterEntry[]>([]);

  useEffect(() => {
    loadInsights().then(i => setRoster(i.roster || []));
  }, []);

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1" style={{ background: '#fdf9e9' }}>
        <TopAppBar title="Speaker Roster" subtitle="Current leaders and when they last spoke" />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24">
          <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f8f4e4] text-left">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60">Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60">Calling</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 text-right">Total Talks</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60">Last Talk</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 text-right">Confs Since</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 text-right">Recent (5yr)</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60">Status</th>
                </tr>
              </thead>
              <tbody>
                {roster.map(r => {
                  const overdue = r.confsSinceLastTalk >= 2;
                  const recent = r.confsSinceLastTalk === 0;
                  return (
                    <tr key={r.slug} className="border-b border-[#ece8d9] hover:bg-[#f8f4e4]/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-[#1c1c13]">{r.name}</td>
                      <td className="px-6 py-4 text-[#1c1c13]/60 text-xs">{r.calling}</td>
                      <td className="px-6 py-4 text-right font-bold text-[#1c1c13]">{r.totalTalks}</td>
                      <td className="px-6 py-4 text-[#1c1c13]/60">{r.lastTalkSeason} {r.lastTalkYear}</td>
                      <td className="px-6 py-4 text-right font-bold text-[#1c1c13]">{r.confsSinceLastTalk}</td>
                      <td className="px-6 py-4 text-right text-[#1c1c13]">{r.recentTalks}</td>
                      <td className="px-6 py-4">
                        {recent && (
                          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">Recent</span>
                        )}
                        {overdue && (
                          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">Due</span>
                        )}
                        {!recent && !overdue && (
                          <span className="px-3 py-1 rounded-full bg-[#f8f4e4] text-[#1B5E7B] text-xs font-bold">Active</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
