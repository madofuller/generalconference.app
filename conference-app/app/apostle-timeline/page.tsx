'use client';

import { useState, useEffect, useMemo } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, LineChart, Line } from 'recharts';
import Papa from 'papaparse';
import { DataCitation } from '@/components/data-citation';

interface Apostle {
  name: string;
  dob: string;
  dod: string | null;
  sdate: string | null; // apostle service start
  edate: string | null; // apostle service end
  sdate_p: string | null; // president start
  edate_p: string | null; // president end
  birthYear: number;
  deathYear: number | null;
  calledYear: number | null;
  ageAtCall: number | null;
  serviceYears: number | null;
  wasPresident: boolean;
  isLiving: boolean;
  isNonQuorum?: boolean;
}

interface BioNote {
  name: string;
  notes: string;
  category: string;
}

interface LifeExpectancy {
  decade: string;
  maleBirth: number;
  femaleBirth: number;
  maleAt65: number;
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

export default function ApostleTimelinePage() {
  const [apostles, setApostles] = useState<Apostle[]>([]);
  const [callings, setCallings] = useState<CallingRecord[]>([]);
  const [bioNotes, setBioNotes] = useState<Map<string, BioNote>>(new Map());
  const [lifeExpectancy, setLifeExpectancy] = useState<LifeExpectancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApostle, setSelectedApostle] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'called' | 'name' | 'age' | 'service'>('called');
  const [filterEra, setFilterEra] = useState<string>('all');
  const [showNonQuorum, setShowNonQuorum] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/apostles_timeline.json').then(r => r.text()),
      fetch('/apostles_calling_data.csv').then(r => r.text()),
      fetch('/apostles_bio_data.csv').then(r => r.text()),
      fetch('/life_expectancy.csv').then(r => r.text()),
    ]).then(([jsonText, csvText, bioText, lifeText]) => {
      // Parse NDJSON — includes both quorum and non-quorum apostles
      const jsonLines = jsonText.trim().split('\n').map(line => JSON.parse(line));

      // Determine which names are non-quorum (those without apostle service dates or with only president dates)
      const nonQuorumNames = new Set<string>();
      jsonLines.forEach((a: any) => {
        if (!a.sdate && !a.edate) nonQuorumNames.add(a.name);
      });

      const parsed: Apostle[] = jsonLines.map((a: any) => {
        const birthYear = yearFromDate(a.dob);
        const deathYear = yearFromDate(a.dod);
        const calledYear = yearFromDate(a.sdate) || yearFromDate(a.sdate_p);
        const endYear = yearFromDate(a.edate) || yearFromDate(a.edate_p);
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
          isNonQuorum: nonQuorumNames.has(a.name),
        };
      }).filter(a => a.calledYear || a.birthYear);

      // Parse callings CSV
      const csvParsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
      const callingRecords: CallingRecord[] = csvParsed.data.map((row: any) => ({
        name: row['Name'] || '',
        position: row['position'] || '',
        calledBy: row['called_by'] || '',
        dateStart: row['date_start'] || '',
        dateEnd: row['date_end'] || '',
      }));

      // Parse bio notes
      const bioParsed = Papa.parse(bioText, { header: true, skipEmptyLines: true });
      const bioMap = new Map<string, BioNote>();
      bioParsed.data.forEach((row: any) => {
        if (row['Name'] && row['Notes']) {
          bioMap.set(row['Name'], {
            name: row['Name'],
            notes: row['Notes'],
            category: row['Category'] || '',
          });
        }
      });

      // Parse life expectancy by decade
      const lifeParsed = Papa.parse(lifeText, { header: true, skipEmptyLines: true });
      const lifeByDecade = new Map<number, { males: number[]; females: number[]; maleAt65: number[] }>();
      lifeParsed.data.forEach((row: any) => {
        const year = parseInt(row['year'], 10);
        const male = parseFloat(row['Male']);
        const female = parseFloat(row['Female']);
        const maleAt65 = parseFloat(row['Male.1'] || row['Male']);
        if (!isNaN(year) && !isNaN(male)) {
          const decade = Math.floor(year / 10) * 10;
          if (!lifeByDecade.has(decade)) lifeByDecade.set(decade, { males: [], females: [], maleAt65: [] });
          const d = lifeByDecade.get(decade)!;
          d.males.push(male);
          d.females.push(female);
          if (!isNaN(maleAt65)) d.maleAt65.push(maleAt65);
        }
      });
      const lifeData: LifeExpectancy[] = Array.from(lifeByDecade.entries())
        .map(([decade, d]) => ({
          decade: `${decade}s`,
          maleBirth: Math.round(d.males.reduce((s, v) => s + v, 0) / d.males.length * 10) / 10,
          femaleBirth: Math.round(d.females.reduce((s, v) => s + v, 0) / d.females.length * 10) / 10,
          maleAt65: d.maleAt65.length > 0 ? Math.round(d.maleAt65.reduce((s, v) => s + v, 0) / d.maleAt65.length * 10) / 10 : 0,
        }))
        .sort((a, b) => a.decade.localeCompare(b.decade));

      setApostles(parsed);
      setCallings(callingRecords);
      setBioNotes(bioMap);
      setLifeExpectancy(lifeData);
      setLoading(false);
    });
  }, []);

  const eras = [
    { label: 'All Eras', value: 'all' },
    { label: '1835–1850 (Original)', value: '1835-1850' },
    { label: '1850–1900', value: '1850-1900' },
    { label: '1900–1950', value: '1900-1950' },
    { label: '1950–2000', value: '1950-2000' },
    { label: '2000–Present', value: '2000-2030' },
  ];

  const filtered = useMemo(() => {
    let result = apostles;
    if (!showNonQuorum) {
      result = result.filter(a => !a.isNonQuorum);
    }
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
  }, [apostles, filterEra, sortBy, showNonQuorum]);

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

  // Average age at calling over time, merged with life expectancy
  const ageOverTime = useMemo(() => {
    const decadeMap = new Map<number, number[]>();
    apostles.filter(a => a.calledYear && a.ageAtCall && !a.isNonQuorum).forEach(a => {
      const decade = Math.floor(a.calledYear! / 10) * 10;
      if (!decadeMap.has(decade)) decadeMap.set(decade, []);
      decadeMap.get(decade)!.push(a.ageAtCall!);
    });

    // Build life expectancy lookup by decade string
    const lifeMap = new Map(lifeExpectancy.map(l => [l.decade, l]));

    return Array.from(decadeMap.entries())
      .map(([decade, ages]) => {
        const life = lifeMap.get(`${decade}s`);
        return {
          decade: `${decade}s`,
          avgAge: Math.round(ages.reduce((s, a) => s + a, 0) / ages.length),
          count: ages.length,
          lifeExpectancy: life?.maleBirth || null,
        };
      })
      .sort((a, b) => a.decade.localeCompare(b.decade));
  }, [apostles, lifeExpectancy]);

  // Age distribution
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

  const selectedBio = useMemo(() => {
    if (!selectedApostle) return null;
    return bioNotes.get(selectedApostle) || null;
  }, [selectedApostle, bioNotes]);

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Navigation />
        <main className="ml-0 lg:ml-[260px] flex-1 flex items-center justify-center" style={{ background: '#fdf9e9' }}>
          <p className="text-[#1c1c13]/40 animate-pulse">Loading apostle data...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1 pt-20 lg:pt-0" style={{ background: '#fdf9e9' }}>
        <TopAppBar title="Apostle Timeline" subtitle="Every apostle from 1835 to present" hideEraToggle />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24">

          {/* Hero Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 mb-10">
            {[
              { label: 'Total Apostles', value: stats.total },
              { label: 'Avg Age Called', value: stats.avgAge },
              { label: 'Avg Service (yrs)', value: stats.avgService },
              { label: 'Became President', value: stats.presidents },
              { label: 'Still Living', value: stats.living },
              { label: 'Longest Service', value: stats.longestServing?.serviceYears ? `${stats.longestServing.serviceYears} yrs` : '—' },
            ].map(stat => (
              <div key={stat.label} className="bg-white p-4 md:p-6 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] text-center">
                <p className="text-lg md:text-2xl font-extrabold text-[#1c1c13]">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-wider text-[#1c1c13]/40 font-bold mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Average Age at Calling Over Time */}
          <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-4 md:p-8 mb-8">
            <h2 className="text-lg md:text-xl font-bold text-[#1c1c13] mb-2">Average Age at Calling Over Time</h2>
            <p className="text-xs text-[#1c1c13]/50 mb-6">
              How old were new apostles when called, by decade
              {lifeExpectancy.length > 0 && <span className="ml-1">&middot; Dashed line = US male life expectancy at birth</span>}
            </p>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ageOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="decade" tick={{ fontSize: 11 }} />
                  <YAxis domain={[20, 80]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: any, name: any) => {
                      if (name === 'avgAge') return [value, 'Avg Age at Calling'];
                      if (name === 'lifeExpectancy') return [value, 'US Male Life Expectancy'];
                      return [value, name];
                    }}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Line type="monotone" dataKey="avgAge" stroke="#1B5E7B" strokeWidth={3} dot={{ fill: '#1B5E7B', r: 4 }} name="avgAge" />
                  {lifeExpectancy.length > 0 && (
                    <Line type="monotone" dataKey="lifeExpectancy" stroke="#f5a623" strokeWidth={2} strokeDasharray="6 3" dot={false} name="lifeExpectancy" connectNulls />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Age Distribution */}
          <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-4 md:p-8 mb-8">
            <h2 className="text-lg md:text-xl font-bold text-[#1c1c13] mb-2">Age at Calling Distribution</h2>
            <p className="text-xs text-[#1c1c13]/50 mb-6">How many apostles were called at each age range</p>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="count" fill="#8455ef" radius={[4, 4, 0, 0]} name="Apostles" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Notable Records */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.youngest && (
              <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-6">
                <p className="text-[10px] uppercase tracking-wider text-[#1c1c13]/40 font-bold mb-2">Youngest Called</p>
                <p className="text-lg font-bold text-[#1c1c13]">{stats.youngest.name}</p>
                <p className="text-sm text-[#1B5E7B] font-bold">Age {stats.youngest.ageAtCall} ({stats.youngest.calledYear})</p>
              </div>
            )}
            {stats.oldest && (
              <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-6">
                <p className="text-[10px] uppercase tracking-wider text-[#1c1c13]/40 font-bold mb-2">Oldest Called</p>
                <p className="text-lg font-bold text-[#1c1c13]">{stats.oldest.name}</p>
                <p className="text-sm text-[#1B5E7B] font-bold">Age {stats.oldest.ageAtCall} ({stats.oldest.calledYear})</p>
              </div>
            )}
            {stats.longestServing && (
              <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-6">
                <p className="text-[10px] uppercase tracking-wider text-[#1c1c13]/40 font-bold mb-2">Longest Serving</p>
                <p className="text-lg font-bold text-[#1c1c13]">{stats.longestServing.name}</p>
                <p className="text-sm text-[#1B5E7B] font-bold">{stats.longestServing.serviceYears} years ({stats.longestServing.calledYear}–{stats.longestServing.deathYear || 'present'})</p>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <select
              value={filterEra}
              onChange={e => setFilterEra(e.target.value)}
              className="px-3 py-2 rounded-full border border-gray-200 text-sm bg-white"
            >
              {eras.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-full border border-gray-200 text-sm bg-white"
            >
              <option value="called">Sort by Year Called</option>
              <option value="name">Sort by Name</option>
              <option value="age">Sort by Age at Call</option>
              <option value="service">Sort by Service Length</option>
            </select>
            <button
              onClick={() => setShowNonQuorum(!showNonQuorum)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                showNonQuorum
                  ? 'bg-[#8455ef]/15 text-[#8455ef]'
                  : 'bg-gray-100 text-[#1c1c13]/40 hover:bg-[#8455ef]/10'
              }`}
            >
              <span className="material-symbols-outlined text-xs">{showNonQuorum ? 'visibility' : 'visibility_off'}</span>
              Non-Quorum
            </button>
            <span className="text-xs text-[#1c1c13]/50 self-center">{filtered.length} apostles</span>
          </div>

          {/* Timeline / List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Apostle List */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-4 md:p-6">
              <div className="space-y-1 max-h-[700px] overflow-y-auto pr-2">
                {filtered.map(a => (
                  <button
                    key={a.name}
                    onClick={() => setSelectedApostle(a.name === selectedApostle ? null : a.name)}
                    className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      selectedApostle === a.name ? 'bg-[#1B5E7B]/10 ring-1 ring-[#1B5E7B]/30' : 'hover:bg-[#fdf9e9]'
                    }`}
                  >
                    {/* Timeline dot and line */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-3 h-3 rounded-full ${
                        a.wasPresident ? 'bg-[#f5a623]' :
                        a.isNonQuorum ? 'bg-[#8455ef]' :
                        a.isLiving ? 'bg-green-500' :
                        'bg-[#1B5E7B]'
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-[#1c1c13] truncate">{a.name}</p>
                        {a.wasPresident && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#f5a623]/20 text-[#f5a623] font-bold shrink-0">
                            President
                          </span>
                        )}
                        {a.isLiving && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-bold shrink-0">
                            Living
                          </span>
                        )}
                        {a.isNonQuorum && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#8455ef]/15 text-[#8455ef] font-bold shrink-0">
                            Non-Quorum
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3 text-[10px] text-[#1c1c13]/50 mt-0.5">
                        <span>Called {a.calledYear}</span>
                        {a.ageAtCall && <span>Age {a.ageAtCall}</span>}
                        {a.serviceYears && <span>{a.serviceYears} yrs service</span>}
                        <span>{a.birthYear}–{a.deathYear || 'present'}</span>
                      </div>
                    </div>

                    {/* Service bar */}
                    <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden shrink-0 hidden sm:block">
                      <div
                        className="h-full rounded-full bg-[#1B5E7B]"
                        style={{ width: `${Math.min(100, ((a.serviceYears || 0) / 50) * 100)}%` }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Detail Panel */}
            <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-4 md:p-6 self-start sticky top-20">
              {selectedInfo ? (
                <>
                  <h3 className="text-xl font-bold text-[#1c1c13] mb-1">{selectedInfo.name}</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedInfo.wasPresident && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f5a623]/20 text-[#f5a623] font-bold">Church President</span>
                    )}
                    {selectedInfo.isLiving && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">Living</span>
                    )}
                    {selectedInfo.isNonQuorum && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#8455ef]/15 text-[#8455ef] font-bold">Non-Quorum Apostle</span>
                    )}
                    {selectedBio?.category && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-[#1c1c13]/60 font-bold capitalize">{selectedBio.category}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-[#fdf9e9] p-3 rounded-lg text-center">
                      <p className="text-lg font-bold text-[#1c1c13]">{selectedInfo.birthYear}</p>
                      <p className="text-[10px] text-[#1c1c13]/40 font-bold uppercase">Born</p>
                    </div>
                    <div className="bg-[#fdf9e9] p-3 rounded-lg text-center">
                      <p className="text-lg font-bold text-[#1c1c13]">{selectedInfo.deathYear || 'Living'}</p>
                      <p className="text-[10px] text-[#1c1c13]/40 font-bold uppercase">{selectedInfo.deathYear ? 'Died' : 'Status'}</p>
                    </div>
                    <div className="bg-[#fdf9e9] p-3 rounded-lg text-center">
                      <p className="text-lg font-bold text-[#1B5E7B]">{selectedInfo.ageAtCall || '—'}</p>
                      <p className="text-[10px] text-[#1c1c13]/40 font-bold uppercase">Age Called</p>
                    </div>
                    <div className="bg-[#fdf9e9] p-3 rounded-lg text-center">
                      <p className="text-lg font-bold text-[#1B5E7B]">{selectedInfo.serviceYears || '—'}</p>
                      <p className="text-[10px] text-[#1c1c13]/40 font-bold uppercase">Years Service</p>
                    </div>
                  </div>

                  {selectedCallings.length > 0 && (
                    <>
                      <h4 className="text-sm font-bold text-[#1c1c13] mb-3">Positions Held</h4>
                      <div className="space-y-2">
                        {selectedCallings.map((c, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#1B5E7B] mt-1.5 shrink-0" />
                            <div>
                              <p className="font-bold text-[#1c1c13]">{c.position}</p>
                              <p className="text-[#1c1c13]/50">
                                {c.dateStart}{c.dateEnd ? ` — ${c.dateEnd}` : ' — present'}
                                {c.calledBy && <span className="italic"> (by {c.calledBy})</span>}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {selectedBio?.notes && (
                    <>
                      <h4 className="text-sm font-bold text-[#1c1c13] mt-5 mb-2">Historical Notes</h4>
                      <p className="text-xs text-[#1c1c13]/70 leading-relaxed bg-[#fdf9e9] p-3 rounded-lg">{selectedBio.notes}</p>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-4xl text-[#1c1c13]/20 mb-3">person_search</span>
                  <p className="text-sm text-[#1c1c13]/40">Select an apostle to see details</p>
                </div>
              )}
            </div>
          </div>

          <DataCitation datasets="Apostle biographical data, calling records, and life expectancy data" />

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-8 text-xs text-[#1c1c13]/50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#f5a623]" />
              <span>Became Church President</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Currently Living</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#8455ef]" />
              <span>Non-Quorum Apostle</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#1B5E7B]" />
              <span>Deceased</span>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
