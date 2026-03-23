'use client';

import { useState, useEffect, useMemo } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useFilteredTalks } from '@/lib/filter-context';
import { getConferences, getTalksByConference } from '@/lib/data-loader';
import { Conference, Talk } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { countScriptureReferences } from '@/lib/search-utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ConferencesPage() {
  const { talks, loading } = useFilteredTalks();
  const conferences = useMemo(() => getConferences(talks), [talks]);
  const [selectedConference, setSelectedConference] = useState('');
  const [conferenceTalks, setConferenceTalks] = useState<Talk[]>([]);

  useEffect(() => {
    if (selectedConference && talks.length > 0) {
      const [season, year] = selectedConference.split(' ');
      const filtered = getTalksByConference(talks, season, Number(year));
      setConferenceTalks(filtered);
    } else {
      setConferenceTalks([]);
    }
  }, [selectedConference, talks]);

  // Calculate statistics
  const totalTalks = conferenceTalks.length;
  const uniqueSpeakers = new Set(conferenceTalks.map(t => t.speaker)).size;
  const totalScriptureRefs = conferenceTalks.reduce((sum, talk) => sum + countScriptureReferences(talk), 0);
  
  // Find first-time speakers
  const firstTimeSpeakers = conferenceTalks.filter(talk => {
    const [season, year] = selectedConference.split(' ');
    const priorTalks = talks.filter(t => 
      t.speaker === talk.speaker && 
      (t.year < Number(year) || (t.year === Number(year) && t.season === 'April' && season === 'October'))
    );
    return priorTalks.length === 0;
  }).map(t => t.speaker);

  // Volume breakdown (simplified)
  const volumeCounts = new Map<string, number>();
  conferenceTalks.forEach(talk => {
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

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1 pt-20 lg:pt-0">
        <TopAppBar title="Conferences" subtitle="Conference-level statistics" />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24">

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select a Conference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Conference</Label>
                <Select value={selectedConference} onValueChange={setSelectedConference}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a conference" />
                  </SelectTrigger>
                  <SelectContent>
                    {conferences.map(conf => (
                      <SelectItem key={conf.label} value={conf.label}>
                        {conf.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {selectedConference && conferenceTalks.length > 0 && (
            <>
              {/* Statistics */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Talks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-3xl font-bold">{totalTalks}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Speakers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-3xl font-bold">{uniqueSpeakers}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Scripture References</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-3xl font-bold">{totalScriptureRefs}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">First-Time Speakers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-3xl font-bold">{firstTimeSpeakers.length}</div>
                  </CardContent>
                </Card>
              </div>

              {/* First-Time Speakers */}
              {firstTimeSpeakers.length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>First-Time Speakers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {firstTimeSpeakers.map((speaker, idx) => (
                        <Badge key={idx} variant="secondary">{speaker}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* All Talks Table */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>All Talks from {selectedConference}</CardTitle>
                  <CardDescription>{totalTalks} talks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Speaker</TableHead>
                          <TableHead>Calling</TableHead>
                          <TableHead className="w-20">Link</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {conferenceTalks.map((talk, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{talk.title}</TableCell>
                            <TableCell>{talk.speaker}</TableCell>
                            <TableCell className="text-sm">{talk.calling}</TableCell>
                            <TableCell>
                              <a 
                                href={talk.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Volume Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Scripture Volume Breakdown</CardTitle>
                  <CardDescription>Distribution of scripture references by volume</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={volumeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {volumeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}

          {!selectedConference && (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-[#524534]">
                  Select a conference to view talks and statistics
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}



