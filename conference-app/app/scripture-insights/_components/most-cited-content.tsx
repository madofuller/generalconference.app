'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { loadInsights, ScriptureData } from '@/lib/insights';
import { useFilteredTalks } from '@/lib/filter-context';
import { Talk } from '@/lib/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const VOLUME_SHORT_LABEL: Record<string, string> = {
  'Doctrine & Covenants': 'D&C',
  'New Testament': 'NT',
  'Book of Mormon': 'BoM',
  'Old Testament': 'OT',
  'Pearl of Great Price': 'PoGP',
};

function useNarrowScreen(maxWidthPx = 639) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxWidthPx}px)`);
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [maxWidthPx]);
  return narrow;
}

const VOLUME_COLORS: Record<string, string> = {
  'Doctrine & Covenants': '#6366f1',
  'New Testament': '#ef4444',
  'Book of Mormon': '#3b82f6',
  'Old Testament': '#f59e0b',
  'Pearl of Great Price': '#10b981',
};

// Map scripture book names to Gospel Library URL slugs
const BOOK_SLUGS: Record<string, { volume: string; book: string }> = {
  // Book of Mormon
  '1 Nephi':   { volume: 'bofm', book: '1-ne' },
  '2 Nephi':   { volume: 'bofm', book: '2-ne' },
  'Jacob':     { volume: 'bofm', book: 'jacob' },
  'Enos':      { volume: 'bofm', book: 'enos' },
  'Jarom':     { volume: 'bofm', book: 'jarom' },
  'Omni':      { volume: 'bofm', book: 'omni' },
  'Mosiah':    { volume: 'bofm', book: 'mosiah' },
  'Alma':      { volume: 'bofm', book: 'alma' },
  'Helaman':   { volume: 'bofm', book: 'hel' },
  '3 Nephi':   { volume: 'bofm', book: '3-ne' },
  '4 Nephi':   { volume: 'bofm', book: '4-ne' },
  'Mormon':    { volume: 'bofm', book: 'morm' },
  'Ether':     { volume: 'bofm', book: 'ether' },
  'Moroni':    { volume: 'bofm', book: 'moro' },
  // Doctrine and Covenants
  'D&C':       { volume: 'dc-testament', book: 'dc' },
  // New Testament
  'Matthew':   { volume: 'nt', book: 'matt' },
  'Mark':      { volume: 'nt', book: 'mark' },
  'Luke':      { volume: 'nt', book: 'luke' },
  'John':      { volume: 'nt', book: 'john' },
  'Acts':      { volume: 'nt', book: 'acts' },
  'Romans':    { volume: 'nt', book: 'rom' },
  '1 Corinthians': { volume: 'nt', book: '1-cor' },
  '2 Corinthians': { volume: 'nt', book: '2-cor' },
  'Galatians':     { volume: 'nt', book: 'gal' },
  'Ephesians':     { volume: 'nt', book: 'eph' },
  'Philippians':   { volume: 'nt', book: 'philip' },
  'Colossians':    { volume: 'nt', book: 'col' },
  '1 Thessalonians': { volume: 'nt', book: '1-thes' },
  '2 Thessalonians': { volume: 'nt', book: '2-thes' },
  '1 Timothy':   { volume: 'nt', book: '1-tim' },
  '2 Timothy':   { volume: 'nt', book: '2-tim' },
  'Titus':       { volume: 'nt', book: 'titus' },
  'Philemon':    { volume: 'nt', book: 'philem' },
  'Hebrews':     { volume: 'nt', book: 'heb' },
  'James':       { volume: 'nt', book: 'james' },
  '1 Peter':     { volume: 'nt', book: '1-pet' },
  '2 Peter':     { volume: 'nt', book: '2-pet' },
  '1 John':      { volume: 'nt', book: '1-jn' },
  '2 John':      { volume: 'nt', book: '2-jn' },
  '3 John':      { volume: 'nt', book: '3-jn' },
  'Jude':        { volume: 'nt', book: 'jude' },
  'Revelation':  { volume: 'nt', book: 'rev' },
  // Old Testament
  'Genesis':     { volume: 'ot', book: 'gen' },
  'Exodus':      { volume: 'ot', book: 'ex' },
  'Leviticus':   { volume: 'ot', book: 'lev' },
  'Numbers':     { volume: 'ot', book: 'num' },
  'Deuteronomy': { volume: 'ot', book: 'deut' },
  'Joshua':      { volume: 'ot', book: 'josh' },
  'Judges':      { volume: 'ot', book: 'judg' },
  'Ruth':        { volume: 'ot', book: 'ruth' },
  '1 Samuel':    { volume: 'ot', book: '1-sam' },
  '2 Samuel':    { volume: 'ot', book: '2-sam' },
  '1 Kings':     { volume: 'ot', book: '1-kgs' },
  '2 Kings':     { volume: 'ot', book: '2-kgs' },
  '1 Chronicles': { volume: 'ot', book: '1-chr' },
  '2 Chronicles': { volume: 'ot', book: '2-chr' },
  'Ezra':        { volume: 'ot', book: 'ezra' },
  'Nehemiah':    { volume: 'ot', book: 'neh' },
  'Esther':      { volume: 'ot', book: 'esth' },
  'Job':         { volume: 'ot', book: 'job' },
  'Psalms':      { volume: 'ot', book: 'ps' },
  'Proverbs':    { volume: 'ot', book: 'prov' },
  'Ecclesiastes': { volume: 'ot', book: 'eccl' },
  'Song of Solomon': { volume: 'ot', book: 'song' },
  'Isaiah':      { volume: 'ot', book: 'isa' },
  'Jeremiah':    { volume: 'ot', book: 'jer' },
  'Lamentations': { volume: 'ot', book: 'lam' },
  'Ezekiel':     { volume: 'ot', book: 'ezek' },
  'Daniel':      { volume: 'ot', book: 'dan' },
  'Hosea':       { volume: 'ot', book: 'hosea' },
  'Joel':        { volume: 'ot', book: 'joel' },
  'Amos':        { volume: 'ot', book: 'amos' },
  'Obadiah':     { volume: 'ot', book: 'obad' },
  'Jonah':       { volume: 'ot', book: 'jonah' },
  'Micah':       { volume: 'ot', book: 'micah' },
  'Nahum':       { volume: 'ot', book: 'nahum' },
  'Habakkuk':    { volume: 'ot', book: 'hab' },
  'Zephaniah':   { volume: 'ot', book: 'zeph' },
  'Haggai':      { volume: 'ot', book: 'hag' },
  'Zechariah':   { volume: 'ot', book: 'zech' },
  'Malachi':     { volume: 'ot', book: 'mal' },
  // Pearl of Great Price
  'Moses':       { volume: 'pgp', book: 'moses' },
  'Abraham':     { volume: 'pgp', book: 'abr' },
  'Joseph Smith\u2014Matthew':  { volume: 'pgp', book: 'js-m' },
  'Joseph Smith\u2014History':  { volume: 'pgp', book: 'js-h' },
  'Articles of Faith': { volume: 'pgp', book: 'a-of-f' },
};

function getGospelLibraryUrl(reference: string): string | null {
  const match = reference.match(/^(.+?)\s+(\d+)$/);
  if (!match) return null;
  const [, bookName, chapter] = match;
  const slug = BOOK_SLUGS[bookName];
  if (!slug) return null;
  return `https://www.churchofjesuschrist.org/study/scriptures/${slug.volume}/${slug.book}/${chapter}`;
}

