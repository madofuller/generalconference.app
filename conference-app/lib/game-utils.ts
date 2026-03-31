import { Talk } from './types';

export interface TriviaQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface BingoItem {
  text: string;
  category: 'phrase' | 'topic' | 'speaker' | 'event';
  marked: boolean;
}

export interface BingoCard {
  items: BingoItem[][];
}

export interface ConnectionsGroup {
  category: string;
  color: string;
  items: string[];
}

export interface ConnectionsPuzzle {
  groups: ConnectionsGroup[];
  allItems: string[];
}

export interface DecadeDetectiveRound {
  excerpt: string;
  speaker: string;
  title: string;
  year: number;
  decade: number;
  options: number[];
}

export interface TitleOrNotItem {
  title: string;
  isReal: boolean;
  speaker?: string;
  year?: number;
}

export interface FinishTheQuoteRound {
  quoteStart: string;
  correctEnding: string;
  options: string[];
  correctIndex: number;
  speaker: string;
  talkTitle: string;
  year: number;
}

// === HELPERS ===

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

function generateTopicQuestion(talks: Talk[]): TriviaQuestion | null {
  const talksWithTopics = talks.filter(t => t.primary_topic);
  if (talksWithTopics.length < 10) return null;

  const conferences = [...new Set(talksWithTopics.map(t => `${t.season} ${t.year}`))];
  const conf = conferences[Math.floor(Math.random() * conferences.length)];
  const [season, yearStr] = conf.split(' ');
  const confTalks = talksWithTopics.filter(t => t.season === season && t.year === Number(yearStr));

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
    question: `What was the most discussed topic in ${conf} conference?`,
    options,
    correctIndex: options.indexOf(correct),
    category: 'Topics',
    difficulty: 'medium',
  };
}

function generateSpeakerTopicQuestion(talks: Talk[]): TriviaQuestion | null {
  const validTalks = talks.filter(t => t.primary_topic && t.speaker && t.year >= 2000);
  if (validTalks.length < 10) return null;

  // Find a speaker who spoke on a distinctive topic
  const speakerTopics = new Map<string, Map<string, number>>();
  validTalks.forEach(t => {
    if (!speakerTopics.has(t.speaker)) speakerTopics.set(t.speaker, new Map());
    const topics = speakerTopics.get(t.speaker)!;
    topics.set(t.primary_topic!, (topics.get(t.primary_topic!) || 0) + 1);
  });

  const candidates = [...speakerTopics.entries()]
    .filter(([, topics]) => topics.size >= 2)
    .map(([speaker, topics]) => {
      const sorted = [...topics.entries()].sort((a, b) => b[1] - a[1]);
      return { speaker, topTopic: sorted[0][0], count: sorted[0][1] };
    })
    .filter(c => c.count >= 2);

  if (candidates.length < 4) return null;
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];

  const otherSpeakers = candidates.filter(c => c.speaker !== chosen.speaker);
  const wrongAnswers = pickRandom(otherSpeakers, 3).map(c => c.speaker);
  const options = shuffle([chosen.speaker, ...wrongAnswers]);

  return {
    question: `Which speaker has spoken most frequently about "${chosen.topTopic}"?`,
    options,
    correctIndex: options.indexOf(chosen.speaker),
    category: 'Speaker Topics',
    difficulty: 'hard',
  };
}

function generateCallingQuestion(talks: Talk[]): TriviaQuestion | null {
  const validTalks = talks.filter(t => t.speaker && t.calling && t.calling !== 'No Calling Found' && t.year >= 1990);
  if (validTalks.length < 10) return null;

  // Find speakers who served in interesting callings
  const speakerCallings = new Map<string, Set<string>>();
  validTalks.forEach(t => {
    if (!speakerCallings.has(t.speaker)) speakerCallings.set(t.speaker, new Set());
    speakerCallings.get(t.speaker)!.add(t.calling);
  });

  const multiCalling = [...speakerCallings.entries()].filter(([, callings]) => callings.size >= 2);
  if (multiCalling.length < 1) return null;

  const [speaker, callings] = multiCalling[Math.floor(Math.random() * multiCalling.length)];
  const callingArr = [...callings];

  // Ask what calling this speaker held
  const correctCalling = callingArr[Math.floor(Math.random() * callingArr.length)];
  const allCallings = [...new Set(validTalks.map(t => t.calling))].filter(c => c !== correctCalling && c !== 'No Calling Found');
  if (allCallings.length < 3) return null;

  const wrongCallings = pickRandom(allCallings, 3);
  const options = shuffle([correctCalling, ...wrongCallings]);

  return {
    question: `Which calling has ${speaker} held?`,
    options,
    correctIndex: options.indexOf(correctCalling),
    category: 'Callings',
    difficulty: 'medium',
  };
}

