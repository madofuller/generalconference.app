import { Talk } from './types';

export const EMOTION_LABELS = [
  'admiration', 'amusement', 'anger', 'annoyance', 'approval', 'caring',
  'confusion', 'curiosity', 'desire', 'disappointment', 'disapproval',
  'disgust', 'embarrassment', 'excitement', 'fear', 'gratitude', 'grief',
  'joy', 'love', 'nervousness', 'optimism', 'pride', 'realization',
  'relief', 'remorse', 'sadness', 'surprise', 'neutral'
] as const;

export type EmotionLabel = typeof EMOTION_LABELS[number];

// Group emotions by category for better UX
export const EMOTION_CATEGORIES = {
  'Positive': ['admiration', 'amusement', 'approval', 'caring', 'excitement', 'gratitude', 'joy', 'love', 'optimism', 'pride', 'relief'],
  'Negative': ['anger', 'annoyance', 'disappointment', 'disapproval', 'disgust', 'embarrassment', 'fear', 'grief', 'nervousness', 'remorse', 'sadness'],
  'Cognitive': ['confusion', 'curiosity', 'realization', 'surprise'],
  'Desire & Motivation': ['desire', 'optimism'],
  'Neutral': ['neutral']
};

// Emotion colors for visualization
export const EMOTION_COLORS: Record<string, string> = {
  'admiration': '#8B5CF6',
  'amusement': '#F59E0B',
  'anger': '#EF4444',
  'annoyance': '#F97316',
  'approval': '#10B981',
  'caring': '#EC4899',
  'confusion': '#8B5CF6',
  'curiosity': '#3B82F6',
  'desire': '#EF4444',
  'disappointment': '#6B7280',
  'disapproval': '#DC2626',
  'disgust': '#7C2D12',
  'embarrassment': '#FCA5A5',
  'excitement': '#FBBF24',
  'fear': '#4B5563',
  'gratitude': '#10B981',
  'grief': '#374151',
  'joy': '#FBBF24',
  'love': '#EC4899',
  'nervousness': '#9CA3AF',
  'optimism': '#84CC16',
  'pride': '#A855F7',
  'realization': '#6366F1',
  'relief': '#86EFAC',
  'remorse': '#B91C1C',
  'sadness': '#1F2937',
  'surprise': '#F472B6',
  'neutral': '#9CA3AF'
};

export function parseTalkEmotions(talk: Talk): string[] {
  if (!talk.emotions) return [];
  try {
    return JSON.parse(talk.emotions);
  } catch {
    return [];
  }
}

export function parseTalkEmotionScores(talk: Talk): number[] {
  if (!talk.emotion_scores) return [];
  try {
    return JSON.parse(talk.emotion_scores);
  } catch {
    return [];
  }
}

export function parseAllEmotionScores(talk: Talk): Record<string, number> {
  if (!talk.all_emotion_scores) return {};
  try {
    return JSON.parse(talk.all_emotion_scores);
  } catch {
    return {};
  }
}

export function getAllEmotions(talks: Talk[]): string[] {
  const emotionSet = new Set<string>();
  talks.forEach(talk => {
    if (talk.primary_emotion) {
      emotionSet.add(talk.primary_emotion);
    }
  });
  return Array.from(emotionSet).sort();
}

export function getEmotionStats(talks: Talk[], emotion: string) {
  const matchingTalks = talks.filter(t => {
    const emotions = parseTalkEmotions(t);
    return emotions.includes(emotion) || t.primary_emotion === emotion;
  });

  const totalScore = matchingTalks.reduce((sum, talk) => {
    return sum + (talk.primary_emotion === emotion ? (talk.primary_emotion_score || 0) : 0);
  }, 0);

  return {
    emotion,
    count: matchingTalks.length,
    percentage: (matchingTalks.length / talks.length) * 100,
    avgScore: matchingTalks.length > 0 ? totalScore / matchingTalks.length : 0
  };
}

export function getEmotionTrends(talks: Talk[], emotion: string): { year: number; count: number }[] {
  const yearCounts = new Map<number, number>();
  
  talks.forEach(talk => {
    const emotions = parseTalkEmotions(talk);
    if (emotions.includes(emotion) || talk.primary_emotion === emotion) {
      yearCounts.set(talk.year, (yearCounts.get(talk.year) || 0) + 1);
    }
  });

  return Array.from(yearCounts.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year);
}

export function getTalksByEmotion(talks: Talk[], emotion: string): Talk[] {
  return talks.filter(talk => {
    const emotions = parseTalkEmotions(talk);
    return emotions.includes(emotion) || talk.primary_emotion === emotion;
  });
}

export function getRelatedEmotions(talks: Talk[], emotion: string, limit: number = 5): { emotion: string; frequency: number }[] {
  const relatedCounts = new Map<string, number>();
  
  talks.forEach(talk => {
    const emotions = parseTalkEmotions(talk);
    if (emotions.includes(emotion) || talk.primary_emotion === emotion) {
      // Count other emotions that appear with this emotion
      emotions.forEach(e => {
        if (e !== emotion) {
          relatedCounts.set(e, (relatedCounts.get(e) || 0) + 1);
        }
      });
    }
  });

  return Array.from(relatedCounts.entries())
    .map(([emotion, frequency]) => ({ emotion, frequency }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, limit);
}

export function getEmotionCategory(emotion: string): string {
  for (const [category, emotions] of Object.entries(EMOTION_CATEGORIES)) {
    if (emotions.includes(emotion as any)) {
      return category;
    }
  }
  return 'Other';
}

// Calculate emotion diversity score (how many different emotions appear in talks)
export function getEmotionDiversity(talks: Talk[]): number {
  const allEmotions = new Set<string>();
  talks.forEach(talk => {
    const emotions = parseTalkEmotions(talk);
    emotions.forEach(e => allEmotions.add(e));
  });
  return allEmotions.size;
}

// Get dominant emotion category for a set of talks
export function getDominantEmotionCategory(talks: Talk[]): string {
  const categoryCounts = new Map<string, number>();
  
  talks.forEach(talk => {
    if (talk.primary_emotion) {
      const category = getEmotionCategory(talk.primary_emotion);
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    }
  });

  let maxCategory = 'Neutral';
  let maxCount = 0;
  categoryCounts.forEach((count, category) => {
    if (count > maxCount) {
      maxCount = count;
      maxCategory = category;
    }
  });

  return maxCategory;
}

