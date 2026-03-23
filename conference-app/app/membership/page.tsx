'use client';

import { useState, useEffect, useMemo } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import Papa from 'papaparse';
import { DataCitation } from '@/components/data-citation';

interface MembershipRow {
  year: number;
  membership: number;
  change: number;
  growthPct: number;
}

function parseMembershipNum(s: string): number {
  if (!s) return 0;
  return parseInt(s.replace(/[",]/g, ''), 10) || 0;
}

function parsePct(s: string): number {
  if (!s || s === 'N/A') return 0;
  return parseFloat(s.replace('%', '')) || 0;
}

export default function MembershipPage() {
  const [data, setData] = useState<MembershipRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hideOutliers, setHideOutliers] = useState(true);

  useEffect(() => {
    fetch('/membership_history.csv')
      .then(r => r.text())
      .then(text => {
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        const rows: MembershipRow[] = parsed.data
          .map((row: any) => ({
            year: parseInt(row['Year'], 10),
            membership: parseMembershipNum(row['Membership']),
            change: parseMembershipNum(row['Number change']),
            growthPct: parsePct(row['Percentage growth']),
          }))
          .filter((r: MembershipRow) => r.year > 0 && r.membership > 0)
          .sort((a: MembershipRow, b: MembershipRow) => a.year - b.year);
        setData(rows);
        setLoading(false);
      });
  }, []);

  const stats = useMemo(() => {
    if (data.length === 0) return null;
    const latest = data[data.length - 1];
    const earliest = data[0];
    const peak = data.reduce((max, r) => r.growthPct > max.growthPct ? r : max, data[0]);
    const doublingYears = data.length > 1 ? (() => {
      const half = latest.membership / 2;
      const halfRow = [...data].reverse().find(r => r.membership <= half);
      return halfRow ? latest.year - halfRow.year : null;
    })() : null;

    return {
      currentMembership: latest.membership,
      currentYear: latest.year,
      startYear: earliest.year,
      startMembership: earliest.membership,
      peakGrowthYear: peak.year,
      peakGrowthPct: peak.growthPct,
      latestGrowth: latest.growthPct,
      latestChange: latest.change,
      doublingYears,
    };
  }, [data]);

  const milestones = useMemo(() => {
    const targets = [1000, 10000, 100000, 1000000, 5000000, 10000000, 15000000, 17000000];
    return targets.map(t => {
      const row = data.find(r => r.membership >= t);
      return row ? { target: t, year: row.year, membership: row.membership } : null;
    }).filter(Boolean) as { target: number; year: number; membership: number }[];
  }, [data]);

  const decadeGrowth = useMemo(() => {
    const filtered = hideOutliers ? data.filter(r => r.year >= 1860) : data;
    const decades = new Map<number, { start: number; end: number }>();
    filtered.forEach(r => {
      const decade = Math.floor(r.year / 10) * 10;
      const existing = decades.get(decade);
      if (!existing) {
        decades.set(decade, { start: r.membership, end: r.membership });
      } else {
        existing.end = r.membership;
      }
    });
    return Array.from(decades.entries())
      .map(([decade, { start, end }]) => ({
        decade: `${decade}s`,
        growth: start > 0 ? Math.round(((end - start) / start) * 100) : 0,
        added: end - start,
      }))
      .filter(d => d.growth > 0);
  }, [data, hideOutliers]);

  const formatNum = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
    return n.toString();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Navigation />
        <main className="ml-0 lg:ml-[260px] flex-1 flex items-center justify-center" style={{ background: '#fdf9e9' }}>
          <p className="text-[#1c1c13]/40 animate-pulse">Loading membership data...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1" style={{ background: '#fdf9e9' }}>
        <TopAppBar title="Church Growth" subtitle="Membership from 1829 to present" hideEraToggle />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24">

          {/* Hero Stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-10">
              {[
                { label: 'Members Today', value: stats.currentMembership.toLocaleString() },
                { label: 'Year Started', value: stats.startYear },
                { label: 'Original Members', value: stats.startMembership },
                { label: 'Peak Growth', value: `${stats.peakGrowthPct}% (${stats.peakGrowthYear})` },
                { label: 'Last Doubled In', value: stats.doublingYears ? `${stats.doublingYears} yrs` : '—' },
              ].map(stat => (
                <div key={stat.label} className="bg-white p-4 md:p-6 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] text-center">
                  <p className="text-lg md:text-2xl font-extrabold text-[#1c1c13]">{stat.value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-[#1c1c13]/40 font-bold mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Page-level filter */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setHideOutliers(!hideOutliers)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                hideOutliers
                  ? 'bg-[#f5a623] text-white'
                  : 'bg-[#f8f4e4] text-[#1c1c13]/50 hover:bg-[#f5a623]/20'
              }`}
            >
              <span className="material-symbols-outlined text-xs">{hideOutliers ? 'visibility_off' : 'visibility'}</span>
              {hideOutliers ? 'Early outliers hidden' : 'Show all years'}
            </button>
            {hideOutliers && (
              <span className="text-[10px] text-[#1c1c13]/40">Pre-1860 growth spikes excluded from charts</span>
            )}
          </div>

          {/* Membership Growth Chart */}
          <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-4 md:p-8 mb-8">
            <h2 className="text-lg md:text-xl font-bold text-[#1c1c13] mb-6">Total Membership Over Time</h2>
            <div className="h-[300px] md:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={formatNum} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: any) => [value.toLocaleString(), 'Members']}
                    labelFormatter={(label) => `Year ${label}`}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="membership" stroke="#1B5E7B" fill="#1B5E7B" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Growth Rate Chart */}
          <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-4 md:p-8 mb-8">
            <h2 className="text-lg md:text-xl font-bold text-[#1c1c13] mb-2">Annual Growth Rate</h2>
            <p className="text-xs text-[#1c1c13]/50 mb-6">Percentage growth year over year</p>
            <div className="h-[300px] md:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.filter(r => r.growthPct > 0 && (!hideOutliers || r.year >= 1860))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: any) => [`${value}%`, 'Growth']}
                    labelFormatter={(label) => `Year ${label}`}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Line type="monotone" dataKey="growthPct" stroke="#f5a623" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* New Members Per Year */}
          <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-4 md:p-8 mb-8">
            <h2 className="text-lg md:text-xl font-bold text-[#1c1c13] mb-2">New Members Added Per Year</h2>
            <p className="text-xs text-[#1c1c13]/50 mb-6">Net membership increase each year</p>
            <div className="h-[300px] md:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.filter(r => r.change > 0 && (!hideOutliers || r.year >= 1860))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={formatNum} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: any) => [value.toLocaleString(), 'New Members']}
                    labelFormatter={(label) => `Year ${label}`}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="change" fill="#8455ef" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Decade Growth */}
          <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-4 md:p-8 mb-8">
            <h2 className="text-lg md:text-xl font-bold text-[#1c1c13] mb-2">Growth by Decade</h2>
            <p className="text-xs text-[#1c1c13]/50 mb-6">Percentage increase within each decade</p>
            <div className="h-[300px] md:h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={decadeGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="decade" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: any, name: any) => {
                      if (name === 'growth') return [`${value}%`, 'Growth'];
                      return [value.toLocaleString(), 'Members Added'];
                    }}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="growth" fill="#1B5E7B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Milestones */}
          <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-4 md:p-8">
            <h2 className="text-lg md:text-xl font-bold text-[#1c1c13] mb-6">Membership Milestones</h2>
            <div className="space-y-3">
              {milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-[#fdf9e9]">
                  <div className="w-10 h-10 rounded-full bg-[#1B5E7B]/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#1B5E7B] text-lg">flag</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[#1c1c13]">{formatNum(m.target)} members</p>
                    <p className="text-xs text-[#1c1c13]/50">Reached in {m.year}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#1B5E7B]">{m.year}</p>
                    <p className="text-[10px] text-[#1c1c13]/40">{m.year - milestones[0].year} years from founding</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DataCitation datasets="Membership history data" />

        </div>
      </main>
    </div>
  );
}
