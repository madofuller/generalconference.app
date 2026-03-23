'use client';

import { useState, useEffect, useMemo } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { loadInsights, RosterEntry } from '@/lib/insights';
import Link from 'next/link';

const GROUP_ORDER = [
  'First Presidency',
  'Quorum of the Twelve',
  'Presidency of the Seventy',
  'General Authority Seventies',
  'Presiding Bishopric',
  'Relief Society',
  'Young Women',
  'Primary',
  'Young Men',
  'Sunday School',
];

export default function RosterPage() {
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadInsights().then(i => setRoster(i.roster || []));
  }, []);

  const groups = useMemo(() => {
    const seen = new Set<string>();
    roster.forEach(r => seen.add(r.group));
    return GROUP_ORDER.filter(g => seen.has(g));
  }, [roster]);

  const filtered = useMemo(() => {
    const list = filter === 'all' ? roster : roster.filter(r => r.group === filter);
    // Sort by group order, then by confs since last talk (descending)
    return [...list].sort((a, b) => {
      const ga = GROUP_ORDER.indexOf(a.group);
      const gb = GROUP_ORDER.indexOf(b.group);
      if (ga !== gb) return ga - gb;
      return b.confsSinceLastTalk - a.confsSinceLastTalk;
    });
  }, [roster, filter]);

  // Group the filtered results
  const grouped = useMemo(() => {
    const map = new Map<string, RosterEntry[]>();
    filtered.forEach(r => {
      if (!map.has(r.group)) map.set(r.group, []);
      map.get(r.group)!.push(r);
    });
    return map;
  }, [filtered]);

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1" style={{ background: '#fdf9e9' }}>
        <TopAppBar title="Who's Due to Speak" subtitle="Current leaders and when they last spoke" />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24">

          {/* Filter pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                filter === 'all'
                  ? 'bg-[#1B5E7B] text-white'
                  : 'bg-[#f8f4e4] text-[#1c1c13]/50 hover:bg-[#1B5E7B]/10'
              }`}
            >
              All ({roster.length})
            </button>
            {groups.map(g => {
              const count = roster.filter(r => r.group === g).length;
              return (
                <button
                  key={g}
                  onClick={() => setFilter(g)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                    filter === g
                      ? 'bg-[#1B5E7B] text-white'
                      : 'bg-[#f8f4e4] text-[#1c1c13]/50 hover:bg-[#1B5E7B]/10'
                  }`}
                >
                  {g} ({count})
                </button>
              );
            })}
          </div>

          {/* Grouped tables */}
          <div className="space-y-8">
            {Array.from(grouped.entries()).map(([group, entries]) => (
              <div key={group}>
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 mb-1">{group}</h2>
                {group === 'General Authority Seventies' && (
                  <p className="text-[10px] text-[#1c1c13]/40 mb-3">Seventies speak in General Conference on average every 7 years</p>
                )}
                <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#f8f4e4] text-left">
                        <th className="px-4 md:px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60">Name</th>
                        <th className="px-4 md:px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 hidden sm:table-cell">Calling</th>
                        <th className="px-4 md:px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 text-right">Talks</th>
                        <th className="px-4 md:px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60">Last Talk</th>
                        <th className="px-4 md:px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 text-right hidden md:table-cell">Confs Since</th>
                        <th className="px-4 md:px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map(r => {
                        const isSeventy = r.group === 'General Authority Seventies';
                        const c = r.confsSinceLastTalk;
                        const recent = c === 0;
                        const overdue = isSeventy ? c >= 13 : c >= 2;
                        const onDeck = isSeventy && c >= 7 && c < 13;
                        return (
                          <tr key={r.slug || r.name} className="border-b border-[#ece8d9] hover:bg-[#f8f4e4]/50 transition-colors">
                            <td className="px-4 md:px-6 py-3">
                              {r.slug && (r.group === 'First Presidency' || r.group === 'Quorum of the Twelve') ? (
                                <Link href={`/apostles/${r.slug}`} className="font-bold text-[#1B5E7B] hover:underline text-sm">{r.name}</Link>
                              ) : r.slug && r.group === 'General Authority Seventies' ? (
                                <Link href={`/seventies/${r.slug}`} className="font-bold text-teal-700 hover:underline text-sm">{r.name}</Link>
                              ) : (
                                <span className="font-bold text-[#1c1c13] text-sm">{r.name}</span>
                              )}
                              <span className="block sm:hidden text-[10px] text-[#1c1c13]/40 mt-0.5">{r.calling}</span>
                            </td>
                            <td className="px-4 md:px-6 py-3 text-[#1c1c13]/60 text-xs hidden sm:table-cell">{r.calling}</td>
                            <td className="px-4 md:px-6 py-3 text-right font-bold text-[#1c1c13]">{r.totalTalks}</td>
                            <td className="px-4 md:px-6 py-3 text-[#1c1c13]/60 text-xs">{r.lastTalkSeason} {r.lastTalkYear}</td>
                            <td className="px-4 md:px-6 py-3 text-right font-bold text-[#1c1c13] hidden md:table-cell">{r.confsSinceLastTalk}</td>
                            <td className="px-4 md:px-6 py-3">
                              {recent && (
                                <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">Recent</span>
                              )}
                              {onDeck && (
                                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold">On Deck</span>
                              )}
                              {overdue && (
                                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">Due</span>
                              )}
                              {!recent && !overdue && !onDeck && (
                                <span className="px-2.5 py-1 rounded-full bg-[#f8f4e4] text-[#1c1c13]/40 text-[10px] font-bold">{c} conf ago</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
