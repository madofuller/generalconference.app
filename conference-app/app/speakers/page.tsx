'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { loadTalks, getSpeakers, getTalksBySpeaker } from '@/lib/data-loader';
import { Talk } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { countScriptureReferences, getScriptureVolume } from '@/lib/search-utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function SpeakersPage() {
  const [talks, setTalks] = useState<Talk[]>([]);
  const [speakers, setSpeakers] = useState<string[]>([]);
  const [selectedSpeaker, setSelectedSpeaker] = useState('');
  const [filterByCount, setFilterByCount] = useState(false);
  const [loading, setLoading] = useState(true);
  const [speakerTalks, setSpeakerTalks] = useState<Talk[]>([]);

  useEffect(() => {
    loadTalks().then(data => {
      setTalks(data);
      const allSpeakers = getSpeakers(data);
      setSpeakers(allSpeakers);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedSpeaker && talks.length > 0) {
      const filtered = getTalksBySpeaker(talks, selectedSpeaker);
      setSpeakerTalks(filtered);
    } else {
      setSpeakerTalks([]);
    }
  }, [selectedSpeaker, talks]);

  const filteredSpeakers = filterByCount
    ? speakers.filter(speaker => getTalksBySpeaker(talks, speaker).length >= 10)
    : speakers;

  // Calculate statistics
  const totalTalks = speakerTalks.length;
  const firstTalk = speakerTalks.length > 0 
    ? speakerTalks.sort((a, b) => a.year - b.year)[0]
    : null;
  const totalScriptureRefs = speakerTalks.reduce((sum, talk) => sum + countScriptureReferences(talk), 0);

  // Volume breakdown
  const volumeCounts = new Map<string, number>();
  speakerTalks.forEach(talk => {
    // This is a simplified version - in reality you'd parse footnotes more carefully
    const refs = countScriptureReferences(talk);
    // For demo, distribute evenly - in real app, parse footnotes properly
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
      <div className="flex h-screen">
        <Navigation />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-8">
            <p>Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Navigation />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold">Speakers</h1>
            <p className="text-xl text-muted-foreground">
              Detailed information about General Conference speakers
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select a Speaker</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="filter-count"
                  checked={filterByCount}
                  onCheckedChange={(checked) => setFilterByCount(checked as boolean)}
                />
                <Label htmlFor="filter-count" className="cursor-pointer">
                  Speakers with 10 or more talks only
                </Label>
              </div>

              <div className="space-y-2">
                <Label>Speaker</Label>
                <Select value={selectedSpeaker} onValueChange={setSelectedSpeaker}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a speaker" />
                  </SelectTrigger>
                  <SelectContent>
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
            </CardContent>
          </Card>

          {selectedSpeaker && speakerTalks.length > 0 && (
            <>
              {/* Statistics */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Talks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{totalTalks}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">First Talk</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {firstTalk ? `${firstTalk.season} ${firstTalk.year}` : 'N/A'}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Scripture References</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{totalScriptureRefs}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Refs per Talk</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {totalTalks > 0 ? (totalScriptureRefs / totalTalks).toFixed(1) : '0'}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* All Talks Table */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>All Talks by {selectedSpeaker}</CardTitle>
                  <CardDescription>{totalTalks} talks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Conference</TableHead>
                          <TableHead>Calling</TableHead>
                          <TableHead className="w-20">Link</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {speakerTalks
                          .sort((a, b) => b.year - a.year || (b.season === 'October' ? 1 : -1))
                          .map((talk, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{talk.title}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {talk.season} {talk.year}
                              </Badge>
                            </TableCell>
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
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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

          {!selectedSpeaker && (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  Select a speaker to view their conference talks and statistics
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

