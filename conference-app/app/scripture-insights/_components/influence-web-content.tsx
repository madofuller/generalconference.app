'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface CitationEdge { source: string; target: string; count: number }
interface SpeakerCitationStats { speaker: string; citedByCount: number; citesCount: number; totalIncoming: number; totalOutgoing: number }
type GraphResult = { edges: CitationEdge[]; stats: SpeakerCitationStats[]; speakers: string[] };

let cached: GraphResult | null = null;

async function loadCitationGraph(): Promise<GraphResult> {
  if (cached) return cached;
  const res = await fetch('/citation_graph.json');
  cached = await res.json();
  return cached!;
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

function useIsMobile(breakpoint = 640) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    setMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);
  return mobile;
}

function compactName(name: string) {
  const parts = name.split(' ');
  if (parts.length <= 2) return name;
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
}

export function InfluenceWebContent() {
  const [selectedSpeaker, setSelectedSpeaker] = useState('');
  const [graph, setGraph] = useState<GraphResult | null>(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    loadCitationGraph().then(data => {
      setGraph(data);
      setLoading(false);
    });
  }, []);

  if (loading || !graph) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-4 border-[#f5a623] border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-[#524534]">Loading citation network...</p>
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
            When speakers quote &quot;President Oaks&quot; or &quot;Elder Bednar,&quot; they reveal an intellectual lineage.
            This page maps who references whom across {graph.speakers.length.toLocaleString()} speakers and {totalCitations.toLocaleString()} references.
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
          <CardContent className="px-1 sm:px-6">
            <ResponsiveContainer width="100%" height={isMobile ? 520 : 450}>
              <BarChart data={topCited} layout="vertical" margin={isMobile ? { left: 0, right: 4, top: 4, bottom: 4 } : undefined}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" />
                <XAxis type="number" tick={{ fontSize: isMobile ? 9 : 10 }} />
                <YAxis
                  type="category"
                  dataKey="speaker"
                  width={isMobile ? 100 : 150}
                  tick={{ fontSize: isMobile ? 8 : 9 }}
                  tickFormatter={isMobile ? compactName : undefined}
                  interval={0}
                />
                <Tooltip contentStyle={{ background: '#fdf9e9', border: '1px solid #e5e0d5', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="totalIncoming" fill="#1B5E7B" radius={[0, 4, 4, 0]} name="Times Referenced" barSize={isMobile ? 14 : undefined} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most Prolific Citers</CardTitle>
            <CardDescription>Who references other speakers most in their talks</CardDescription>
          </CardHeader>
          <CardContent className="px-1 sm:px-6">
            <ResponsiveContainer width="100%" height={isMobile ? 520 : 450}>
              <BarChart data={topCiters} layout="vertical" margin={isMobile ? { left: 0, right: 4, top: 4, bottom: 4 } : undefined}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d5" />
                <XAxis type="number" tick={{ fontSize: isMobile ? 9 : 10 }} />
                <YAxis
                  type="category"
                  dataKey="speaker"
                  width={isMobile ? 100 : 150}
                  tick={{ fontSize: isMobile ? 8 : 9 }}
                  tickFormatter={isMobile ? compactName : undefined}
                  interval={0}
                />
                <Tooltip contentStyle={{ background: '#fdf9e9', border: '1px solid #e5e0d5', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="totalOutgoing" fill="#f5a623" radius={[0, 4, 4, 0]} name="References Made" barSize={isMobile ? 14 : undefined} />
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
            Dataset scope: 1971 onward only.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
