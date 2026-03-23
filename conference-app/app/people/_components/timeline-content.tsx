'use client';

import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import Papa from 'papaparse';

interface Apostle {
  name: string;
  dob: string;
  dod: string | null;
  sdate: string | null;
  edate: string | null;
  sdate_p: string | null;
  edate_p: string | null;
  birthYear: number;
  deathYear: number | null;
  calledYear: number | null;
  ageAtCall: number | null;
  serviceYears: number | null;
  wasPresident: boolean;
  isLiving: boolean;
}

interface CallingRecord {
  name: string;
  position: string;
  calledBy: string;
  dateStart: string;
  dateEnd: string;
}

function yearFromDate(d: string | null): number | null {
  if (!d) return null;
  const date = new Date(d);
  return isNaN(date.getTime()) ? null : date.getFullYear();
}

export function TimelineContent() {
  const [apostles, setApostles] = useState<Apostle[]>([]);
  const [callings, setCallings] = useState<CallingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApostle, setSelectedApostle] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'called' | 'name' | 'age' | 'service'>('called');
  const [filterEra, setFilterEra] = useState<string>('all');

  useEffect(() => {
    Promise.all([
      fetch('/apostles_timeline.json').then(r => r.text()),
      fetch('/apostles_calling_data.csv').then(r => r.text()),
    ]).then(([jsonText, csvText]) => {
      const jsonLines = jsonText.trim().split('\n').map(line => JSON.parse(line));
      const parsed: Apostle[] = jsonLines.map((a: any) => {
        const birthYear = yearFromDate(a.dob);
        const deathYear = yearFromDate(a.dod);
        const calledYear = yearFromDate(a.sdate);
        const endYear = yearFromDate(a.edate);
        const presStart = yearFromDate(a.sdate_p);

        return {
          name: a.name,
          dob: a.dob,
          dod: a.dod,
          sdate: a.sdate,
          edate: a.edate,
          sdate_p: a.sdate_p,
          edate_p: a.edate_p,
          birthYear: birthYear || 0,
          deathYear,
          calledYear,
          ageAtCall: birthYear && calledYear ? calledYear - birthYear : null,
          serviceYears: calledYear ? ((endYear || 2026) - calledYear) : null,
          wasPresident: !!presStart,
          isLiving: !deathYear,
        };
      }).filter(a => a.calledYear);

      const csvParsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
      const callingRecords: CallingRecord[] = csvParsed.data.map((row: any) => ({
        name: row['Name'] || '',
        position: row['position'] || '',
        calledBy: row['called_by'] || '',
        dateStart: row['date_start'] || '',
        dateEnd: row['date_end'] || '',
      }));

      setApostles(parsed);
      setCallings(callingRecords);
      setLoading(false);
    });
  }, []);

  const eras = [
    { label: 'All Eras', value: 'all' },
    { label: '1835–1850', value: '1835-1850' },
    { label: '1850–1900', value: '1850-1900' },
    { label: '1900–1950', value: '1900-1950' },
    { label: '1950–2000', value: '1950-2000' },
    { label: '2000–Now', value: '2000-2030' },
  ];

  const filtered = useMemo(() => {
    let result = apostles;
    if (filterEra !== 'all') {
      const [start, end] = filterEra.split('-').map(Number);
      result = result.filter(a => a.calledYear && a.calledYear >= start && a.calledYear <= end);
    }
    switch (sortBy) {
      case 'name': return [...result].sort((a, b) => a.name.localeCompare(b.name));
      case 'age': return [...result].sort((a, b) => (a.ageAtCall || 99) - (b.ageAtCall || 99));
      case 'service': return [...result].sort((a, b) => (b.serviceYears || 0) - (a.serviceYears || 0));
      default: return [...result].sort((a, b) => (a.calledYear || 0) - (b.calledYear || 0));
    }
  }, [apostles, filterEra, sortBy]);

  const stats = useMemo(() => {
    const withAge = apostles.filter(a => a.ageAtCall !== null);
    const avgAge = withAge.length > 0 ? Math.round(withAge.reduce((s, a) => s + (a.ageAtCall || 0), 0) / withAge.length) : 0;
    const withService = apostles.filter(a => a.serviceYears !== null);
    const avgService = withService.length > 0 ? Math.round(withService.reduce((s, a) => s + (a.serviceYears || 0), 0) / withService.length) : 0;
    const presidents = apostles.filter(a => a.wasPresident).length;
    const living = apostles.filter(a => a.isLiving).length;
    const youngest = withAge.reduce((min, a) => (a.ageAtCall || 99) < (min.ageAtCall || 99) ? a : min, withAge[0]);
    const oldest = withAge.reduce((max, a) => (a.ageAtCall || 0) > (max.ageAtCall || 0) ? a : max, withAge[0]);
    const longestServing = withService.reduce((max, a) => (a.serviceYears || 0) > (max.serviceYears || 0) ? a : max, withService[0]);

    return { total: apostles.length, avgAge, avgService, presidents, living, youngest, oldest, longestServing };
  }, [apostles]);

  const ageOverTime = useMemo(() => {
    const decadeMap = new Map<number, number[]>();
    apostles.filter(a => a.calledYear && a.ageAtCall).forEach(a => {
      const decade = Math.floor(a.calledYear! / 10) * 10;
      if (!decadeMap.has(decade)) decadeMap.set(decade, []);
      decadeMap.get(decade)!.push(a.ageAtCall!);
    });
    return Array.from(decadeMap.entries())
      .map(([decade, ages]) => ({
        decade: `${decade}s`,
        avgAge: Math.round(ages.reduce((s, a) => s + a, 0) / ages.length),
        count: ages.length,
      }))
      .sort((a, b) => a.decade.localeCompare(b.decade));
  }, [apostles]);

  const ageDistribution = useMemo(() => {
    const buckets = new Map<string, number>();
    apostles.filter(a => a.ageAtCall).forEach(a => {
      const bucket = `${Math.floor(a.ageAtCall! / 5) * 5}-${Math.floor(a.ageAtCall! / 5) * 5 + 4}`;
      buckets.set(bucket, (buckets.get(bucket) || 0) + 1);
    });
    return Array.from(buckets.entries())
      .map(([range, count]) => ({ range, count }))
      .sort((a, b) => parseInt(a.range) - parseInt(b.range));
  }, [apostles]);

  const selectedCallings = useMemo(() => {
    if (!selectedApostle) return [];
    return callings.filter(c => c.name === selectedApostle).sort((a, b) => a.dateStart.localeCompare(b.dateStart));
  }, [selectedApostle, callings]);

  const selectedInfo = useMemo(() => {
    if (!selectedApostle) return null;
    return apostles.find(a => a.name === selectedApostle) || null;
  }, [selectedApostle, apostles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-[#1c1c13]/40 animate-pulse">Loading apostle data...</p>
      </div>
    );
  }

  return (
    <div className="px-3 md:px-8 lg:px-12 pt-4 md:pt-6 pb-12 md:pb-24 overflow-x-hidden">

      {/* Hero Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4 mb-8">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Avg Age', value: stats.avgAge },
          { label: 'Avg Svc', value: `${stats.avgService}y` },
          { label: 'Presidents', value: stats.presidents },
          { label: 'Living', value: stats.living },
          { label: 'Longest Svc', value: stats.longestServing?.serviceYears ? `${stats.longestServing.serviceYears}y` : '—' },
        ].map(stat => (
          <div key={stat.label} className="bg-white p-3 md:p-5 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] text-center">
            <p className="text-base md:text-2xl font-extrabold text-[#1c1c13]">{stat.value}</p>
            <p className="text-[8px] md:text-[10px] uppercase tracking-wider text-[#1c1c13]/40 font-bold mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts side by side on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-3 md:p-6">
          <h2 className="text-xs md:text-lg font-bold text-[#1c1c13] mb-0.5">Age at Calling Over Time</h2>
          <p className="text-[10px] md:text-xs text-[#1c1c13]/50 mb-3">By decade</p>
          <div className="h-[180px] md:h-[280px] -ml-2 md:ml-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ageOverTime} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="decade" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                <YAxis domain={[20, 70]} tick={{ fontSize: 9 }} width={25} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 11 }} />
                <Line type="monotone" dataKey="avgAge" stroke="#1B5E7B" strokeWidth={2} dot={{ fill: '#1B5E7B', r: 3 }} name="Avg Age" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-3 md:p-6">
          <h2 className="text-xs md:text-lg font-bold text-[#1c1c13] mb-0.5">Age Distribution</h2>
          <p className="text-[10px] md:text-xs text-[#1c1c13]/50 mb-3">At time of calling</p>
          <div className="h-[180px] md:h-[280px] -ml-2 md:ml-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageDistribution} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="range" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9 }} width={22} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 11 }} />
                <Bar dataKey="count" fill="#8455ef" radius={[4, 4, 0, 0]} name="Apostles" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Notable Records */}
      <div className="grid grid-cols-3 gap-2 md:gap-6 mb-6 md:mb-8">
        {stats.youngest && (
          <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-2.5 md:p-6">
            <p className="text-[8px] md:text-[10px] uppercase tracking-wider text-[#1c1c13]/40 font-bold mb-0.5">Youngest Called</p>
            <p className="text-[11px] md:text-lg font-bold text-[#1c1c13] truncate leading-tight">{stats.youngest.name}</p>
            <p className="text-[10px] md:text-sm text-[#1B5E7B] font-bold">Age {stats.youngest.ageAtCall} ({stats.youngest.calledYear})</p>
          </div>
        )}
        {stats.oldest && (
          <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-2.5 md:p-6">
            <p className="text-[8px] md:text-[10px] uppercase tracking-wider text-[#1c1c13]/40 font-bold mb-0.5">Oldest Called</p>
            <p className="text-[11px] md:text-lg font-bold text-[#1c1c13] truncate leading-tight">{stats.oldest.name}</p>
            <p className="text-[10px] md:text-sm text-[#1B5E7B] font-bold">Age {stats.oldest.ageAtCall} ({stats.oldest.calledYear})</p>
          </div>
        )}
        {stats.longestServing && (
          <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-2.5 md:p-6">
            <p className="text-[8px] md:text-[10px] uppercase tracking-wider text-[#1c1c13]/40 font-bold mb-0.5">Longest Serving</p>
            <p className="text-[11px] md:text-lg font-bold text-[#1c1c13] truncate leading-tight">{stats.longestServing.name}</p>
            <p className="text-[10px] md:text-sm text-[#1B5E7B] font-bold">{stats.longestServing.serviceYears}y ({stats.longestServing.calledYear}–{stats.longestServing.deathYear || 'present'})</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 pb-1">
        <select
          value={filterEra}
          onChange={e => setFilterEra(e.target.value)}
          className="px-3 py-2 rounded-full border border-gray-200 text-xs md:text-sm bg-white shrink-0"
        >
          {eras.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="px-3 py-2 rounded-full border border-gray-200 text-xs md:text-sm bg-white shrink-0"
        >
          <option value="called">Year Called</option>
          <option value="name">Name</option>
          <option value="age">Age at Call</option>
          <option value="service">Service Length</option>
        </select>
        <span className="text-xs text-[#1c1c13]/50 self-center shrink-0">{filtered.length} apostles</span>
      </div>

      {/* Apostle List + Detail — stacked on mobile, side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Apostle List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-3 md:p-6">
          <div className="space-y-1 max-h-[500px] md:max-h-[700px] overflow-y-auto">
            {filtered.map(a => (
              <button
                key={a.name}
                onClick={() => setSelectedApostle(a.name === selectedApostle ? null : a.name)}
                className={`w-full text-left flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-xl transition-colors ${
                  selectedApostle === a.name ? 'bg-[#1B5E7B]/10 ring-1 ring-[#1B5E7B]/30' : 'hover:bg-[#fdf9e9]'
                }`}
              >
                {/* Timeline dot */}
                <div className="flex flex-col items-center shrink-0">
                  <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${
                    a.wasPresident ? 'bg-[#f5a623]' :
                    a.isLiving ? 'bg-green-500' :
                    'bg-[#1B5E7B]'
                  }`} />
                </div>

                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-xs md:text-sm text-[#1c1c13] truncate min-w-0">{a.name}</p>
                    {a.wasPresident && (
                      <span className="text-[8px] md:text-[9px] px-1.5 py-0.5 rounded-full bg-[#f5a623]/20 text-[#f5a623] font-bold shrink-0">P</span>
                    )}
                    {a.isLiving && (
                      <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" title="Living" />
                    )}
                  </div>
                  <p className="text-[9px] md:text-[10px] text-[#1c1c13]/50 mt-0.5 truncate">
                    {a.calledYear}{a.ageAtCall ? ` · Age ${a.ageAtCall}` : ''}<span className="hidden sm:inline"> · {a.serviceYears}y</span><span className="hidden md:inline"> · {a.birthYear}–{a.deathYear || 'now'}</span>
                  </p>
                </div>

                {/* Service bar — hidden on mobile */}
                <div className="w-16 md:w-20 h-2 bg-gray-100 rounded-full overflow-hidden shrink-0 hidden sm:block">
                  <div
                    className="h-full rounded-full bg-[#1B5E7B]"
                    style={{ width: `${Math.min(100, ((a.serviceYears || 0) / 50) * 100)}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail Panel — on mobile, only show when selected */}
        {selectedInfo ? (
          <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-4 md:p-6 self-start lg:sticky lg:top-20">
            <h3 className="text-lg md:text-xl font-bold text-[#1c1c13] mb-1">{selectedInfo.name}</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedInfo.wasPresident && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f5a623]/20 text-[#f5a623] font-bold">Church President</span>
              )}
              {selectedInfo.isLiving && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">Living</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="bg-[#fdf9e9] p-2.5 md:p-3 rounded-lg text-center">
                <p className="text-base md:text-lg font-bold text-[#1c1c13]">{selectedInfo.birthYear}</p>
                <p className="text-[9px] md:text-[10px] text-[#1c1c13]/40 font-bold uppercase">Born</p>
              </div>
              <div className="bg-[#fdf9e9] p-2.5 md:p-3 rounded-lg text-center">
                <p className="text-base md:text-lg font-bold text-[#1c1c13]">{selectedInfo.deathYear || 'Living'}</p>
                <p className="text-[9px] md:text-[10px] text-[#1c1c13]/40 font-bold uppercase">{selectedInfo.deathYear ? 'Died' : 'Status'}</p>
              </div>
              <div className="bg-[#fdf9e9] p-2.5 md:p-3 rounded-lg text-center">
                <p className="text-base md:text-lg font-bold text-[#1B5E7B]">{selectedInfo.ageAtCall || '—'}</p>
                <p className="text-[9px] md:text-[10px] text-[#1c1c13]/40 font-bold uppercase">Age Called</p>
              </div>
              <div className="bg-[#fdf9e9] p-2.5 md:p-3 rounded-lg text-center">
                <p className="text-base md:text-lg font-bold text-[#1B5E7B]">{selectedInfo.serviceYears || '—'}</p>
                <p className="text-[9px] md:text-[10px] text-[#1c1c13]/40 font-bold uppercase">Years Svc</p>
              </div>
            </div>

            {selectedCallings.length > 0 && (
              <>
                <h4 className="text-xs md:text-sm font-bold text-[#1c1c13] mb-2">Positions Held</h4>
                <div className="space-y-2">
                  {selectedCallings.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1B5E7B] mt-1.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-[#1c1c13] text-[11px] md:text-xs">{c.position}</p>
                        <p className="text-[10px] md:text-[11px] text-[#1c1c13]/50">
                          {c.dateStart}{c.dateEnd ? ` — ${c.dateEnd}` : ' — present'}
                          {c.calledBy && <span className="italic hidden sm:inline"> (by {c.calledBy})</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-4 md:p-6 self-start hidden lg:block">
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-4xl text-[#1c1c13]/20 mb-3">person_search</span>
              <p className="text-sm text-[#1c1c13]/40">Select an apostle to see details</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 md:gap-4 mt-6 md:mt-8 text-[10px] md:text-xs text-[#1c1c13]/50">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#f5a623]" />
          <span>President</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span>Living</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#1B5E7B]" />
          <span>Deceased</span>
        </div>
      </div>

    </div>
  );
}
