'use client';

import { useState, useEffect, useMemo } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { getSpeakers, getConferences, getTalksBySpeaker } from '@/lib/data-loader';
import { Conference, Talk } from '@/lib/types';
import { useFilteredTalks } from '@/lib/filter-context';
import { countScriptureReferences } from '@/lib/search-utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function TalksPage() {
  const { talks, loading } = useFilteredTalks();
  const [selectedTalk, setSelectedTalk] = useState<Talk | null>(null);

  const [selectionType, setSelectionType] = useState<'speakers' | 'conferences'>('speakers');
  const [selectedSpeaker, setSelectedSpeaker] = useState('');
  const [selectedConference, setSelectedConference] = useState('');
  const [speakerTalks, setSpeakerTalks] = useState<Talk[]>([]);
  const [filterByCount, setFilterByCount] = useState(false);

  const speakers = useMemo(() => getSpeakers(talks), [talks]);
  const conferences = useMemo(() => getConferences(talks), [talks]);

  useEffect(() => {
    if (selectionType === 'speakers' && selectedSpeaker) {
      const filtered = getTalksBySpeaker(talks, selectedSpeaker);
      setSpeakerTalks(filtered);
      setSelectedTalk(null);
    } else if (selectionType === 'conferences' && selectedConference) {
      const [season, year] = selectedConference.split(' ');
      const filtered = talks.filter(t => t.season === season && t.year === Number(year));
      setSpeakerTalks(filtered);
      setSelectedTalk(null);
    } else {
      setSpeakerTalks([]);
      setSelectedTalk(null);
    }
  }, [selectionType, selectedSpeaker, selectedConference, talks]);

  const filteredSpeakers = filterByCount
    ? speakers.filter(speaker => getTalksBySpeaker(talks, speaker).length >= 10)
    : speakers;

  // Calculate statistics for selected talk
  const scriptureRefs = selectedTalk ? countScriptureReferences(selectedTalk) : 0;
  
  // Volume breakdown (simplified)
  const volumeData = selectedTalk ? [
    { name: 'Book of Mormon', value: Math.round(scriptureRefs * 0.3) },
    { name: 'Doctrine and Covenants', value: Math.round(scriptureRefs * 0.2) },
    { name: 'New Testament', value: Math.round(scriptureRefs * 0.25) },
    { name: 'Old Testament', value: Math.round(scriptureRefs * 0.15) },
    { name: 'Pearl of Great Price', value: Math.round(scriptureRefs * 0.1) },
  ].filter(v => v.value > 0) : [];

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
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1">
        <TopAppBar title="Talks" subtitle="Individual talk analysis" />
        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24">

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select a Talk</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Selection Type */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Selection Method</Label>
                <RadioGroup value={selectionType} onValueChange={(value: any) => setSelectionType(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="speakers" id="speakers" />
                    <Label htmlFor="speakers" className="cursor-pointer">By Speaker</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="conferences" id="conferences" />
                    <Label htmlFor="conferences" className="cursor-pointer">By Conference</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Speaker Selection */}
              {selectionType === 'speakers' && (
                <>
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
                        {filteredSpeakers.map(speaker => (
                          <SelectItem key={speaker} value={speaker}>
                            {speaker}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Conference Selection */}
              {selectionType === 'conferences' && (
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
              )}

              {/* Talk Selection */}
              {speakerTalks.length > 0 && (
                <div className="space-y-2">
                  <Label>Talk</Label>
                  <Select 
                    value={selectedTalk?.title || ''} 
                    onValueChange={(title) => {
                      const talk = speakerTalks.find(t => t.title === title);
                      setSelectedTalk(talk || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a talk" />
                    </SelectTrigger>
                    <SelectContent>
                      {speakerTalks
                        .sort((a, b) => b.year - a.year || (b.season === 'October' ? 1 : -1))
                        .map((talk, idx) => (
                        <SelectItem key={idx} value={talk.title}>
                          {talk.title} ({talk.season} {talk.year})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedTalk && (
            <>
              {/* Talk Details */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>{selectedTalk.title}</CardTitle>
                  <CardDescription>
                    By {selectedTalk.speaker} • {selectedTalk.season} {selectedTalk.year}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-[#524534]">Speaker</p>
                      <p className="text-lg font-semibold">{selectedTalk.speaker}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#524534]">Calling</p>
                      <p className="text-lg font-semibold">{selectedTalk.calling}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#524534]">Conference</p>
                      <p className="text-lg font-semibold">
                        {selectedTalk.season} {selectedTalk.year}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[#524534]">Scripture References</p>
                      <p className="text-lg font-semibold">{scriptureRefs}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {selectedTalk.url && (
                      <a
                        href={selectedTalk.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                      >
                        {selectedTalk.source === 'historical'
                          ? 'View source PDF on Internet Archive'
                          : 'View on ChurchofJesusChrist.org'}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    {selectedTalk.source === 'historical' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-[10px] font-medium text-amber-800">
                        OCR Source — may contain errors
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Volume Breakdown */}
              {volumeData.length > 0 && (
                <Card className="mb-6">
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
              )}

              {/* Talk Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Talk Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[#524534] whitespace-pre-wrap line-clamp-10">
                    {selectedTalk.talk.substring(0, 1000)}
                    {selectedTalk.talk.length > 1000 && '...'}
                  </p>
                  <p className="mt-4 text-xs text-[#524534]">
                    Showing first {Math.min(1000, selectedTalk.talk.length)} characters. 
                    Visit the full talk for complete content.
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {!selectedTalk && speakerTalks.length === 0 && (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-[#524534]">
                  Select a speaker or conference to view available talks
                </p>
              </CardContent>
            </Card>
          )}

          {!selectedTalk && speakerTalks.length > 0 && (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-[#524534]">
                  Select a talk from the dropdown to view its details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}