function generateConferenceCountQuestion(talks: Talk[]): TriviaQuestion | null {
  const validTalks = talks.filter(t => t.speaker && t.year >= 1990);
  const speakerCounts = new Map<string, number>();
  validTalks.forEach(t => speakerCounts.set(t.speaker, (speakerCounts.get(t.speaker) || 0) + 1));

  const candidates = [...speakerCounts.entries()].filter(([, count]) => count >= 5);
  if (candidates.length < 4) return null;

  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  const [speaker, count] = chosen;

  // Create plausible wrong answers within ±15 of the real count
  const wrongCounts = new Set<number>();
  while (wrongCounts.size < 3) {
    const offset = Math.floor(Math.random() * 20) - 10;
    const fake = Math.max(1, count + offset);
    if (fake !== count) wrongCounts.add(fake);
  }

  const options = shuffle([String(count), ...[...wrongCounts].map(String)]);

  return {
    question: `How many conference talks has ${speaker} given since 1990?`,
    options,
    correctIndex: options.indexOf(String(count)),
    category: 'Stats',
    difficulty: 'hard',
  };
}

function generateEraQuestion(talks: Talk[]): TriviaQuestion | null {
  const validTalks = talks.filter(t => t.speaker && t.year >= 1971);
  if (validTalks.length < 20) return null;

  // Pick a random year range and find who spoke most
  const decades = [1970, 1980, 1990, 2000, 2010, 2020];
  const decade = decades[Math.floor(Math.random() * decades.length)];
  const decadeTalks = validTalks.filter(t => t.year >= decade && t.year < decade + 10);

  const speakerCounts = new Map<string, number>();
  decadeTalks.forEach(t => speakerCounts.set(t.speaker, (speakerCounts.get(t.speaker) || 0) + 1));

  const sorted = [...speakerCounts.entries()].sort((a, b) => b[1] - a[1]);
  if (sorted.length < 4) return null;

  const correct = sorted[0][0];
  const wrong = pickRandom(sorted.slice(1).map(s => s[0]), 3);
  const options = shuffle([correct, ...wrong]);

  return {
    question: `Who gave the most conference talks in the ${decade}s?`,
    options,
    correctIndex: options.indexOf(correct),
    category: 'Eras',
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

const TRIVIA_GENERATORS = [
  generateTopicQuestion,
  generateSpeakerTopicQuestion,
  generateCallingQuestion,
  generateConferenceCountQuestion,
  generateEraQuestion,
];

// Generators that need full talk text
const TRIVIA_FULLTEXT_GENERATORS = [
  generateQuoteQuestion,
];

export function generateTriviaQuestions(talks: Talk[], count: number = 10, category?: string): TriviaQuestion[] {
  const questions: TriviaQuestion[] = [];
  let attempts = 0;
  const maxAttempts = count * 15;

  // Check if talks have full text
  const hasFullText = talks.some(t => t.talk && t.talk.length > 100);
  const generators = category === 'Quotes'
    ? TRIVIA_FULLTEXT_GENERATORS
    : hasFullText
      ? [...TRIVIA_GENERATORS, ...TRIVIA_FULLTEXT_GENERATORS]
      : TRIVIA_GENERATORS;

  if (category && category !== 'Mixed' && category !== 'Quotes') {
    // Filter to matching category generators
    const catGenerators = generators.filter(g => {
      const sample = g(talks);
      return sample && sample.category === category;
    });
    if (catGenerators.length > 0) {
      while (questions.length < count && attempts < maxAttempts) {
        attempts++;
        const gen = catGenerators[Math.floor(Math.random() * catGenerators.length)];
        const q = gen(talks);
        if (q) questions.push(q);
      }
      return questions;
    }
  }

  while (questions.length < count && attempts < maxAttempts) {
    attempts++;
    const gen = generators[Math.floor(Math.random() * generators.length)];
    const q = gen(talks);
    if (q) questions.push(q);
  }

  return questions;
}

// === BINGO ===

const COMMON_PHRASES = [
  'tender mercies', 'covenant path', 'plan of salvation', 'Book of Mormon',
  'Jesus Christ', 'priesthood', 'testimony', 'repentance', 'baptism',
  'Atonement', 'scriptures', 'prayer', 'revelation', 'commandments',
  'agency', 'resurrection', 'tithing', 'service', 'missionary',
  'obedience', 'gratitude', 'Sabbath day', 'Second Coming', 'faith',
];

const BINGO_EVENTS = [
  'Temple announced', 'Story about family', 'Hymn quoted', 'Scripture story',
  'Audience laughs', 'Speaker gets emotional', 'Current prophet quoted',
  'Past prophet quoted', 'Youth mentioned', 'Covenants mentioned',
  'Missionary work mentioned', 'Temple worship mentioned', 'Prayer invited',
  'Repentance invited', 'Jesus Christ emphasized',
];

const SESSION_MOMENTS = [
  'Joke/laughter', 'Tears/emotional pause', 'Long quote read aloud',
  'Strong invitation to act', 'Personal conversion story', 'Mission story',
  'Temple covenant focus', 'Service challenge', 'Family-centered message',
  'Youth/children focus', 'Global Church mention', 'Testimony closing',
  'Prayer emphasis', 'Forgiveness emphasis', 'Hope in trials',
];

export function generateBingoCard(talks: Talk[]): BingoCard {
  const items: BingoItem[] = [];

  const phraseItems = pickRandom(COMMON_PHRASES, 9).map(p => ({
    text: p, category: 'phrase' as const, marked: false,
  }));

  const topicSet = [...new Set(talks.filter(t => t.primary_topic).map(t => t.primary_topic!))];
  const topicItems = pickRandom(topicSet, 7).map(t => ({
    text: t, category: 'topic' as const, marked: false,
  }));

  const eventItems = [...pickRandom(BINGO_EVENTS, 5), ...pickRandom(SESSION_MOMENTS, 3)].map(e => ({
    text: e, category: 'event' as const, marked: false,
  }));

  items.push(...phraseItems, ...topicItems, ...eventItems);

  // We need exactly 24 items (25 minus the free space)
  // Pad with extra phrases if needed
  while (items.length < 24) {
    const extraPhrases = COMMON_PHRASES.filter(p => !items.some(i => i.text === p));
    if (extraPhrases.length === 0) break;
    items.push({
      text: extraPhrases[Math.floor(Math.random() * extraPhrases.length)],
      category: 'phrase' as const,
      marked: false,
    });
  }

  // Shuffle and take exactly 24
  const shuffled = shuffle(items).slice(0, 24);

  // Insert free space at position 12 (center of 5x5)
  const withFree = [
    ...shuffled.slice(0, 12),
    { text: 'FREE', category: 'event' as const, marked: true },
    ...shuffled.slice(12),
  ];

  const grid: BingoItem[][] = [];
  for (let i = 0; i < 5; i++) {
    grid.push(withFree.slice(i * 5, (i + 1) * 5));
  }

  return { items: grid };
}

export function checkBingoWin(card: BingoCard): boolean {
  const items = card.items;
  for (let r = 0; r < 5; r++) {
    if (items[r].every(item => item.marked)) return true;
  }
  for (let c = 0; c < 5; c++) {
    if (items.every(row => row[c].marked)) return true;
  }
  if ([0, 1, 2, 3, 4].every(i => items[i][i].marked)) return true;
  if ([0, 1, 2, 3, 4].every(i => items[i][4 - i].marked)) return true;
  return false;
}

// === CONNECTIONS ===

// Pre-built category pools — designed so items across groups can be confused
const CONNECTIONS_TEMPLATES = [
  {
    groups: [
      { category: 'Church Presidents', pool: ['Joseph Smith', 'Brigham Young', 'John Taylor', 'Wilford Woodruff', 'Lorenzo Snow', 'Joseph F. Smith', 'Heber J. Grant', 'George Albert Smith', 'David O. McKay', 'Spencer W. Kimball', 'Ezra Taft Benson', 'Gordon B. Hinckley', 'Thomas S. Monson', 'Russell M. Nelson', 'Dallin H. Oaks'] },
      { category: 'Book of Mormon Prophets', pool: ['Nephi', 'Alma', 'Mormon', 'Moroni', 'Helaman', 'Abinadi', 'King Benjamin', 'Enos', 'Jacob', 'Samuel', 'Mosiah', 'Ammon'] },
      { category: 'Old Testament Prophets', pool: ['Moses', 'Abraham', 'Isaiah', 'Elijah', 'Daniel', 'Jeremiah', 'Ezekiel', 'Noah', 'Enoch', 'Malachi', 'Joel', 'Micah'] },
      { category: 'New Testament Apostles', pool: ['Peter', 'Paul', 'John', 'James', 'Matthew', 'Andrew', 'Thomas', 'Philip', 'Bartholomew', 'Luke', 'Mark', 'Timothy'] },
    ],
  },
  {
    groups: [
      { category: 'Hymn Titles', pool: ['Come, Come, Ye Saints', 'I Stand All Amazed', 'How Firm a Foundation', 'Be Still, My Soul', 'I Know That My Redeemer Lives', 'A Poor Wayfaring Man of Grief', 'The Spirit of God', 'Praise to the Man', 'Count Your Blessings', 'Abide with Me'] },
      { category: 'Books in the Book of Mormon', pool: ['1 Nephi', '2 Nephi', 'Alma', 'Mosiah', 'Helaman', 'Ether', 'Moroni', 'Jacob', '3 Nephi', 'Omni', 'Jarom', 'Mormon'] },
      { category: 'Temple Locations', pool: ['Salt Lake City', 'Nauvoo', 'Kirtland', 'Mesa', 'Provo', 'Laie', 'St. George', 'Manti', 'Logan', 'Bountiful', 'Ogden', 'Draper'] },
      { category: 'Articles of Faith Principles', pool: ['Faith', 'Repentance', 'Baptism', 'Holy Ghost', 'Revelation', 'Atonement', 'Resurrection', 'Agency', 'Gathering of Israel', 'Zion', 'Chastity', 'Honesty'] },
    ],
  },
  {
    groups: [
      { category: 'Conference Phrases', pool: ['covenant path', 'tender mercies', 'plan of salvation', 'endure to the end', 'fullness of the gospel', 'strait and narrow', 'iron rod', 'living water', 'still small voice', 'broken heart'] },
      { category: 'Parables of Jesus', pool: ['Good Samaritan', 'Prodigal Son', 'Ten Virgins', 'Talents', 'Sower', 'Lost Sheep', 'Mustard Seed', 'Pearl of Great Price', 'Workers in the Vineyard', 'Rich Man and Lazarus'] },
      { category: 'Scripture Stories', pool: ['Stripling Warriors', 'Brother of Jared', 'Liahona', 'Tree of Life', 'Waters of Mormon', 'Title of Liberty', 'Rameumptom', 'Jaredite Barges', 'Brass Plates', 'Gold Plates'] },
      { category: 'Priesthood Ordinances', pool: ['Baptism', 'Confirmation', 'Sacrament', 'Temple Endowment', 'Sealing', 'Priesthood Blessing', 'Baby Blessing', 'Ordination', 'Setting Apart', 'Dedicating a Grave'] },
    ],
  },
  {
    groups: [
      { category: 'First Presidency Counselors', pool: ['Henry B. Eyring', 'Dieter F. Uchtdorf', 'James E. Faust', 'N. Eldon Tanner', 'Marion G. Romney', 'Gordon B. Hinckley', 'Thomas S. Monson', 'Dallin H. Oaks', 'J. Reuben Clark', 'Hugh B. Brown'] },
      { category: 'Relief Society Presidents', pool: ['Eliza R. Snow', 'Emmeline B. Wells', 'Belle S. Spafford', 'Barbara B. Smith', 'Elaine L. Jack', 'Mary Ellen Smoot', 'Bonnie D. Parkin', 'Julie B. Beck', 'Linda K. Burton', 'Jean B. Bingham'] },
      { category: 'Called as Apostle in 2000s+', pool: ['David A. Bednar', 'Quentin L. Cook', 'Neil L. Andersen', 'Ronald A. Rasband', 'Gary E. Stevenson', 'Dale G. Renlund', 'Gerrit W. Gong', 'Ulisses Soares', 'Patrick Kearon', 'D. Todd Christofferson', 'Clark G. Gilbert'] },
      { category: 'Presiding Bishops', pool: ['Gérald Caussé', 'Dean M. Davies', 'Keith B. McMullin', 'H. David Burton', 'Merrill J. Bateman', 'Robert D. Hales', 'Victor L. Brown', 'John H. Vandenberg', 'LeGrand Richards', 'Marvin J. Ashton'] },
    ],
  },
  {
    groups: [
      { category: 'Missionary Scriptures', pool: ['Moroni 10:3-5', 'James 1:5', '3 Nephi 11:10-11', 'Alma 32:21', 'John 3:16', '2 Nephi 2:25', 'D&C 130:22', 'Mosiah 3:19', 'Ether 12:6', 'Alma 7:11-12'] },
      { category: 'Pearl of Great Price Books', pool: ['Moses', 'Abraham', 'Joseph Smith—Matthew', 'Joseph Smith—History', 'Articles of Faith'] },
      { category: 'D&C Sections About', pool: ['Word of Wisdom (89)', 'Plan of Salvation (76)', 'Priesthood (107)', 'Degrees of Glory (131)', 'Tithing (119)', 'Missionary Work (4)', 'Temple Work (138)', 'Repentance (58)'] },
      { category: 'Beatitudes', pool: ['Blessed are the poor in spirit', 'Blessed are they that mourn', 'Blessed are the meek', 'Blessed are the merciful', 'Blessed are the pure in heart', 'Blessed are the peacemakers', 'Blessed are the persecuted'] },
    ],
  },
  {
    groups: [
      { category: 'Fruits of the Spirit', pool: ['Love', 'Joy', 'Peace', 'Patience', 'Kindness', 'Goodness', 'Faithfulness', 'Gentleness', 'Self-control'] },
      { category: 'Ten Commandments', pool: ['No other gods', 'No graven images', 'Not take name in vain', 'Remember the Sabbath', 'Honor parents', 'Not kill', 'Not steal', 'Not bear false witness', 'Not covet'] },
      { category: 'Gifts of the Spirit', pool: ['Tongues', 'Interpretation', 'Prophecy', 'Healing', 'Miracles', 'Discernment', 'Wisdom', 'Knowledge', 'Faith to be healed'] },
      { category: 'Armor of God', pool: ['Belt of Truth', 'Breastplate of Righteousness', 'Shoes of Peace', 'Shield of Faith', 'Helmet of Salvation', 'Sword of the Spirit'] },
    ],
  },
];

export function generateConnectionsPuzzle(_talks: Talk[]): ConnectionsPuzzle | null {
  // Pick a random template
  const template = CONNECTIONS_TEMPLATES[Math.floor(Math.random() * CONNECTIONS_TEMPLATES.length)];

  const groups: ConnectionsGroup[] = [];
  const colors = ['#f5a623', '#40c2fd', '#8455ef', '#1B5E7B'];

  for (let i = 0; i < 4; i++) {
    const group = template.groups[i];
    if (group.pool.length < 4) return null;
    const items = pickRandom(group.pool, 4);
    groups.push({
      category: group.category,
      color: colors[i],
      items,
    });
  }

  const allItems = shuffle(groups.flatMap(g => g.items));
  return { groups, allItems };
}

// === DECADE DETECTIVE ===

export function generateDecadeDetectiveRounds(talks: Talk[], count: number = 8): DecadeDetectiveRound[] {
  const validTalks = talks.filter(t => t.talk && t.talk.length > 300 && t.year >= 1900);
  if (validTalks.length < 10) return [];

  const rounds: DecadeDetectiveRound[] = [];
  const usedTalks = new Set<string>();
  let attempts = 0;

  while (rounds.length < count && attempts < count * 20) {
    attempts++;
    const talk = validTalks[Math.floor(Math.random() * validTalks.length)];
    const key = `${talk.speaker}-${talk.year}-${talk.title}`;
    if (usedTalks.has(key)) continue;
    usedTalks.add(key);

    const sentences = talk.talk
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 60 && s.length < 250);

    if (sentences.length < 2) continue;

    const startIdx = Math.floor(Math.random() * Math.max(1, sentences.length - 2));
    const excerpt = sentences.slice(startIdx, startIdx + 2).join('. ') + '.';

    const decade = Math.floor(talk.year / 10) * 10;
    const allDecades = [...new Set(validTalks.map(t => Math.floor(t.year / 10) * 10))].sort();
    const otherDecades = allDecades.filter(d => d !== decade);
    if (otherDecades.length < 3) continue;

    const wrongDecades = pickRandom(otherDecades, 3);
    const options = shuffle([decade, ...wrongDecades]).sort();

    rounds.push({
      excerpt,
      speaker: talk.speaker,
      title: talk.title,
      year: talk.year,
      decade,
      options,
    });
  }

  return rounds;
}

// === TALK TITLE OR NOT ===

const FAKE_TITLE_TEMPLATES = [
  'The {adj} Power of {noun}',
  '{noun}: A {adj} Blessing',
  'Finding {noun} in {adj} Times',
  'The {adj} Promise of {noun}',
  '{noun} and the {adj} Heart',
  'Walking the {adj} Path of {noun}',
  'Embracing {adj} {noun}',
  'The {adj} Gift of {noun}',
  '{noun}: Our {adj} Heritage',
  'A {adj} Witness of {noun}',
  'Come Unto {noun}',
  'The {adj} Work of {noun}',
  'Seek the {adj} {noun}',
  '{noun} in Every Season',
  'Standing in {adj} Places',
  'The {adj} Voice of {noun}',
  '{adj} Foundations of {noun}',
  'Anchored in {adj} {noun}',
  'The Miracle of {adj} {noun}',
  '{noun} Above All',
];

const FAKE_ADJS = [
  'Sacred', 'Eternal', 'Divine', 'Quiet', 'Steadfast', 'Enduring', 'Joyful',
  'Mighty', 'Humble', 'Abiding', 'Transcendent', 'Unfailing', 'Refining',
  'Celestial', 'Radiant', 'Wondrous', 'Still', 'Living', 'Holy',
  'Boundless', 'Tender', 'Glorious', 'Unfading',
];

const FAKE_NOUNS = [
  'Faith', 'Hope', 'Grace', 'Charity', 'Mercy', 'Redemption', 'Truth',
  'Discipleship', 'Conversion', 'Covenant', 'Sacrifice', 'Obedience',
  'Testimony', 'Prayer', 'Repentance', 'Forgiveness', 'Service',
  'Revelation', 'Providence', 'Righteousness', 'Devotion', 'Consecration',
];

function generateFakeTitle(): string {
  const template = FAKE_TITLE_TEMPLATES[Math.floor(Math.random() * FAKE_TITLE_TEMPLATES.length)];
  const adj = FAKE_ADJS[Math.floor(Math.random() * FAKE_ADJS.length)];
  const noun = FAKE_NOUNS[Math.floor(Math.random() * FAKE_NOUNS.length)];
  return template.replace('{adj}', adj).replace('{noun}', noun);
}

export function generateTitleOrNotRounds(talks: Talk[], count: number = 12): TitleOrNotItem[] {
  const validTalks = talks.filter(t => t.title && t.title !== 'No Title Found' && t.title.length > 5 && t.title.length < 60);
  if (validTalks.length < count) return [];

  const realCount = Math.ceil(count / 2);
  const fakeCount = count - realCount;

  const realTalks = pickRandom(validTalks, realCount);
  const realItems: TitleOrNotItem[] = realTalks.map(t => ({
    title: t.title,
    isReal: true,
    speaker: t.speaker,
    year: t.year,
  }));

  const existingTitles = new Set(validTalks.map(t => t.title.toLowerCase()));
  const fakeItems: TitleOrNotItem[] = [];
  let fakeAttempts = 0;
  while (fakeItems.length < fakeCount && fakeAttempts < fakeCount * 10) {
    fakeAttempts++;
    const fakeTitle = generateFakeTitle();
    if (!existingTitles.has(fakeTitle.toLowerCase())) {
      fakeItems.push({ title: fakeTitle, isReal: false });
      existingTitles.add(fakeTitle.toLowerCase());
    }
  }

  return shuffle([...realItems, ...fakeItems]);
}

// === FINISH THE QUOTE ===

export function generateFinishTheQuoteRounds(talks: Talk[], count: number = 8): FinishTheQuoteRound[] {
  const validTalks = talks.filter(t => t.talk && t.talk.length > 300 && t.speaker && t.title);
  if (validTalks.length < 4) return [];

  const rounds: FinishTheQuoteRound[] = [];
  let attempts = 0;

  while (rounds.length < count && attempts < count * 20) {
    attempts++;
    const talk = validTalks[Math.floor(Math.random() * validTalks.length)];

    const sentences = talk.talk
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 60 && s.length < 180);

    if (sentences.length < 4) continue;

    const sentence = sentences[Math.floor(Math.random() * sentences.length)];
    const words = sentence.split(/\s+/);
    if (words.length < 8) continue;

    const splitPoint = Math.floor(words.length * 0.5);
    const quoteStart = words.slice(0, splitPoint).join(' ') + '...';
    const correctEnding = '...' + words.slice(splitPoint).join(' ') + '.';

    // Generate wrong endings from other talks
    const otherSentences: string[] = [];
    for (let i = 0; i < 30 && otherSentences.length < 3; i++) {
      const otherTalk = validTalks[Math.floor(Math.random() * validTalks.length)];
      if (otherTalk.speaker === talk.speaker) continue;
      const otherSents = otherTalk.talk
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 40 && s.length < 180);
      if (otherSents.length === 0) continue;
      const otherSentence = otherSents[Math.floor(Math.random() * otherSents.length)];
      const otherWords = otherSentence.split(/\s+/);
      if (otherWords.length < 6) continue;
      const otherSplitPoint = Math.floor(otherWords.length * 0.5);
      otherSentences.push('...' + otherWords.slice(otherSplitPoint).join(' ') + '.');
    }

    if (otherSentences.length < 3) continue;

    const options = shuffle([correctEnding, ...otherSentences.slice(0, 3)]);

    rounds.push({
      quoteStart,
      correctEnding,
      options,
      correctIndex: options.indexOf(correctEnding),
      speaker: talk.speaker,
      talkTitle: talk.title,
      year: talk.year,
    });
  }

  return rounds;
}

