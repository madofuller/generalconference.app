'use client';

import { useState, useEffect } from 'react';
import { loadInsights, WomenProfile } from '@/lib/insights';
import Link from 'next/link';

type SortKey = 'talks' | 'name' | 'first' | 'last';
type FilterKey = 'all' | 'relief-society' | 'young-women' | 'primary';

function cleanCallingLabel(value?: string): string {
  if (!value) return '';
  return value
    .replace(/^recently released(?:\s+as)?\s+/i, '')
    .trim();
}

function matchesFilter(p: WomenProfile, filter: FilterKey): boolean {
  const c = p.womenCalling.toLowerCase();
  if (filter === 'all') return true;
  if (filter === 'relief-society') return c.includes('relief society');
  if (filter === 'young-women') return c.includes('young women');
  if (filter === 'primary') return c.includes('primary');
  return true;
}

export function WomenContent() {
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
    <div className="px-3 md:px-8 lg:px-12 pt-4 md:pt-6 pb-12 md:pb-24">

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Speakers', value: profiles.length },
          { label: 'Total Talks', value: profiles.reduce((s, p) => s + p.totalTalks, 0) },
          { label: 'Earliest', value: profiles.length ? Math.min(...profiles.map(p => p.firstTalk || 9999)) : '—' },
          { label: 'Most Recent', value: profiles.length ? Math.max(...profiles.map(p => p.lastTalk || 0)) : '—' },
        ].map(stat => (
          <div key={stat.label} className="bg-white p-3 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] text-center">
            <p className="text-lg md:text-2xl font-extrabold text-[#1c1c13]">{stat.value}</p>
            <p className="text-[9px] md:text-[10px] uppercase tracking-wider text-[#1c1c13]/40 font-bold mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-3 md:p-4 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] mb-6">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={e => { setSearch(e.target.value); if (e.target.value.trim()) setFilter('all'); }}
          className="w-full px-4 py-2 rounded-full border border-[#ece8d9] text-sm focus:outline-none focus:border-[#1B5E7B] mb-3"
        />
        <div className={`flex flex-wrap gap-1.5 mb-2.5 ${search.trim() ? 'hidden' : ''}`}>
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${
                filter === f.key
                  ? 'bg-[#1B5E7B] text-white'
                  : 'bg-[#f8f4e4] text-[#1c1c13]/50 hover:bg-[#1B5E7B]/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className={`flex flex-wrap gap-1.5 ${search.trim() ? 'hidden' : ''}`}>
          {sorts.map(s => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={`px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${
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
      <div className="space-y-2 md:space-y-3">
        {filtered.map((p, i) => (
          <Link key={p.slug} href={`/women/${p.slug}`}>
            <div className="bg-white p-3 md:p-5 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer mb-2 md:mb-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-[#ece8d9] rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#1B5E7B] text-xl md:text-2xl">person</span>
                  </div>
                  <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-[#1B5E7B] flex items-center justify-center">
                    <span className="text-[9px] font-extrabold text-white">{i + 1}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  {(() => {
                    const primaryCalling = cleanCallingLabel(p.womenCalling);
                    const latestCalling = cleanCallingLabel(p.latestCalling);
                    return (
                      <>
                  <h3 className="font-bold text-[#1c1c13] text-[13px] md:text-sm truncate">{p.name}</h3>
                  <p className="text-[11px] text-[#1B5E7B] truncate">{primaryCalling}</p>
                  <p className="text-[10px] text-[#1c1c13]/40">
                    {p.firstTalk}&ndash;{p.lastTalk}
                    <span className="hidden sm:inline"> &middot; {p.totalConferences || 0} conf.</span>
                    {latestCalling && latestCalling !== primaryCalling && (
                      <span className="hidden md:inline"> &middot; Now: {latestCalling}</span>
                    )}
                  </p>
                      </>
                    );
                  })()}
                </div>
                <div className="text-right flex-shrink-0 pl-2">
                  <p className="text-xl md:text-2xl font-extrabold text-[#1c1c13]">{p.totalTalks}</p>
                  <p className="text-[9px] uppercase tracking-wider text-[#1c1c13]/40 font-bold">Talks</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
