import { Talk, SearchFilters, SearchResult } from './types';
import { getEraForYear, getTalksByEra, getTalksByYearRange } from './data-loader';

export function applyFilters(talks: Talk[], filters: SearchFilters): Talk[] {
  switch (filters.type) {
    case 'none':
      return talks;
    
    case 'speaker':
      if (!filters.speakers || filters.speakers.length === 0) return talks;
      return talks.filter(t => filters.speakers!.includes(t.speaker));
    
    case 'conference':
      if (!filters.conference) return talks;
      const [season, year] = filters.conference.split(' ');
      return talks.filter(t => t.season === season && t.year === Number(year));
    
    case 'era':
      if (!filters.era) return talks;
      return getTalksByEra(talks, filters.era);
    
    case 'year':
      if (!filters.yearRange) return talks;
      return getTalksByYearRange(talks, filters.yearRange[0], filters.yearRange[1]);
    
    default:
      return talks;
  }
}

export function searchByWord(
  talks: Talk[],
  anyWords: string[],
  allWords: string[],
  noneWords: string[],
  scope: 'talk_text' | 'title',
  filters: SearchFilters
): SearchResult {
  const filteredTalks = applyFilters(talks, filters);
  
  const matchingTalks = filteredTalks.filter(talk => {
    const text = scope === 'title' ? talk.title.toLowerCase() : talk.talk.toLowerCase();
    
    // Check NONE words first (exclude if any are found)
    if (noneWords.length > 0) {
      const hasNoneWord = noneWords.some(word => text.includes(word.toLowerCase()));
      if (hasNoneWord) return false;
    }
    
    // Check ALL words (must contain all)
    if (allWords.length > 0) {
      const hasAllWords = allWords.every(word => text.includes(word.toLowerCase()));
      if (!hasAllWords) return false;
    }
    
    // Check ANY words (must contain at least one)
    if (anyWords.length > 0) {
      const hasAnyWord = anyWords.some(word => text.includes(word.toLowerCase()));
      if (!hasAnyWord) return false;
    }
    
    // If we have no search criteria, exclude
    if (anyWords.length === 0 && allWords.length === 0) return false;
    
    return true;
  });
  
  return generateSearchResult(matchingTalks, talks);
}

export function searchByPhrase(
  talks: Talk[],
  phrase: string,
  scope: 'talk_text' | 'title',
  filters: SearchFilters
): SearchResult {
  const filteredTalks = applyFilters(talks, filters);
  const phraseLower = phrase.toLowerCase();
  
  const matchingTalks = filteredTalks.filter(talk => {
    const text = scope === 'title' ? talk.title.toLowerCase() : talk.talk.toLowerCase();
    return text.includes(phraseLower);
  });
  
  // Count total references
  let totalReferences = 0;
  matchingTalks.forEach(talk => {
    const text = scope === 'title' ? talk.title.toLowerCase() : talk.talk.toLowerCase();
    const count = (text.match(new RegExp(phraseLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    totalReferences += count;
  });
  
  const result = generateSearchResult(matchingTalks, talks);
  result.totalReferences = totalReferences;
  
  return result;
}

function generateSearchResult(matchingTalks: Talk[], allTalks: Talk[]): SearchResult {
  // Speaker stats
  const speakerCounts = new Map<string, number>();
  const speakerTotalTalks = new Map<string, number>();
  
  // Count all talks by each speaker
  allTalks.forEach(talk => {
    speakerTotalTalks.set(talk.speaker, (speakerTotalTalks.get(talk.speaker) || 0) + 1);
  });
  
  // Count matching talks by speaker
  matchingTalks.forEach(talk => {
    speakerCounts.set(talk.speaker, (speakerCounts.get(talk.speaker) || 0) + 1);
  });
  
  const speakerStats = Array.from(speakerCounts.entries()).map(([speaker, count]) => ({
    speaker,
    count,
    percentage: (count / (speakerTotalTalks.get(speaker) || 1)) * 100
  })).sort((a, b) => b.count - a.count);
  
  // Conference stats
  const conferenceCounts = new Map<string, number>();
  matchingTalks.forEach(talk => {
    const key = `${talk.season} ${talk.year}`;
    conferenceCounts.set(key, (conferenceCounts.get(key) || 0) + 1);
  });
  
  const conferenceStats = Array.from(conferenceCounts.entries())
    .map(([conference, count]) => ({ conference, count }))
    .sort((a, b) => b.count - a.count);
  
  // Era stats
  const eraCounts = new Map<string, { count: number; total: number }>();
  
  // Count all talks by era
  allTalks.forEach(talk => {
    const era = getEraForYear(talk.year);
    const current = eraCounts.get(era) || { count: 0, total: 0 };
    eraCounts.set(era, { ...current, total: current.total + 1 });
  });
  
  // Count matching talks by era
  matchingTalks.forEach(talk => {
    const era = getEraForYear(talk.year);
    const current = eraCounts.get(era)!;
    eraCounts.set(era, { ...current, count: current.count + 1 });
  });
  
  const eraStats = Array.from(eraCounts.entries())
    .map(([era, { count, total }]) => ({
      era,
      count,
      percentage: (count / total) * 100
    }))
    .sort((a, b) => b.percentage - a.percentage);
  
  // Year stats
  const yearCounts = new Map<number, number>();
  matchingTalks.forEach(talk => {
    yearCounts.set(talk.year, (yearCounts.get(talk.year) || 0) + 1);
  });
  
  const yearStats = Array.from(yearCounts.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year);
  
  return {
    talks: matchingTalks,
    totalReferences: matchingTalks.length,
    speakerStats,
    conferenceStats,
    eraStats,
    yearStats
  };
}

export function countScriptureReferences(talk: Talk): number {
  // Count scripture references in footnotes
  if (!talk.footnotes) return 0;
  
  // Simple heuristic: count book names or verse patterns
  const patterns = [
    /\d+\s+Nephi/gi,
    /Alma/gi,
    /Moroni/gi,
    /D&C/gi,
    /Matthew/gi,
    /John/gi,
    /Romans/gi,
    /Genesis/gi,
    /Exodus/gi,
    /Moses/gi,
    /Abraham/gi
  ];
  
  let count = 0;
  patterns.forEach(pattern => {
    const matches = talk.footnotes.match(pattern);
    if (matches) count += matches.length;
  });
  
  return count;
}

export function getScriptureVolume(book: string): string {
  const bomBooks = ['1 Nephi', '2 Nephi', 'Jacob', 'Enos', 'Jarom', 'Omni', 'Words of Mormon', 
                    'Mosiah', 'Alma', 'Helaman', '3 Nephi', '4 Nephi', 'Mormon', 'Ether', 'Moroni'];
  const ntBooks = ['Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians',
                   'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
                   '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
                   '1 John', '2 John', '3 John', 'Jude', 'Revelation'];
  const otBooks = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
                   '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
                   'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
                   'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
                   'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'];
  const pgpBooks = ['Moses', 'Abraham', 'Joseph Smith—Matthew', 'Joseph Smith—History', 'Articles of Faith'];
  
  if (bomBooks.includes(book)) return 'Book of Mormon';
  if (book === 'D&C' || book === 'Doctrine and Covenants') return 'Doctrine and Covenants';
  if (ntBooks.includes(book)) return 'New Testament';
  if (otBooks.includes(book)) return 'Old Testament';
  if (pgpBooks.includes(book)) return 'Pearl of Great Price';
  
  return 'Unknown';
}

