'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { useFilters } from '@/lib/filter-context';
import { loadTalks, getConferences, getSpeakers } from '@/lib/data-loader';
import { ERAS, PRESIDENTS_OF_THE_CHURCH, LIVING_PROPHETS, SearchFilters } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function FiltersPage() {
  const { filters, setFilters, resetFilters } = useFilters();
  const [filterType, setFilterType] = useState<'none' | 'speaker' | 'conference' | 'era' | 'year'>(filters.type);
  const [speakerFilterType, setSpeakerFilterType] = useState<'presidents' | 'living' | 'custom'>('custom');
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>(filters.speakers || []);
  const [selectedConference, setSelectedConference] = useState<string>(filters.conference || '');
  const [selectedEra, setSelectedEra] = useState<string>(filters.era || '');
  const [yearRange, setYearRange] = useState<[number, number]>(filters.yearRange || [1971, 2025]);
  
  const [conferences, setConferences] = useState<string[]>([]);
  const [speakers, setSpeakers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTalks().then(talks => {
      const confs = getConferences(talks);
      setConferences(confs.map(c => c.label));
      setSpeakers(getSpeakers(talks));
      setLoading(false);
    });
  }, []);

  const handleSetFilter = () => {
    const newFilters: SearchFilters = { type: filterType };
    
    if (filterType === 'speaker') {
      if (speakerFilterType === 'presidents') {
        newFilters.speakers = PRESIDENTS_OF_THE_CHURCH;
      } else if (speakerFilterType === 'living') {
        newFilters.speakers = LIVING_PROPHETS;
      } else {
        newFilters.speakers = selectedSpeakers;
      }
    } else if (filterType === 'conference') {
      newFilters.conference = selectedConference;
    } else if (filterType === 'era') {
      newFilters.era = selectedEra;
    } else if (filterType === 'year') {
      newFilters.yearRange = yearRange;
    }
    
    setFilters(newFilters);
  };

  const handleResetFilter = () => {
    resetFilters();
    setFilterType('none');
    setSelectedSpeakers([]);
    setSelectedConference('');
    setSelectedEra('');
    setYearRange([1971, 2025]);
  };

  const toggleSpeaker = (speaker: string) => {
    setSelectedSpeakers(prev => 
      prev.includes(speaker) 
        ? prev.filter(s => s !== speaker)
        : [...prev, speaker]
    );
  };

  const getCurrentFilterDescription = () => {
    if (filters.type === 'none') return 'No filter applied';
    if (filters.type === 'speaker') {
      return `Speaker filter: ${filters.speakers?.length || 0} speaker(s) selected`;
    }
    if (filters.type === 'conference') {
      return `Conference filter: ${filters.conference}`;
    }
    if (filters.type === 'era') {
      return `Era filter: ${filters.era}`;
    }
    if (filters.type === 'year') {
      return `Year filter: ${filters.yearRange?.[0]} - ${filters.yearRange?.[1]}`;
    }
    return '';
  };

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
            <h1 className="mb-2 text-4xl font-bold">Filters</h1>
            <p className="text-xl text-muted-foreground">
              Refine search results in Scriptures, Word Search, and Phrase Search tabs
            </p>
          </div>

          {/* Current Filter Status */}
          <Card className="mb-6 border-2 border-primary">
            <CardHeader>
              <CardTitle>Current Filter Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-medium">{getCurrentFilterDescription()}</p>
                  {filters.type !== 'none' && filters.speakers && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {filters.speakers.slice(0, 5).map(speaker => (
                        <Badge key={speaker} variant="secondary">{speaker}</Badge>
                      ))}
                      {filters.speakers.length > 5 && (
                        <Badge variant="outline">+{filters.speakers.length - 5} more</Badge>
                      )}
                    </div>
                  )}
                </div>
                {filters.type !== 'none' && (
                  <Button variant="outline" onClick={handleResetFilter}>
                    Clear Filter
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configure Filter</CardTitle>
              <CardDescription>
                Filters apply to Scriptures, Word Search, and Phrase Search. Remember to click search again after setting a filter.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Filter Type Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Filter Type</Label>
                <RadioGroup value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="none" />
                    <Label htmlFor="none" className="cursor-pointer">No Filter</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="speaker" id="speaker" />
                    <Label htmlFor="speaker" className="cursor-pointer">Speaker</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="conference" id="conference" />
                    <Label htmlFor="conference" className="cursor-pointer">Conference</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="era" id="era" />
                    <Label htmlFor="era" className="cursor-pointer">Era</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="year" id="year" />
                    <Label htmlFor="year" className="cursor-pointer">Year Range</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Speaker Filter Options */}
              {filterType === 'speaker' && (
                <div className="space-y-4 rounded-lg border p-4">
                  <Label className="text-base font-semibold">Speaker Options</Label>
                  <RadioGroup value={speakerFilterType} onValueChange={(value: any) => setSpeakerFilterType(value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="presidents" id="presidents" />
                      <Label htmlFor="presidents" className="cursor-pointer">Presidents of the Church</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="living" id="living" />
                      <Label htmlFor="living" className="cursor-pointer">Living Prophets</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="custom" />
                      <Label htmlFor="custom" className="cursor-pointer">Custom List</Label>
                    </div>
                  </RadioGroup>

                  {speakerFilterType === 'custom' && (
                    <div className="mt-4">
                      <Label>Select Speakers</Label>
                      <ScrollArea className="h-60 rounded-md border p-4 mt-2">
                        <div className="space-y-2">
                          {speakers.map(speaker => (
                            <div key={speaker} className="flex items-center space-x-2">
                              <Checkbox
                                id={speaker}
                                checked={selectedSpeakers.includes(speaker)}
                                onCheckedChange={() => toggleSpeaker(speaker)}
                              />
                              <Label htmlFor={speaker} className="cursor-pointer text-sm">
                                {speaker}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {selectedSpeakers.length} speaker(s) selected
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Conference Filter */}
              {filterType === 'conference' && (
                <div className="space-y-2">
                  <Label>Select Conference</Label>
                  <Select value={selectedConference} onValueChange={setSelectedConference}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a conference" />
                    </SelectTrigger>
                    <SelectContent>
                      {conferences.map(conf => (
                        <SelectItem key={conf} value={conf}>{conf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Era Filter */}
              {filterType === 'era' && (
                <div className="space-y-2">
                  <Label>Select Era</Label>
                  <Select value={selectedEra} onValueChange={setSelectedEra}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an era" />
                    </SelectTrigger>
                    <SelectContent>
                      {ERAS.map(era => (
                        <SelectItem key={era.name} value={era.name}>
                          {era.name} Era ({era.president})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Year Range Filter */}
              {filterType === 'year' && (
                <div className="space-y-4">
                  <Label>Year Range: {yearRange[0]} - {yearRange[1]}</Label>
                  <Slider
                    min={1971}
                    max={2025}
                    step={1}
                    value={yearRange}
                    onValueChange={(value) => setYearRange(value as [number, number])}
                    className="w-full"
                  />
                </div>
              )}

              {/* Set Filter Button */}
              <div className="pt-4">
                <Button onClick={handleSetFilter} size="lg" className="w-full">
                  Set Filter
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>How Filters Work</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Filters only apply to the Scriptures, Word Search, and Phrase Search tabs</li>
                <li>After setting a filter, navigate to one of these tabs and perform a search</li>
                <li>The Speakers, Conferences, Talks, and Overall tabs are not affected by filters</li>
                <li>You can change or clear the filter at any time from this page</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

