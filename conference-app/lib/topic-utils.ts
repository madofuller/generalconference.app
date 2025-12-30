import { Talk, TopicStats } from './types';

export function parseTalkTopics(talk: Talk): string[] {
  if (!talk.topics) return [];
  try {
    return JSON.parse(talk.topics);
  } catch {
    return [];
  }
}

export function parseTalkScores(talk: Talk): number[] {
  if (!talk.topic_scores) return [];
  try {
    return JSON.parse(talk.topic_scores);
  } catch {
    return [];
  }
}

export function getAllTopics(talks: Talk[]): string[] {
  const topicSet = new Set<string>();
  talks.forEach(talk => {
    if (talk.primary_topic) {
      topicSet.add(talk.primary_topic);
    }
  });
  return Array.from(topicSet).sort();
}

export function getTopicStats(talks: Talk[], topic: string): TopicStats {
  const matchingTalks = talks.filter(t => {
    const topics = parseTalkTopics(t);
    return topics.includes(topic) || t.primary_topic === topic;
  });

  const totalScore = matchingTalks.reduce((sum, talk) => {
    return sum + (talk.primary_topic === topic ? (talk.primary_topic_score || 0) : 0);
  }, 0);

  return {
    topic,
    count: matchingTalks.length,
    percentage: (matchingTalks.length / talks.length) * 100,
    avgScore: matchingTalks.length > 0 ? totalScore / matchingTalks.length : 0
  };
}

export function getTopicTrends(talks: Talk[], topic: string): { year: number; count: number }[] {
  const yearCounts = new Map<number, number>();
  
  talks.forEach(talk => {
    const topics = parseTalkTopics(talk);
    if (topics.includes(topic) || talk.primary_topic === topic) {
      yearCounts.set(talk.year, (yearCounts.get(talk.year) || 0) + 1);
    }
  });

  return Array.from(yearCounts.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year);
}

export function getTopicsByEra(talks: Talk[], era: string): TopicStats[] {
  // This would filter by era first, then calculate stats
  const topicCounts = new Map<string, { count: number; totalScore: number }>();
  
  talks.forEach(talk => {
    if (talk.primary_topic) {
      const current = topicCounts.get(talk.primary_topic) || { count: 0, totalScore: 0 };
      topicCounts.set(talk.primary_topic, {
        count: current.count + 1,
        totalScore: current.totalScore + (talk.primary_topic_score || 0)
      });
    }
  });

  return Array.from(topicCounts.entries())
    .map(([topic, data]) => ({
      topic,
      count: data.count,
      percentage: (data.count / talks.length) * 100,
      avgScore: data.count > 0 ? data.totalScore / data.count : 0
    }))
    .sort((a, b) => b.count - a.count);
}

export function getTalksByTopic(talks: Talk[], topic: string): Talk[] {
  return talks.filter(talk => {
    const topics = parseTalkTopics(talk);
    return topics.includes(topic) || talk.primary_topic === topic;
  });
}

export function getRelatedTopics(talks: Talk[], topic: string, limit: number = 5): { topic: string; frequency: number }[] {
  const relatedCounts = new Map<string, number>();
  
  talks.forEach(talk => {
    const topics = parseTalkTopics(talk);
    if (topics.includes(topic) || talk.primary_topic === topic) {
      // Count other topics that appear with this topic
      topics.forEach(t => {
        if (t !== topic) {
          relatedCounts.set(t, (relatedCounts.get(t) || 0) + 1);
        }
      });
    }
  });

  return Array.from(relatedCounts.entries())
    .map(([topic, frequency]) => ({ topic, frequency }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, limit);
}

export function getTopicComparison(talks: Talk[], topics: string[]): { 
  topic: string; 
  yearData: { year: number; count: number }[] 
}[] {
  return topics.map(topic => ({
    topic,
    yearData: getTopicTrends(talks, topic)
  }));
}

// Group topics by category for better organization
export const TOPIC_CATEGORIES = {
  'Restoration': [
    'The Restoration of the Gospel through Joseph Smith',
    'The Great Apostasy',
    'The Book of Mormon is the word of God',
    'The priesthood authority has been restored',
    'Church history and heritage'
  ],
  'Plan of Salvation': [
    'The Plan of Salvation',
    'Pre-mortal life and our divine nature',
    'The Creation and purpose of life',
    'Agency and accountability',
    'The Fall of Adam and Eve',
    'The kingdoms of glory',
    'Exaltation and eternal families'
  ],
  'Jesus Christ & Atonement': [
    'Jesus Christ is central to the Gospel',
    'The Atonement of Jesus Christ',
    'Following Jesus Christ',
    'Faith in Jesus Christ',
    'Physical death and resurrection',
    'Spiritual death and salvation'
  ],
  'Gospel Principles': [
    'Faith and testimony',
    'Repentance and forgiveness',
    'Baptism by immersion',
    'The gift of the Holy Ghost',
    'Enduring to the end',
    'Hope and optimism',
    'Love and compassion',
    'Gratitude and thanksgiving'
  ],
  'Commandments': [
    'Obedience to God\'s commandments',
    'Chastity and fidelity in marriage',
    'The law of tithing',
    'Keeping the Sabbath day holy',
    'The Word of Wisdom',
    'Honesty and integrity'
  ],
  'Family': [
    'The Gospel blesses families and individuals',
    'Marriage and family relationships',
    'Parenting and raising children',
    'Youth and rising generation',
    'Exaltation and eternal families'
  ],
  'Ordinances & Temple': [
    'Baptism and confirmation',
    'The sacrament',
    'Temple ordinances and covenants',
    'Temples and temple work',
    'Covenants and ordinances',
    'Family history and genealogy'
  ],
  'Church & Kingdom': [
    'The organization of the Church',
    'Priesthood and priesthood keys',
    'Prophets and revelation',
    'Unity and fellowship',
    'Missionary work',
    'Service and charity'
  ],
  'Personal Development': [
    'Scripture study',
    'Prayer and personal revelation',
    'Education and learning',
    'Work and self-reliance',
    'Repentance and redemption'
  ],
  'Latter Days': [
    'The Second Coming of Jesus Christ',
    'The spirit world and missionary work',
    'Heavenly Father reveals His Gospel in every dispensation'
  ],
  'Deity': [
    'God is our loving Heavenly Father',
    'Jesus Christ is central to the Gospel',
    'The gift of the Holy Ghost'
  ]
};

export function getTopicCategory(topic: string): string {
  for (const [category, topics] of Object.entries(TOPIC_CATEGORIES)) {
    if (topics.includes(topic)) {
      return category;
    }
  }
  return 'Other';
}



