'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Navigation, TopAppBar } from '@/components/navigation';
import { loadInsights, ApostleProfile } from '@/lib/insights';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function ApostleDetailPage() {
  const params = useParams();
  const [profile, setProfile] = useState<ApostleProfile | null>(null);

  useEffect(() => {
    loadInsights().then(i => {
      const p = (i.apostleProfiles || []).find(a => a.slug === params.slug);
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
        <TopAppBar title={profile.name} subtitle={profile.calling} />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24">
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
                    <span key={w} className="px-3 py-1.5 rounded-full bg-[#f5a623]/10 text-[#1B5E7B] text-sm font-bold">{w}</span>
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
                <BarChart data={profile.topScriptures.slice(0, 10)} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ece8d9" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="ref" width={120} tick={{ fontSize: 11, fill: '#1c1c13' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f5a623" radius={[0, 6, 6, 0]} />
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
                {profile.talks.map((t, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-[#ece8d9] last:border-0">
                    <div>
                      <p className="font-medium text-[#1c1c13] text-sm">{t.title}</p>
                      <p className="text-xs text-[#1c1c13]/40">{t.season} {t.year} &middot; {t.wordCount.toLocaleString()} words</p>
                    </div>
                    <span className="text-xs text-[#1B5E7B] font-bold">{t.year}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
