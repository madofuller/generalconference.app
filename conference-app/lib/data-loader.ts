import Papa from 'papaparse';
import { Talk, Conference, ERAS } from './types';

let cachedTalks: Talk[] | null = null;

function parseCsv(csvText: string, source: 'modern' | 'historical'): Promise<Talk[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Talk>(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const talks = results.data.map(row => ({
          ...row,
          title: (row.title || '').trim(),
          speaker: (row.speaker || '').trim(),
          calling: (row.calling || '').trim(),
          season: (row.season || '').trim(),
          url: (row.url || '').trim(),
          calling_original: (row.calling_original || '').trim(),
          year: Number(row.year) || 0,
          talk: row.talk || '',
          footnotes: row.footnotes || '',
          source,
          topics: row.topics,
          topic_scores: row.topic_scores,
          primary_topic: row.primary_topic,
          primary_topic_score: row.primary_topic_score,
          emotions: row.emotions,
          emotion_scores: row.emotion_scores,
          primary_emotion: row.primary_emotion,
          primary_emotion_score: row.primary_emotion_score,
          all_emotion_scores: row.all_emotion_scores
        }));
        resolve(talks);
      },
      error: (error: Error) => {
        reject(error);
      }
    });
  });
}

export async function loadTalks(): Promise<Talk[]> {
  if (cachedTalks) {
    return cachedTalks;
  }

  const [modernRes, historicalRes] = await Promise.all([
    fetch('/conference_talks_cleaned.csv'),
    fetch('/historical_talks.csv'),
  ]);

  const [modernCsv, historicalCsv] = await Promise.all([
    modernRes.text(),
    historicalRes.text(),
  ]);

  const [modernTalks, historicalTalks] = await Promise.all([
    parseCsv(modernCsv, 'modern'),
    parseCsv(historicalCsv, 'historical'),
  ]);

  cachedTalks = [...historicalTalks, ...modernTalks];
  return cachedTalks;
}

export function getConferences(talks: Talk[]): Conference[] {
  const conferenceSet = new Set<string>();
  const conferences: Conference[] = [];

  talks.forEach(talk => {
    const key = `${talk.season} ${talk.year}`;
    if (!conferenceSet.has(key)) {
      conferenceSet.add(key);
      conferences.push({
        season: talk.season,
        year: talk.year,
        label: key
      });
    }
  });

  return conferences.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return a.season === 'April' ? 1 : -1;
  });
}

export function getSpeakers(talks: Talk[]): string[] {
  const speakerSet = new Set<string>();
  talks.forEach(talk => speakerSet.add(talk.speaker));
  return Array.from(speakerSet).sort();
}

export function getEraForYear(year: number): string {
  const era = ERAS.find(e => year >= e.start && (e.end === null || year <= e.end));
  return era?.name || 'Unknown';
}

export function getTalksByConference(talks: Talk[], season: string, year: number): Talk[] {
  return talks.filter(t => t.season === season && t.year === year);
}

export function getTalksBySpeaker(talks: Talk[], speaker: string): Talk[] {
  return talks.filter(t => t.speaker === speaker);
}

export function getTalksByEra(talks: Talk[], eraName: string): Talk[] {
  const era = ERAS.find(e => e.name === eraName);
  if (!era) return [];
  return talks.filter(t => t.year >= era.start && (era.end === null || t.year <= era.end));
}

export function getTalksByYearRange(talks: Talk[], startYear: number, endYear: number): Talk[] {
  return talks.filter(t => t.year >= startYear && t.year <= endYear);
}
