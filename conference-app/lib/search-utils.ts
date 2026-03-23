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
    const era = getEraForYear(talk.year, talk.season);
    const current = eraCounts.get(era) || { count: 0, total: 0 };
    eraCounts.set(era, { ...current, total: current.total + 1 });
  });

  // Count matching talks by era
  matchingTalks.forEach(talk => {
    const era = getEraForYear(talk.year, talk.season);
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
  // Check both footnotes and talk text for scripture references
  const textToSearch = (talk.footnotes || '') + ' ' + (talk.talk || '');
  if (!textToSearch.trim()) return 0;
  
  // Comprehensive scripture reference patterns
  // Match patterns like "1 Nephi 3:7", "Alma 32:21", "D&C 88:118", "Matthew 5:14-16"
  const scripturePatterns = [
    // Book of Mormon
    /\b1\s*Nephi\s+\d+[:\d\-,\s]*/gi,
    /\b2\s*Nephi\s+\d+[:\d\-,\s]*/gi,
    /\bJacob\s+\d+[:\d\-,\s]*/gi,
    /\bEno[s]?\s+\d*[:\d\-,\s]*/gi,
    /\bJarom\s+\d*[:\d\-,\s]*/gi,
    /\bOmni\s+\d*[:\d\-,\s]*/gi,
    /\bMosiah\s+\d+[:\d\-,\s]*/gi,
    /\bAlma\s+\d+[:\d\-,\s]*/gi,
    /\bHelaman\s+\d+[:\d\-,\s]*/gi,
    /\b3\s*Nephi\s+\d+[:\d\-,\s]*/gi,
    /\b4\s*Nephi\s+\d*[:\d\-,\s]*/gi,
    /\bMormon\s+\d+[:\d\-,\s]*/gi,
    /\bEther\s+\d+[:\d\-,\s]*/gi,
    /\bMoroni\s+\d+[:\d\-,\s]*/gi,
    // D&C
    /\bD\.?\s*&\s*C\.?\s+\d+[:\d\-,\s]*/gi,
    /\bDoctrine\s+and\s+Covenants\s+\d+[:\d\-,\s]*/gi,
    // Pearl of Great Price
    /\bMoses\s+\d+[:\d\-,\s]*/gi,
    /\bAbraham\s+\d+[:\d\-,\s]*/gi,
    /\bJoseph\s+Smith[—\-–]\s*History\s+\d*[:\d\-,\s]*/gi,
    /\bJS[—\-–]H\s+\d*[:\d\-,\s]*/gi,
    // New Testament
    /\bMatthew\s+\d+[:\d\-,\s]*/gi,
    /\bMark\s+\d+[:\d\-,\s]*/gi,
    /\bLuke\s+\d+[:\d\-,\s]*/gi,
    /\bJohn\s+\d+[:\d\-,\s]*/gi,
    /\bActs\s+\d+[:\d\-,\s]*/gi,
    /\bRomans\s+\d+[:\d\-,\s]*/gi,
    /\b1\s*Corinthians\s+\d+[:\d\-,\s]*/gi,
    /\b2\s*Corinthians\s+\d+[:\d\-,\s]*/gi,
    /\bGalatians\s+\d+[:\d\-,\s]*/gi,
    /\bEphesians\s+\d+[:\d\-,\s]*/gi,
    /\bPhilippians\s+\d+[:\d\-,\s]*/gi,
    /\bColossians\s+\d+[:\d\-,\s]*/gi,
    /\b1\s*Thessalonians\s+\d+[:\d\-,\s]*/gi,
    /\b2\s*Thessalonians\s+\d+[:\d\-,\s]*/gi,
    /\b1\s*Timothy\s+\d+[:\d\-,\s]*/gi,
    /\b2\s*Timothy\s+\d+[:\d\-,\s]*/gi,
    /\bTitus\s+\d+[:\d\-,\s]*/gi,
    /\bPhilemon\s+\d*[:\d\-,\s]*/gi,
    /\bHebrews\s+\d+[:\d\-,\s]*/gi,
    /\bJames\s+\d+[:\d\-,\s]*/gi,
    /\b1\s*Peter\s+\d+[:\d\-,\s]*/gi,
    /\b2\s*Peter\s+\d+[:\d\-,\s]*/gi,
    /\b1\s*John\s+\d+[:\d\-,\s]*/gi,
    /\b2\s*John\s+\d*[:\d\-,\s]*/gi,
    /\b3\s*John\s+\d*[:\d\-,\s]*/gi,
    /\bJude\s+\d*[:\d\-,\s]*/gi,
    /\bRevelation\s+\d+[:\d\-,\s]*/gi,
    // Old Testament
    /\bGenesis\s+\d+[:\d\-,\s]*/gi,
    /\bExodus\s+\d+[:\d\-,\s]*/gi,
    /\bLeviticus\s+\d+[:\d\-,\s]*/gi,
    /\bNumbers\s+\d+[:\d\-,\s]*/gi,
    /\bDeuteronomy\s+\d+[:\d\-,\s]*/gi,
    /\bJoshua\s+\d+[:\d\-,\s]*/gi,
    /\bJudges\s+\d+[:\d\-,\s]*/gi,
    /\bRuth\s+\d+[:\d\-,\s]*/gi,
    /\b1\s*Samuel\s+\d+[:\d\-,\s]*/gi,
    /\b2\s*Samuel\s+\d+[:\d\-,\s]*/gi,
    /\b1\s*Kings\s+\d+[:\d\-,\s]*/gi,
    /\b2\s*Kings\s+\d+[:\d\-,\s]*/gi,
    /\b1\s*Chronicles\s+\d+[:\d\-,\s]*/gi,
    /\b2\s*Chronicles\s+\d+[:\d\-,\s]*/gi,
    /\bEzra\s+\d+[:\d\-,\s]*/gi,
    /\bNehemiah\s+\d+[:\d\-,\s]*/gi,
    /\bEsther\s+\d+[:\d\-,\s]*/gi,
    /\bJob\s+\d+[:\d\-,\s]*/gi,
    /\bPsalm[s]?\s+\d+[:\d\-,\s]*/gi,
    /\bProverbs\s+\d+[:\d\-,\s]*/gi,
    /\bEcclesiastes\s+\d+[:\d\-,\s]*/gi,
    /\bSong\s+of\s+Solomon\s+\d+[:\d\-,\s]*/gi,
    /\bIsaiah\s+\d+[:\d\-,\s]*/gi,
    /\bJeremiah\s+\d+[:\d\-,\s]*/gi,
    /\bLamentations\s+\d+[:\d\-,\s]*/gi,
    /\bEzekiel\s+\d+[:\d\-,\s]*/gi,
    /\bDaniel\s+\d+[:\d\-,\s]*/gi,
    /\bHosea\s+\d+[:\d\-,\s]*/gi,
    /\bJoel\s+\d+[:\d\-,\s]*/gi,
    /\bAmos\s+\d+[:\d\-,\s]*/gi,
    /\bObadiah\s+\d*[:\d\-,\s]*/gi,
    /\bJonah\s+\d+[:\d\-,\s]*/gi,
    /\bMicah\s+\d+[:\d\-,\s]*/gi,
    /\bNahum\s+\d+[:\d\-,\s]*/gi,
    /\bHabakkuk\s+\d+[:\d\-,\s]*/gi,
    /\bZephaniah\s+\d+[:\d\-,\s]*/gi,
    /\bHaggai\s+\d+[:\d\-,\s]*/gi,
    /\bZechariah\s+\d+[:\d\-,\s]*/gi,
    /\bMalachi\s+\d+[:\d\-,\s]*/gi,
  ];
  
  let count = 0;
  scripturePatterns.forEach(pattern => {
    const matches = textToSearch.match(pattern);
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



