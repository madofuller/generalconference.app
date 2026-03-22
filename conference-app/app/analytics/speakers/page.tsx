'use client';

import { useState, useEffect, useMemo } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFilteredTalks } from '@/lib/filter-context';
import { getSpeakerProfile, SpeakerProfile } from '@/lib/analytics-utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#1B5E7B', '#f5a623', '#00668a', '#8455ef', '#40c2fd'];

export default function SpeakerPatternsPage() {
  const { talks, loading } = useFilteredTalks();
  const [speaker1, setSpeaker1] = useState<string>('');
  const [speaker2, setSpeaker2] = useState<string>('');


  const speakers = useMemo(() => {
    const counts = new Map<string, number>();
    talks.forEach(t => counts.set(t.speaker, (counts.get(t.speaker) || 0) + 1));
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([s]) => s);
  }, [talks]);

  useEffect(() => {
    if (speakers.length > 0 && !speaker1) setSpeaker1(speakers[0]);
  }, [speakers, speaker1]);

  const profile1 = useMemo(() => speaker1 ? getSpeakerProfile(talks, speaker1) : null, [talks, speaker1]);
  const profile2 = useMemo(() => speaker2 ? getSpeakerProfile(talks, speaker2) : null, [talks, speaker2]);

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Navigation />
        <main className="ml-0 lg:ml-[260px] flex-1 flex items-center justify-center">
          <p className="text-[#524534]">Loading...</p>
        </main>
      </div>
    );
  }

  const renderProfile = (profile: SpeakerProfile, color: string) => (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold">{profile.talkCount}</p>
          <p className="text-sm text-[#524534]">Talks</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{profile.yearRange[0]}-{profile.yearRange[1]}</p>
          <p className="text-sm text-[#524534]">Years Active</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{(profile.avgTalkLength / 1000).toFixed(1)}k</p>
          <p className="text-sm text-[#524534]">Avg Characters</p>
        </div>
      </div>

      {/* Topic Radar */}
      {profile.topTopics.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Topic Distribution</h4>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={profile.topTopics.slice(0, 8).map(t => ({ ...t, topic: t.topic.length > 15 ? t.topic.substring(0, 13) + '...' : t.topic }))}>
              <PolarGrid />
              <PolarAngleAxis dataKey="topic" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis />
              <Radar dataKey="count" stroke={color} fill={color} fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Emotion Distribution */}
      {profile.topEmotions.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Emotion Profile</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={profile.topEmotions} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="emotion" width={100} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill={color} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Talks Per Year */}
      {profile.talksPerYear.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Talks Per Year</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={profile.talksPerYear}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Words */}
      {profile.topWords.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Most Used Words</h4>
          <div className="flex flex-wrap gap-2">
            {profile.topWords.slice(0, 15).map(({ word, count }) => (
              <span key={word} className="px-2 py-1 rounded-full text-xs bg-muted">
                {word} <span className="text-[#524534]">({count})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1">
        <TopAppBar title="Speaker Patterns" subtitle="Compare speakers' styles and topics" />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24">

          {/* Speaker Selectors */}
          <div className="grid gap-4 lg:grid-cols-2 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Speaker 1</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={speaker1} onValueChange={setSpeaker1}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a speaker" />
                  </SelectTrigger>
                  <SelectContent>
                    {speakers.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Speaker 2 (Compare)</CardTitle>
                <CardDescription>Optional - select to compare two speakers</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={speaker2} onValueChange={setSpeaker2}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a speaker to compare" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {speakers.filter(s => s !== speaker1).map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {/* Profiles */}
          <div className={`grid gap-8 ${profile2 && speaker2 !== 'none' ? 'lg:grid-cols-2' : ''}`}>
            {profile1 && (
              <Card>
                <CardHeader>
                  <CardTitle>{profile1.speaker}</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderProfile(profile1, '#1B5E7B')}
                </CardContent>
              </Card>
            )}
            {profile2 && speaker2 !== 'none' && (
              <Card>
                <CardHeader>
                  <CardTitle>{profile2.speaker}</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderProfile(profile2, '#00668a')}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