export function MostCitedContent() {
  const narrow = useNarrowScreen();
  const { talks } = useFilteredTalks();
  const [data, setData] = useState<ScriptureData | null>(null);
  const [expandedRef, setExpandedRef] = useState<string | null>(null);
  const [citingTalks, setCitingTalks] = useState<Talk[]>([]);

  useEffect(() => {
    loadInsights().then(i => setData(i.scriptures));
  }, []);

  const handleExpandRef = (reference: string) => {
    if (expandedRef === reference) {
      setExpandedRef(null);
      setCitingTalks([]);
      return;
    }
    setExpandedRef(reference);
    const pattern = reference.toLowerCase();
    const results = talks.filter(talk => {
      const text = `${talk.footnotes} ${talk.talk}`.toLowerCase();
      return text.includes(pattern);
    });
    setCitingTalks(results);
  };

  if (!data) {
    return <p className="text-[#524534] text-center py-12">Loading scripture data...</p>;
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-4 md:px-8 lg:px-12 pt-4 md:pt-6 pb-12 md:pb-24">

      <Card className="mb-4 md:mb-8 border-emerald-200 bg-emerald-50/50 overflow-hidden">
        <CardContent className="pt-4 md:pt-6">
          <p className="text-sm md:text-xl font-medium text-emerald-900 break-words">{data.headline}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:gap-6 lg:gap-8 lg:grid-cols-2 mb-4 md:mb-8">
        {/* Volume Breakdown */}
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>References by Volume</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <div className="h-[min(360px,70vw)] w-full min-w-0 sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 4, right: 4, bottom: narrow ? 4 : 8, left: 4 }}>
                  <Pie
                    data={data.byVolume}
                    dataKey="references"
                    nameKey="volume"
                    cx="50%"
                    cy="45%"
                    outerRadius={narrow ? '62%' : 110}
                    label={false}
                  >
                    {data.byVolume.map((entry) => (
                      <Cell key={entry.volume} fill={VOLUME_COLORS[entry.volume] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _n, p) => [`${value ?? 0} refs`, p?.payload?.volume as string]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    layout="horizontal"
                    wrapperStyle={{ fontSize: narrow ? 10 : 12, paddingTop: 4 }}
                    formatter={(value) => {
                      const pct = data.byVolume.find((v) => v.volume === value);
                      const total = data.byVolume.reduce((s, v) => s + v.references, 0);
                      const p = pct ? ((pct.references / total) * 100).toFixed(0) : '';
                      return `${value} (${p}%)`;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Volume Bar Chart */}
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Total References by Volume</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <div className="h-[280px] w-full min-w-0 sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.byVolume}
                  layout="vertical"
                  margin={{ top: 4, right: 8, bottom: 4, left: narrow ? 0 : 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="volume"
                    width={narrow ? 56 : 160}
                    tick={{ fontSize: narrow ? 10 : 12 }}
                    tickFormatter={(v) => (narrow ? VOLUME_SHORT_LABEL[v] ?? v : v)}
                  />
                  <Tooltip
                    formatter={(value) => [`${value ?? 0} refs`, 'References']}
                    labelFormatter={(label) => label}
                  />
                  <Bar dataKey="references" radius={[0, 6, 6, 0]}>
                    {data.byVolume.map((entry) => (
                      <Cell key={entry.volume} fill={VOLUME_COLORS[entry.volume] || '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Individual Scriptures */}
      <Card>
        <CardHeader>
          <CardTitle>Top 30 Most Referenced Scriptures</CardTitle>
          <CardDescription className="text-pretty">
            Individual chapter references across all conference talks. Click any scripture to read it on Gospel Library, or expand to see every talk that cites it.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="space-y-1">
            {data.topReferences.map((ref, i) => {
              const url = getGospelLibraryUrl(ref.reference);
              const isExpanded = expandedRef === ref.reference;
              return (
                <div key={ref.reference}>
                  <div className="flex flex-col gap-2 p-2 rounded-lg hover:bg-muted/50 sm:flex-row sm:items-center sm:gap-3">
                    <div className="flex min-w-0 items-start gap-2 sm:items-center sm:gap-3">
                      <span className="w-7 shrink-0 text-right text-lg font-bold text-[#524534] sm:w-8">
                        {i + 1}
                      </span>
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-w-0 flex-1 font-medium text-blue-700 hover:text-blue-900 hover:underline break-words"
                        >
                          {ref.reference}
                          <span className="ml-1 inline-block align-super text-xs">&#x2197;</span>
                        </a>
                      ) : (
                        <span className="min-w-0 flex-1 break-words font-medium">{ref.reference}</span>
                      )}
                    </div>
                    <div className="flex min-w-0 items-center justify-between gap-2 pl-9 sm:ml-auto sm:shrink-0 sm:justify-end sm:pl-0 sm:pt-0">
                      <span className="text-sm tabular-nums text-[#524534]">{ref.count} refs</span>
                      <button
                        type="button"
                        onClick={() => handleExpandRef(ref.reference)}
                        className="shrink-0 rounded border px-2 py-1 text-xs text-[#524534] transition-colors hover:bg-muted"
                        title="Show citing talks"
                      >
                        {isExpanded ? 'Hide sources' : 'Show sources'}
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="mb-3 ml-0 mr-0 mt-1 rounded-lg border bg-muted/30 p-3 sm:ml-12 sm:mr-2 sm:p-4">
                      <p className="text-sm font-medium mb-3">
                        {citingTalks.length} talk{citingTalks.length !== 1 ? 's' : ''} referencing {ref.reference}:
                      </p>
                      {citingTalks.length === 0 ? (
                        <p className="text-sm text-[#524534]">Loading or no matches found...</p>
                      ) : (
                        <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                          {citingTalks.map((talk, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <Badge variant="outline" className="shrink-0 text-xs">
                                {talk.season} {talk.year}
                              </Badge>
                              <span className="text-[#524534] shrink-0">{talk.speaker}</span>
                              <span className="text-[#524534]">&mdash;</span>
                              {talk.url ? (
                                <a
                                  href={talk.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-700 hover:underline truncate"
                                >
                                  {talk.title}
                                </a>
                              ) : (
                                <span className="truncate">{talk.title}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
