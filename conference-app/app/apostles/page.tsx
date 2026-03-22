'use client';

import { useState, useEffect } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { loadInsights, ApostleProfile } from '@/lib/insights';
import Link from 'next/link';

export default function ApostlesPage() {
  const [profiles, setProfiles] = useState<ApostleProfile[]>([]);

  useEffect(() => {
    loadInsights().then(i => setProfiles(i.apostleProfiles || []));
  }, []);

  // Sort by ordination date (seniority = succession order)
  const sorted = [...profiles].sort((a, b) => a.ordained_apostle - b.ordained_apostle);
  const fpOrder = (p: ApostleProfile) =>
    p.calling.includes('President of the Church') ? 0 :
    p.calling.includes('First Counselor') ? 1 : 2;
  const firstPresidency = sorted.filter(p => p.group === 'First Presidency').sort((a, b) => fpOrder(a) - fpOrder(b));
  const quorum = sorted.filter(p => p.group === 'Quorum of the Twelve');

  function ProfileCard({ p, rank, size = 'normal' }: { p: ApostleProfile; rank?: number; size?: 'large' | 'normal' }) {
    const isLarge = size === 'large';
    return (
      <Link key={p.slug} href={`/apostles/${p.slug}`}>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] hover:-translate-y-1 transition-all duration-300 cursor-pointer">
          <div className="flex items-start gap-4">
            {rank !== undefined && (
              <div className="w-8 h-8 rounded-full bg-[#f5a623]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-extrabold text-[#835500]">{rank}</span>
              </div>
            )}
            <div className={`${isLarge ? 'w-16 h-16' : 'w-12 h-12'} bg-[#ece8d9] rounded-full flex items-center justify-center flex-shrink-0 border-4 border-[#fdf9e9]`}>
              <span className={`material-symbols-outlined text-[#1B5E7B] ${isLarge ? 'text-3xl' : 'text-2xl'}`}>person</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold text-[#1c1c13] ${isLarge ? 'text-lg' : 'text-sm'}`}>{p.name}</h3>
              <p className="text-xs text-[#1B5E7B] mb-2">{p.calling}</p>
              <p className="text-[10px] text-[#1c1c13]/40">Ordained {p.ordained_apostle} &middot; {p.totalTalks} talks &middot; First talk {p.firstTalk || '—'}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-extrabold text-[#1c1c13]">{p.totalTalks}</p>
              <p className="text-[10px] uppercase tracking-wider text-[#1c1c13]/40 font-bold">Talks</p>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1" style={{ background: '#fdf9e9' }}>
        <TopAppBar title="The Apostles" subtitle="Current First Presidency & Quorum of the Twelve, ordered by seniority" />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24">

          {/* Succession explainer */}
          <div className="bg-white p-5 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] mb-8">
            <p className="text-sm text-[#1c1c13]/60">
              Ordered by apostolic seniority (date ordained). This is the order of succession for the presidency of the Church.
            </p>
          </div>

          {/* First Presidency */}
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 mb-4 mt-4">First Presidency</h2>
          <div className="space-y-3 mb-10">
            {firstPresidency.map((p, i) => (
              <ProfileCard key={p.slug} p={p} size="large" />
            ))}
          </div>

          {/* Quorum of the Twelve */}
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 mb-4">Quorum of the Twelve Apostles</h2>
          <p className="text-xs text-[#1c1c13]/40 mb-4">Ordered by seniority &mdash; the senior apostle (top) would be next in line for the presidency</p>
          <div className="space-y-3">
            {quorum.map((p, i) => (
              <ProfileCard key={p.slug} p={p} rank={i + 1} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
