'use client';

import { useState, useEffect } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { loadInsights, WomenProfile } from '@/lib/insights';
import Link from 'next/link';

type SortKey = 'talks' | 'name' | 'first' | 'last';
type FilterKey = 'all' | 'relief-society' | 'young-women' | 'primary';

function matchesFilter(p: WomenProfile, filter: FilterKey): boolean {
  const c = p.womenCalling.toLowerCase();
  if (filter === 'all') return true;
  if (filter === 'relief-society') return c.includes('relief society');
  if (filter === 'young-women') return c.includes('young women');
  if (filter === 'primary') return c.includes('primary');
  return true;
}

export default function WomenDirectoryPage() {
  const [profiles, setProfiles] = useState<WomenProfile[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('talks');
  const [filter, setFilter] = useState<FilterKey>('all');

  useEffect(() => {
    loadInsights().then(i => setProfiles(i.womenProfiles || []));
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
    { key: 'relief-society', label: 'Relief Society' },
    { key: 'young-women', label: 'Young Women' },
    { key: 'primary', label: 'Primary' },
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
        <TopAppBar title="Women's Voices" subtitle="Women organization leaders who have spoken in General Conference" />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24">

          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Women Speakers', value: profiles.length },
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
              className="w-full px-4 py-2 rounded-full border border-[#ece8d9] text-sm focus:outline-none focus:border-[#ec4899] mb-3"
            />
            <div className="flex flex-wrap gap-2 mb-3">
              {filters.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                    filter === f.key
                      ? 'bg-[#ec4899] text-white'
                      : 'bg-[#f8f4e4] text-[#1c1c13]/50 hover:bg-[#ec4899]/10'
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
              <Link key={p.slug} href={`/women/${p.slug}`}>
                <div className="bg-white p-4 md:p-6 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] hover:-translate-y-1 transition-all duration-300 cursor-pointer mb-3">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-extrabold text-pink-700">{i + 1}</span>
                    </div>
                    <div className="w-12 h-12 bg-[#ece8d9] rounded-full flex items-center justify-center flex-shrink-0 border-4 border-[#fdf9e9]">
                      <span className="material-symbols-outlined text-[#ec4899] text-2xl">person</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[#1c1c13] text-sm">{p.name}</h3>
                      <p className="text-xs text-pink-600 mb-1">{p.womenCalling}</p>
                      {p.latestCalling !== p.womenCalling && (
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
