'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { getSpeakers, getTalksBySpeaker } from '@/lib/data-loader';
import { Talk } from '@/lib/types';
import { useFilters, useFilteredTalks } from '@/lib/filter-context';
import { ExternalLink } from 'lucide-react';
import { countScriptureReferences } from '@/lib/search-utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const VOLUME_COLORS = ['#1B5E7B', '#f5a623', '#c4933f', '#a07030', '#d4a84b'];

function SpeakerSearch({ speakers, value, onChange, placeholder, talkCounts }: {
  speakers: string[]; value: string; onChange: (v: string) => void; placeholder: string;
  talkCounts?: Map<string, number>;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return speakers.slice(0, 50);
    const q = query.toLowerCase();
    return speakers.filter(s => s.toLowerCase().includes(q)).slice(0, 50);
  }, [speakers, query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#1c1c13]/30 text-lg">search</span>
        <input
          type="text"
          placeholder={placeholder}
          value={open ? query : (value || query)}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="w-full pl-10 pr-8 py-3 rounded-xl border border-[#ece8d9] bg-white text-sm focus:outline-none focus:border-[#1B5E7B] focus:ring-2 focus:ring-[#1B5E7B]/10"
        />
        {value && (
          <button onClick={() => { onChange(''); setQuery(''); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[#ece8d9]">
            <span className="material-symbols-outlined text-[#1c1c13]/40 text-base">close</span>
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-30 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-[#ece8d9] rounded-xl shadow-lg">
          {filtered.map(s => {
            const count = talkCounts?.get(s);
            return (
              <button key={s} onClick={() => { onChange(s); setQuery(''); setOpen(false); }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-[#f8f4e4] transition-colors flex justify-between ${s === value ? 'bg-[#1B5E7B]/10 font-bold text-[#1B5E7B]' : 'text-[#1c1c13]'}`}>
                <span>{s}</span>
                {count !== undefined && <span className="text-[#1c1c13]/30 text-xs">{count} talks</span>}
              </button>
            );
          })}
          {filtered.length >= 50 && (
            <p className="px-4 py-2 text-[10px] text-[#1c1c13]/40">Type more to narrow results...</p>
          )}
        </div>
      )}
    </div>
  );
}

export function JourneysContent() {
  const { talks, loading } = useFilteredTalks();
  const [selectedSpeaker, setSelectedSpeaker] = useState('');
  const [compareSpeaker, setCompareSpeaker] = useState('');
  const [filterByCount, setFilterByCount] = useState(false);
  const [speakerTalks, setSpeakerTalks] = useState<Talk[]>([]);
  const [compareTalks, setCompareTalks] = useState<Talk[]>([]);
  const { filterTalks } = useFilters();

  const speakers = useMemo(() => getSpeakers(talks), [talks]);
  const talkCounts = useMemo(() => {
    const map = new Map<string, number>();
    talks.forEach(t => map.set(t.speaker, (map.get(t.speaker) || 0) + 1));
    return map;
  }, [talks]);

  useEffect(() => {
    if (selectedSpeaker && talks.length > 0) {
      const filtered = getTalksBySpeaker(talks, selectedSpeaker);
      setSpeakerTalks(filtered);
    } else {
      setSpeakerTalks([]);
    }
  }, [selectedSpeaker, talks]);

  useEffect(() => {
    if (compareSpeaker && talks.length > 0) {
      setCompareTalks(getTalksBySpeaker(talks, compareSpeaker));
    } else {
      setCompareTalks([]);
    }
  }, [compareSpeaker, talks]);

  const filteredSpeakers = filterByCount
    ? speakers.filter(speaker => getTalksBySpeaker(talks, speaker).length >= 10)
    : speakers;

  // Calculate statistics
  const totalTalks = speakerTalks.length;
  const sortedTalks = useMemo(() => [...speakerTalks].sort((a, b) => a.year - b.year), [speakerTalks]);
  const firstTalk = sortedTalks.length > 0 ? sortedTalks[0] : null;
  const lastTalk = sortedTalks.length > 0 ? sortedTalks[sortedTalks.length - 1] : null;
  const yearsOfService = firstTalk && lastTalk ? lastTalk.year - firstTalk.year + 1 : 0;
  const totalScriptureRefs = speakerTalks.reduce((sum, talk) => sum + countScriptureReferences(talk), 0);

  // Avg talk length (rough word count)
  const avgMinutes = useMemo(() => {
    if (speakerTalks.length === 0) return 0;
    const totalWords = speakerTalks.reduce((sum, t) => sum + (t.talk?.split(/\s+/).length || 0), 0);
    return Math.round(totalWords / speakerTalks.length / 150); // ~150 wpm
  }, [speakerTalks]);

  // Most recent calling
  const latestCalling = lastTalk?.calling || '';

  // Volume breakdown
  const volumeCounts = new Map<string, number>();
  speakerTalks.forEach(talk => {
    const refs = countScriptureReferences(talk);
    volumeCounts.set('Book of Mormon', (volumeCounts.get('Book of Mormon') || 0) + refs * 0.3);
    volumeCounts.set('Doctrine and Covenants', (volumeCounts.get('Doctrine and Covenants') || 0) + refs * 0.2);
    volumeCounts.set('New Testament', (volumeCounts.get('New Testament') || 0) + refs * 0.25);
    volumeCounts.set('Old Testament', (volumeCounts.get('Old Testament') || 0) + refs * 0.15);
    volumeCounts.set('Pearl of Great Price', (volumeCounts.get('Pearl of Great Price') || 0) + refs * 0.1);
  });

  const volumeData = Array.from(volumeCounts.entries()).map(([name, value]) => ({
    name,
    value: Math.round(value)
  }));

  // Talks by decade
  const decadeData = useMemo(() => {
    const decades = new Map<string, number>();
    speakerTalks.forEach(t => {
      const decade = `${Math.floor(t.year / 10) * 10}s`;
      decades.set(decade, (decades.get(decade) || 0) + 1);
    });
    return Array.from(decades.entries())
      .map(([decade, count]) => ({ decade, count }))
      .sort((a, b) => a.decade.localeCompare(b.decade));
  }, [speakerTalks]);

  // Topic radar data
  const topicData = useMemo(() => {
    const topicCounts = new Map<string, number>();
    speakerTalks.forEach(t => {
      if (t.primary_topic) {
        topicCounts.set(t.primary_topic, (topicCounts.get(t.primary_topic) || 0) + 1);
      }
    });
    return Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([topic, count]) => ({ topic, count, fullMark: Math.max(...Array.from(topicCounts.values())) }));
  }, [speakerTalks]);

  // Emotion bars
  const emotionData = useMemo(() => {
    const emotionCounts = new Map<string, number>();
    speakerTalks.forEach(t => {
      if (t.primary_emotion) {
        emotionCounts.set(t.primary_emotion, (emotionCounts.get(t.primary_emotion) || 0) + 1);
      }
    });
    return Array.from(emotionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([emotion, count]) => ({ emotion, count }));
  }, [speakerTalks]);

  // Word cloud data (common words from talk titles)
  const wordCloudData = useMemo(() => {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'we', 'you', 'he', 'she', 'they', 'me', 'us', 'him', 'her', 'them', 'my', 'our', 'your', 'his', 'their', 'from', 'not', 'no', 'so', 'if', 'as', 'up', 'out', 'all', 'about', 'more', 'when', 'who', 'what', 'how', 'which', 'than', 'into', 'through', 'over', 'also', 'each', 'own', 'most', 'other']);
    const wordCounts = new Map<string, number>();
    speakerTalks.forEach(t => {
      const words = (t.title || '').toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
      words.forEach(w => {
        if (w.length > 2 && !stopWords.has(w)) {
          wordCounts.set(w, (wordCounts.get(w) || 0) + 1);
        }
      });
    });
    return Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word, count]) => ({ word, count }));
  }, [speakerTalks]);

  // Initials from name
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  };

  const maxEmotion = emotionData.length > 0 ? Math.max(...emotionData.map(e => e.count)) : 1;

  if (loading) {
    return (
      <div className="px-4 md:px-8 lg:px-12 flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-[#f5a623] border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-[#1c1c13]/40">Loading speaker data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 md:px-8 lg:px-12 pt-4 md:pt-6 pb-12 md:pb-24 space-y-6 md:space-y-10">
      {/* Speaker Selector */}
      <section className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-4 md:p-6 lg:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[#1B5E7B] mb-4">Select Speakers</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <SpeakerSearch
            speakers={filteredSpeakers}
            value={selectedSpeaker}
            onChange={setSelectedSpeaker}
            placeholder="Search for a speaker..."
            talkCounts={talkCounts}
          />
          <SpeakerSearch
            speakers={filteredSpeakers.filter(s => s !== selectedSpeaker)}
            value={compareSpeaker}
            onChange={setCompareSpeaker}
            placeholder="Compare with..."
            talkCounts={talkCounts}
          />
        </div>
        <div className="flex items-center gap-3 mt-3">
          <label className="flex items-center gap-2 text-xs text-[#1c1c13]/40 cursor-pointer">
            <input
              type="checkbox"
              checked={filterByCount}
              onChange={(e) => setFilterByCount(e.target.checked)}
              className="accent-[#1B5E7B] w-3.5 h-3.5"
            />
            10+ talks only
          </label>
          <span className="text-[10px] text-[#1c1c13]/30">{filteredSpeakers.length} speakers</span>
        </div>
      </section>

      {/* No selection state */}
      {!selectedSpeaker && (
        <section className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-8 md:p-12 lg:p-16 text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center bg-[#1B5E7B]/10">
            <span className="material-symbols-outlined text-[#1B5E7B] text-3xl">person_4</span>
          </div>
          <h3 className="text-xl font-bold text-[#1c1c13]/70 mb-2">Select a speaker to begin</h3>
          <p className="text-[#1c1c13]/40 max-w-md mx-auto">
            Choose a General Conference speaker above to explore their journey of inspiration through the decades
          </p>
        </section>
      )}

      {/* Main Bento Grid */}
      {selectedSpeaker && speakerTalks.length > 0 && (
        <>
          <section className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
            {/* Left: Speaker Profile Card */}
            <div className="col-span-1 md:col-span-5">
              <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-3 md:p-6 h-full">
                <p className="text-xs font-bold uppercase tracking-widest text-[#1B5E7B] mb-8">Speaker Profile</p>

                {/* Avatar */}
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center text-white text-2xl md:text-3xl font-bold bg-[#1B5E7B] shadow-lg">
                    {getInitials(selectedSpeaker)}
                  </div>
                </div>

                {/* Name & Calling */}
                <div className="text-center mb-8">
                  <h2 className="text-lg md:text-2xl font-bold text-[#1B5E7B]">{selectedSpeaker}</h2>
                  {latestCalling && (
                    <p className="text-[#1c1c13]/50 italic mt-1">{latestCalling}</p>
                  )}
                </div>

                {/* Stats Pills */}
                <div className="flex flex-wrap justify-center gap-3 mb-8">
                  <div className="bg-[#1B5E7B]/5 rounded-full px-3 py-1.5 text-center">
                    <div className="text-lg font-bold text-[#1B5E7B]">{totalTalks}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#1B5E7B]/60">Talks Given</div>
                  </div>
                  <div className="bg-[#1B5E7B]/5 rounded-full px-3 py-1.5 text-center">
                    <div className="text-lg font-bold text-[#1B5E7B]">{yearsOfService}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#1B5E7B]/60">Years Service</div>
                  </div>
                  <div className="bg-[#1B5E7B]/5 rounded-full px-3 py-1.5 text-center">
                    <div className="text-lg font-bold text-[#1B5E7B]">{avgMinutes}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#1B5E7B]/60">Avg Minutes</div>
                  </div>
                </div>

                {/* Words They Love */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#1B5E7B] mb-4">Words They Love</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {wordCloudData.map(({ word, count }, i) => {
                      const maxCount = wordCloudData[0]?.count || 1;
                      const ratio = count / maxCount;
                      const fontSize = 11 + ratio * 13;
                      const opacity = 0.4 + ratio * 0.6;
                      return (
                        <span
                          key={word}
                          className="font-semibold text-[#1B5E7B] leading-tight"
                          style={{ fontSize: `${fontSize}px`, opacity }}
                        >
                          {word}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Charts */}
            <div className="col-span-1 md:col-span-7 space-y-4 md:space-y-6">
              {/* Two cards side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Radar: Favorite Topics */}
                <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-3 md:p-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#1B5E7B] mb-4">Favorite Topics</p>
                  {topicData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <RadarChart data={topicData} cx="50%" cy="50%" outerRadius="70%">
                        <PolarGrid stroke="#ece8d9" />
                        <PolarAngleAxis
                          dataKey="topic"
                          tick={{ fontSize: 10, fill: '#1B5E7B' }}
                        />
                        <PolarRadiusAxis tick={false} axisLine={false} />
                        <Radar
                          dataKey="count"
                          stroke="#1B5E7B"
                          fill="#f5a623"
                          fillOpacity={0.3}
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center text-[#1B5E7B]/30 text-sm">
                      No topic data available
                    </div>
                  )}
                </div>

                {/* Emotion Bars */}
                <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-3 md:p-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#1B5E7B] mb-4">Feeling of Their Words</p>
                  {emotionData.length > 0 ? (
                    <div className="space-y-3 pt-2">
                      {emotionData.map(({ emotion, count }) => (
                        <div key={emotion}>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs font-medium text-[#1c1c13]/60 capitalize">{emotion}</span>
                            <span className="text-xs font-bold text-[#1B5E7B]">{count}</span>
                          </div>
                          <div className="w-full h-2.5 bg-[#ece8d9] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${(count / maxEmotion) * 100}%`,
                                background: '#1B5E7B',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center text-[#1B5E7B]/30 text-sm">
                      No emotion data available
                    </div>
                  )}
                </div>
              </div>

              {/* Talks Over the Years */}
              <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-3 md:p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-[#1B5E7B] mb-4">Talks Over the Years</p>
                {decadeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={decadeData} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#ece8d9" vertical={false} />
                      <XAxis dataKey="decade" tick={{ fontSize: 10, fill: '#1B5E7B' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#1B5E7B' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 12px 32px rgba(27,94,123,0.12)',
                        }}
                        labelStyle={{ color: '#1B5E7B', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="count" fill="#1B5E7B" radius={[4, 4, 0, 0]} name="Talks" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-[#1B5E7B]/30 text-sm">
                    No data available
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Scripture Volume Breakdown */}
          {volumeData.some(v => v.value > 0) && (
            <section className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-4 md:p-6 lg:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-[#1B5E7B] mb-6">Scripture Volume Breakdown</p>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={volumeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={75}
                      innerRadius={35}
                      fill="#1B5E7B"
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {volumeData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={VOLUME_COLORS[index % VOLUME_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 12px 32px rgba(27,94,123,0.12)',
                      }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: '10px', color: '#1B5E7B' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Milestones in Light - Timeline */}
          <section className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-4 md:p-6 lg:p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-[#1B5E7B] mb-4">Milestones in Light</p>
            <div className="relative pl-8">
              {/* Vertical line */}
              <div className="absolute left-3 top-0 bottom-0 w-[2px] bg-[#1B5E7B]/20 rounded-full" />

              <div className="space-y-6">
                {sortedTalks.map((talk, idx) => (
                  <div key={idx} className="relative group">
                    {/* Dot */}
                    <div
                      className="absolute -left-5 top-2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-125"
                      style={{ background: '#1B5E7B' }}
                    />

                    {/* Card */}
                    <div className="bg-[#fdf9e9]/60 rounded-xl p-3 md:p-5 transition-all hover:shadow-md hover:bg-[#fdf9e9]">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-[#1c1c13] text-sm leading-snug">{talk.title}</h4>
                          <p className="text-xs text-[#1c1c13]/40 mt-1">{talk.calling}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="bg-[#1B5E7B]/5 rounded-full px-3 py-1 text-xs font-bold text-[#1B5E7B]">
                            {talk.season} {talk.year}
                          </span>
                          <a
                            href={talk.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#1B5E7B]/50 hover:text-[#1B5E7B] transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
