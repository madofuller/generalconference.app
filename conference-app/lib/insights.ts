let cachedInsights: Insights | null = null;

export interface ChristTrackerData {
  title: string;
  subtitle: string;
  headline: string;
  byYear: { year: number; avgMentions: number; totalMentions: number; talkCount: number }[];
  byDecade: { decade: string; avgMentions: number }[];
}

export interface PhraseData {
  phrase: string;
  byDecade: { decade: string; count: number; pct: number }[];
  earlyCount: number;
  lateCount: number;
  trend: 'rising' | 'falling' | 'stable';
}

export interface LanguageEvolutionData {
  title: string;
  subtitle: string;
  headline: string;
  phrases: PhraseData[];
}

export interface SpeakerStat {
  speaker: string;
  talks: number;
  conferences: number;
  firstYear: number;
  lastYear: number;
  span: number;
  avgLength: number;
  calling: string;
}

export interface SpeakerLeaderboardData {
  title: string;
  subtitle: string;
  headline: string;
  speakers: SpeakerStat[];
}

export interface TalkLengthData {
  title: string;
  subtitle: string;
  headline: string;
  byYear: { year: number; avgLength: number; avgWords: number; talkCount: number; totalSpeakers: number }[];
  byDecade: { decade: string; avgWords: number; avgMinutes: number; talkCount: number }[];
}

export interface WomensVoicesData {
  title: string;
  subtitle: string;
  headline: string;
  byDecade: { decade: string; talks: number; speakers: number; pctOfTotal: number }[];
  byYear: { year: number; talks: number; pctOfTotal: number }[];
  topSpeakers: { speaker: string; talks: number; firstYear: number; lastYear: number; calling: string }[];
}

export interface ScriptureData {
  title: string;
  subtitle: string;
  headline: string;
  topReferences: { reference: string; count: number }[];
  byVolume: { volume: string; references: number }[];
}

export interface NewVoicesData {
  title: string;
  subtitle: string;
  headline: string;
  byDecade: { decade: string; newSpeakers: number; totalSpeakers: number; totalTalks: number }[];
}

export interface ProphetEra {
  prophet: string;
  startYear: number;
  endYear: number;
  totalTalks: number;
  uniqueSpeakers: number;
  avgWordsPerTalk: number;
  christMentionsPerTalk: number;
  topWords: string[];
}

export interface ProphetErasData {
  title: string;
  subtitle: string;
  headline: string;
  eras: ProphetEra[];
}

export interface VocabSpeaker {
  speaker: string;
  talks: number;
  uniqueWords: number;
  totalVocabulary: number;
  totalWordsSpoken: number;
  sampleUniqueWords: string[];
}

export interface VocabularyData {
  title: string;
  subtitle: string;
  headline: string;
  speakers: VocabSpeaker[];
}

export interface OverviewData {
  totalTalks: number;
  uniqueSpeakers: number;
  yearRange: [number, number];
  totalConferences: number;
  totalWords: number;
}

// === NEW V2 TYPES ===

export interface ApostleProfile {
  name: string;
  calling: string;
  group: string;
  ordained_apostle: number;
  slug: string;
  totalTalks: number;
  firstTalk?: number;
  lastTalk?: number;
  totalConferences?: number;
  avgWordsPerTalk?: number;
  avgChristMentions?: number;
  topWords?: string[];
  signaturePhrases?: { phrase: string; count: number; ratio: number }[];
  topScriptures?: { ref: string; count: number }[];
  christByYear?: { year: number; season: string; mentions: number }[];
  lengthTrend?: { period: string; avgWords: number }[];
  talks?: { title: string; year: number; season: string; wordCount: number }[];
  yearsActive?: number[];
}

export interface RosterEntry {
  name: string;
  calling: string;
  group: string;
  slug: string;
  totalTalks: number;
  lastTalkYear: number;
  lastTalkSeason: string;
  confsSinceLastTalk: number;
  recentTalks: number;
}

