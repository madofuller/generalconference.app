'use client';

import { useState, useEffect, useMemo } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFilteredTalks } from '@/lib/filter-context';
import { Talk } from '@/lib/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface CitationEdge { source: string; target: string; count: number }
interface SpeakerCitationStats { speaker: string; citedByCount: number; citesCount: number; totalIncoming: number; totalOutgoing: number }

function buildCitationGraph(talks: Talk[], minTalks: number = 10) {
  // Get speakers with enough talks to be meaningful
  const speakerTalkCount = new Map<string, number>();
  talks.forEach(t => speakerTalkCount.set(t.speaker, (speakerTalkCount.get(t.speaker) || 0) + 1));

  const speakers = Array.from(speakerTalkCount.entries())
    .filter(([, count]) => count >= minTalks)
    .map(([name]) => name);

  // Build search-friendly names (last name + first initial is most common citation form)
  const speakerPatterns = speakers.map(s => {
    const parts = s.split(' ');
    const lastName = parts[parts.length - 1];
    // Match patterns like "President Oaks", "Elder Holland", "Sister Smith", or full name
    return {
      name: s,
      patterns: [
        s.toLowerCase(),
        // "President/Elder/Sister LastName"
        `president ${lastName.toLowerCase()}`,
        `elder ${lastName.toLowerCase()}`,
        `sister ${lastName.toLowerCase()}`,
        `bishop ${lastName.toLowerCase()}`,
        // Just last name is too noisy, skip unless it's distinctive
      ].filter(Boolean),
    };
  });

  const edges = new Map<string, number>();

  talks.forEach(talk => {
    const text = (talk.talk || '').toLowerCase();
    if (!text) return;

    speakerPatterns.forEach(({ name, patterns }) => {
      if (name === talk.speaker) return;
      for (const pattern of patterns) {
        if (text.includes(pattern)) {
          const key = `${talk.speaker}|||${name}`;
          edges.set(key, (edges.get(key) || 0) + 1);
          break; // Don't double-count same speaker in same talk
        }
      }
    });
  });

  const edgeList: CitationEdge[] = Array.from(edges.entries())
    .map(([key, count]) => {
      const [source, target] = key.split('|||');
      return { source, target, count };
    })
    .sort((a, b) => b.count - a.count);

  const stats = new Map<string, SpeakerCitationStats>();
  const initStats = (s: string) => {
    if (!stats.has(s)) stats.set(s, { speaker: s, citedByCount: 0, citesCount: 0, totalIncoming: 0, totalOutgoing: 0 });
  };

  edgeList.forEach(e => {
    initStats(e.source);
    initStats(e.target);
    stats.get(e.source)!.citesCount++;
    stats.get(e.source)!.totalOutgoing += e.count;
    stats.get(e.target)!.citedByCount++;
    stats.get(e.target)!.totalIncoming += e.count;
  });

  return { edges: edgeList, stats: Array.from(stats.values()), speakers };
}

