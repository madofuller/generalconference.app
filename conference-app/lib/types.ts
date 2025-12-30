export interface Talk {
  title: string;
  speaker: string;
  calling: string;
  year: number;
  season: string;
  url: string;
  talk: string;
  footnotes: string;
  calling_original: string;
  // Topic classification fields (added by NLP)
  topics?: string;  // JSON string array of topics
  topic_scores?: string;  // JSON string array of scores
  primary_topic?: string;  // Main topic
  primary_topic_score?: number;  // Confidence score
  // Emotion classification fields (added by NLP)
  emotions?: string;  // JSON string array of emotions
  emotion_scores?: string;  // JSON string array of scores
  primary_emotion?: string;  // Main emotion
  primary_emotion_score?: number;  // Confidence score
  all_emotion_scores?: string;  // JSON object with all 28 emotion scores
}

export interface TopicStats {
  topic: string;
  count: number;
  percentage: number;
  avgScore: number;
}

export interface Conference {
  season: string;
  year: number;
  label: string;
}

export interface Era {
  name: string;
  start: number;
  end: number | null;
  president: string;
}

export interface ScriptureReference {
  volume: string;
  book: string;
  chapter: number;
  verse?: number;
  verseEnd?: number;
}

export interface SearchFilters {
  type: 'none' | 'speaker' | 'conference' | 'era' | 'year';
  speakers?: string[];
  conference?: string;
  era?: string;
  yearRange?: [number, number];
}

export interface SearchResult {
  talks: Talk[];
  totalReferences: number;
  speakerStats: { speaker: string; count: number; percentage: number }[];
  conferenceStats: { conference: string; count: number }[];
  eraStats: { era: string; count: number; percentage: number }[];
  yearStats: { year: number; count: number }[];
}

export const SCRIPTURE_VOLUMES = [
  'Book of Mormon',
  'Doctrine and Covenants',
  'New Testament',
  'Old Testament',
  'Pearl of Great Price'
] as const;

export const ERAS: Era[] = [
  { name: 'Oaks', start: 2026, end: null, president: 'Dallin H. Oaks' },
  { name: 'Nelson', start: 2018, end: 2025, president: 'Russell M. Nelson' },
  { name: 'Monson', start: 2008, end: 2017, president: 'Thomas S. Monson' },
  { name: 'Hinckley', start: 1995, end: 2007, president: 'Gordon B. Hinckley' },
  { name: 'Hunter', start: 1994, end: 1994, president: 'Howard W. Hunter' },
  { name: 'Benson', start: 1986, end: 1994, president: 'Ezra Taft Benson' },
  { name: 'Kimball', start: 1974, end: 1985, president: 'Spencer W. Kimball' },
  { name: 'Lee', start: 1972, end: 1973, president: 'Harold B. Lee' },
  { name: 'Smith', start: 1971, end: 1972, president: 'Joseph Fielding Smith' },
];

export const PRESIDENTS_OF_THE_CHURCH = [
  'Dallin H. Oaks',
  'Russell M. Nelson',
  'Thomas S. Monson',
  'Gordon B. Hinckley',
  'Howard W. Hunter',
  'Ezra Taft Benson',
  'Spencer W. Kimball',
  'Harold B. Lee',
  'Joseph Fielding Smith'
];

export const LIVING_PROPHETS = [
  'Dallin H. Oaks',
  'Henry B. Eyring',
  'D. Todd Christofferson',
  'Jeffrey R. Holland',
  'Dieter F. Uchtdorf',
  'David A. Bednar',
  'Quentin L. Cook',
  'Neil L. Andersen',
  'Ronald A. Rasband',
  'Gary E. Stevenson',
  'Dale G. Renlund',
  'Gerrit W. Gong',
  'Ulisses Soares',
  'Patrick Kearon',
  'Gérald Caussé'
];

