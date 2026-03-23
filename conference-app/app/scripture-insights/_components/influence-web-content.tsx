'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFilteredFullTalks } from '@/lib/filter-context';
import { Talk } from '@/lib/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface CitationEdge { source: string; target: string; count: number }
interface SpeakerCitationStats { speaker: string; citedByCount: number; citesCount: number; totalIncoming: number; totalOutgoing: number }

// Last names too common/ambiguous for "Elder/President LastName" matching
const AMBIGUOUS_LASTNAMES = new Set([
  'young', 'smith', 'johnson', 'brown', 'cook', 'taylor', 'nelson',
  'snow', 'clark', 'lee', 'turner', 'martin', 'king', 'wright',
  'hill', 'green', 'stone', 'long', 'day', 'may', 'rich', 'child',
  'wells', 'grant', 'page', 'hyde', 'mark', 'luke', 'james',
]);

function buildCitationGraph(talks: Talk[], minTalks: number = 1) {
  const speakerTalkCount = new Map<string, number>();
  talks.forEach(t => speakerTalkCount.set(t.speaker, (speakerTalkCount.get(t.speaker) || 0) + 1));

  const speakers = Array.from(speakerTalkCount.entries())
    .filter(([, count]) => count >= minTalks)
    .map(([name]) => name);

  const speakerPatterns = speakers.map(s => {
    const parts = s.split(' ');
    const lastName = parts[parts.length - 1].toLowerCase();
    const isAmbiguous = AMBIGUOUS_LASTNAMES.has(lastName);
    const fullName = s.toLowerCase();

    const patterns: string[] = [fullName];

    if (isAmbiguous) {
      // For ambiguous names, require more specificity
      if (parts.length >= 2) {
        patterns.push(`${parts[0].toLowerCase()} ${lastName}`);
      }
      // Use first+middle+last or two-word combos with title
      if (parts.length >= 3) {
        const twoWordId = `${parts[parts.length - 2].toLowerCase()} ${lastName}`;
        patterns.push(`president ${twoWordId}`);
        patterns.push(`elder ${twoWordId}`);
        patterns.push(`sister ${twoWordId}`);
      }
    } else {
      // Unambiguous last names are safe with titles
      patterns.push(`president ${lastName}`);
      patterns.push(`elder ${lastName}`);
      patterns.push(`sister ${lastName}`);
      patterns.push(`bishop ${lastName}`);
      patterns.push(`brother ${lastName}`);
    }

    return { name: s, patterns };
  });

  const edges = new Map<string, number>();

  talks.forEach(talk => {
    const text = (talk.talk || '').toLowerCase();
    if (!text || text.length < 50) return;

    speakerPatterns.forEach(({ name, patterns }) => {
      if (name === talk.speaker) return;
      for (const pattern of patterns) {
        const idx = text.indexOf(pattern);
        if (idx !== -1) {
          // Word boundary check
          const before = idx > 0 ? text[idx - 1] : ' ';
          const after = idx + pattern.length < text.length ? text[idx + pattern.length] : ' ';
          if (/[\s,.:;"'(\u201c\u201d]/.test(before) && /[\s,.:;"')\u201c\u201d?!]/.test(after)) {
            const key = `${talk.speaker}|||${name}`;
            edges.set(key, (edges.get(key) || 0) + 1);
            break;
          }
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

function SpeakerSearch({ speakers, value, onChange }: { speakers: string[]; value: string; onChange: (v: string) => void }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return speakers;
    const q = query.toLowerCase();
    return speakers.filter(s => s.toLowerCase().includes(q));
  }, [speakers, query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative mb-4">
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#1c1c13]/30 text-lg">search</span>
        <input
          type="text"
          placeholder="Type a speaker name..."
          value={open ? query : (value || query)}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="w-full md:w-80 pl-10 pr-8 py-2.5 rounded-xl border border-[#ece8d9] bg-white text-sm focus:outline-none focus:border-[#1B5E7B] focus:ring-2 focus:ring-[#1B5E7B]/10"
        />
        {value && (
          <button
            onClick={() => { onChange(''); setQuery(''); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[#ece8d9]"
          >
            <span className="material-symbols-outlined text-[#1c1c13]/40 text-base">close</span>
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-30 mt-1 w-full md:w-80 max-h-60 overflow-y-auto bg-white border border-[#ece8d9] rounded-xl shadow-lg">
          {filtered.slice(0, 50).map(s => (
            <button
              key={s}
              onClick={() => { onChange(s); setQuery(''); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-[#f8f4e4] transition-colors ${s === value ? 'bg-[#1B5E7B]/10 font-bold text-[#1B5E7B]' : 'text-[#1c1c13]'}`}
            >
              {s}
            </button>
          ))}
          {filtered.length > 50 && (
            <p className="px-4 py-2 text-[10px] text-[#1c1c13]/40">Type more to narrow results...</p>
          )}
        </div>
      )}
    </div>
  );
}

export function InfluenceWebContent() {
  const { talks, loading } = useFilteredFullTalks();
  const [computing, setComputing] = useState(false);
  const [selectedSpeaker, setSelectedSpeaker] = useState('');
  const [graph, setGraph] = useState<ReturnType<typeof buildCitationGraph> | null>(null);

  useEffect(() => {
    if (talks.length === 0) return;
    setComputing(true);
    setTimeout(() => {
      setGraph(buildCitationGraph(talks));
      setComputing(false);
    }, 100);
  }, [talks]);

  if (loading || computing || !graph) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-4 border-[#f5a623] border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-[#524534]">{loading ? 'Loading talks...' : 'Building citation network...'}</p>
          <p className="text-xs text-[#524534]/60 mt-1">Scanning {talks.length.toLocaleString()} talks for speaker references</p>
        </div>
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
    <div className="px-4 md:px-8 lg:px-12 pt-4 md:pt-6 pb-12 md:pb-24 max-w-7xl">

      <Card className="mb-6 border-violet-200 bg-violet-50/50">
        <CardContent className="pt-6">
          <p className="text-sm md:text-lg font-medium text-violet-900">
            When speakers quote &quot;President Oaks&quot; or &quot;Elder Holland,&quot; they reveal an intellectual lineage.
            This page maps who references whom across {talks.length.toLocaleString()} conference talks.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-6">
        <Card><CardContent className="pt-3 md:pt-4 text-center px-2">
          <p className="text-xl md:text-2xl font-bold text-[#1B5E7B]">{graph.edges.length.toLocaleString()}</p>
          <p className="text-[10px] md:text-xs text-[#524534]">Citation Links</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 md:pt-4 text-center px-2">
          <p className="text-xl md:text-2xl font-bold text-[#1B5E7B]">{totalCitations.toLocaleString()}</p>
          <p className="text-[10px] md:text-xs text-[#524534]">Total References</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 md:pt-4 text-center px-2">
          <p className="text-sm md:text-lg font-bold text-[#f5a623] leading-tight">{topCited[0]?.speaker || '\u2014'}</p>
          <p className="text-[10px] md:text-xs text-[#524534] mt-1">Most Referenced</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 md:pt-4 text-center px-2">
          <p className="text-sm md:text-lg font-bold text-[#f5a623] leading-tight">{topCiters[0]?.speaker || '\u2014'}</p>
          <p className="text-[10px] md:text-xs text-[#524534] mt-1">References Others Most</p>
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
          <CardDescription>Search for any speaker to explore their reference network</CardDescription>
        </CardHeader>
        <CardContent>
          <SpeakerSearch
            speakers={graph.stats.map(s => s.speaker).sort()}
            value={selectedSpeaker}
            onChange={setSelectedSpeaker}
          />

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
            <strong>Methodology:</strong> References are detected by searching talk text for &quot;President/Elder/Sister [LastName]&quot;
            or full speaker names. Ambiguous last names (Smith, Young, Nelson, etc.) require more context to match —
            we look for first+last name or title+two-word identifier to avoid false positives like &quot;young people&quot; or &quot;elder brother.&quot;
            All speakers are included.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
