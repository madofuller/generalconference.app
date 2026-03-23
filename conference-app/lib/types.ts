export type DataEra = 'modern' | 'historical' | 'all';

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
  source: 'modern' | 'historical';
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
  startSeason?: 'April' | 'October';
  endSeason?: 'April' | 'October';
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
  { name: 'Oaks', start: 2025, end: null, president: 'Dallin H. Oaks', startSeason: 'October' },
  { name: 'Nelson', start: 2018, end: 2025, president: 'Russell M. Nelson', endSeason: 'April' },
  { name: 'Monson', start: 2008, end: 2017, president: 'Thomas S. Monson' },
  { name: 'Hinckley', start: 1995, end: 2007, president: 'Gordon B. Hinckley' },
  { name: 'Hunter', start: 1994, end: 1994, president: 'Howard W. Hunter' },
  { name: 'Benson', start: 1986, end: 1994, president: 'Ezra Taft Benson' },
  { name: 'Kimball', start: 1974, end: 1985, president: 'Spencer W. Kimball' },
  { name: 'Lee', start: 1972, end: 1973, president: 'Harold B. Lee' },
  { name: 'Smith', start: 1971, end: 1972, president: 'Joseph Fielding Smith' },
  { name: 'McKay', start: 1951, end: 1970, president: 'David O. McKay' },
  { name: 'G. A. Smith', start: 1945, end: 1951, president: 'George Albert Smith' },
  { name: 'Grant', start: 1918, end: 1945, president: 'Heber J. Grant' },
  { name: 'J. F. Smith', start: 1901, end: 1918, president: 'Joseph F. Smith' },
  { name: 'Snow', start: 1898, end: 1901, president: 'Lorenzo Snow' },
  { name: 'Woodruff', start: 1889, end: 1898, president: 'Wilford Woodruff' },
  { name: 'Taylor', start: 1880, end: 1887, president: 'John Taylor' },
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

// Current First Presidency & Quorum of the Twelve
export const LIVING_APOSTLES = [
  'Dallin H. Oaks',
  'Henry B. Eyring',
  'D. Todd Christofferson',
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
  'Clark G. Gilbert',
  'Gérald Caussé',
];

// Living General Authority Seventies, Presiding Bishopric, and other known living speakers
export const LIVING_GENERAL_AUTHORITIES = [
  'Carl B. Cook', 'José A. Teixeira', 'Carlos A. Godoy', 'Brent H. Nielson',
  'Paul B. Pieper', 'Marcos A. Aidukaitis', 'Brian K. Taylor',
  'L. Todd Budge', 'W. Mark Bassett', 'Chad H. Webb',
  'Bonnie H. Cordon', 'Susan H. Porter', 'J. Anette Dennis',
  'Tamara W. Runia', 'Andrea Muñoz Spannaus', 'Tracy Y. Browning',
  'Emily Belle Freeman', 'Amy A. Wright', 'Kristin M. Yee',
  'Ian S. Ardern', 'Mathias Held', 'Hugo Montoya',
  'Aroldo B. Cavalcante', 'Joni L. Koch', 'Karl D. Hirst',
  'Juan Pablo Villar', 'Gregorio E. Casillas', 'Takashi Wada',
  'Alan R. Walker', 'Steven R. Bangerter', 'Rubén V. Alliaud',
  'Kevin W. Pearson', 'Adrián Ochoa', 'Hugo E. Martinez',
  'Arnulfo Valenzuela', 'Edward Dube', 'Chi Hong (Sam) Wong',
  'Weatherford T. Clayton', 'Taylor G. Godoy', 'David L. Buckner',
  'Mark A. Bragg', 'Vern P. Stanfill', 'S. Mark Palmer',
  'Ahmad S. Corbitt', 'Kevin S. Hamilton',
  'Kyle S. McKay', 'Jack N. Gerard', 'Brook P. Hales',
  'David P. Homer', 'Matthew L. Carpenter',
];

// Combined set for quick lookup
export const LIVING_SPEAKERS = new Set([
  ...LIVING_APOSTLES,
  ...LIVING_GENERAL_AUTHORITIES,
]);

// Backwards compatibility alias
export const LIVING_PROPHETS = LIVING_APOSTLES;

