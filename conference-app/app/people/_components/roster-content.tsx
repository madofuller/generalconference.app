'use client';

import { useState, useEffect, useMemo } from 'react';
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

function StatusBadge({ r }: { r: RosterEntry }) {
  const isSeventy = r.group === 'General Authority Seventies';
  const c = r.confsSinceLastTalk;

  if (c === 0) return <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">Recent</span>;

  if (isSeventy) {
    if (c >= 13) return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">Due</span>;
    if (c >= 7) return <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold">On Deck</span>;
    return <span className="px-2 py-0.5 rounded-full bg-[#f8f4e4] text-[#1c1c13]/40 text-[10px] font-bold">{c} conf ago</span>;
  }

  if (c >= 2) return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">Due</span>;
  return <span className="px-2 py-0.5 rounded-full bg-[#f8f4e4] text-[#1c1c13]/40 text-[10px] font-bold">{c} conf ago</span>;
}

function NameLink({ r }: { r: RosterEntry }) {
  if (r.slug && (r.group === 'First Presidency' || r.group === 'Quorum of the Twelve')) {
    return <Link href={`/apostles/${r.slug}`} className="font-bold text-[#1B5E7B] hover:underline text-[13px] md:text-sm">{r.name}</Link>;
  }
  if (r.slug && r.group === 'General Authority Seventies') {
    return <Link href={`/seventies/${r.slug}`} className="font-bold text-teal-700 hover:underline text-[13px] md:text-sm">{r.name}</Link>;
  }
  return <span className="font-bold text-[#1c1c13] text-[13px] md:text-sm">{r.name}</span>;
}

export function RosterContent() {
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadInsights().then(i => setRoster(i.roster || []));
  }, []);

  const groups = useMemo(() => {
    const seen = new Set<string>();
    roster.forEach(r => seen.add(r.group));
    return GROUP_ORDER.filter(g => seen.has(g));
  }, [roster]);

  const filtered = useMemo(() => {
    let list = filter === 'all' ? roster : roster.filter(r => r.group === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r => r.name.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      const ga = GROUP_ORDER.indexOf(a.group);
      const gb = GROUP_ORDER.indexOf(b.group);
      if (ga !== gb) return ga - gb;
      return b.confsSinceLastTalk - a.confsSinceLastTalk;
    });
  }, [roster, filter, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, RosterEntry[]>();
    filtered.forEach(r => {
      if (!map.has(r.group)) map.set(r.group, []);
      map.get(r.group)!.push(r);
    });
    return map;
  }, [filtered]);

  return (
    <div className="px-3 md:px-8 lg:px-12 pt-4 md:pt-6 pb-12 md:pb-24">

      {/* Search bar */}
      <div className="relative mb-4">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#1c1c13]/30 text-xl">search</span>
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={e => { setSearch(e.target.value); if (e.target.value.trim()) setFilter('all'); }}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#ece8d9] bg-white text-sm focus:outline-none focus:border-[#1B5E7B] focus:ring-2 focus:ring-[#1B5E7B]/10 shadow-[0px_4px_16px_rgba(27,94,123,0.04)]"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[#ece8d9] transition-colors"
          >
            <span className="material-symbols-outlined text-[#1c1c13]/40 text-lg">close</span>
          </button>
        )}
      </div>

      {/* Filter pills */}
      <div className={`flex overflow-x-auto scrollbar-hide gap-1.5 mb-4 pb-1 ${search.trim() ? 'hidden' : ''}`}>
        <button
          onClick={() => setFilter('all')}
          className={`px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${
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
              className={`px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${
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

      <p className="text-xs text-[#1c1c13]/40 mb-4">{filtered.length} speakers{search && ` matching "${search}"`}</p>

      {/* Grouped sections */}
      <div className="space-y-6 md:space-y-8">
        {Array.from(grouped.entries()).map(([group, entries]) => (
          <div key={group}>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 mb-1">{group}</h2>
            {group === 'General Authority Seventies' && (
              <p className="text-[10px] text-[#1c1c13]/40 mb-3">Seventies speak in General Conference on average every 7 years</p>
            )}

            {/* Desktop: table */}
            <div className="hidden md:block bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f8f4e4] text-left">
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60">Name</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60">Calling</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 text-right">Talks</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60">Last Talk</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 text-right">Confs Since</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(r => (
                    <tr key={r.slug || r.name} className="border-b border-[#ece8d9] hover:bg-[#f8f4e4]/50 transition-colors">
                      <td className="px-6 py-3"><NameLink r={r} /></td>
                      <td className="px-6 py-3 text-[#1c1c13]/60 text-xs">{r.calling}</td>
                      <td className="px-6 py-3 text-right font-bold text-[#1c1c13]">{r.totalTalks}</td>
                      <td className="px-6 py-3 text-[#1c1c13]/60 text-xs">{r.lastTalkSeason} {r.lastTalkYear}</td>
                      <td className="px-6 py-3 text-right font-bold text-[#1c1c13]">{r.confsSinceLastTalk}</td>
                      <td className="px-6 py-3"><StatusBadge r={r} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: compact cards */}
            <div className="md:hidden space-y-1.5">
              {entries.map(r => (
                <div key={r.slug || r.name} className="bg-white px-3 py-2.5 rounded-xl shadow-[0px_4px_16px_rgba(27,94,123,0.04)]">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <NameLink r={r} />
                        <StatusBadge r={r} />
                      </div>
                      <p className="text-[10px] text-[#1c1c13]/40 mt-0.5 truncate">{r.calling}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-extrabold text-[#1c1c13]">{r.totalTalks}</p>
                      <p className="text-[9px] text-[#1c1c13]/40">{r.lastTalkSeason} {r.lastTalkYear}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