export interface AprilVsOctoberData {
  title: string;
  subtitle: string;
  april: { totalTalks: number; avgWords: number; avgChristMentions: number; uniqueSpeakers: number };
  october: { totalTalks: number; avgWords: number; avgChristMentions: number; uniqueSpeakers: number };
  byYear: { year: number; aprilTalks: number; octoberTalks: number; aprilAvgWords: number; octoberAvgWords: number }[];
}

export interface TalkOpeningsData {
  title: string;
  subtitle: string;
  byDecade: Record<string, unknown>[];
  samples: { opening: string; speaker: string; year: number; title: string; type: string }[];
}

export interface ScriptureHabitsData {
  title: string;
  subtitle: string;
  speakers: {
    speaker: string; talks: number;
    bookOfMormon: number; doctrineCovenants: number; newTestament: number; oldTestament: number;
    total: number; bomPct: number; dcPct: number; ntPct: number; otPct: number;
  }[];
}

export interface TopicPairsData {
  title: string;
  subtitle: string;
  pairs: { topic1: string; topic2: string; count: number }[];
}

export interface SpeakerSimilarityData {
  title: string;
  subtitle: string;
  pairs: { speaker1: string; speaker2: string; similarity: number }[];
}

export interface ConferenceHistoryData {
  title: string;
  subtitle: string;
  events: { year: number; event: string; keywords: string[]; talkCount: number; keywordMentions: number; avgKeywordMentions: number }[];
}

export interface ServiceTimelinesData {
  title: string;
  subtitle: string;
  speakers: { speaker: string; firstYear: number; lastYear: number; span: number; talks: number; conferences: number }[];
}

export interface Insights {
  christTracker: ChristTrackerData;
  languageEvolution: LanguageEvolutionData;
  speakerLeaderboard: SpeakerLeaderboardData;
  talkLength: TalkLengthData;
  womensVoices: WomensVoicesData;
  scriptures: ScriptureData;
  newVoices: NewVoicesData;
  prophetEras: ProphetErasData;
  vocabulary: VocabularyData;
  overview: OverviewData;
  apostleProfiles?: ApostleProfile[];
  seventyProfiles?: SeventyProfile[];
  roster?: RosterEntry[];
  aprilVsOctober?: AprilVsOctoberData;
  talkOpenings?: TalkOpeningsData;
  scriptureHabits?: ScriptureHabitsData;
  topicPairs?: TopicPairsData;
  speakerSimilarity?: SpeakerSimilarityData;
  conferenceHistory?: ConferenceHistoryData;
  serviceTimelines?: ServiceTimelinesData;
  careerProgressions?: CareerProgressionsData;
}

export interface SeventyProfile {
  name: string;
  seventyCalling: string;
  latestCalling: string;
  slug: string;
  totalTalks: number;
  firstTalk?: number;
  lastTalk?: number;
  totalConferences?: number;
  avgWordsPerTalk?: number;
  avgChristMentions?: number;
  topWords?: string[];
  signaturePhrases?: { phrase: string; count: number; ratio: number }[];
  topScriptures?: { ref: string; count: number }[];
  christByYear?: { year: number; season: string; mentions: number }[];
  lengthTrend?: { period: string; avgWords: number }[];
  talks?: { title: string; year: number; season: string; wordCount: number; calling: string; url: string }[];
  yearsActive?: number[];
}

export interface CareerMilestone {
  year: number;
  season: string;
  calling: string;
}

export interface CareerProgression {
  speaker: string;
  totalTalks: number;
  totalCallings: number;
  firstYear: number;
  lastYear: number;
  currentCalling: string;
  milestones: CareerMilestone[];
}

export interface CareerProgressionsData {
  title: string;
  subtitle: string;
  headline: string;
  speakers: CareerProgression[];
}

export async function loadInsights(): Promise<Insights> {
  if (cachedInsights) return cachedInsights;
  const res = await fetch('/insights.json');
  cachedInsights = await res.json();
  return cachedInsights!;
}
