'use client';

import { useState, useEffect, useMemo } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { useFilteredTalks } from '@/lib/filter-context';
import { getTalksByEra } from '@/lib/data-loader';
import { 
  getAllTopics, 
  getTopicStats, 
  getTopicTrends, 
  getTalksByTopic, 
  getRelatedTopics,
  getTopicsByEra,
  getTopicCategory,
  TOPIC_CATEGORIES
} from '@/lib/topic-utils';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#ff7c7c'];

export default function TopicsPage() {
  const { talks, loading } = useFilteredTalks();
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedEra, setSelectedEra] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const hasTopics = useMemo(() => talks.filter(t => t.primary_topic && t.primary_topic !== 'Error').length > 0, [talks]);

  const topics = useMemo(() => {
    const topicData = talks.filter(t => t.primary_topic && t.primary_topic !== 'Error');
    return topicData.length > 0 ? getAllTopics(topicData) : [];
  }, [talks]);

  useEffect(() => {
    if (topics.length > 0 && !selectedTopic) {
      setSelectedTopic(topics[0]);
    }
  }, [topics, selectedTopic]);

  const filteredTalks = selectedEra === 'all' 
    ? talks.filter(t => t.primary_topic)
    : getTalksByEra(talks, selectedEra).filter(t => t.primary_topic);

  const filteredTopics = selectedCategory === 'all'
    ? topics
    : topics.filter(t => {
        const topics = TOPIC_CATEGORIES[selectedCategory as keyof typeof TOPIC_CATEGORIES] || [];
        return topics.includes(t);
      });

  // Overall topic statistics
  const topicStats = topics.map(topic => getTopicStats(filteredTalks, topic))
    .sort((a, b) => b.count - a.count);

  // Selected topic analysis
  const selectedTopicStats = selectedTopic ? getTopicStats(filteredTalks, selectedTopic) : null;
  const selectedTopicTrends = selectedTopic ? getTopicTrends(filteredTalks, selectedTopic) : [];
  const selectedTopicTalks = selectedTopic ? getTalksByTopic(filteredTalks, selectedTopic) : [];
  const relatedTopics = selectedTopic ? getRelatedTopics(filteredTalks, selectedTopic, 10) : [];

  // Era comparison
  const eraTopics = getTopicsByEra(filteredTalks, selectedEra);

  // Topic trends - calculate growth/decline
  const getTopicTrend = (topic: string) => {
    const trends = getTopicTrends(filteredTalks, topic);
    if (trends.length < 10) return 'stable';
    
    const recent = trends.slice(-5).reduce((sum, t) => sum + t.count, 0);
    const older = trends.slice(-10, -5).reduce((sum, t) => sum + t.count, 0);
    
    if (recent > older * 1.2) return 'rising';
    if (recent < older * 0.8) return 'declining';
    return 'stable';
  };

  // Topic comparison
  const [compareTopics, setCompareTopics] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<any[]>([]);

  const addTopicToComparison = (topic: string) => {
    if (!compareTopics.includes(topic) && compareTopics.length < 5) {
      setCompareTopics([...compareTopics, topic]);
    }
  };

  const removeTopicFromComparison = (topic: string) => {
    setCompareTopics(compareTopics.filter(t => t !== topic));
  };

  useEffect(() => {
    if (compareTopics.length > 0) {
      // Build comparison data
      const allYears = new Set<number>();
      compareTopics.forEach(topic => {
        const trends = getTopicTrends(filteredTalks, topic);
        trends.forEach(t => allYears.add(t.year));
      });

      const data = Array.from(allYears).sort().map(year => {
        const entry: any = { year };
        compareTopics.forEach(topic => {
          const trends = getTopicTrends(filteredTalks, topic);
          const yearData = trends.find(t => t.year === year);
          entry[topic] = yearData ? yearData.count : 0;
        });
        return entry;
      });

      setComparisonData(data);
    }
  }, [compareTopics, filteredTalks]);

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

  if (!hasTopics) {
    return (
      <div className="flex min-h-screen">
        <Navigation />
        <main className="ml-0 lg:ml-[260px] min-h-screen flex-1">
          <TopAppBar title="Topics" subtitle="AI-classified gospel topics" />
          <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24">

            <Card>
              <CardHeader>
                <CardTitle>Topics Coming Soon</CardTitle>
                <CardDescription>
                  This feature requires AI-classified topic data that hasn&apos;t been generated yet.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-[#524534]">
                  Once topic classification is complete, you&apos;ll be able to explore 60+ gospel topics across 50+ years of General Conference &mdash; see trends, compare themes, and discover which topics are rising or declining.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1">
        <TopAppBar title="Topics" subtitle="AI-classified gospel topics" />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24">

          {/* Methodology Disclaimer */}
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>Methodology Note</AlertTitle>
            <AlertDescription>
              Topic classifications are based on AI analysis of representative samples from each talk (title + selected sentences), 
              not the full text. This approach enables efficient processing while capturing the main themes. 
              Results provide valuable insights into topic trends, though they may not reflect every nuance of each talk.
            </AlertDescription>
          </Alert>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Filter by Era</Label>
                <Select value={selectedEra} onValueChange={setSelectedEra}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Eras" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Eras</SelectItem>
                    <SelectItem value="Nelson">Nelson Era (2018-2025)</SelectItem>
                    <SelectItem value="Monson">Monson Era (2008-2017)</SelectItem>
                    <SelectItem value="Hinckley">Hinckley Era (1995-2007)</SelectItem>
                    <SelectItem value="Benson">Benson Era (1986-1994)</SelectItem>
                    <SelectItem value="Kimball">Kimball Era (1974-1985)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Filter by Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.keys(TOPIC_CATEGORIES).map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="space-y-4 md:space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="explore">Explore Topic</TabsTrigger>
              <TabsTrigger value="compare">Compare Topics</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Summary Stats */}
              <div className="grid gap-4 sm:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Topics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-3xl font-bold">{topics.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Classified Talks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-3xl font-bold">{filteredTalks.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg Topics/Talk</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-3xl font-bold">2.8</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-3xl font-bold">
                      {(filteredTalks.reduce((sum, t) => sum + (t.primary_topic_score || 0), 0) / filteredTalks.length * 100).toFixed(0)}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Topics */}
              <Card>
                <CardHeader>
                  <CardTitle>Top 20 Topics</CardTitle>
                  <CardDescription>Most frequently discussed gospel topics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={topicStats.slice(0, 20)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="topic" angle={-45} textAnchor="end" height={150} fontSize={11} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>

                    <div className="overflow-x-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Rank</TableHead>
                            <TableHead>Topic</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Talks</TableHead>
                            <TableHead className="text-right">%</TableHead>
                            <TableHead className="text-right">Trend</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {topicStats.slice(0, 20).map((stat, idx) => {
                            const trend = getTopicTrend(stat.topic);
                            return (
                              <TableRow key={idx} className="cursor-pointer hover:bg-muted" onClick={() => setSelectedTopic(stat.topic)}>
                                <TableCell className="font-medium">{idx + 1}</TableCell>
                                <TableCell className="font-medium">{stat.topic}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{getTopicCategory(stat.topic)}</Badge>
                                </TableCell>
                                <TableCell className="text-right">{stat.count}</TableCell>
                                <TableCell className="text-right">{stat.percentage.toFixed(1)}%</TableCell>
                                <TableCell className="text-right">
                                  {trend === 'rising' && <TrendingUp className="h-4 w-4 text-green-600 inline" />}
                                  {trend === 'declining' && <TrendingDown className="h-4 w-4 text-red-600 inline" />}
                                  {trend === 'stable' && <Minus className="h-4 w-4 text-gray-600 inline" />}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Explore Topic Tab */}
            <TabsContent value="explore" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Select a Topic to Explore</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTopics.map(topic => (
                        <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {selectedTopicStats && (
                <>
                  {/* Topic Stats */}
                  <div className="grid gap-4 sm:grid-cols-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Talks</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl md:text-3xl font-bold">{selectedTopicStats.count}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Percentage</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl md:text-3xl font-bold">{selectedTopicStats.percentage.toFixed(1)}%</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl md:text-3xl font-bold">{(selectedTopicStats.avgScore * 100).toFixed(0)}%</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Category</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge className="text-sm">{getTopicCategory(selectedTopic)}</Badge>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Trend Over Time */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Topic Trend Over Time</CardTitle>
                      <CardDescription>Number of talks per year discussing "{selectedTopic}"</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={selectedTopicTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Related Topics */}
                  {relatedTopics.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Related Topics</CardTitle>
                        <CardDescription>Topics frequently discussed alongside "{selectedTopic}"</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {relatedTopics.map(rt => (
                            <Badge 
                              key={rt.topic} 
                              variant="secondary" 
                              className="cursor-pointer hover:bg-[#1B5E7B] hover:text-white"
                              onClick={() => setSelectedTopic(rt.topic)}
                            >
                              {rt.topic} ({rt.frequency})
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Sample Talks */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Talks on "{selectedTopic}"</CardTitle>
                      <CardDescription>Showing 10 most recent talks</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedTopicTalks
                          .sort((a, b) => b.year - a.year)
                          .slice(0, 10)
                          .map((talk, idx) => (
                            <div key={idx} className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h3 className="font-semibold mb-1">{talk.title}</h3>
                                  <p className="text-sm text-[#524534] mb-2">
                                    {talk.speaker} • {talk.season} {talk.year}
                                  </p>
                                  <div className="flex gap-2 items-center">
                                    <Badge variant="outline">{talk.calling}</Badge>
                                    <span className="text-xs text-[#524534]">
                                      Confidence: {((talk.primary_topic_score || 0) * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                </div>
                                <a
                                  href={talk.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Button variant="outline" size="sm">
                                    View Talk
                                  </Button>
                                </a>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Compare Topics Tab */}
            <TabsContent value="compare" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Compare Multiple Topics</CardTitle>
                  <CardDescription>Select up to 5 topics to compare their trends over time</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Add Topic to Comparison</Label>
                    <Select onValueChange={addTopicToComparison} value="">
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a topic to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredTopics
                          .filter(t => !compareTopics.includes(t))
                          .map(topic => (
                            <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {compareTopics.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {compareTopics.map(topic => (
                        <Badge 
                          key={topic} 
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeTopicFromComparison(topic)}
                        >
                          {topic} ✕
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {compareTopics.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Topic Comparison Chart</CardTitle>
                    <CardDescription>Comparing {compareTopics.length} topics over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={comparisonData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {compareTopics.map((topic, idx) => (
                          <Line 
                            key={topic} 
                            type="monotone" 
                            dataKey={topic} 
                            stroke={COLORS[idx % COLORS.length]} 
                            strokeWidth={2}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-6">
              <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Rising Topics
                    </CardTitle>
                    <CardDescription>Topics gaining emphasis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {topicStats
                        .filter(s => getTopicTrend(s.topic) === 'rising')
                        .slice(0, 10)
                        .map(stat => (
                          <div key={stat.topic} className="flex justify-between items-center p-2 rounded hover:bg-muted cursor-pointer" onClick={() => setSelectedTopic(stat.topic)}>
                            <span className="text-sm font-medium">{stat.topic}</span>
                            <Badge variant="outline">{stat.count}</Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Minus className="h-5 w-5 text-gray-600" />
                      Stable Topics
                    </CardTitle>
                    <CardDescription>Consistently discussed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {topicStats
                        .filter(s => getTopicTrend(s.topic) === 'stable')
                        .slice(0, 10)
                        .map(stat => (
                          <div key={stat.topic} className="flex justify-between items-center p-2 rounded hover:bg-muted cursor-pointer" onClick={() => setSelectedTopic(stat.topic)}>
                            <span className="text-sm font-medium">{stat.topic}</span>
                            <Badge variant="outline">{stat.count}</Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      Declining Topics
                    </CardTitle>
                    <CardDescription>Less emphasis recently</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {topicStats
                        .filter(s => getTopicTrend(s.topic) === 'declining')
                        .slice(0, 10)
                        .map(stat => (
                          <div key={stat.topic} className="flex justify-between items-center p-2 rounded hover:bg-muted cursor-pointer" onClick={() => setSelectedTopic(stat.topic)}>
                            <span className="text-sm font-medium">{stat.topic}</span>
                            <Badge variant="outline">{stat.count}</Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}



