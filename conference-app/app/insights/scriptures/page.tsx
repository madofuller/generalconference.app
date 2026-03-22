'use client';

import { useState, useEffect } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { loadInsights, ScriptureData } from '@/lib/insights';
import { useFilteredTalks } from '@/lib/filter-context';
import { Talk } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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
  // Parse reference like "D&C 88", "John 14", "Alma 5", "3 Nephi 11"
  const match = reference.match(/^(.+?)\s+(\d+)$/);
  if (!match) return null;
  const [, bookName, chapter] = match;
  const slug = BOOK_SLUGS[bookName];
  if (!slug) return null;
  return `https://www.churchofjesuschrist.org/study/scriptures/${slug.volume}/${slug.book}/${chapter}`;
}

export default function ScripturesPage() {
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
    return (
      <div className="flex min-h-screen">
        <Navigation />
        <main className="ml-0 lg:ml-[260px] flex-1 flex items-center justify-center">
          <p className="text-[#524534]">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1">
        <TopAppBar title="Most Loved Scriptures" subtitle="The most frequently cited scriptures" />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24 max-w-7xl">

          <Card className="mb-4 md:mb-8 border-emerald-200 bg-emerald-50/50">
            <CardContent className="pt-6">
              <p className="text-xl font-medium text-emerald-900">{data.headline}</p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:gap-6 lg:gap-8 lg:grid-cols-2 mb-4 md:mb-8">
            {/* Volume Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>References by Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.byVolume}
                      dataKey="references"
                      nameKey="volume"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {data.byVolume.map((entry) => (
                        <Cell key={entry.volume} fill={VOLUME_COLORS[entry.volume] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Volume Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Total References by Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.byVolume} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="volume" width={160} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="references" radius={[0, 6, 6, 0]}>
                      {data.byVolume.map((entry) => (
                        <Cell key={entry.volume} fill={VOLUME_COLORS[entry.volume] || '#94a3b8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Individual Scriptures */}
          <Card>
            <CardHeader>
              <CardTitle>Top 30 Most Referenced Scriptures</CardTitle>
              <CardDescription>
                Individual chapter references across all conference talks. Click any scripture to read it on Gospel Library, or expand to see every talk that cites it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {data.topReferences.map((ref, i) => {
                  const url = getGospelLibraryUrl(ref.reference);
                  const isExpanded = expandedRef === ref.reference;
                  return (
                    <div key={ref.reference}>
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                        <span className="text-lg font-bold text-[#524534] w-8 text-right">{i + 1}</span>
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium flex-1 text-blue-700 hover:text-blue-900 hover:underline"
                          >
                            {ref.reference}
                            <span className="inline-block ml-1 text-xs align-super">&#x2197;</span>
                          </a>
                        ) : (
                          <span className="font-medium flex-1">{ref.reference}</span>
                        )}
                        <span className="text-sm text-[#524534]">{ref.count} refs</span>
                        <button
                          onClick={() => handleExpandRef(ref.reference)}
                          className="text-xs px-2 py-1 rounded border hover:bg-muted transition-colors text-[#524534] shrink-0"
                          title="Show citing talks"
                        >
                          {isExpanded ? 'Hide sources' : 'Show sources'}
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="ml-12 mr-2 mb-3 mt-1 rounded-lg border bg-muted/30 p-4">
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
      </main>
    </div>
  );
}
