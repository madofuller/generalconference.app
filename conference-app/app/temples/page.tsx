'use client';

import { useState, useEffect, useMemo } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Papa from 'papaparse';
import TempleMap from '@/components/temple-map';
import { DataCitation } from '@/components/data-citation';
import { cn } from '@/lib/utils';

interface Temple {
  number: number;
  status: string;
  name: string;
  region: string;
  country: string;
  continent: string;
  sqft: number;
  style: string;
  designer: string;
  announcedDate: string;
  announcedBy: string;
  dedicatedDate: string;
  dedicatedBy: string;
  president: string;
  dedicatedYear: number;
}

function parseSquareFeet(s: string): number {
  if (!s) return 0;
  const match = s.replace(/[^\d,]/g, ' ').trim().split(/\s+/);
  if (match.length > 0) {
    const num = parseInt(match[0].replace(/,/g, ''), 10);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

function extractYear(dateStr: string): number {
  if (!dateStr) return 0;
  const match = dateStr.match(/(\d{4})/);
  return match ? parseInt(match[1], 10) : 0;
}

function cleanName(name: string): string {
  return name.replace(/\s*\(edit\)\s*/g, '').trim();
}

const COLORS = ['#1B5E7B', '#8455ef', '#40c2fd', '#f5a623', '#00668a', '#e74c3c', '#2ecc71', '#9b59b6'];

export default function TemplesPage() {
  const [temples, setTemples] = useState<Temple[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterContinent, setFilterContinent] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'number' | 'name' | 'year' | 'size'>('number');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/temples1.csv').then(r => r.text()),
      fetch('/temples2.csv').then(r => r.text()),
    ]).then(([t1Text, t2Text]) => {
      const t1 = Papa.parse(t1Text, { header: false, skipEmptyLines: true });
      const t2 = Papa.parse(t2Text, { header: false, skipEmptyLines: true });

      // temples1: skip header row (index 0), columns: [empty, #, Status, Name, Region, Country, Continent, Site, Floor, Ht, B, Rm, SR, Style, Designer, VC]
      // temples2: skip 2 header rows, columns: [empty, #, Status, Name, date, by, date, by, OpenHouse, date, by, President]
      const t2Map = new Map<number, { announcedDate: string; announcedBy: string; dedicatedDate: string; dedicatedBy: string; president: string }>();
      (t2.data as string[][]).slice(2).forEach(row => {
        const num = parseInt(row[1], 10);
        if (!isNaN(num)) {
          t2Map.set(num, {
            announcedDate: row[4] || '',
            announcedBy: row[5] || '',
            dedicatedDate: row[9] || '',
            dedicatedBy: row[10] || '',
            president: row[11] || '',
          });
        }
      });

      const parsed: Temple[] = (t1.data as string[][]).slice(1).map(row => {
        const num = parseInt(row[1], 10);
        const t2Info = t2Map.get(num);
        return {
          number: num,
          status: row[2] || '',
          name: cleanName(row[3] || ''),
          region: row[4] || '',
          country: row[5] || '',
          continent: row[6] || '',
          sqft: parseSquareFeet(row[8] || ''),
          style: row[13] || '',
          designer: row[14] || '',
          announcedDate: t2Info?.announcedDate || '',
          announcedBy: t2Info?.announcedBy || '',
          dedicatedDate: t2Info?.dedicatedDate || '',
          dedicatedBy: t2Info?.dedicatedBy || '',
          president: t2Info?.president || '',
          dedicatedYear: extractYear(t2Info?.dedicatedDate || ''),
        };
      }).filter(t => !isNaN(t.number) && t.name);

      setTemples(parsed);
      setLoading(false);
    });
  }, []);

  const statuses = useMemo(() => [...new Set(temples.map(t => t.status).filter(Boolean))].sort(), [temples]);
  const continents = useMemo(() => [...new Set(temples.map(t => t.continent).filter(Boolean))].sort(), [temples]);

  const filtered = useMemo(() => {
    let result = temples;
    if (filterStatus !== 'all') result = result.filter(t => t.status === filterStatus);
    if (filterContinent !== 'all') result = result.filter(t => t.continent === filterContinent);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(term) || t.country.toLowerCase().includes(term) || t.region.toLowerCase().includes(term));
    }
    switch (sortBy) {
      case 'name': result = [...result].sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'year': result = [...result].sort((a, b) => (a.dedicatedYear || 9999) - (b.dedicatedYear || 9999)); break;
      case 'size': result = [...result].sort((a, b) => b.sqft - a.sqft); break;
      default: result = [...result].sort((a, b) => a.number - b.number);
    }
    return result;
  }, [temples, filterStatus, filterContinent, sortBy, searchTerm]);

  const stats = useMemo(() => {
    const operating = temples.filter(t => t.status === 'Operating').length;
    const countries = new Set(temples.map(t => t.country)).size;
    const continentCount = new Set(temples.map(t => t.continent).filter(Boolean)).size;
    const oldest = temples.filter(t => t.dedicatedYear > 0).sort((a, b) => a.dedicatedYear - b.dedicatedYear)[0];
    const largest = temples.filter(t => t.sqft > 0).sort((a, b) => b.sqft - a.sqft)[0];
    return { total: temples.length, operating, countries, continentCount, oldest, largest };
  }, [temples]);

  const byContinent = useMemo(() => {
    const map = new Map<string, number>();
    temples.forEach(t => {
      if (t.continent) map.set(t.continent, (map.get(t.continent) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [temples]);

  const byDecade = useMemo(() => {
    const map = new Map<number, number>();
    temples.filter(t => t.dedicatedYear > 0).forEach(t => {
      const decade = Math.floor(t.dedicatedYear / 10) * 10;
      map.set(decade, (map.get(decade) || 0) + 1);
    });
    return Array.from(map.entries()).map(([decade, count]) => ({ decade: `${decade}s`, count })).sort((a, b) => a.decade.localeCompare(b.decade));
  }, [temples]);

  const byStatus = useMemo(() => {
    const map = new Map<string, number>();
    temples.forEach(t => {
      if (t.status) map.set(t.status, (map.get(t.status) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [temples]);

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Navigation />
        <main className="ml-0 lg:ml-[260px] flex-1 flex items-center justify-center" style={{ background: '#fdf9e9' }}>
          <p className="text-[#1c1c13]/40 animate-pulse">Loading temple data...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1 pt-20 lg:pt-0" style={{ background: '#fdf9e9' }}>
        <TopAppBar title="Temples" subtitle="Houses of the Lord around the world" hideEraToggle />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24">

          {/* Hero Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-10">
            {[
              { label: 'Total Temples', value: stats.total },
              { label: 'Operating', value: stats.operating },
              { label: 'Countries', value: stats.countries },
              { label: 'Oldest', value: stats.oldest ? stats.oldest.dedicatedYear : '—' },
              { label: 'Largest', value: stats.largest ? stats.largest.name.replace(' Temple', '').split(/\s/).slice(0, 2).join(' ') : '—' },
            ].map((stat, i, arr) => (
              <div key={stat.label} className={cn(
                "bg-white p-4 md:p-6 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] text-center",
                i === arr.length - 1 && arr.length % 2 !== 0 && "col-span-2 sm:col-span-1"
              )}>
                <p className="text-lg md:text-2xl font-extrabold text-[#1c1c13]">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-wider text-[#1c1c13]/40 font-bold mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Interactive Map */}
          <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-4 md:p-8 mb-8 relative z-10">
            <h2 className="text-lg md:text-xl font-bold text-[#1c1c13] mb-2">Temple Locations Worldwide</h2>
            <p className="text-xs text-[#1c1c13]/50 mb-4">
              Click markers for details &middot;
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mx-1 align-middle" /> Operating
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mx-1 align-middle" /> Renovation
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mx-1 align-middle" /> Construction
              <span className="inline-block w-2 h-2 rounded-full bg-[#1B5E7B] mx-1 align-middle" /> Other
            </p>
            <TempleMap filterStatus={filterStatus} filterContinent={filterContinent} searchTerm={searchTerm} />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* By Continent */}
            <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-4 md:p-8">
              <h2 className="text-lg font-bold text-[#1c1c13] mb-4">Temples by Continent</h2>
              <div className="h-[220px] md:h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byContinent} cx="50%" cy="50%" outerRadius="80%" innerRadius="35%" dataKey="value" nameKey="name" labelLine={false}>
                      {byContinent.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend below chart */}
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3">
                {byContinent.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-[11px] text-[#1c1c13]/70 font-medium">{c.name} ({c.value})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* By Status */}
            <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-4 md:p-8">
              <h2 className="text-lg font-bold text-[#1c1c13] mb-4">Temples by Status</h2>
              <div className="space-y-3">
                {byStatus.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-sm text-[#1c1c13] flex-1">{s.name}</span>
                    <span className="font-bold text-[#1c1c13]">{s.value}</span>
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(s.value / temples.length) * 100}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dedications by Decade */}
          <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-4 md:p-8 mb-8">
            <h2 className="text-lg md:text-xl font-bold text-[#1c1c13] mb-2">Temple Dedications by Decade</h2>
            <p className="text-xs text-[#1c1c13]/50 mb-6">Number of temples dedicated in each decade</p>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byDecade}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="decade" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="count" fill="#1B5E7B" radius={[4, 4, 0, 0]} name="Temples Dedicated" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-4 md:p-8">
            <h2 className="text-lg md:text-xl font-bold text-[#1c1c13] mb-4">Temple Directory</h2>

            <div className="flex flex-wrap gap-3 mb-6">
              <input
                type="text"
                placeholder="Search temples..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="px-4 py-2 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E7B]/30 flex-1 min-w-[200px]"
              />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-full border border-gray-200 text-sm bg-white"
              >
                <option value="all">All Statuses</option>
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={filterContinent}
                onChange={e => setFilterContinent(e.target.value)}
                className="px-3 py-2 rounded-full border border-gray-200 text-sm bg-white"
              >
                <option value="all">All Continents</option>
                {continents.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-3 py-2 rounded-full border border-gray-200 text-sm bg-white"
              >
                <option value="number">Sort by #</option>
                <option value="name">Sort by Name</option>
                <option value="year">Sort by Year</option>
                <option value="size">Sort by Size</option>
              </select>
            </div>

            <p className="text-xs text-[#1c1c13]/50 mb-4">{filtered.length} temples</p>

            {/* Temple List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {filtered.map(t => (
                <div key={t.number} className="flex items-start gap-4 p-4 rounded-xl bg-[#fdf9e9] hover:bg-[#f5a623]/10 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#1B5E7B]/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[#1B5E7B]">#{t.number}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#1c1c13] text-sm">{t.name}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        t.status === 'Operating' ? 'bg-green-100 text-green-700' :
                        t.status.includes('renovation') ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {t.status}
                      </span>
                      {t.country && <span className="text-[10px] text-[#1c1c13]/50">{t.country}</span>}
                      {t.continent && <span className="text-[10px] text-[#1c1c13]/40">{t.continent}</span>}
                    </div>
                    {(t.dedicatedYear > 0 || t.sqft > 0 || t.style) && (
                      <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-[#1c1c13]/50">
                        {t.dedicatedYear > 0 && <span>Dedicated: {t.dedicatedYear}</span>}
                        {t.sqft > 0 && <span>{t.sqft.toLocaleString()} sq ft</span>}
                        {t.style && <span>{t.style}</span>}
                      </div>
                    )}
                    {t.dedicatedBy && (
                      <p className="text-[10px] text-[#1c1c13]/40 mt-1">Dedicated by {t.dedicatedBy}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DataCitation datasets="Temple data" />

        </div>
      </main>
    </div>
  );
}
