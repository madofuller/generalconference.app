import { Talk } from './types';

export interface TriviaQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuoteMatchQuestion {
  quote: string;
  speaker: string;
  options: string[];
  correctIndex: number;
  talkTitle: string;
  year: number;
}

export interface BingoItem {
  text: string;
  category: 'phrase' | 'topic' | 'speaker' | 'event';
  marked: boolean;
}

export interface BingoCard {
  items: BingoItem[][];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

function extractSentences(text: string): string[] {
  if (!text) return [];
  return text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 40 && s.length < 200);
}

// === TRIVIA ===

function generateSpeakerQuestion(talks: Talk[]): TriviaQuestion | null {
  const validTalks = talks.filter(t => t.title && t.speaker && t.title !== 'No Title Found');
  if (validTalks.length < 4) return null;

  const talk = validTalks[Math.floor(Math.random() * validTalks.length)];
  const otherSpeakers = [...new Set(validTalks.filter(t => t.speaker !== talk.speaker).map(t => t.speaker))];
  if (otherSpeakers.length < 3) return null;

  const wrongAnswers = pickRandom(otherSpeakers, 3);
  const options = shuffle([talk.speaker, ...wrongAnswers]);

  return {
    question: `Who gave the talk titled "${talk.title}"?`,
    options,
    correctIndex: options.indexOf(talk.speaker),
    category: 'Speakers',
    difficulty: 'medium',
  };
}

function generateYearQuestion(talks: Talk[]): TriviaQuestion | null {
  const validTalks = talks.filter(t => t.title && t.year && t.speaker);
  if (validTalks.length < 4) return null;

  const talk = validTalks[Math.floor(Math.random() * validTalks.length)];
  const allYears = [...new Set(validTalks.map(t => t.year))];
  const otherYears = allYears.filter(y => y !== talk.year);
  if (otherYears.length < 3) return null;

  const wrongYears = pickRandom(otherYears, 3).map(String);
  const options = shuffle([String(talk.year), ...wrongYears]);

  return {
    question: `In what year did ${talk.speaker} give the talk "${talk.title}"?`,
    options,
    correctIndex: options.indexOf(String(talk.year)),
    category: 'Dates',
    difficulty: 'hard',
  };
}

function generateTopicQuestion(talks: Talk[]): TriviaQuestion | null {
  const talksWithTopics = talks.filter(t => t.primary_topic);
  if (talksWithTopics.length < 10) return null;

  // Pick a conference
  const conferences = [...new Set(talksWithTopics.map(t => `${t.season} ${t.year}`))];
  const conf = conferences[Math.floor(Math.random() * conferences.length)];
  const [season, yearStr] = conf.split(' ');
  const confTalks = talksWithTopics.filter(t => t.season === season && t.year === Number(yearStr));

  // Count topics in this conference
  const topicCounts = new Map<string, number>();
  confTalks.forEach(t => {
    if (t.primary_topic) topicCounts.set(t.primary_topic, (topicCounts.get(t.primary_topic) || 0) + 1);
  });

  const sorted = Array.from(topicCounts.entries()).sort((a, b) => b[1] - a[1]);
  if (sorted.length < 4) return null;

  const correct = sorted[0][0];
  const wrong = sorted.slice(1).map(s => s[0]);
  const wrongAnswers = pickRandom(wrong, 3);
  const options = shuffle([correct, ...wrongAnswers]);

  return {
    question: `What was the most discussed topic in ${conf}?`,
    options,
    correctIndex: options.indexOf(correct),
    category: 'Topics',
    difficulty: 'hard',
  };
}

function generateQuoteQuestion(talks: Talk[]): TriviaQuestion | null {
  const validTalks = talks.filter(t => t.talk && t.speaker && t.talk.length > 200);
  if (validTalks.length < 4) return null;

  const talk = validTalks[Math.floor(Math.random() * validTalks.length)];
  const sentences = extractSentences(talk.talk);
  if (sentences.length === 0) return null;

  const quote = sentences[Math.floor(Math.random() * sentences.length)];
  const otherSpeakers = [...new Set(validTalks.filter(t => t.speaker !== talk.speaker).map(t => t.speaker))];
  if (otherSpeakers.length < 3) return null;

  const wrongAnswers = pickRandom(otherSpeakers, 3);
  const options = shuffle([talk.speaker, ...wrongAnswers]);

  return {
    question: `Who said: "${quote.substring(0, 120)}..."?`,
    options,
    correctIndex: options.indexOf(talk.speaker),
    category: 'Quotes',
    difficulty: 'hard',
  };
}

const QUESTION_GENERATORS = [
  generateSpeakerQuestion,
  generateYearQuestion,
  generateTopicQuestion,
  generateQuoteQuestion,
];

export function generateTriviaQuestions(talks: Talk[], count: number = 10, category?: string): TriviaQuestion[] {
  const questions: TriviaQuestion[] = [];
  let attempts = 0;
  const maxAttempts = count * 10;

  while (questions.length < count && attempts < maxAttempts) {
    attempts++;
    let generators = QUESTION_GENERATORS;
    if (category === 'Speakers') generators = [generateSpeakerQuestion];
    else if (category === 'Dates') generators = [generateYearQuestion];
    else if (category === 'Topics') generators = [generateTopicQuestion];
    else if (category === 'Quotes') generators = [generateQuoteQuestion];

    const gen = generators[Math.floor(Math.random() * generators.length)];
    const q = gen(talks);
    if (q) questions.push(q);
  }

  return questions;
}

