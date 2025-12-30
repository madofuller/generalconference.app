'use client';

import { Talk, SearchResult } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ScatterChart, Scatter } from 'recharts';

interface SearchResultsProps {
  result: SearchResult;
  title: string;
}

export function SearchResults({ result, title }: SearchResultsProps) {
  const { talks, totalReferences, speakerStats, conferenceStats, eraStats, yearStats } = result;

  // Prepare data for last 10 conferences chart
  const last10Conferences = conferenceStats.slice(0, 10).reverse();
  
  // Prepare data for era chart
  const eraChartData = eraStats.map(stat => ({
    era: stat.era,
    percentage: Number(stat.percentage.toFixed(2))
  }));

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Talks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{talks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total References</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalReferences}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unique Speakers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{speakerStats.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{conferenceStats.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Matching Talks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Matching Talks</CardTitle>
          <CardDescription>{talks.length} talks found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Speaker</TableHead>
                  <TableHead>Conference</TableHead>
                  <TableHead className="w-20">Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {talks.slice(0, 50).map((talk, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{talk.title}</TableCell>
                    <TableCell>{talk.speaker}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {talk.season} {talk.year}
                      </Badge>
                    </TableCell>
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
          {talks.length > 50 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Showing first 50 of {talks.length} talks
            </p>
          )}
        </CardContent>
      </Card>

      {/* Speaker Statistics */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Speakers by Count</CardTitle>
            <CardDescription>Speakers with most talks matching criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Speaker</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {speakerStats.slice(0, 10).map((stat, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{stat.speaker}</TableCell>
                      <TableCell className="text-right">{stat.count}</TableCell>
                      <TableCell className="text-right">{stat.percentage.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Speakers by Percentage</CardTitle>
            <CardDescription>Percentage of speaker's talks matching criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={speakerStats.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="speaker" angle={-45} textAnchor="end" height={100} fontSize={12} />
                <YAxis label={{ value: 'Percentage', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="percentage" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Conference and Era Statistics */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Last 10 Conferences</CardTitle>
            <CardDescription>Usage in recent conferences</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={last10Conferences}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="conference" angle={-45} textAnchor="end" height={100} fontSize={12} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage by Era</CardTitle>
            <CardDescription>Percentage of talks in each era</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eraChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="era" />
                <YAxis label={{ value: 'Percentage', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="percentage" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Year Scatter Plot */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Over Time</CardTitle>
          <CardDescription>Number of talks per year</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" domain={['dataMin', 'dataMax']} />
              <YAxis dataKey="count" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={yearStats} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Conferences Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Conferences</CardTitle>
          <CardDescription>Conferences with most references</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conference</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conferenceStats.slice(0, 20).map((stat, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{stat.conference}</TableCell>
                    <TableCell className="text-right">{stat.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