// === CONFERENCE WORDLE ===

const CONFERENCE_WORDS = [
  'faith', 'grace', 'heart', 'serve', 'peace', 'light', 'truth', 'power',
  'bless', 'angel', 'atone', 'elder', 'saint', 'tithe', 'feast',
  'reign', 'glory', 'merit', 'psalm', 'moral', 'trust', 'heirs',
  'world', 'altar', 'cross', 'risen', 'tower', 'flame', 'crown', 'stone',
  'sword', 'water', 'bread', 'grain', 'sheep', 'teach', 'learn', 'study',
  'quest', 'trial', 'guide', 'house', 'loved', 'mercy', 'royal', 'godly',
  'words', 'gifts', 'honor', 'kneel', 'voice', 'earth', 'shall', 'abide',
  'yield', 'worth', 'dwell', 'swore', 'given', 'cries', 'savvy',
];

export function getWordleWord(dayOffset?: number): string {
  const today = dayOffset ?? Math.floor(Date.now() / 86400000);
  const index = today % CONFERENCE_WORDS.length;
  return CONFERENCE_WORDS[index].toUpperCase();
}

export function checkWordleGuess(guess: string, target: string): ('correct' | 'present' | 'absent')[] {
  const result: ('correct' | 'present' | 'absent')[] = Array(guess.length).fill('absent');
  const targetChars = target.split('');
  const guessChars = guess.split('');

  guessChars.forEach((char, i) => {
    if (char === targetChars[i]) {
      result[i] = 'correct';
      targetChars[i] = '_';
    }
  });

  guessChars.forEach((char, i) => {
    if (result[i] === 'correct') return;
    const idx = targetChars.indexOf(char);
    if (idx !== -1) {
      result[i] = 'present';
      targetChars[idx] = '_';
    }
  });

  return result;
}

export function isValidWord(word: string): boolean {
  return /^[A-Z]{5}$/i.test(word);
}

const WORD_VALIDATION_CACHE = new Map<string, boolean>();

// Real-word validation for Wordle guesses.
// Uses dictionaryapi.dev with local fallback to conference answers.
export async function isRealWord(word: string): Promise<boolean> {
  const upper = word.toUpperCase();
  if (!/^[A-Z]{5}$/.test(upper)) return false;
  if (WORD_VALIDATION_CACHE.has(upper)) return WORD_VALIDATION_CACHE.get(upper)!;

  // Always accept official answer words.
  if (CONFERENCE_WORDS.map(w => w.toUpperCase()).includes(upper)) {
    WORD_VALIDATION_CACHE.set(upper, true);
    return true;
  }

  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${upper.toLowerCase()}`);
    const ok = res.ok;
    WORD_VALIDATION_CACHE.set(upper, ok);
    return ok;
  } catch {
    // If offline, only allow words from the built-in answer list.
    WORD_VALIDATION_CACHE.set(upper, false);
    return false;
  }
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
