import { Talk } from './types';

export interface TopicTrend {
  year: number;
  [topic: string]: number | string;
}

export interface SpeakerProfile {
  speaker: string;
  talkCount: number;
  yearRange: [number, number];
  topTopics: { topic: string; count: number }[];
  topEmotions: { emotion: string; count: number }[];
  avgTalkLength: number;
  talksPerYear: { year: number; count: number }[];
  topWords: { word: string; count: number }[];
}

export interface EmotionTrend {
  period: string;
  [emotion: string]: number | string;
}

export interface DecadeStats {
  decade: string;
  talkCount: number;
  uniqueSpeakers: number;
  topTopic: string;
  topEmotion: string;
  avgTalkLength: number;
}

const STOP_WORDS = new Set([
  'the', 'and', 'of', 'to', 'a', 'in', 'that', 'is', 'was', 'he', 'for', 'it', 'with',
  'as', 'his', 'on', 'be', 'at', 'by', 'i', 'this', 'had', 'not', 'are', 'but', 'from',
  'or', 'have', 'an', 'they', 'which', 'one', 'you', 'were', 'her', 'all', 'she', 'there',
  'would', 'their', 'we', 'him', 'been', 'has', 'when', 'who', 'will', 'no', 'more', 'if',
  'out', 'so', 'up', 'said', 'what', 'its', 'about', 'than', 'into', 'them', 'can', 'only',
  'other', 'new', 'some', 'could', 'time', 'these', 'two', 'may', 'then', 'do', 'first',
  'any', 'my', 'now', 'such', 'like', 'our', 'over', 'man', 'me', 'even', 'most', 'after',
  'also', 'did', 'many', 'before', 'must', 'through', 'back', 'years', 'where', 'much',
  'your', 'way', 'well', 'down', 'should', 'because', 'each', 'just', 'those', 'people',
  'how', 'too', 'little', 'very', 'when', 'come', 'us', 'know', 'shall', 'upon',
]);

export function getTopicTrends(talks: Talk[], selectedTopics: string[]): TopicTrend[] {
  const yearMap = new Map<number, Map<string, number>>();

  talks.forEach(talk => {
    if (!talk.primary_topic || !talk.year) return;
    if (!yearMap.has(talk.year)) yearMap.set(talk.year, new Map());
    const topicMap = yearMap.get(talk.year)!;
    const topic = talk.primary_topic;
    topicMap.set(topic, (topicMap.get(topic) || 0) + 1);
  });

  const years = Array.from(yearMap.keys()).sort();
  return years.map(year => {
    const topicMap = yearMap.get(year)!;
    const totalTalks = Array.from(topicMap.values()).reduce((a, b) => a + b, 0);
    const row: TopicTrend = { year };
    selectedTopics.forEach(topic => {
      row[topic] = totalTalks > 0 ? Math.round(((topicMap.get(topic) || 0) / totalTalks) * 100) : 0;
    });
    return row;
  });
}

export function getAllTopics(talks: Talk[]): { topic: string; count: number }[] {
  const topicCounts = new Map<string, number>();
  talks.forEach(talk => {
    if (!talk.primary_topic) return;
    topicCounts.set(talk.primary_topic, (topicCounts.get(talk.primary_topic) || 0) + 1);
  });
  return Array.from(topicCounts.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count);
}

export function getAllEmotions(talks: Talk[]): { emotion: string; count: number }[] {
  const emotionCounts = new Map<string, number>();
  talks.forEach(talk => {
    if (!talk.primary_emotion) return;
    emotionCounts.set(talk.primary_emotion, (emotionCounts.get(talk.primary_emotion) || 0) + 1);
  });
  return Array.from(emotionCounts.entries())
    .map(([emotion, count]) => ({ emotion, count }))
    .sort((a, b) => b.count - a.count);
}

