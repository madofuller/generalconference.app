'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { loadTalks } from '@/lib/data-loader';
import { Talk } from '@/lib/types';
import { 
  getAllEmotions, 
  getEmotionStats, 
  getEmotionTrends, 
  getTalksByEmotion, 
  getRelatedEmotions,
  getEmotionCategory,
  EMOTION_CATEGORIES,
  EMOTION_COLORS
} from '@/lib/emotion-utils';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink, Smile, Frown, Heart, AlertCircle, Info } from 'lucide-react';

export default function EmotionsPage() {
  const [talks, setTalks] = useState<Talk[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasEmotions, setHasEmotions] = useState(false);
  const [emotions, setEmotions] = useState<string[]>([]);
  const [selectedEmotion, setSelectedEmotion] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadTalks().then(data => {
      setTalks(data);
      
      // Check if emotions are available
      const emotionData = data.filter(t => t.primary_emotion && t.primary_emotion !== 'Error');
      setHasEmotions(emotionData.length > 0);
      
      if (emotionData.length > 0) {
        const allEmotions = getAllEmotions(emotionData);
        setEmotions(allEmotions);
        if (allEmotions.length > 0) {
          setSelectedEmotion(allEmotions[0]);
        }
      }
      
      setLoading(false);
    });
  }, []);

  const filteredTalks = talks.filter(t => t.primary_emotion);
  
  const filteredEmotions = selectedCategory === 'all'
    ? emotions
    : emotions.filter(e => {
        const emotionsInCat = EMOTION_CATEGORIES[selectedCategory as keyof typeof EMOTION_CATEGORIES] || [];
        return emotionsInCat.includes(e as any);
      });

  // Overall emotion statistics
  const emotionStats = emotions.map(emotion => getEmotionStats(filteredTalks, emotion))
    .sort((a, b) => b.count - a.count);

  // Selected emotion analysis
  const selectedEmotionStats = selectedEmotion ? getEmotionStats(filteredTalks, selectedEmotion) : null;
  const selectedEmotionTrends = selectedEmotion ? getEmotionTrends(filteredTalks, selectedEmotion) : [];
  const selectedEmotionTalks = selectedEmotion ? getTalksByEmotion(filteredTalks, selectedEmotion) : [];
  const relatedEmotions = selectedEmotion ? getRelatedEmotions(filteredTalks, selectedEmotion, 10) : [];

  // Emotion comparison
  const [compareEmotions, setCompareEmotions] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<any[]>([]);

  const addEmotionToComparison = (emotion: string) => {
    if (!compareEmotions.includes(emotion) && compareEmotions.length < 5) {
      setCompareEmotions([...compareEmotions, emotion]);
    }
  };

  const removeEmotionFromComparison = (emotion: string) => {
    setCompareEmotions(compareEmotions.filter(e => e !== emotion));
  };

  useEffect(() => {
    if (compareEmotions.length > 0) {
      const allYears = new Set<number>();
      compareEmotions.forEach(emotion => {
        const trends = getEmotionTrends(filteredTalks, emotion);
        trends.forEach(t => allYears.add(t.year));
      });

      const data = Array.from(allYears).sort().map(year => {
        const entry: any = { year };
        compareEmotions.forEach(emotion => {
          const trends = getEmotionTrends(filteredTalks, emotion);
          const yearData = trends.find(t => t.year === year);
          entry[emotion] = yearData ? yearData.count : 0;
        });
        return entry;
      });

      setComparisonData(data);
    }
  }, [compareEmotions, filteredTalks]);

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

  if (!hasEmotions) {
    return (
      <div className="flex h-screen">
        <Navigation />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-8">
            <div className="mb-8">
              <h1 className="mb-2 text-4xl font-bold">Emotions</h1>
              <p className="text-xl text-muted-foreground">
                AI-powered emotion analysis using 28 emotion labels
              </p>
            </div>

            <Card className="border-2 border-yellow-500">
              <CardHeader>
                <CardTitle>Emotions Not Yet Classified</CardTitle>
                <CardDescription>
                  The talks need emotion analysis before using this feature
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>To add emotion classification to your talks:</p>
                
                <div className="rounded-lg bg-muted p-4">
                  <h3 className="font-semibold mb-2">Step 1: Run Classification</h3>
                  <pre className="text-sm bg-black text-white p-3 rounded overflow-x-auto">
                    cd classification{'\n'}
                    python classify_emotions_fast.py
                  </pre>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <h3 className="font-semibold mb-2">Step 2: Update App</h3>
                  <pre className="text-sm bg-black text-white p-3 rounded overflow-x-auto">
                    cp conference_talks_with_emotions.csv ../conference-app/public/conference_talks_cleaned.csv
                  </pre>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold mb-2">What This Adds:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>28 emotion labels from roberta-base-go_emotions model</li>
                    <li>Track emotional tone of talks over 50+ years</li>
                    <li>See which emotions are most common in different eras</li>
                    <li>Compare emotional trends across time</li>
                    <li>Discover how conference talks inspire different emotions</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Category counts for pie chart
  const categoryCounts = Object.keys(EMOTION_CATEGORIES).map(category => {
    const emotionsInCat = EMOTION_CATEGORIES[category as keyof typeof EMOTION_CATEGORIES];
    const count = filteredTalks.filter(t => 
      t.primary_emotion && emotionsInCat.includes(t.primary_emotion as any)
    ).length;
    return { name: category, value: count };
  }).filter(c => c.value > 0);

  return (
    <div className="flex h-screen">
      <Navigation />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold">😊 Emotions</h1>
            <p className="text-xl text-muted-foreground">
              Explore emotional tone across General Conference talks using AI analysis
            </p>
          </div>

          {/* Methodology Disclaimer */}
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>Methodology Note</AlertTitle>
            <AlertDescription>
              Emotion classifications are based on AI analysis of representative samples from each talk (title + selected sentences), 
              not the full text. This approach enables efficient processing while capturing the emotional tone. 
              Results provide valuable insights into emotional trends, though they may not reflect every emotional nuance of each talk.
            </AlertDescription>
          </Alert>

          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Classified Talks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{filteredTalks.length.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Unique Emotions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{emotions.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Most Common</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{emotionStats[0]?.emotion || 'N/A'}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {(filteredTalks.reduce((sum, t) => sum + (t.primary_emotion_score || 0), 0) / filteredTalks.length * 100).toFixed(0)}%
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="explore">Explore Emotion</TabsTrigger>
              <TabsTrigger value="compare">Compare</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top 15 Emotions</CardTitle>
                  <CardDescription>Most frequently detected emotions in conference talks</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={emotionStats.slice(0, 15)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="emotion" angle={-45} textAnchor="end" height={100} fontSize={11} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Emotion Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rank</TableHead>
                          <TableHead>Emotion</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Count</TableHead>
                          <TableHead className="text-right">%</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {emotionStats.slice(0, 20).map((stat, idx) => (
                          <TableRow key={idx} className="cursor-pointer hover:bg-muted" onClick={() => setSelectedEmotion(stat.emotion)}>
                            <TableCell className="font-medium">{idx + 1}</TableCell>
                            <TableCell className="font-medium capitalize">{stat.emotion}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{getEmotionCategory(stat.emotion)}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{stat.count.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{stat.percentage.toFixed(1)}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Explore Emotion Tab */}
            <TabsContent value="explore" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Select an Emotion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Filter by Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {Object.keys(EMOTION_CATEGORIES).map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Emotion</Label>
                    <Select value={selectedEmotion} onValueChange={setSelectedEmotion}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an emotion" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredEmotions.map(emotion => (
                          <SelectItem key={emotion} value={emotion} className="capitalize">
                            {emotion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {selectedEmotionStats && (
                <>
                  <div className="grid gap-4 sm:grid-cols-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Talks</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{selectedEmotionStats.count.toLocaleString()}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Percentage</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{selectedEmotionStats.percentage.toFixed(1)}%</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{(selectedEmotionStats.avgScore * 100).toFixed(0)}%</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Category</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge className="text-sm capitalize">{getEmotionCategory(selectedEmotion)}</Badge>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="capitalize">"{selectedEmotion}" Trend Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={selectedEmotionTrends}>
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

                  {relatedEmotions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Related Emotions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {relatedEmotions.map(re => (
                            <Badge 
                              key={re.emotion} 
                              variant="secondary" 
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground capitalize"
                              onClick={() => setSelectedEmotion(re.emotion)}
                            >
                              {re.emotion} ({re.frequency})
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Talks with "{selectedEmotion}"</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedEmotionTalks
                          .sort((a, b) => b.year - a.year)
                          .slice(0, 10)
                          .map((talk, idx) => (
                            <div key={idx} className="rounded-lg border p-4 hover:bg-muted/50">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h3 className="font-semibold mb-1">{talk.title}</h3>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {talk.speaker} • {talk.season} {talk.year}
                                  </p>
                                  <div className="flex gap-2 items-center">
                                    <Badge variant="outline">{talk.calling}</Badge>
                                    <span className="text-xs text-muted-foreground">
                                      Confidence: {((talk.primary_emotion_score || 0) * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                </div>
                                <a href={talk.url} target="_blank" rel="noopener noreferrer">
                                  <Button variant="outline" size="sm">View Talk</Button>
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

            {/* Compare Tab */}
            <TabsContent value="compare" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Compare Multiple Emotions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Add Emotion</Label>
                    <Select onValueChange={addEmotionToComparison} value="">
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an emotion to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {emotions.filter(e => !compareEmotions.includes(e)).map(emotion => (
                          <SelectItem key={emotion} value={emotion} className="capitalize">
                            {emotion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {compareEmotions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {compareEmotions.map(emotion => (
                        <Badge 
                          key={emotion} 
                          variant="secondary"
                          className="cursor-pointer capitalize"
                          onClick={() => removeEmotionFromComparison(emotion)}
                        >
                          {emotion} ✕
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {compareEmotions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Emotion Comparison Chart</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={comparisonData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {compareEmotions.map((emotion, idx) => (
                          <Line 
                            key={emotion} 
                            type="monotone" 
                            dataKey={emotion} 
                            stroke={EMOTION_COLORS[emotion] || `#${Math.floor(Math.random()*16777215).toString(16)}`}
                            strokeWidth={2}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Categories Tab */}
            <TabsContent value="categories" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Emotion Categories Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={categoryCounts}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryCounts.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#10B981', '#EF4444', '#3B82F6', '#F59E0B', '#9CA3AF'][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                {Object.entries(EMOTION_CATEGORIES).map(([category, categoryEmotions]) => {
                  const count = filteredTalks.filter(t => 
                    t.primary_emotion && categoryEmotions.includes(t.primary_emotion as any)
                  ).length;
                  const percentage = (count / filteredTalks.length) * 100;

                  return (
                    <Card key={category}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{category}</span>
                          <Badge>{count.toLocaleString()} talks</Badge>
                        </CardTitle>
                        <CardDescription>{percentage.toFixed(1)}% of all talks</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {categoryEmotions.map(emotion => {
                            const emotionCount = filteredTalks.filter(t => t.primary_emotion === emotion).length;
                            return emotionCount > 0 ? (
                              <Badge 
                                key={emotion} 
                                variant="outline"
                                className="capitalize cursor-pointer hover:bg-secondary"
                                onClick={() => setSelectedEmotion(emotion)}
                              >
                                {emotion} ({emotionCount})
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}



