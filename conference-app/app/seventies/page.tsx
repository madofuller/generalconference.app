'use client';

import { useState, useEffect } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { loadInsights, SeventyProfile } from '@/lib/insights';
import Link from 'next/link';

type SortKey = 'talks' | 'name' | 'first' | 'last';
type FilterKey = 'all' | 'presidency' | 'first-quorum' | 'first-council' | 'other';

function matchesFilter(p: SeventyProfile, filter: FilterKey): boolean {
  const c = p.seventyCalling;
  if (filter === 'all') return true;
  if (filter === 'presidency') return c.includes('Presidency of the Seventy') || c.includes('Presidency of the First Quorum');
  if (filter === 'first-quorum') return c.includes('First Quorum of the Seventy');
  if (filter === 'first-council') return c.includes('First Council of the Seventy');
  return !c.includes('Presidency') && !c.includes('First Quorum') && !c.includes('First Council');
}

export default function SeventiesPage() {
  const [profiles, setProfiles] = useState<SeventyProfile[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('talks');
  const [filter, setFilter] = useState<FilterKey>('all');

  useEffect(() => {
    loadInsights().then(i => setProfiles(i.seventyProfiles || []));
  }, []);

  const filtered = profiles
    .filter(p => matchesFilter(p, filter))
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'talks') return b.totalTalks - a.totalTalks;
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'first') return (a.firstTalk || 9999) - (b.firstTalk || 9999);
      return (b.lastTalk || 0) - (a.lastTalk || 0);
    });

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'presidency', label: 'Presidency of 70' },
    { key: 'first-quorum', label: 'First Quorum' },
    { key: 'first-council', label: 'First Council' },
    { key: 'other', label: 'Other Seventy' },
  ];

  const sorts: { key: SortKey; label: string }[] = [
    { key: 'talks', label: 'Most Talks' },
    { key: 'name', label: 'Name' },
    { key: 'first', label: 'First Talk' },
    { key: 'last', label: 'Most Recent' },
  ];

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1 pt-20 lg:pt-0" style={{ background: '#fdf9e9' }}>
        <TopAppBar title="The Seventies" subtitle="Every member of the Seventy who has spoken in General Conference" />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24">

          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Seventy Speakers', value: profiles.length },
              { label: 'Total Talks', value: profiles.reduce((s, p) => s + p.totalTalks, 0) },
              { label: 'Earliest', value: profiles.length ? Math.min(...profiles.map(p => p.firstTalk || 9999)) : '—' },
              { label: 'Most Recent', value: profiles.length ? Math.max(...profiles.map(p => p.lastTalk || 0)) : '—' },
            ].map(stat => (
              <div key={stat.label} className="bg-white p-4 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] text-center">
                <p className="text-xl md:text-2xl font-extrabold text-[#1c1c13]">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-wider text-[#1c1c13]/40 font-bold mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Search & Filters */}
          <div className="bg-white p-4 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] mb-6">
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-4 py-2 rounded-full border border-[#ece8d9] text-sm focus:outline-none focus:border-[#1B5E7B] mb-3"
            />
            <div className="flex flex-wrap gap-2 mb-3">
              {filters.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                    filter === f.key
                      ? 'bg-[#1B5E7B] text-white'
                      : 'bg-[#f8f4e4] text-[#1c1c13]/50 hover:bg-[#1B5E7B]/10'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {sorts.map(s => (
                <button
                  key={s.key}
                  onClick={() => setSort(s.key)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                    sort === s.key
                      ? 'bg-[#f5a623] text-white'
                      : 'bg-[#f8f4e4] text-[#1c1c13]/50 hover:bg-[#f5a623]/10'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Count */}
          <p className="text-xs text-[#1c1c13]/40 mb-4">{filtered.length} speakers</p>

          {/* Cards */}
          <div className="space-y-3">
            {filtered.map((p, i) => (
              <Link key={p.slug} href={`/seventies/${p.slug}`}>
                <div className="bg-white p-4 md:p-6 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] hover:-translate-y-1 transition-all duration-300 cursor-pointer mb-3">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-extrabold text-teal-700">{i + 1}</span>
                    </div>
                    <div className="w-12 h-12 bg-[#ece8d9] rounded-full flex items-center justify-center flex-shrink-0 border-4 border-[#fdf9e9]">
                      <span className="material-symbols-outlined text-[#1B5E7B] text-2xl">person</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[#1c1c13] text-sm">{p.name}</h3>
                      <p className="text-xs text-teal-600 mb-1">{p.seventyCalling}</p>
                      {p.latestCalling !== p.seventyCalling && (
                        <p className="text-[10px] text-[#1c1c13]/40">Latest: {p.latestCalling}</p>
                      )}
                      <p className="text-[10px] text-[#1c1c13]/40">{p.firstTalk}&ndash;{p.lastTalk} &middot; {p.totalConferences || 0} conferences</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-extrabold text-[#1c1c13]">{p.totalTalks}</p>
                      <p className="text-[10px] uppercase tracking-wider text-[#1c1c13]/40 font-bold">Talks</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
