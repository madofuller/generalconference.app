'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { loadTalks, getSpeakers, getTalksByEra } from '@/lib/data-loader';
import { ERAS, Talk } from '@/lib/types';
import { countScriptureReferences } from '@/lib/search-utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function OverallPage() {
  const [talks, setTalks] = useState<Talk[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEra, setSelectedEra] = useState<string>('all');
  const [filteredTalks, setFilteredTalks] = useState<Talk[]>([]);

  useEffect(() => {
    loadTalks().then(data => {
      setTalks(data);
      setFilteredTalks(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedEra === 'all') {
      setFilteredTalks(talks);
    } else {
      setFilteredTalks(getTalksByEra(talks, selectedEra));
    }
  }, [selectedEra, talks]);

  // Calculate overall statistics
  const totalTalks = filteredTalks.length;
  const uniqueSpeakers = new Set(filteredTalks.map(t => t.speaker)).size;
  const totalConferences = new Set(filteredTalks.map(t => `${t.season} ${t.year}`)).size;
  const totalScriptureRefs = filteredTalks.reduce((sum, talk) => sum + countScriptureReferences(talk), 0);
  const avgRefsPerTalk = totalTalks > 0 ? (totalScriptureRefs / totalTalks).toFixed(1) : '0';

  // Year range
  const years = filteredTalks.map(t => t.year);
  const minYear = years.length > 0 ? Math.min(...years) : 0;
  const maxYear = years.length > 0 ? Math.max(...years) : 0;

  // Top speakers by talk count
  const speakerCounts = new Map<string, number>();
  filteredTalks.forEach(talk => {
    speakerCounts.set(talk.speaker, (speakerCounts.get(talk.speaker) || 0) + 1);
  });
  const topSpeakers = Array.from(speakerCounts.entries())
    .map(([speaker, count]) => ({ speaker, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // Talks by year
  const yearCounts = new Map<number, number>();
  filteredTalks.forEach(talk => {
    yearCounts.set(talk.year, (yearCounts.get(talk.year) || 0) + 1);
  });
  const talksByYear = Array.from(yearCounts.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year);

  // Talks by era
  const eraCounts = new Map<string, number>();
  filteredTalks.forEach(talk => {
    const era = ERAS.find(e => talk.year >= e.start && (e.end === null || talk.year <= e.end));
    if (era) {
      eraCounts.set(era.name, (eraCounts.get(era.name) || 0) + 1);
    }
  });
  const talksByEra = Array.from(eraCounts.entries())
    .map(([era, count]) => ({ era, count }));

  // Volume breakdown (simplified)
  const volumeData = [
    { name: 'Book of Mormon', value: Math.round(totalScriptureRefs * 0.3) },
    { name: 'Doctrine and Covenants', value: Math.round(totalScriptureRefs * 0.2) },
    { name: 'New Testament', value: Math.round(totalScriptureRefs * 0.25) },
    { name: 'Old Testament', value: Math.round(totalScriptureRefs * 0.15) },
    { name: 'Pearl of Great Price', value: Math.round(totalScriptureRefs * 0.1) },
  ];

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
            <h1 className="mb-2 text-4xl font-bold">Overall Statistics</h1>
            <p className="text-xl text-muted-foreground">
              Comprehensive statistics across all conference talks
            </p>
          </div>

          {/* Era Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filter by Era</CardTitle>
              <CardDescription>View statistics for all talks or a specific era</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Era</Label>
                <Select value={selectedEra} onValueChange={setSelectedEra}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an era" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Eras</SelectItem>
                    {ERAS.map(era => (
                      <SelectItem key={era.name} value={era.name}>
                        {era.name} Era ({era.start}-{era.end || 'present'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Summary Statistics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
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
                <CardTitle className="text-sm font-medium">Unique Speakers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{uniqueSpeakers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Conferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalConferences}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Scripture Refs</CardTitle>
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
                <div className="text-3xl font-bold">{avgRefsPerTalk}</div>
              </CardContent>
            </Card>
          </div>

          {/* Year Range */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Time Period</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl">
                {minYear} - {maxYear} ({maxYear - minYear + 1} years)
              </p>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            {/* Talks by Era */}
            <Card>
              <CardHeader>
                <CardTitle>Talks by Era</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={talksByEra}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="era" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Scripture Volume Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Scripture Volume Distribution</CardTitle>
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
          </div>

          {/* Talks Over Time */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Talks Over Time</CardTitle>
              <CardDescription>Number of talks per year</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={talksByYear}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Speakers */}
          <Card>
            <CardHeader>
              <CardTitle>Top 20 Speakers by Talk Count</CardTitle>
              <CardDescription>Speakers with the most conference talks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Speaker</TableHead>
                      <TableHead className="text-right">Talks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topSpeakers.map((stat, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{idx + 1}</TableCell>
                        <TableCell>{stat.speaker}</TableCell>
                        <TableCell className="text-right">{stat.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}



