'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Navigation, TopAppBar } from '@/components/navigation';
import { loadInsights, SeventyProfile } from '@/lib/insights';
import { SPEAKER_ALIASES } from '@/lib/data-loader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

function deduplicateProfiles(raw: SeventyProfile[]): SeventyProfile[] {
  const merged = new Map<string, SeventyProfile>();
  for (const p of raw) {
    const canonical = SPEAKER_ALIASES[p.name] || p.name;
    if (merged.has(canonical)) {
      const existing = merged.get(canonical)!;
      existing.totalTalks += p.totalTalks;
      existing.totalConferences = (existing.totalConferences || 0) + (p.totalConferences || 0);
      if (p.firstTalk && (!existing.firstTalk || p.firstTalk < existing.firstTalk)) existing.firstTalk = p.firstTalk;
      if (p.lastTalk && (!existing.lastTalk || p.lastTalk > existing.lastTalk)) existing.lastTalk = p.lastTalk;
      if (p.talks) existing.talks = [...(existing.talks || []), ...p.talks];
      if (p.yearsActive) existing.yearsActive = [...new Set([...(existing.yearsActive || []), ...p.yearsActive])];
    } else {
      merged.set(canonical, { ...p, name: canonical, slug: canonical.toLowerCase().replace(/[^a-z0-9]+/g, '-') });
    }
  }
  return [...merged.values()];
}

export default function SeventyDetailPage() {
  const params = useParams();
  const [profile, setProfile] = useState<SeventyProfile | null>(null);

  useEffect(() => {
    loadInsights().then(i => {
      const profiles = deduplicateProfiles(i.seventyProfiles || []);
      const p = profiles.find(a => a.slug === params.slug);
      setProfile(p || null);
    });
  }, [params.slug]);

  if (!profile) {
    return (
      <div className="flex min-h-screen">
        <Navigation />
        <main className="ml-0 lg:ml-[260px] flex-1 flex items-center justify-center" style={{ background: '#fdf9e9' }}>
          <p className="text-[#1c1c13]/40">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1" style={{ background: '#fdf9e9' }}>
        <TopAppBar title={profile.name} subtitle={profile.seventyCalling} />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24">

          {/* Calling info */}
          {profile.latestCalling !== profile.seventyCalling && (
            <div className="bg-teal-50 border border-teal-200 p-4 rounded-xl mb-6">
              <p className="text-sm text-teal-800">
                <span className="font-bold">Latest calling:</span> {profile.latestCalling}
              </p>
            </div>
          )}

          {/* Hero Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-10">
            {[
              { label: 'Total Talks', value: profile.totalTalks },
              { label: 'Conferences', value: profile.totalConferences || 0 },
              { label: 'First Talk', value: profile.firstTalk || '—' },
              { label: 'Avg Words', value: profile.avgWordsPerTalk?.toLocaleString() || '—' },
              { label: 'Christ/Talk', value: profile.avgChristMentions || '—' },
            ].map(stat => (
              <div key={stat.label} className="bg-white p-4 md:p-6 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] text-center">
                <p className="text-xl md:text-3xl font-extrabold text-[#1c1c13]">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-wider text-[#1c1c13]/40 font-bold mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 mb-10">
            {/* Top Words */}
            {profile.topWords && profile.topWords.length > 0 && (
              <div className="bg-white p-4 md:p-6 lg:p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 mb-4">Defining Words</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.topWords.map(w => (
                    <span key={w} className="px-3 py-1.5 rounded-full bg-teal-500/10 text-teal-700 text-sm font-bold">{w}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Signature Phrases */}
            {profile.signaturePhrases && profile.signaturePhrases.length > 0 && (
              <div className="bg-white p-4 md:p-6 lg:p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 mb-4">Signature Phrases</h3>
                <div className="space-y-2">
                  {profile.signaturePhrases.slice(0, 8).map(sp => (
                    <div key={sp.phrase} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#1c1c13]">&ldquo;{sp.phrase}&rdquo;</span>
                      <span className="text-xs text-[#1c1c13]/40">{sp.count}x</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Top Scriptures */}
          {profile.topScriptures && profile.topScriptures.length > 0 && (
            <div className="bg-white p-4 md:p-6 lg:p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] mb-10">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 mb-4">Most Quoted Scriptures</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={profile.topScriptures.slice(0, 10).map(s => ({ scripture: s.ref, count: s.count }))} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ece8d9" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="scripture" width={120} tick={{ fontSize: 11, fill: '#1c1c13' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#14b8a6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Christ Mentions Over Time */}
          {profile.christByYear && profile.christByYear.length > 0 && (
            <div className="bg-white p-4 md:p-6 lg:p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] mb-10">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 mb-4">Christ Mentions Per Talk Over Time</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={profile.christByYear}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ece8d9" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="mentions" stroke="#e11d48" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* All Talks List */}
          {profile.talks && profile.talks.length > 0 && (
            <div className="bg-white p-4 md:p-6 lg:p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 mb-4">
                All Conference Talks ({profile.talks.length})
              </h3>
              <div className="space-y-2">
                {profile.talks.map((t, i) => {
                  const inner = (
                    <div className={`flex items-center justify-between py-2 border-b border-[#ece8d9] last:border-0 ${t.url ? 'hover:bg-[#f5a623]/5 -mx-2 px-2 rounded-lg transition-colors' : ''}`}>
                      <div>
                        <p className="font-medium text-[#1c1c13] text-sm">
                          {t.title}
                          {t.url && <span className="material-symbols-outlined text-[#1B5E7B]/40 text-sm ml-1 align-middle">open_in_new</span>}
                        </p>
                        <p className="text-xs text-[#1c1c13]/40">{t.season} {t.year} &middot; {t.wordCount.toLocaleString()} words &middot; {t.calling}</p>
                      </div>
                      <span className="text-xs text-[#1B5E7B] font-bold">{t.year}</span>
                    </div>
                  );
                  return t.url ? (
                    <a key={i} href={t.url} target="_blank" rel="noopener noreferrer">{inner}</a>
                  ) : (
                    <div key={i}>{inner}</div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