export default function FootnoteWebPage() {
  const { talks, loading } = useFilteredTalks();
  const [computing, setComputing] = useState(false);
  const [selectedSpeaker, setSelectedSpeaker] = useState('');
  const [graph, setGraph] = useState<ReturnType<typeof buildCitationGraph> | null>(null);

  useEffect(() => {
    if (talks.length === 0) return;
    setComputing(true);
    // Use setTimeout to avoid blocking the UI thread
    setTimeout(() => {
      setGraph(buildCitationGraph(talks));
      setComputing(false);
    }, 100);
  }, [talks]);

  if (loading || computing || !graph) {
    return (
      <div className="flex min-h-screen"><Navigation />
        <main className="ml-0 lg:ml-[260px] flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[#524534]">{loading ? 'Loading talks...' : 'Building citation network...'}</p>
            <p className="text-xs text-[#524534]/60 mt-1">Scanning {talks.length.toLocaleString()} talks for speaker references</p>
          </div>
        </main>
      </div>
    );
  }

  const topCited = [...graph.stats].sort((a, b) => b.totalIncoming - a.totalIncoming).slice(0, 20);
  const topCiters = [...graph.stats].sort((a, b) => b.totalOutgoing - a.totalOutgoing).slice(0, 20);
  const topPairs = graph.edges.slice(0, 50);
  const totalCitations = graph.edges.reduce((s, e) => s + e.count, 0);

  const speakerDetail = selectedSpeaker ? {
    incoming: graph.edges.filter(e => e.target === selectedSpeaker).sort((a, b) => b.count - a.count).slice(0, 15),
    outgoing: graph.edges.filter(e => e.source === selectedSpeaker).sort((a, b) => b.count - a.count).slice(0, 15),
  } : null;

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1">
        <TopAppBar title="The Influence Web" subtitle="Who references whom — the citation network of conference" />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24 max-w-7xl">

          <Card className="mb-6 border-violet-200 bg-violet-50/50">
            <CardContent className="pt-6">
              <p className="text-lg font-medium text-violet-900">
                When speakers quote &quot;President Oaks&quot; or &quot;Elder Holland,&quot; they reveal an intellectual lineage.
                This page maps who references whom across {talks.length.toLocaleString()} conference talks.
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Card><CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-[#1B5E7B]">{graph.edges.length.toLocaleString()}</p>
              <p className="text-xs text-[#524534]">Unique Citation Links</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-[#1B5E7B]">{totalCitations.toLocaleString()}</p>
              <p className="text-xs text-[#524534]">Total References</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className="text-lg font-bold text-[#f5a623] truncate">{topCited[0]?.speaker || '—'}</p>
              <p className="text-xs text-[#524534]">Most Referenced</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className="text-lg font-bold text-[#f5a623] truncate">{topCiters[0]?.speaker || '—'}</p>
              <p className="text-xs text-[#524534]">References Others Most</p>
            </CardContent></Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Most Referenced Speakers</CardTitle>
                <CardDescription>Whose name appears most in others&apos; talks</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={450}>
                  <BarChart data={topCited} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="speaker" width={150} tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ background: '#fdf9e9', border: '1px solid #e5e0d5', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="totalIncoming" fill="#1B5E7B" radius={[0, 4, 4, 0]} name="Times Referenced" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Most Prolific Citers</CardTitle>
                <CardDescription>Who references other speakers most in their talks</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={450}>
                  <BarChart data={topCiters} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="speaker" width={150} tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ background: '#fdf9e9', border: '1px solid #e5e0d5', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="totalOutgoing" fill="#f5a623" radius={[0, 4, 4, 0]} name="References Made" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Speaker Explorer</CardTitle>
              <CardDescription>Select a speaker to explore their reference network</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedSpeaker} onValueChange={setSelectedSpeaker}>
                <SelectTrigger className="w-full md:w-80 mb-4"><SelectValue placeholder="Choose a speaker..." /></SelectTrigger>
                <SelectContent>
                  {graph.stats.sort((a, b) => a.speaker.localeCompare(b.speaker)).map(s => (
                    <SelectItem key={s.speaker} value={s.speaker}>{s.speaker}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {speakerDetail && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-bold mb-2 text-[#1B5E7B]">Who References {selectedSpeaker.split(' ').slice(-1)[0]}</h3>
                    {speakerDetail.incoming.length === 0 ? (
                      <p className="text-sm text-[#524534]">No incoming references found</p>
                    ) : (
                      <div className="space-y-1">
                        {speakerDetail.incoming.map(e => (
                          <div key={e.source} className="flex justify-between items-center py-1 border-b border-[#f2eede]">
                            <span className="text-sm">{e.source}</span>
                            <span className="text-xs font-bold text-[#1B5E7B] bg-[#1B5E7B]/10 px-2 py-0.5 rounded-full">{e.count}x</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold mb-2 text-[#f5a623]">{selectedSpeaker.split(' ').slice(-1)[0]} References</h3>
                    {speakerDetail.outgoing.length === 0 ? (
                      <p className="text-sm text-[#524534]">No outgoing references found</p>
                    ) : (
                      <div className="space-y-1">
                        {speakerDetail.outgoing.map(e => (
                          <div key={e.target} className="flex justify-between items-center py-1 border-b border-[#f2eede]">
                            <span className="text-sm">{e.target}</span>
                            <span className="text-xs font-bold text-[#f5a623] bg-[#f5a623]/10 px-2 py-0.5 rounded-full">{e.count}x</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Strongest Reference Pairs</CardTitle>
              <CardDescription>The most frequent speaker-to-speaker references</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-[#e5e0d5]">
                      <th className="text-left py-2 text-[#524534] font-medium">#</th>
                      <th className="text-left py-2 text-[#524534] font-medium">Speaker</th>
                      <th className="text-center py-2 text-[#524534] font-medium"></th>
                      <th className="text-left py-2 text-[#524534] font-medium">References</th>
                      <th className="text-right py-2 text-[#524534] font-medium">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPairs.map((e, i) => (
                      <tr key={`${e.source}-${e.target}`} className="border-b border-[#f2eede]">
                        <td className="py-1.5 text-[#524534]">{i + 1}</td>
                        <td className="py-1.5">{e.source}</td>
                        <td className="py-1.5 text-center text-[#524534]">&rarr;</td>
                        <td className="py-1.5">{e.target}</td>
                        <td className="py-1.5 text-right font-bold text-[#1B5E7B]">{e.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-6">
              <p className="text-xs text-amber-800">
                <strong>Methodology:</strong> References are detected by searching each talk&apos;s full text for patterns like
                &quot;President [LastName]&quot;, &quot;Elder [LastName]&quot;, &quot;Sister [LastName]&quot;, or full names of other conference speakers.
                Only speakers with 10+ talks are tracked. This may over-count (quoting scripture about &quot;Elder&quot;) or
                under-count (references by last name only, paraphrasing without attribution).
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
