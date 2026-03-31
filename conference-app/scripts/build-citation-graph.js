#!/usr/bin/env node

/**
 * Pre-computes the speaker citation graph from talk CSVs and writes
 * public/citation_graph.json so the client never has to scan talk text.
 *
 * Usage:  node scripts/build-citation-graph.js
 */

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const PUBLIC = path.join(__dirname, '..', 'public');
const OUT_FILE = path.join(PUBLIC, 'citation_graph.json');

// ── Speaker normalisation (mirrors lib/data-loader.ts) ──────────────

const SPEAKER_ALIASES = {
  'W. Grant Bangerter': 'William Grant Bangerter',
  'Wm. Grant Bangerter': 'William Grant Bangerter',
  'Michael J. Teh': 'Michael John U. Teh',
  'Teddy E. Brewerton': 'Ted E. Brewerton',
  'Elaine Cannon': 'Elaine A. Cannon',
  'Michelle Craig': 'Michelle D. Craig',
  'Charles A. Didier': 'Charles Didier',
  'Jack H. Goaslind': 'Jack H Goaslind',
  'Ardeth Greene Kapp': 'Ardeth G. Kapp',
  'Larry Echo Hawk': 'Larry J. Echo Hawk',
  'Mary Ellen W. Smoot': 'Mary Ellen Smoot',
  'LeGrand Richards': 'Legrand Richards',
  'ElRay L. Christiansen': 'Elray L. Christiansen',
  'Cecil O. Samuelson, Jr.': 'Cecil O. Samuelson Jr.',
  'Betty Jo Jepsen': 'Betty Jo N. Jepsen',
  'Albert Theodore Tuttle': 'A. Theodore Tuttle',
  'José L. Alonso': 'Jose L. Alonso',
  'Wm. Rolfe Kerr': 'W. Rolfe Kerr',
  'Jack H Goaslind, Jr.': 'Jack H Goaslind',
  'Jack H. Goaslind, Jr.': 'Jack H Goaslind',
  'Oleen L. Stohl': 'Oleen N. Stohl',
  'Oleen X. Stohl': 'Oleen N. Stohl',
  'Seymour Dilworth Young': 'S. Dilworth Young',
  'Wm. J. Henderson': 'William J. Henderson',
  'Wm. T. Jack': 'William T. Jack',
  'Heber J Grant': 'Heber J. Grant',
  'B H. Roberts': 'B. H. Roberts',
  'B High Am H. Roberts': 'B. H. Roberts',
  'Briguam H. Roberts': 'B. H. Roberts',
  'Brigham Ham H. Roberts': 'B. H. Roberts',
  'Htrum M. Smith': 'Hyrum M. Smith',
  'Rum M. Smith': 'Hyrum M. Smith',
  'Rum G. Smith': 'Hyrum G. Smith',
  'Wilfokd Woodruff': 'Wilford Woodruff',
  'A. O. Woodruff': 'Abraham O. Woodruff',
  'Asahel Woodruff': 'Asahel H. Woodruff',
  'George A. Smith': 'George Albert Smith',
  'Winslow F. Smith': 'Winslow Farr Smith',
  'F. M. Lyman': 'Francis M. Lyman',
  'A. W. Ivins': 'Anthony W. Ivins',
  'M. F. Cowley': 'Matthias F. Cowley',
  'G. E. Ellsworth': 'German E. Ellsworth',
  'A. A. Hinckley': 'Alonzo A. Hinckley',
  'M. W. Merrill': 'Marriner W. Merrill',
  'J. Golden Kimball': 'J. Golden Kimball',
  'J. G. Kimball': 'J. Golden Kimball',
  'Stephen Richards': 'Stephen L. Richards',
  'Geo. F. Richards': 'George F. Richards',
  'F. D. Richards': 'Franklin D. Richards',
  'Wm. H. Richards': 'William H. Richards',
  'Rtjlon S. Wells': 'Rulon S. Wells',
  'Ben. E. Rich': 'Ben E. Rich',
  'S. E. Woolley': 'Samuel E. Woolley',
  'Charles Iv. Penrose': 'Charles W. Penrose',
  'Hep Ee, C- Austin': 'Heber C. Austin',
  'George. H. Brimhall': 'George H. Brimhall',
  'Henry A, Gardner': 'Henry A. Gardner',
  'Joseph E, Evans': 'Joseph E. Evans',
  'E. H. Nye': 'Ephraim H. Nye',
  'L. A. Kelsch': 'Louis A. Kelsch',
  'W. C. Lyman': 'Walter C. Lyman',
  'R. G. Miller': 'Reuben G. Miller',
  'J. N. Lambert': 'James N. Lambert',
  'J. M. Tanner': 'Joseph M. Tanner',
  'J. W. Summerhays': 'Joseph W. Summerhays',
  'Jos. W. Summerhays': 'Joseph W. Summerhays',
  'J. G. Duffin': 'James G. Duffin',
  'J. C. Bentley': 'Joseph C. Bentley',
  'E. Frank Birch': 'E. Franklin Birch',
  'Jos. S. Geddes': 'Joseph S. Geddes',
  'S. R. Bennion': 'Samuel O. Bennion',
  'Fred Tadje': 'Fred J. Tadje',
  'Lars Oveson': 'Lars P. Oveson',
  'W. C. Parkinson': 'William C. Parkinson',
  'Heber Meeks': 'Heber J. Meeks',
  'Benjamin Goddard': 'Benjamin F. Goddard',
  'Arthur Horsley': 'Arthur W. Horsley',
  'Arthur Iv. Horsley': 'Arthur W. Horsley',
  'Wm. H. Mendenhall': 'William H. Mendenhall',
  'Wm, H. Mendenhall': 'William H. Mendenhall',
  'Wm. H. Seegmiller': 'William H. Seegmiller',
  'Wm. W. Seegmiller': 'William W. Seegmiller',
  'W. W. Seegmiller': 'William W. Seegmiller',
  'Wm. H. Smart': 'William H. Smart',
  'William H Smart': 'William H. Smart',
  'William. H. Smart': 'William H. Smart',
  'Wm. R. Sloan': 'William R. Sloan',
  'William A- Hyde': 'William A. Hyde',
  'George. S. Romney': 'George S. Romney',
  'Josepei Quinney': 'Joseph Quinney',
  "Joseph'Quinney, Jr": 'Joseph Quinney, Jr',
  'Abel John Evans': 'Abel J. Evans',
  'L. W. Shurtliff': 'Louis W. Shurtliff',
  'H. W. Valentine': 'Hyrum W. Valentine',
  'Helio da Rocha Camargo': 'Helio R. Camargo',
  'Arnold H. Schulthess': 'Arnold Schulthess',
  'A. H. Schulthess': 'Arnold Schulthess',
  'C. Elder C. N. Lund': 'Christian N. Lund',
  'Joseph F. Smith, Jr': 'Joseph Fielding Smith',
  'Joseph E. Smith, Jr': 'Joseph Fielding Smith',
  'B. F. Johnson': 'Benjamin F. Johnson',
  'Ezra T. Benson': 'Ezra Taft Benson',
  'E. H. Snow': 'Edward H. Snow',
  'C. Iv. Sorenson': 'C. W. Sorenson',
  'Wilford Iv. Richards': 'Wilford W. Richards',
  'Thomas X . Taylor': 'Thomas N. Taylor',
  'Orville L. Thompson': 'Orvil L. Thompson',
};

