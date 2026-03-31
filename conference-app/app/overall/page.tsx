'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFilteredTalks } from '@/lib/filter-context';
import { getTalksByEra } from '@/lib/data-loader';
import { ERAS } from '@/lib/types';
import { loadInsights, ScriptureData } from '@/lib/insights';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Link from 'next/link';
import { DataCitation } from '@/components/data-citation';

interface HistoricalCount {
  decade: string;
  talks: number;
  words: number;
  avgWordsPerTalk: number;
}

const COLORS = ['#1B5E7B', '#8455ef', '#40c2fd', '#f5a623', '#00668a'];

const EXPORT_DATASETS = [
  {
    name: 'Conference Talks (metadata)',
    description: 'Speaker, title, year, calling, topics, emotions — no full text',
    href: '/conference_talks_cleaned_index.csv',
    size: '4.3 MB',
    icon: 'description',
  },
  {
    name: 'Conference Talks (full text)',
    description: 'Complete talk text and footnotes for all modern talks',
    href: '/conference_talks_cleaned.csv',
    size: '44.7 MB',
    icon: 'article',
  },
  {
    name: 'Historical Talks (pre-1971)',
    description: 'Speaker, title, and metadata for historical conference talks',
    href: '/historical_talks_index.csv',
    size: '1.9 MB',
    icon: 'history_edu',
  },
  {
    name: 'Analytics & Insights',
    description: 'Pre-computed scripture stats, speaker data, language trends, and more',
    href: '/insights.json',
    size: '3.1 MB',
    icon: 'analytics',
  },
  {
    name: 'Temple Data',
    description: 'Temple locations, status, details, and dedication info',
    href: '/temples1.csv',
    size: '0.1 MB',
    icon: 'temple_buddhist',
  },
];

function ExportDataButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="bg-[#f8f4e4] text-[#1B5E7B] px-6 sm:px-8 py-4 rounded-full font-bold text-sm hover:bg-[#f2eede] transition-all active:scale-95 flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-lg">download</span>
        Export Data
        <span className="material-symbols-outlined text-sm transition-transform" style={{ transform: open ? 'rotate(180deg)' : undefined }}>expand_more</span>
      </button>

      {open && (
        <>
          <div className="sm:hidden fixed inset-0 bg-black/30 z-40" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-3 bottom-20 sm:absolute sm:inset-auto sm:right-0 sm:bottom-full sm:mb-2 sm:w-[400px] bg-white rounded-2xl shadow-[0px_16px_48px_rgba(27,94,123,0.18)] border border-[#e8e0cc] z-50 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#f2eede]">
              <div>
                <p className="text-sm font-bold text-[#1c1c13]">Download Datasets</p>
                <p className="text-[11px] text-[#1c1c13]/50 mt-0.5">All data used in this app, free to download</p>
              </div>
              <button onClick={() => setOpen(false)} className="sm:hidden p-1.5 rounded-full hover:bg-[#f5a623]/10">
                <span className="material-symbols-outlined text-[#1c1c13]/40 text-xl">close</span>
              </button>
            </div>
            <div className="max-h-[50vh] sm:max-h-[360px] overflow-y-auto">
              {EXPORT_DATASETS.map(ds => (
                <a
                  key={ds.href}
                  href={ds.href}
                  download
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-5 py-3.5 hover:bg-[#fdf9e9] transition-colors border-b border-[#f8f4e4] last:border-b-0"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#1B5E7B]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[#1B5E7B] text-lg">{ds.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#1c1c13]">{ds.name}</p>
                    <p className="text-[11px] text-[#1c1c13]/50 leading-snug mt-0.5">{ds.description}</p>
                  </div>
                  <span className="text-[10px] font-bold text-[#1c1c13]/30 uppercase tracking-wider shrink-0 mt-1">{ds.size}</span>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function OverallPage() {
  const { talks, loading } = useFilteredTalks();
  const [selectedEra, setSelectedEra] = useState<string>('all');
  const [historicalCounts, setHistoricalCounts] = useState<HistoricalCount[]>([]);
  const [scriptureData, setScriptureData] = useState<ScriptureData | null>(null);

  useEffect(() => {
    fetch('/general_counts.txt')
      .then(r => r.text())
      .then(text => {
        const lines = text.trim().split('\n').slice(1); // skip header
        const parsed: HistoricalCount[] = lines.map(line => {
          const [decade, talks, words] = line.split('\t');
          const t = parseInt(talks, 10);
          const w = parseInt(words, 10);
          return {
            decade,
            talks: t,
            words: w,
            avgWordsPerTalk: t > 0 ? Math.round(w / t) : 0,
          };
        }).filter(r => r.talks > 0);
        setHistoricalCounts(parsed);
      })
      .catch(() => {});

    loadInsights().then(data => {
      setScriptureData(data.scriptures);
    }).catch(() => {});
  }, []);

  // Override historical counts with accurate modern data for overlapping decades
  const mergedHistoricalCounts = useMemo(() => {
    if (historicalCounts.length === 0 || talks.length === 0) return historicalCounts;

    const modernDecadeCounts = new Map<string, number>();
    talks.forEach(talk => {
      const decade = `${Math.floor(talk.year / 10) * 10}s`;
      modernDecadeCounts.set(decade, (modernDecadeCounts.get(decade) || 0) + 1);
    });

    return historicalCounts.map(entry => {
      const modernCount = modernDecadeCounts.get(entry.decade);
      if (modernCount && modernCount > entry.talks) {
        const avgWords = entry.avgWordsPerTalk > 0 ? entry.avgWordsPerTalk : 1650;
        const estimatedWords = modernCount * avgWords;
        return {
          ...entry,
          talks: modernCount,
          words: estimatedWords,
          avgWordsPerTalk: avgWords,
        };
      }
      return entry;
    });
  }, [historicalCounts, talks]);

  const filteredTalks = useMemo(() => {
    if (selectedEra === 'all') {
      return talks;
    }
    return getTalksByEra(talks, selectedEra);
  }, [selectedEra, talks]);

  const stats = useMemo(() => {
    const totalTalks = filteredTalks.length;
    const uniqueSpeakers = new Set(filteredTalks.map(t => t.speaker)).size;
    const totalConferences = new Set(filteredTalks.map(t => `${t.season} ${t.year}`)).size;

    const totalScriptureRefs = scriptureData
      ? scriptureData.byVolume.reduce((sum, v) => sum + v.references, 0)
      : 0;
    const avgRefsPerTalk = totalTalks > 0 ? (totalScriptureRefs / totalTalks).toFixed(1) : '0';

    const years = filteredTalks.map(t => t.year);
    const minYear = years.length > 0 ? Math.min(...years) : 0;
    const maxYear = years.length > 0 ? Math.max(...years) : 0;

    const speakerCounts = new Map<string, number>();
    filteredTalks.forEach(talk => {
      speakerCounts.set(talk.speaker, (speakerCounts.get(talk.speaker) || 0) + 1);
    });
    const topSpeakers = Array.from(speakerCounts.entries())
      .map(([speaker, count]) => ({ speaker, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const yearCounts = new Map<number, number>();
    filteredTalks.forEach(talk => {
      yearCounts.set(talk.year, (yearCounts.get(talk.year) || 0) + 1);
    });
    const talksByYear = Array.from(yearCounts.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year);

    const eraCounts = new Map<string, number>();
    filteredTalks.forEach(talk => {
      const era = ERAS.find(e => talk.year >= e.start && (e.end === null || talk.year <= e.end));
      if (era) {
        eraCounts.set(era.name, (eraCounts.get(era.name) || 0) + 1);
      }
    });
    const talksByEra = Array.from(eraCounts.entries())
      .map(([era, count]) => ({ era, count }));

    const volumeData = scriptureData
      ? scriptureData.byVolume.map(v => ({ name: v.volume, value: v.references }))
      : [];

    const decadeMap = new Map<number, number>();
    filteredTalks.forEach(talk => {
      const decade = Math.floor(talk.year / 10) * 10;
      decadeMap.set(decade, (decadeMap.get(decade) || 0) + 1);
    });
    const decades = Array.from(decadeMap.entries())
      .map(([decade, count]) => ({ decade, count }))
      .sort((a, b) => a.decade - b.decade);

    const donutTotal = talksByEra.reduce((s, e) => s + e.count, 0);

    return { totalTalks, uniqueSpeakers, totalConferences, totalScriptureRefs, avgRefsPerTalk, minYear, maxYear, topSpeakers, talksByYear, talksByEra, volumeData, decades, donutTotal };
  }, [filteredTalks, scriptureData]);

  const { totalTalks, uniqueSpeakers, totalConferences, totalScriptureRefs, avgRefsPerTalk, minYear, maxYear, topSpeakers, talksByYear, talksByEra, volumeData, decades, donutTotal } = stats;

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Navigation />
        <main className="ml-0 lg:ml-[260px] min-h-screen flex-1 bg-[#fdf9e9] pt-20 lg:pt-0">
          <TopAppBar title="The Big Picture" subtitle="Conference at a Glance" />
          <div className="px-4 md:px-8 lg:px-12 py-24 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-[#f5a623] border-t-transparent animate-spin" />
              <p className="text-[#524534] font-medium">Loading conference data...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1 bg-[#fdf9e9] pt-20 lg:pt-0">
        <TopAppBar title="The Big Picture" subtitle="Conference at a Glance" />

        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24 space-y-6 md:space-y-10">

          {/* Era Filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 pt-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1B5E7B] text-xl">filter_list</span>
              <span className="text-sm font-bold text-[#524534] uppercase tracking-widest">Filter by Era</span>
            </div>
            <Select value={selectedEra} onValueChange={setSelectedEra}>
              <SelectTrigger className="w-full sm:w-[280px] bg-white rounded-full border-0 shadow-[0px_4px_12px_rgba(27,94,123,0.06)] text-[#1c1c13] font-medium">
                <SelectValue placeholder="Choose an era" />
              </SelectTrigger>
              <SelectContent className="bg-white border-0 shadow-[0px_12px_32px_rgba(27,94,123,0.12)] rounded-xl">
                <SelectItem value="all">All Eras</SelectItem>
                {ERAS.filter(era => (era.end === null || era.end >= 1971)).map(era => (
                  <SelectItem key={era.name} value={era.name}>
                    {era.name} Era ({era.start}-{era.end || 'present'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* High-level Stats Bento */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: 'record_voice_over', value: totalTalks.toLocaleString(), label: 'Total Talks', color: '#f5a623' },
              { icon: 'person_4', value: uniqueSpeakers.toLocaleString(), label: 'Unique Speakers', color: '#8455ef' },
              { icon: 'calendar_month', value: totalConferences.toLocaleString(), label: 'Conferences', color: '#40c2fd' },
              { icon: 'history', value: `${minYear}–${maxYear}`, label: `${maxYear - minYear + 1} Years of Talks`, color: '#ba1a1a' },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.08)] p-4 md:p-6 lg:p-8 flex flex-col items-center text-center gap-3 transition-all hover:shadow-[0px_16px_40px_rgba(27,94,123,0.12)] hover:-translate-y-0.5"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: stat.color + '18' }}
                >
                  <span
                    className="material-symbols-outlined text-3xl"
                    style={{ color: stat.color, fontVariationSettings: "'FILL' 1" }}
                  >
                    {stat.icon}
                  </span>
                </div>
                <div className="text-2xl md:text-4xl font-extrabold text-[#1c1c13] tracking-tight">{stat.value}</div>
                <div className="text-sm font-medium text-[#524534]">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Most Frequent Voices + Did You Know */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Most Frequent Voices - Bar Chart */}
            <div className="col-span-1 sm:col-span-2 bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.08)] p-4 md:p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-[#1B5E7B] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
                <h2 className="text-xl font-bold text-[#1c1c13]">Most Frequent Voices</h2>
              </div>
              <div className="space-y-3">
                {topSpeakers.slice(0, 10).map((s, i) => {
                  const maxCount = topSpeakers[0]?.count || 1;
                  const pct = (s.count / maxCount) * 100;
                  return (
                    <div key={i} className="flex items-center gap-4">
                      <span className="w-6 text-right text-xs font-bold text-[#524534]/60">{i + 1}</span>
                      <span className="w-24 sm:w-44 text-sm font-medium text-[#1c1c13] truncate">{s.speaker}</span>
                      <div className="flex-1 h-7 bg-[#f8f4e4] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                          style={{
                            width: `${Math.max(pct, 8)}%`,
                            background: 'linear-gradient(45deg, #1B5E7B, #f5a623)',
                          }}
                        >
                          <span className="text-xs font-bold text-white drop-shadow-sm">{s.count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Did You Know? */}
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-1">
                <span className="material-symbols-outlined text-[#1B5E7B] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
                <h2 className="text-xl font-bold text-[#1c1c13]">Did You Know?</h2>
              </div>

              <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.08)] p-6 border-l-4 border-[#1B5E7B]">
                <p className="text-sm text-[#524534] leading-relaxed">
                  <span className="font-bold text-[#1B5E7B]">{totalScriptureRefs.toLocaleString()}</span> scripture references
                  have been made across all talks, averaging <span className="font-bold text-[#1B5E7B]">{avgRefsPerTalk}</span> per talk.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.08)] p-6 border-l-4 border-[#8455ef]">
                <p className="text-sm text-[#524534] leading-relaxed">
                  The dataset spans <span className="font-bold text-[#8455ef]">{maxYear - minYear + 1} years</span> of
                  General Conference, from {minYear} to {maxYear}.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.08)] p-6 border-l-4 border-[#00668a]">
                <p className="text-sm text-[#524534] leading-relaxed">
                  The most prolific speaker, <span className="font-bold text-[#00668a]">{topSpeakers[0]?.speaker}</span>,
                  has given <span className="font-bold text-[#00668a]">{topSpeakers[0]?.count}</span> conference talks.
                </p>
              </div>
            </div>
          </div>

          {/* Topics Donut + Talks by Era */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Donut Chart */}
            <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.08)] p-4 md:p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-[#1B5E7B] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>donut_large</span>
                <h2 className="text-xl font-bold text-[#1c1c13]">Scripture Volume Distribution</h2>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={volumeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {volumeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0px 8px 24px rgba(27,94,123,0.12)',
                        fontSize: '13px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-3">
                  {volumeData.map((v, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i] }} />
                      <span className="text-sm text-[#524534]">{v.name}</span>
                      <span className="ml-auto text-sm font-bold text-[#1c1c13]">{v.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Talks by Era */}
            <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.08)] p-4 md:p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-[#1B5E7B] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>bar_chart</span>
                <h2 className="text-xl font-bold text-[#1c1c13]">Talks by Era</h2>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={talksByEra} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f2eede" vertical={false} />
                  <XAxis
                    dataKey="era"
                    tick={{ fontSize: 11, fill: '#524534' }}
                    axisLine={{ stroke: '#f2eede' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#524534' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0px 8px 24px rgba(27,94,123,0.12)',
                      fontSize: '13px',
                    }}
                  />
                  <Bar dataKey="count" fill="#1B5E7B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Talks Over Time */}
          <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.08)] p-4 md:p-6 lg:p-8">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6">
              <span className="material-symbols-outlined text-[#1B5E7B] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>timeline</span>
              <h2 className="text-xl font-bold text-[#1c1c13]">Talks Over Time</h2>
              <span className="text-xs sm:text-sm text-[#524534]/60">per year</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={talksByYear}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f2eede" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 10, fill: '#524534' }}
                  axisLine={{ stroke: '#f2eede' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#524534' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0px 8px 24px rgba(27,94,123,0.12)',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="count" fill="#f5a623" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Through the Decades Timeline */}
          <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.08)] p-4 md:p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-[#1B5E7B] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>update</span>
              <h2 className="text-xl font-bold text-[#1c1c13]">Through the Decades</h2>
            </div>
            <div className="rounded-xl overflow-hidden">
              {decades.map((d, i) => (
                <div
                  key={d.decade}
                  className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 transition-colors"
                  style={{ backgroundColor: i % 2 === 0 ? '#fdf9e9' : '#f8f4e4' }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-extrabold text-[#1B5E7B] w-16">{d.decade}s</span>
                    <div className="h-2 rounded-full bg-[#f2eede] w-32 sm:w-64 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(d.count / Math.max(...decades.map(x => x.count))) * 100}%`,
                          background: `linear-gradient(90deg, #1B5E7B, ${i % 2 === 0 ? '#f5a623' : '#8455ef'})`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-[#1c1c13]">{d.count.toLocaleString()} talks</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top 20 Speakers Full Table */}
          <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.08)] p-4 md:p-6 lg:p-8">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6">
              <span className="material-symbols-outlined text-[#1B5E7B] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
              <h2 className="text-xl font-bold text-[#1c1c13]">Top 20 Speakers</h2>
              <span className="text-xs sm:text-sm text-[#524534]/60">By total talk count</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
              {topSpeakers.map((stat, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 py-3 px-4 rounded-lg transition-colors hover:bg-[#fdf9e9]"
                  style={{ borderBottom: '1px solid #f2eede' }}
                >
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0"
                    style={{
                      backgroundColor: idx < 3 ? '#f5a623' : '#f2eede',
                      color: idx < 3 ? 'white' : '#524534',
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium text-[#1c1c13] truncate">{stat.speaker}</span>
                  <span className="text-sm font-bold text-[#1B5E7B]">{stat.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Historical Conference Counts (from general_counts.txt) */}
          {mergedHistoricalCounts.length > 0 && (
            <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.08)] p-4 md:p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-[#1B5E7B] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>library_books</span>
                <h2 className="text-xl font-bold text-[#1c1c13]">Conference Through the Ages</h2>
              </div>
              <p className="text-xs text-[#1c1c13]/50 mb-6">Total talks and words spoken each decade, from 1850s to present</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Talks per decade */}
                <div>
                  <h3 className="text-sm font-bold text-[#1c1c13] mb-3">Talks Per Decade</h3>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mergedHistoricalCounts}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                        <XAxis dataKey="decade" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={50} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{ background: 'white', border: 'none', borderRadius: '12px', boxShadow: '0px 8px 24px rgba(27,94,123,0.12)', fontSize: '13px' }}
                          formatter={(value: any) => [Number(value).toLocaleString(), 'Talks']}
                        />
                        <Bar dataKey="talks" fill="#1B5E7B" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Avg words per talk */}
                <div>
                  <h3 className="text-sm font-bold text-[#1c1c13] mb-3">Average Words Per Talk</h3>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mergedHistoricalCounts}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                        <XAxis dataKey="decade" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={50} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{ background: 'white', border: 'none', borderRadius: '12px', boxShadow: '0px 8px 24px rgba(27,94,123,0.12)', fontSize: '13px' }}
                          formatter={(value: any) => [Number(value).toLocaleString(), 'Words/Talk']}
                        />
                        <Bar dataKey="avgWordsPerTalk" fill="#8455ef" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Summary row */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="bg-[#fdf9e9] p-3 sm:p-4 rounded-lg text-center">
                  <p className="text-base sm:text-xl font-extrabold text-[#1c1c13]">{mergedHistoricalCounts.reduce((s, r) => s + r.talks, 0).toLocaleString()}</p>
                  <p className="text-[8px] sm:text-[10px] uppercase tracking-wider text-[#1c1c13]/40 font-bold mt-1">All-Time Talks</p>
                </div>
                <div className="bg-[#fdf9e9] p-3 sm:p-4 rounded-lg text-center">
                  <p className="text-base sm:text-xl font-extrabold text-[#1c1c13]">{(mergedHistoricalCounts.reduce((s, r) => s + r.words, 0) / 1000000).toFixed(1)}M</p>
                  <p className="text-[8px] sm:text-[10px] uppercase tracking-wider text-[#1c1c13]/40 font-bold mt-1">Words Spoken</p>
                </div>
                <div className="bg-[#fdf9e9] p-3 sm:p-4 rounded-lg text-center">
                  <p className="text-base sm:text-xl font-extrabold text-[#1c1c13]">{mergedHistoricalCounts.length}</p>
                  <p className="text-[8px] sm:text-[10px] uppercase tracking-wider text-[#1c1c13]/40 font-bold mt-1">Decades</p>
                </div>
              </div>

              <DataCitation datasets="Pre-1971 conference talk and word counts" />
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#1B5E7B]/5 border border-[#1B5E7B]/10 mt-3">
                <span className="material-symbols-outlined text-[#1B5E7B]/40 text-lg mt-0.5 shrink-0">update</span>
                <p className="text-[11px] text-[#1c1c13]/50 leading-relaxed">
                  Recent decades are supplemented with talk counts from our modern conference dataset to ensure accuracy.
                </p>
              </div>
            </div>
          )}

          {/* CTA Footer */}
          <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.08)] p-5 md:p-8 lg:p-10 flex flex-col items-center text-center md:text-left md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#1c1c13] mb-1 sm:mb-2">Ready to explore further?</h3>
              <p className="text-sm sm:text-base text-[#524534]">Dive deeper into topics, speakers, and trends.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              <Link
                href="/search"
                className="bg-[#1B5E7B] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-sm shadow-[0px_8px_24px_rgba(27,94,123,0.2)] hover:shadow-[0px_12px_32px_rgba(245,166,35,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">search</span>
                Search Talks
              </Link>
              <ExportDataButton />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