export function getSpeakerProfile(talks: Talk[], speaker: string): SpeakerProfile {
  const speakerTalks = talks.filter(t => t.speaker === speaker);
  const years = speakerTalks.map(t => t.year).filter(Boolean);

  // Topic distribution
  const topicCounts = new Map<string, number>();
  speakerTalks.forEach(t => {
    if (t.primary_topic) topicCounts.set(t.primary_topic, (topicCounts.get(t.primary_topic) || 0) + 1);
  });
  const topTopics = Array.from(topicCounts.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Emotion distribution
  const emotionCounts = new Map<string, number>();
  speakerTalks.forEach(t => {
    if (t.primary_emotion) emotionCounts.set(t.primary_emotion, (emotionCounts.get(t.primary_emotion) || 0) + 1);
  });
  const topEmotions = Array.from(emotionCounts.entries())
    .map(([emotion, count]) => ({ emotion, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Talks per year
  const yearCounts = new Map<number, number>();
  speakerTalks.forEach(t => {
    if (t.year) yearCounts.set(t.year, (yearCounts.get(t.year) || 0) + 1);
  });
  const talksPerYear = Array.from(yearCounts.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year);

  // Average talk length
  const avgTalkLength = speakerTalks.length > 0
    ? Math.round(speakerTalks.reduce((sum, t) => sum + (t.talk?.length || 0), 0) / speakerTalks.length)
    : 0;

  // Top words
  const wordCounts = new Map<string, number>();
  speakerTalks.forEach(t => {
    if (!t.talk) return;
    const words = t.talk.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
    words.forEach(word => {
      if (word.length > 3 && !STOP_WORDS.has(word)) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    });
  });
  const topWords = Array.from(wordCounts.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  return {
    speaker,
    talkCount: speakerTalks.length,
    yearRange: [Math.min(...years), Math.max(...years)],
    topTopics,
    topEmotions,
    avgTalkLength,
    talksPerYear,
    topWords,
  };
}

export function getEmotionTrends(talks: Talk[]): EmotionTrend[] {
  const decadeMap = new Map<string, Map<string, number>>();

  talks.forEach(talk => {
    if (!talk.primary_emotion || !talk.year) return;
    const decade = `${Math.floor(talk.year / 10) * 10}s`;
    if (!decadeMap.has(decade)) decadeMap.set(decade, new Map());
    const emotionMap = decadeMap.get(decade)!;
    emotionMap.set(talk.primary_emotion, (emotionMap.get(talk.primary_emotion) || 0) + 1);
  });

  const decades = Array.from(decadeMap.keys()).sort();
  return decades.map(decade => {
    const emotionMap = decadeMap.get(decade)!;
    const total = Array.from(emotionMap.values()).reduce((a, b) => a + b, 0);
    const row: EmotionTrend = { period: decade };
    emotionMap.forEach((count, emotion) => {
      row[emotion] = total > 0 ? Math.round((count / total) * 100) : 0;
    });
    return row;
  });
}

export function getEmotionByYear(talks: Talk[]): EmotionTrend[] {
  const yearMap = new Map<number, Map<string, number>>();

  talks.forEach(talk => {
    if (!talk.primary_emotion || !talk.year) return;
    if (!yearMap.has(talk.year)) yearMap.set(talk.year, new Map());
    const emotionMap = yearMap.get(talk.year)!;
    emotionMap.set(talk.primary_emotion, (emotionMap.get(talk.primary_emotion) || 0) + 1);
  });

  const years = Array.from(yearMap.keys()).sort();
  return years.map(year => {
    const emotionMap = yearMap.get(year)!;
    const total = Array.from(emotionMap.values()).reduce((a, b) => a + b, 0);
    const row: EmotionTrend = { period: String(year) };
    emotionMap.forEach((count, emotion) => {
      row[emotion] = total > 0 ? Math.round((count / total) * 100) : 0;
    });
    return row;
  });
}

export function getDecadeStats(talks: Talk[]): DecadeStats[] {
  const decadeMap = new Map<string, Talk[]>();

  talks.forEach(talk => {
    if (!talk.year) return;
    const decade = `${Math.floor(talk.year / 10) * 10}s`;
    if (!decadeMap.has(decade)) decadeMap.set(decade, []);
    decadeMap.get(decade)!.push(talk);
  });

  return Array.from(decadeMap.entries())
    .map(([decade, dTalks]) => {
      const topicCounts = new Map<string, number>();
      const emotionCounts = new Map<string, number>();
      dTalks.forEach(t => {
        if (t.primary_topic) topicCounts.set(t.primary_topic, (topicCounts.get(t.primary_topic) || 0) + 1);
        if (t.primary_emotion) emotionCounts.set(t.primary_emotion, (emotionCounts.get(t.primary_emotion) || 0) + 1);
      });

      const topTopic = Array.from(topicCounts.entries()).sort((a, b) => b[1] - a[1])[0];
      const topEmotion = Array.from(emotionCounts.entries()).sort((a, b) => b[1] - a[1])[0];

      return {
        decade,
        talkCount: dTalks.length,
        uniqueSpeakers: new Set(dTalks.map(t => t.speaker)).size,
        topTopic: topTopic?.[0] || 'N/A',
        topEmotion: topEmotion?.[0] || 'N/A',
        avgTalkLength: Math.round(dTalks.reduce((sum, t) => sum + (t.talk?.length || 0), 0) / dTalks.length),
      };
    })
    .sort((a, b) => a.decade.localeCompare(b.decade));
}

export function getFunFacts(talks: Talk[]): string[] {
  const facts: string[] = [];

  // Longest talk
  const longestTalk = talks.reduce((max, t) => (t.talk?.length || 0) > (max.talk?.length || 0) ? t : max, talks[0]);
  if (longestTalk) {
    facts.push(`The longest talk was "${longestTalk.title}" by ${longestTalk.speaker} (${longestTalk.season} ${longestTalk.year}) at ${Math.round((longestTalk.talk?.length || 0) / 1000)}k characters.`);
  }

  // Most prolific speaker
  const speakerCounts = new Map<string, number>();
  talks.forEach(t => speakerCounts.set(t.speaker, (speakerCounts.get(t.speaker) || 0) + 1));
  const topSpeaker = Array.from(speakerCounts.entries()).sort((a, b) => b[1] - a[1])[0];
  if (topSpeaker) {
    facts.push(`${topSpeaker[0]} has given the most talks with ${topSpeaker[1]} total conference addresses.`);
  }

  // Most common topic
  const topicCounts = new Map<string, number>();
  talks.forEach(t => { if (t.primary_topic) topicCounts.set(t.primary_topic, (topicCounts.get(t.primary_topic) || 0) + 1); });
  const topTopic = Array.from(topicCounts.entries()).sort((a, b) => b[1] - a[1])[0];
  if (topTopic) {
    facts.push(`"${topTopic[0]}" is the most common primary topic, appearing in ${topTopic[1]} talks.`);
  }

  // Year with most talks
  const yearCounts = new Map<number, number>();
  talks.forEach(t => { if (t.year) yearCounts.set(t.year, (yearCounts.get(t.year) || 0) + 1); });
  const topYear = Array.from(yearCounts.entries()).sort((a, b) => b[1] - a[1])[0];
  if (topYear) {
    facts.push(`${topYear[0]} had the most talks with ${topYear[1]} addresses across both conferences.`);
  }

  return facts;
}
