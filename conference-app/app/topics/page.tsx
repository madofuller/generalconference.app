'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { loadTalks, getEraForYear, getTalksByEra } from '@/lib/data-loader';
import { Talk } from '@/lib/types';
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
  const [talks, setTalks] = useState<Talk[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasTopics, setHasTopics] = useState(false);
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedEra, setSelectedEra] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadTalks().then(data => {
      setTalks(data);
      
      // Check if topics are available
      const topicData = data.filter(t => t.primary_topic && t.primary_topic !== 'Error');
      setHasTopics(topicData.length > 0);
      
      if (topicData.length > 0) {
        const allTopics = getAllTopics(topicData);
        setTopics(allTopics);
        if (allTopics.length > 0) {
          setSelectedTopic(allTopics[0]);
        }
      }
      
      setLoading(false);
    });
  }, []);

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

  if (!hasTopics) {
    return (
      <div className="flex h-screen">
        <Navigation />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-8">
            <div className="mb-8">
              <h1 className="mb-2 text-4xl font-bold">Topics</h1>
              <p className="text-xl text-muted-foreground">
                AI-powered topic classification using Preach My Gospel themes
              </p>
            </div>

            <Card className="border-2 border-yellow-500">
              <CardHeader>
                <CardTitle>Topics Not Yet Classified</CardTitle>
                <CardDescription>
                  The talks need to be classified with AI before using this feature
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>To add topic classification to your talks, follow these steps:</p>
                
                <div className="rounded-lg bg-muted p-4">
                  <h3 className="font-semibold mb-2">Step 1: Install Dependencies</h3>
                  <pre className="text-sm bg-black text-white p-3 rounded overflow-x-auto">
                    cd /Users/lukejoneslwj/Downloads/conferencescraper{'\n'}
                    pip install -r requirements_nlp.txt
                  </pre>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <h3 className="font-semibold mb-2">Step 2: Run Classification Script</h3>
                  <pre className="text-sm bg-black text-white p-3 rounded overflow-x-auto">
                    python classify_topics.py
                  </pre>
                  <p className="text-sm text-muted-foreground mt-2">
                    ⚠️ This will take several hours for ~280,000 talks. Consider using a GPU for faster processing.
                  </p>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <h3 className="font-semibold mb-2">Step 3: Update Data File</h3>
                  <p className="text-sm">
                    Copy the generated <code>conference_talks_with_topics.csv</code> to{' '}
                    <code>conference-app/public/conference_talks_cleaned.csv</code> (replace the existing file)
                  </p>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <h3 className="font-semibold mb-2">Step 4: Reload the App</h3>
                  <p className="text-sm">
                    Refresh your browser to load the newly classified data.
                  </p>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold mb-2">What This Feature Does:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Uses DeBERTa-v3-base AI model for zero-shot classification</li>
                    <li>Classifies talks by 60+ gospel topics from Preach My Gospel</li>
                    <li>Shows topic trends over 50+ years of General Conference</li>
                    <li>Compare topics, explore related themes, discover insights</li>
                    <li>See which topics are rising or declining in emphasis</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
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
            <h1 className="mb-2 text-4xl font-bold">Topics</h1>
            <p className="text-xl text-muted-foreground">
              Explore gospel topics across General Conference talks using AI classification
            </p>
          </div>

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

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
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
                    <div className="text-3xl font-bold">{topics.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Classified Talks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{filteredTalks.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg Topics/Talk</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">2.8</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
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

                    <div className="rounded-md border">
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
                        <div className="text-3xl font-bold">{selectedTopicStats.count}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Percentage</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{selectedTopicStats.percentage.toFixed(1)}%</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{(selectedTopicStats.avgScore * 100).toFixed(0)}%</div>
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
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
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
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {talk.speaker} • {talk.season} {talk.year}
                                  </p>
                                  <div className="flex gap-2 items-center">
                                    <Badge variant="outline">{talk.calling}</Badge>
                                    <span className="text-xs text-muted-foreground">
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
              <div className="grid gap-6 lg:grid-cols-3">
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

