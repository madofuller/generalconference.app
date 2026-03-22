'use client';

import { useState, useEffect, useMemo } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

export default function SpeakersPage() {
  const { talks, loading } = useFilteredTalks();
  const [selectedSpeaker, setSelectedSpeaker] = useState('');
  const [compareSpeaker, setCompareSpeaker] = useState('');
  const [filterByCount, setFilterByCount] = useState(false);
  const [speakerTalks, setSpeakerTalks] = useState<Talk[]>([]);
  const [compareTalks, setCompareTalks] = useState<Talk[]>([]);
  const { filterTalks } = useFilters();

  const speakers = useMemo(() => getSpeakers(talks), [talks]);

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
      <div className="flex min-h-screen">
        <Navigation />
        <main className="ml-0 lg:ml-[260px] min-h-screen flex-1">
          <TopAppBar title="Speaker Journeys" subtitle="Witness the path of inspiration through the decades" />
          <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center h-[60vh]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full mx-auto animate-pulse" style={{ background: 'linear-gradient(45deg, #1B5E7B, #f5a623)' }} />
              <p className="text-[#1B5E7B]/60 font-medium">Loading speaker data...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1">
        <TopAppBar title="Speaker Journeys" subtitle="Witness the path of inspiration through the decades" />

        <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-12">
          {/* Speaker Selector */}
          <section className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-4 md:p-6 lg:p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-[#1B5E7B] mb-6">Select Speakers</p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
              <div className="flex-1 min-w-0">
                <label className="text-sm text-[#1c1c13]/50 mb-2 block">Choose a speaker</label>
                <Select value={selectedSpeaker} onValueChange={setSelectedSpeaker}>
                  <SelectTrigger className="bg-[#ece8d9] border-none rounded-xl py-4 px-4 sm:px-6 h-auto text-base w-full">
                    <SelectValue placeholder="Choose a speaker" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <label className="flex items-center gap-2 text-xs text-[#1B5E7B]/60 cursor-pointer mb-2 px-2">
                        <input
                          type="checkbox"
                          checked={filterByCount}
                          onChange={(e) => setFilterByCount(e.target.checked)}
                          className="accent-[#1B5E7B]"
                        />
                        10+ talks only
                      </label>
                    </div>
                    {filteredSpeakers.map(speaker => {
                      const count = getTalksBySpeaker(talks, speaker).length;
                      return (
                        <SelectItem key={speaker} value={speaker}>
                          {speaker} ({count} {count === 1 ? 'talk' : 'talks'})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-0">
                <label className="text-sm text-[#1c1c13]/50 mb-2 block">Compare with...</label>
                <Select value={compareSpeaker} onValueChange={setCompareSpeaker}>
                  <SelectTrigger className="bg-[#ece8d9] border-none rounded-xl py-4 px-4 sm:px-6 h-auto text-base w-full">
                    <SelectValue placeholder="Compare with..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSpeakers.filter(s => s !== selectedSpeaker).map(speaker => {
                      const count = getTalksBySpeaker(talks, speaker).length;
                      return (
                        <SelectItem key={speaker} value={speaker}>
                          {speaker} ({count} {count === 1 ? 'talk' : 'talks'})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <button
                onClick={() => {
                  const s = selectedSpeaker;
                  setSelectedSpeaker('');
                  setTimeout(() => setSelectedSpeaker(s), 0);
                }}
                className="w-full sm:w-auto px-8 py-4 rounded-full text-white font-bold text-sm uppercase tracking-wider shrink-0 transition-all hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(45deg, #1B5E7B, #f5a623)' }}
              >
                Update View
              </button>
            </div>
          </section>

          {/* No selection state */}
          {!selectedSpeaker && (
            <section className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-8 md:p-12 lg:p-16 text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: 'linear-gradient(45deg, #1B5E7B, #f5a623)' }}>
                <span className="material-symbols-outlined text-white text-3xl">person_4</span>
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
                  <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-4 md:p-6 lg:p-8 h-full">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#1B5E7B] mb-8">Speaker Profile</p>

                    {/* Avatar */}
                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        <div className="absolute inset-[-8px] rounded-full opacity-30 blur-xl" style={{ background: 'linear-gradient(45deg, #1B5E7B, #f5a623)' }} />
                        <div
                          className="relative w-28 h-28 rounded-full flex items-center justify-center text-white text-3xl font-bold"
                          style={{ background: 'linear-gradient(135deg, #1B5E7B, #f5a623)' }}
                        >
                          {getInitials(selectedSpeaker)}
                        </div>
                      </div>
                    </div>

                    {/* Name & Calling */}
                    <div className="text-center mb-8">
                      <h2 className="text-xl md:text-3xl font-bold text-[#1B5E7B]">{selectedSpeaker}</h2>
                      {latestCalling && (
                        <p className="text-[#1c1c13]/50 italic mt-1">{latestCalling}</p>
                      )}
                    </div>

                    {/* Stats Pills */}
                    <div className="flex flex-wrap justify-center gap-3 mb-8">
                      <div className="bg-[#1B5E7B]/5 rounded-full px-5 py-2.5 text-center">
                        <div className="text-lg font-bold text-[#1B5E7B]">{totalTalks}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#1B5E7B]/60">Talks Given</div>
                      </div>
                      <div className="bg-[#1B5E7B]/5 rounded-full px-5 py-2.5 text-center">
                        <div className="text-lg font-bold text-[#1B5E7B]">{yearsOfService}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#1B5E7B]/60">Years Service</div>
                      </div>
                      <div className="bg-[#1B5E7B]/5 rounded-full px-5 py-2.5 text-center">
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
                          const fontSize = 12 + ratio * 18;
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
                    <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-6">
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
                    <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-6">
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
                                    background: 'linear-gradient(45deg, #1B5E7B, #f5a623)',
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
                  <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#1B5E7B] mb-4">Talks Over the Years</p>
                    {decadeData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={decadeData} barCategoryGap="30%">
                          <CartesianGrid strokeDasharray="3 3" stroke="#ece8d9" vertical={false} />
                          <XAxis dataKey="decade" tick={{ fontSize: 12, fill: '#1B5E7B' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#1B5E7B' }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{
                              background: 'white',
                              border: 'none',
                              borderRadius: '12px',
                              boxShadow: '0 12px 32px rgba(27,94,123,0.12)',
                            }}
                            labelStyle={{ color: '#1B5E7B', fontWeight: 'bold' }}
                          />
                          <defs>
                            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f5a623" />
                              <stop offset="100%" stopColor="#1B5E7B" />
                            </linearGradient>
                          </defs>
                          <Bar dataKey="count" fill="url(#barGrad)" radius={[6, 6, 0, 0]} name="Talks" />
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
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={volumeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                          outerRadius={100}
                          innerRadius={50}
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
                          wrapperStyle={{ fontSize: '12px', color: '#1B5E7B' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              )}

              {/* Milestones in Light - Timeline */}
              <section className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] p-4 md:p-6 lg:p-8">
                <p className="text-xs font-bold uppercase tracking-widest text-[#1B5E7B] mb-8">Milestones in Light</p>
                <div className="relative pl-8">
                  {/* Vertical line */}
                  <div className="absolute left-3 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#f5a623] to-[#1B5E7B] rounded-full" />

                  <div className="space-y-6">
                    {sortedTalks.map((talk, idx) => (
                      <div key={idx} className="relative group">
                        {/* Dot */}
                        <div
                          className="absolute -left-5 top-2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-125"
                          style={{ background: 'linear-gradient(135deg, #1B5E7B, #f5a623)' }}
                        />

                        {/* Card */}
                        <div className="bg-[#fdf9e9]/60 rounded-xl p-5 transition-all hover:shadow-md hover:bg-[#fdf9e9]">
                          <div className="flex items-start justify-between gap-4">
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
                                className="text-[#f5a623] hover:text-[#1B5E7B] transition-colors"
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
      </main>
    </div>
  );
}
