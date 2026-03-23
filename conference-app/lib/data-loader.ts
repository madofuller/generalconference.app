import Papa from 'papaparse';
import { Talk, Conference, ERAS } from './types';

let cachedTalks: Talk[] | null = null;
let cachedFullTalks: Talk[] | null = null;

// Normalize speaker name variants to a canonical form (merge into the one with more entries)
const SPEAKER_ALIASES: Record<string, string> = {
  // Modern-era duplicates
  'W. Grant Bangerter': 'William Grant Bangerter',
  'Wm. Grant Bangerter': 'William Grant Bangerter',
  'Michael J. Teh': 'Michael John U. Teh',
  'Teddy E. Brewerton': 'Ted E. Brewerton',
  'Elaine Cannon': 'Elaine A. Cannon',
  'Michelle Craig': 'Michelle D. Craig',
  'Charles A. Didier': 'Charles Didier',
  'Jack H. Goaslind': 'Jack H Goaslind',
  'Ardeth Greene Kapp': 'Ardeth G. Kapp',
  'Larry Echo Hawk': 'Larry J. Echo Hawk',
  'Mary Ellen W. Smoot': 'Mary Ellen Smoot',
  'LeGrand Richards': 'Legrand Richards',
  'ElRay L. Christiansen': 'Elray L. Christiansen',
  'Cecil O. Samuelson, Jr.': 'Cecil O. Samuelson Jr.',
  'Betty Jo Jepsen': 'Betty Jo N. Jepsen',
  'Albert Theodore Tuttle': 'A. Theodore Tuttle',
  'Jos\u00e9 L. Alonso': 'Jose L. Alonso',
  'Wm. Rolfe Kerr': 'W. Rolfe Kerr',
  'Jack H Goaslind, Jr.': 'Jack H Goaslind',
  'Jack H. Goaslind, Jr.': 'Jack H Goaslind',
  'Oleen L. Stohl': 'Oleen N. Stohl',
  'Oleen X. Stohl': 'Oleen N. Stohl',
  'Seymour Dilworth Young': 'S. Dilworth Young',
  'Wm. J. Henderson': 'William J. Henderson',
  'Wm. T. Jack': 'William T. Jack',

  // Historical OCR duplicates
  'Heber J Grant': 'Heber J. Grant',
  'B H. Roberts': 'B. H. Roberts',
  'B High Am H. Roberts': 'B. H. Roberts',
  'Briguam H. Roberts': 'B. H. Roberts',
  'Brigham Ham H. Roberts': 'B. H. Roberts',
  'Htrum M. Smith': 'Hyrum M. Smith',
  'Rum M. Smith': 'Hyrum M. Smith',
  'Rum G. Smith': 'Hyrum G. Smith',
  'Wilfokd Woodruff': 'Wilford Woodruff',
  'A. O. Woodruff': 'Abraham O. Woodruff',
  'Asahel Woodruff': 'Asahel H. Woodruff',
  'George A. Smith': 'George Albert Smith',
  'Winslow F. Smith': 'Winslow Farr Smith',
  'F. M. Lyman': 'Francis M. Lyman',
  'A. W. Ivins': 'Anthony W. Ivins',
  'M. F. Cowley': 'Matthias F. Cowley',
  'G. E. Ellsworth': 'German E. Ellsworth',
  'A. A. Hinckley': 'Alonzo A. Hinckley',
  'M. W. Merrill': 'Marriner W. Merrill',
  'J. Golden Kimball': 'J. Golden Kimball',
  'J. G. Kimball': 'J. Golden Kimball',
  'Stephen Richards': 'Stephen L. Richards',
  'Geo. F. Richards': 'George F. Richards',
  'F. D. Richards': 'Franklin D. Richards',
  'Wm. H. Richards': 'William H. Richards',
  'Rtjlon S. Wells': 'Rulon S. Wells',
  'Ben. E. Rich': 'Ben E. Rich',
  'S. E. Woolley': 'Samuel E. Woolley',
  'Charles Iv. Penrose': 'Charles W. Penrose',
  'Hep Ee, C- Austin': 'Heber C. Austin',
  'George H, Brimhall': 'George H. Brimhall',
  'Henry A, Gardner': 'Henry A. Gardner',
  'Joseph E, Evans': 'Joseph E. Evans',
  'E. H. Nye': 'Ephraim H. Nye',
  'L. A. Kelsch': 'Louis A. Kelsch',
  'W. C. Lyman': 'Walter C. Lyman',
  'R. G. Miller': 'Reuben G. Miller',
  'J. N. Lambert': 'James N. Lambert',
  'J. M. Tanner': 'Joseph M. Tanner',
  'J. W. Summerhays': 'Joseph W. Summerhays',
  'Jos. W. Summerhays': 'Joseph W. Summerhays',
  'J. G. Duffin': 'James G. Duffin',
  'J. C. Bentley': 'Joseph C. Bentley',
  'E. Frank Birch': 'E. Franklin Birch',
  'Jos. S. Geddes': 'Joseph S. Geddes',
  'S. R. Bennion': 'Samuel O. Bennion',
  'Fred Tadje': 'Fred J. Tadje',
  'Lars Oveson': 'Lars P. Oveson',
  'W. C. Parkinson': 'William C. Parkinson',
  'Heber Meeks': 'Heber J. Meeks',
  'Benjamin Goddard': 'Benjamin F. Goddard',
  'Arthur Horsley': 'Arthur W. Horsley',
  'Arthur Iv. Horsley': 'Arthur W. Horsley',
  'Wm. H. Mendenhall': 'William H. Mendenhall',
  'Wm, H. Mendenhall': 'William H. Mendenhall',
  'Wm. H. Seegmiller': 'William H. Seegmiller',
  'Wm. W. Seegmiller': 'William W. Seegmiller',
  'W. W. Seegmiller': 'William W. Seegmiller',
  'Wm. H. Smart': 'William H. Smart',
  'William H Smart': 'William H. Smart',
  'William. H. Smart': 'William H. Smart',
  'Wm. R. Sloan': 'William R. Sloan',
  'William A- Hyde': 'William A. Hyde',
  'George. S. Romney': 'George S. Romney',
  'Josepei Quinney': 'Joseph Quinney',
  "Joseph'Quinney, Jr": 'Joseph Quinney, Jr',
  'Abel John Evans': 'Abel J. Evans',
  'L. W. Shurtliff': 'Louis W. Shurtliff',
  'H. W. Valentine': 'Hyrum W. Valentine',
  'Helio da Rocha Camargo': 'Helio R. Camargo',
  'Arnold H. Schulthess': 'Arnold Schulthess',
  'A. H. Schulthess': 'Arnold Schulthess',
  'C. Elder C. N. Lund': 'Christian N. Lund',
  'Joseph F. Smith, Jr': 'Joseph Fielding Smith',
  'Joseph E. Smith, Jr': 'Joseph Fielding Smith',
  'B. F. Johnson': 'Benjamin F. Johnson',
  'Ezra T. Benson': 'Ezra Taft Benson',
  'E. H. Snow': 'Edward H. Snow',
  'C. Iv. Sorenson': 'C. W. Sorenson',
  'Wilford Iv. Richards': 'Wilford W. Richards',
  'Thomas X . Taylor': 'Thomas N. Taylor',
  'Orville L. Thompson': 'Orvil L. Thompson',
};