// === QUOTE MATCH ===

export function generateQuoteMatchQuestions(talks: Talk[], count: number = 10, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): QuoteMatchQuestion[] {
  const validTalks = talks.filter(t => t.talk && t.speaker && t.talk.length > 200 && t.title);
  if (validTalks.length < 4) return [];

  const questions: QuoteMatchQuestion[] = [];
  let attempts = 0;

  while (questions.length < count && attempts < count * 10) {
    attempts++;
    const talk = validTalks[Math.floor(Math.random() * validTalks.length)];
    const sentences = extractSentences(talk.talk);
    if (sentences.length === 0) continue;

    const quote = sentences[Math.floor(Math.random() * sentences.length)];

    let pool: Talk[];
    if (difficulty === 'easy') {
      pool = validTalks.filter(t => t.speaker !== talk.speaker && t.calling !== talk.calling);
    } else if (difficulty === 'medium') {
      pool = validTalks.filter(t => t.speaker !== talk.speaker);
    } else {
      // Hard: same era speakers
      pool = validTalks.filter(t => t.speaker !== talk.speaker && Math.abs(t.year - talk.year) <= 10);
    }

    const otherSpeakers = [...new Set(pool.map(t => t.speaker))];
    if (otherSpeakers.length < 3) continue;

    const wrong = pickRandom(otherSpeakers, 3);
    const options = shuffle([talk.speaker, ...wrong]);

    questions.push({
      quote: quote.substring(0, 200),
      speaker: talk.speaker,
      options,
      correctIndex: options.indexOf(talk.speaker),
      talkTitle: talk.title,
      year: talk.year,
    });
  }

  return questions;
}

// === BINGO ===

const COMMON_PHRASES = [
  'tender mercies', 'covenant path', 'plan of salvation', 'fullness of the gospel',
  'book of mormon', 'holy ghost', 'heavenly father', 'jesus christ',
  'temple', 'eternal life', 'sacrament', 'priesthood', 'testimony',
  'faith', 'repentance', 'baptism', 'holy spirit', 'prophet',
  'atonement', 'scriptures', 'prayer', 'revelation', 'commandments',
  'charity', 'hope', 'agency', 'resurrection', 'tithing',
  'family', 'service', 'missionary', 'endure to the end', 'celestial kingdom',
  'obedience', 'gratitude', 'sabbath day', 'word of wisdom', 'second coming',
];

const BINGO_EVENTS = [
  'New temple announced', 'Story about a child', 'Reference to hymn',
  'Personal family story', 'Quote from previous prophet', 'Mention of current events',
  'Story from scriptures', 'Statistics cited', 'Humor/laughter from audience',
  'Reference to pioneer history', 'Talk about youth', 'Mention of technology',
];

export function generateBingoCard(talks: Talk[]): BingoCard {
  const items: BingoItem[] = [];

  // Get top speakers likely to speak
  const recentTalks = talks.filter(t => t.year >= 2020);
  const recentSpeakers = [...new Set(recentTalks.map(t => t.speaker))];
  const speakerItems = pickRandom(recentSpeakers, 6).map(s => ({
    text: s, category: 'speaker' as const, marked: false,
  }));

  // Get phrases
  const phraseItems = pickRandom(COMMON_PHRASES, 8).map(p => ({
    text: `"${p}"`, category: 'phrase' as const, marked: false,
  }));

  // Get topics
  const topicSet = [...new Set(talks.filter(t => t.primary_topic).map(t => t.primary_topic!))];
  const topicItems = pickRandom(topicSet, 5).map(t => ({
    text: t, category: 'topic' as const, marked: false,
  }));

  // Get events
  const eventItems = pickRandom(BINGO_EVENTS, 5).map(e => ({
    text: e, category: 'event' as const, marked: false,
  }));

  items.push(...speakerItems, ...phraseItems, ...topicItems, ...eventItems);

  // Shuffle and place into 5x5 grid
  const shuffled = shuffle(items).slice(0, 25);
  // Center square is free
  shuffled[12] = { text: 'FREE', category: 'event', marked: true };

  const grid: BingoItem[][] = [];
  for (let i = 0; i < 5; i++) {
    grid.push(shuffled.slice(i * 5, (i + 1) * 5));
  }

  return { items: grid };
}

export function checkBingoWin(card: BingoCard): boolean {
  const items = card.items;
  // Check rows
  for (let r = 0; r < 5; r++) {
    if (items[r].every(item => item.marked)) return true;
  }
  // Check columns
  for (let c = 0; c < 5; c++) {
    if (items.every(row => row[c].marked)) return true;
  }
  // Check diagonals
  if ([0, 1, 2, 3, 4].every(i => items[i][i].marked)) return true;
  if ([0, 1, 2, 3, 4].every(i => items[i][4 - i].marked)) return true;

  return false;
}

// === SCORE MANAGEMENT (localStorage) ===

export interface GameScore {
  gameType: string;
  score: number;
  date: string;
  details?: string;
}

export function saveScore(score: GameScore): void {
  const key = `gc_scores_${score.gameType}`;
  const existing = JSON.parse(localStorage.getItem(key) || '[]') as GameScore[];
  existing.push(score);
  existing.sort((a, b) => b.score - a.score);
  localStorage.setItem(key, JSON.stringify(existing.slice(0, 20)));
}

export function getScores(gameType: string): GameScore[] {
  const key = `gc_scores_${gameType}`;
  return JSON.parse(localStorage.getItem(key) || '[]') as GameScore[];
}