function normalizeSpeaker(name) {
  if (name.startsWith('Bishop ')) name = name.slice(7);
  if (name.startsWith('Presented ')) name = name.slice(10);
  return SPEAKER_ALIASES[name] || name;
}

// ── CSV loading ─────────────────────────────────────────────────────

function loadCsv(filename) {
  const csv = fs.readFileSync(path.join(PUBLIC, filename), 'utf-8');
  const { data } = Papa.parse(csv, { header: true, dynamicTyping: true, skipEmptyLines: true });
  return data.map(row => ({
    speaker: normalizeSpeaker((row.speaker || '').replace(/\u00a0/g, ' ').trim().replace(/^By\s+/i, '')),
    talk: row.talk || '',
    year: Number(row.year) || 0,
  }));
}

// ── Citation graph builder ──────────────────────────────────────────

const AMBIGUOUS_LASTNAMES = new Set([
  'young', 'smith', 'johnson', 'brown', 'cook', 'taylor', 'nelson',
  'snow', 'clark', 'lee', 'turner', 'martin', 'king', 'wright',
  'hill', 'green', 'stone', 'long', 'day', 'may', 'rich', 'child',
  'wells', 'grant', 'page', 'hyde', 'mark', 'luke', 'james',
]);

function buildCitationGraph(talks) {
  const speakerTalkCount = new Map();
  talks.forEach(t => speakerTalkCount.set(t.speaker, (speakerTalkCount.get(t.speaker) || 0) + 1));

  const speakers = Array.from(speakerTalkCount.entries())
    .filter(([, count]) => count >= 1)
    .map(([name]) => name);

  const speakerPatterns = speakers.map(s => {
    const parts = s.split(' ');
    const lastName = parts[parts.length - 1].toLowerCase();
    const isAmbiguous = AMBIGUOUS_LASTNAMES.has(lastName);
    const fullName = s.toLowerCase();
    const patterns = [fullName];

    if (isAmbiguous) {
      if (parts.length >= 2) patterns.push(`${parts[0].toLowerCase()} ${lastName}`);
      if (parts.length >= 3) {
        const twoWordId = `${parts[parts.length - 2].toLowerCase()} ${lastName}`;
        patterns.push(`president ${twoWordId}`);
        patterns.push(`elder ${twoWordId}`);
        patterns.push(`sister ${twoWordId}`);
      }
    } else {
      patterns.push(`president ${lastName}`);
      patterns.push(`elder ${lastName}`);
      patterns.push(`sister ${lastName}`);
      patterns.push(`bishop ${lastName}`);
      patterns.push(`brother ${lastName}`);
    }
    return { name: s, patterns };
  });

  console.log(`  ${speakers.length} speakers, scanning ${talks.length} talks...`);

  const edges = new Map();
  let processed = 0;

  talks.forEach(talk => {
    const text = (talk.talk || '').toLowerCase();
    if (!text || text.length < 50) return;

    speakerPatterns.forEach(({ name, patterns }) => {
      if (name === talk.speaker) return;
      for (const pattern of patterns) {
        const idx = text.indexOf(pattern);
        if (idx !== -1) {
          const before = idx > 0 ? text[idx - 1] : ' ';
          const after = idx + pattern.length < text.length ? text[idx + pattern.length] : ' ';
          if (/[\s,.:;"'(\u201c\u201d]/.test(before) && /[\s,.:;"')\u201c\u201d?!]/.test(after)) {
            const key = `${talk.speaker}|||${name}`;
            edges.set(key, (edges.get(key) || 0) + 1);
            break;
          }
        }
      }
    });

    processed++;
    if (processed % 1000 === 0) {
      process.stdout.write(`  ${processed.toLocaleString()} / ${talks.length.toLocaleString()} talks scanned\r`);
    }
  });

  console.log(`  ${talks.length.toLocaleString()} / ${talks.length.toLocaleString()} talks scanned`);

  const edgeList = Array.from(edges.entries())
    .map(([key, count]) => {
      const [source, target] = key.split('|||');
      return { source, target, count };
    })
    .sort((a, b) => b.count - a.count);

  const stats = new Map();
  const initStats = (s) => {
    if (!stats.has(s)) stats.set(s, { speaker: s, citedByCount: 0, citesCount: 0, totalIncoming: 0, totalOutgoing: 0 });
  };

  edgeList.forEach(e => {
    initStats(e.source);
    initStats(e.target);
    stats.get(e.source).citesCount++;
    stats.get(e.source).totalOutgoing += e.count;
    stats.get(e.target).citedByCount++;
    stats.get(e.target).totalIncoming += e.count;
  });

  return {
    edges: edgeList,
    stats: Array.from(stats.values()),
    speakers,
  };
}

// ── Main ────────────────────────────────────────────────────────────

console.log('Loading modern talks...');
const modernTalks = loadCsv('conference_talks_cleaned.csv');
console.log(`  ${modernTalks.length} modern talks`);

console.log('Loading historical talks...');
const historicalTalks = loadCsv('historical_talks.csv');
console.log(`  ${historicalTalks.length} historical talks`);

const allTalks = [...historicalTalks, ...modernTalks];
const talks1971Plus = allTalks.filter(t => t.year >= 1971);
console.log(`\nBuilding citation graph from ${talks1971Plus.length} talks (1971 onward)...`);

const graph = buildCitationGraph(talks1971Plus);

console.log(`\nResults:`);
console.log(`  ${graph.edges.length} citation links`);
console.log(`  ${graph.stats.length} speakers with citations`);
console.log(`  ${graph.speakers.length} total speakers`);

const totalRefs = graph.edges.reduce((s, e) => s + e.count, 0);
console.log(`  ${totalRefs} total references`);

fs.writeFileSync(OUT_FILE, JSON.stringify(graph));

const sizeMB = (fs.statSync(OUT_FILE).size / 1024 / 1024).toFixed(2);
console.log(`\nWrote ${OUT_FILE} (${sizeMB} MB)`);
