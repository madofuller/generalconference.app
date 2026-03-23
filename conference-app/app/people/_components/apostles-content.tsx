'use client';

import { useState, useEffect } from 'react';
import { loadInsights, ApostleProfile } from '@/lib/insights';
import Link from 'next/link';

function ProfileCard({ p, rank, size = 'normal' }: { p: ApostleProfile; rank?: number; size?: 'large' | 'normal' }) {
  const isLarge = size === 'large';
  return (
    <Link key={p.slug} href={`/apostles/${p.slug}`}>
      <div className="bg-white p-3 md:p-5 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
        <div className="flex items-center gap-3">
          {/* Avatar with rank badge */}
          <div className="relative flex-shrink-0">
            <div className={`${isLarge ? 'w-12 h-12 md:w-16 md:h-16' : 'w-10 h-10 md:w-12 md:h-12'} bg-[#ece8d9] rounded-full flex items-center justify-center`}>
              <span className={`material-symbols-outlined text-[#1B5E7B] ${isLarge ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'}`}>person</span>
            </div>
            {rank !== undefined && (
              <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-[#f5a623] flex items-center justify-center">
                <span className="text-[9px] font-extrabold text-white">{rank}</span>
              </div>
            )}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className={`font-bold text-[#1c1c13] truncate ${isLarge ? 'text-sm md:text-lg' : 'text-[13px] md:text-sm'}`}>{p.name}</h3>
            <p className="text-[11px] md:text-xs text-[#1B5E7B] truncate">{p.calling}</p>
            <p className="text-[10px] text-[#1c1c13]/40 truncate">
              Ordained {p.ordained_apostle}
              <span className="hidden sm:inline"> &middot; {p.totalTalks} talks &middot; First talk {p.firstTalk || '—'}</span>
            </p>
          </div>
          {/* Talk count */}
          <div className="text-right flex-shrink-0 pl-2">
            <p className="text-xl md:text-2xl font-extrabold text-[#1c1c13]">{p.totalTalks}</p>
            <p className="text-[9px] uppercase tracking-wider text-[#1c1c13]/40 font-bold">Talks</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ApostlesContent() {
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

  return (
    <div className="px-3 md:px-8 lg:px-12 pt-4 md:pt-6 pb-12 md:pb-24">

      {/* Succession explainer */}
      <div className="bg-white p-4 md:p-5 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] mb-6 md:mb-8">
        <p className="text-xs md:text-sm text-[#1c1c13]/60">
          Ordered by apostolic seniority (date ordained). This is the order of succession for the presidency of the Church.
        </p>
      </div>

      {/* First Presidency */}
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 mb-3 mt-4">First Presidency</h2>
      <div className="space-y-2 md:space-y-3 mb-8 md:mb-10">
        {firstPresidency.map((p) => (
          <ProfileCard key={p.slug} p={p} size="large" />
        ))}
      </div>

      {/* Quorum of the Twelve */}
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 mb-2">Quorum of the Twelve Apostles</h2>
      <p className="text-[10px] md:text-xs text-[#1c1c13]/40 mb-3 md:mb-4">Ordered by seniority &mdash; the senior apostle (top) would be next in line for the presidency</p>
      <div className="space-y-2 md:space-y-3">
        {quorum.map((p, i) => (
          <ProfileCard key={p.slug} p={p} rank={i + 1} />
        ))}
      </div>
    </div>
  );
}