export { SPEAKER_ALIASES };

function normalizeSpeaker(name: string): string {
  // Strip "Bishop " and "Presented " prefixes — these are callings/roles, not part of the name
  if (name.startsWith('Bishop ')) {
    name = name.slice(7);
  }
  if (name.startsWith('Presented ')) {
    name = name.slice(10);
  }
  return SPEAKER_ALIASES[name] || name;
}

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
          speaker: normalizeSpeaker((row.speaker || '').replace(/\u00a0/g, ' ').trim().replace(/^By\s+/i, '')),
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

/**
 * Load lightweight talk index (no full text) — fast, ~7MB total.
 * Use this for pages that only need metadata (speakers, years, callings, topics, etc.)
 */
export async function loadTalks(): Promise<Talk[]> {
  if (cachedTalks) {
    return cachedTalks;
  }

  const [modernRes, historicalRes] = await Promise.all([
    fetch('/conference_talks_cleaned_index.csv'),
    fetch('/historical_talks_index.csv'),
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

/**
 * Load full talks with text — heavy, ~104MB total.
 * Only use this for pages that need the actual talk body (search, reading, scripture counting).
 */
export async function loadFullTalks(): Promise<Talk[]> {
  if (cachedFullTalks) {
    return cachedFullTalks;
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

  cachedFullTalks = [...historicalTalks, ...modernTalks];
  return cachedFullTalks;
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

export function getEraForYear(year: number, season?: string): string {
  const seasonOrder = (s?: string) => s === 'October' ? 1 : 0;
  const era = ERAS.find(e => {
    const afterStart = year > e.start || (year === e.start && seasonOrder(season) >= seasonOrder(e.startSeason));
    const beforeEnd = e.end === null || year < e.end || (year === e.end && seasonOrder(season) <= seasonOrder(e.endSeason));
    return afterStart && beforeEnd;
  });
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
  const sOrd = (s?: string) => s === 'October' ? 1 : 0;
  return talks.filter(t => {
    const afterStart = t.year > era.start || (t.year === era.start && sOrd(t.season) >= sOrd(era.startSeason));
    const beforeEnd = era.end === null || t.year < era.end || (t.year === era.end && sOrd(t.season) <= sOrd(era.endSeason));
    return afterStart && beforeEnd;
  });
}

export function getTalksByYearRange(talks: Talk[], startYear: number, endYear: number): Talk[] {
  return talks.filter(t => t.year >= startYear && t.year <= endYear);
}
