#!/usr/bin/env python3
"""
Compute ALL insights for GeneralConference.App v2
Adds: apostle profiles, roster, April vs October, talk openings,
scripture habits, topic pairs, speaker similarity, service timelines
"""

import pandas as pd
import re
import json
import math
from collections import Counter
from difflib import SequenceMatcher

# Load existing insights
with open('conference-app/public/insights.json', 'r', encoding='utf-8') as f:
    insights = json.load(f)

df = pd.read_csv('conference-app/public/conference_talks_cleaned.csv')
df['speaker'] = df['speaker'].str.replace('\xa0', ' ', regex=False).str.strip()
df['talk_length'] = df['talk'].str.len().fillna(0).astype(int)
df['word_count'] = df['talk'].str.split().str.len().fillna(0).astype(int)
df['conf'] = df.season + ' ' + df.year.astype(str)
print(f"Loaded {len(df)} talks")

# ============================================================
# CURRENT CHURCH LEADERSHIP (as of 2025)
# ============================================================
CURRENT_LEADERS = [
    # First Presidency
    {"name": "Dallin H. Oaks", "calling": "President of the Church", "group": "First Presidency", "ordained_apostle": 1984, "slug": "dallin-h-oaks"},
    {"name": "Henry B. Eyring", "calling": "First Counselor in the First Presidency", "group": "First Presidency", "ordained_apostle": 1995, "slug": "henry-b-eyring"},
    {"name": "Jeffrey R. Holland", "calling": "Second Counselor in the First Presidency", "group": "First Presidency", "ordained_apostle": 1994, "slug": "jeffrey-r-holland"},
    # Quorum of the Twelve
    {"name": "Dieter F. Uchtdorf", "calling": "President of the Quorum of the Twelve", "group": "Quorum of the Twelve", "ordained_apostle": 2004, "slug": "dieter-f-uchtdorf"},
    {"name": "David A. Bednar", "calling": "Of the Quorum of the Twelve Apostles", "group": "Quorum of the Twelve", "ordained_apostle": 2004, "slug": "david-a-bednar"},
    {"name": "Quentin L. Cook", "calling": "Of the Quorum of the Twelve Apostles", "group": "Quorum of the Twelve", "ordained_apostle": 2007, "slug": "quentin-l-cook"},
    {"name": "D. Todd Christofferson", "calling": "Of the Quorum of the Twelve Apostles", "group": "Quorum of the Twelve", "ordained_apostle": 2008, "slug": "d-todd-christofferson"},
    {"name": "Neil L. Andersen", "calling": "Of the Quorum of the Twelve Apostles", "group": "Quorum of the Twelve", "ordained_apostle": 2009, "slug": "neil-l-andersen"},
    {"name": "Ronald A. Rasband", "calling": "Of the Quorum of the Twelve Apostles", "group": "Quorum of the Twelve", "ordained_apostle": 2015, "slug": "ronald-a-rasband"},
    {"name": "Gary E. Stevenson", "calling": "Of the Quorum of the Twelve Apostles", "group": "Quorum of the Twelve", "ordained_apostle": 2015, "slug": "gary-e-stevenson"},
    {"name": "Dale G. Renlund", "calling": "Of the Quorum of the Twelve Apostles", "group": "Quorum of the Twelve", "ordained_apostle": 2015, "slug": "dale-g-renlund"},
    {"name": "Gerrit W. Gong", "calling": "Of the Quorum of the Twelve Apostles", "group": "Quorum of the Twelve", "ordained_apostle": 2018, "slug": "gerrit-w-gong"},
    {"name": "Ulisses Soares", "calling": "Of the Quorum of the Twelve Apostles", "group": "Quorum of the Twelve", "ordained_apostle": 2018, "slug": "ulisses-soares"},
    {"name": "Patrick Kearon", "calling": "Of the Quorum of the Twelve Apostles", "group": "Quorum of the Twelve", "ordained_apostle": 2024, "slug": "patrick-kearon"},
]

stop = set('the and of to a in that is was he for it with as his on be at by this had not are but from or have an they which one you were her all she there would their we him been has when who will more if out so up said what its about than into them can only other new some could time these two may then first any now such like our over man even most after also did many before must through back years where much your way well down should because each just those people how too little very come know shall upon being made would every life great good make things world day church them unto made long shall being much every'.split())

christ_pattern = r'(?i)\b(?:jesus|christ|savior|redeemer|lord)\b'

# ============================================================
# 1. INDIVIDUAL APOSTLE/LEADER PROFILES
# ============================================================
print("Computing individual leader profiles...")

def get_top_words(texts, n=20):
    all_words = ' '.join(texts).lower()
    all_words = re.sub(r'[^a-z\s]', '', all_words).split()
    filtered = [w for w in all_words if len(w) > 4 and w not in stop]
    return [w for w, _ in Counter(filtered).most_common(n)]

def get_signature_phrases(speaker_talks, all_talks_text, n=10):
    """Find 2-3 word phrases this speaker uses disproportionately more than others."""
    speaker_text = ' '.join(speaker_talks).lower()
    speaker_words = re.sub(r'[^a-z\s]', '', speaker_text).split()

    # Build bigrams
    speaker_bigrams = Counter()
    for i in range(len(speaker_words) - 1):
        w1, w2 = speaker_words[i], speaker_words[i+1]
        if w1 not in stop and w2 not in stop and len(w1) > 3 and len(w2) > 3:
            speaker_bigrams[(w1, w2)] += 1

    # Compare to overall
    all_words = re.sub(r'[^a-z\s]', '', all_talks_text.lower()).split()
    all_bigrams = Counter()
    for i in range(len(all_words) - 1):
        w1, w2 = all_words[i], all_words[i+1]
        if w1 not in stop and w2 not in stop and len(w1) > 3 and len(w2) > 3:
            all_bigrams[(w1, w2)] += 1

    # Find phrases with highest relative frequency
    results = []
    total_speaker = sum(speaker_bigrams.values()) or 1
    total_all = sum(all_bigrams.values()) or 1
    for bigram, count in speaker_bigrams.most_common(200):
        if count < 3:
            continue
        speaker_freq = count / total_speaker
        all_freq = all_bigrams.get(bigram, 1) / total_all
        ratio = speaker_freq / all_freq if all_freq > 0 else 0
        if ratio > 1.5:
            results.append({
                'phrase': f"{bigram[0]} {bigram[1]}",
                'count': count,
                'ratio': round(ratio, 1),
            })

    results.sort(key=lambda x: x['count'] * x['ratio'], reverse=True)
    return results[:n]

scripture_pattern = r'(?:(?:1|2|3|4)\s+)?(?:Nephi|Mosiah|Alma|Helaman|Ether|Moroni|Mormon|Jacob|Genesis|Exodus|Isaiah|Jeremiah|Ezekiel|Daniel|Psalms?|Proverbs|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Hebrews|James|Peter|Revelation|D&C|Moses|Abraham)\s+\d+'

all_talks_text = ' '.join(df.talk.dropna())

apostle_profiles = []
for leader in CURRENT_LEADERS:
    name = leader['name']
    talks = df[df.speaker == name].sort_values('year')
    if len(talks) == 0:
        # Try fuzzy match
        for s in df.speaker.unique():
            if name.split()[-1].lower() in s.lower():
                talks = df[df.speaker == s].sort_values('year')
                if len(talks) > 0:
                    name = s
                    break

    if len(talks) == 0:
        apostle_profiles.append({**leader, 'name': leader['name'], 'totalTalks': 0, 'talks': []})
        continue

    talk_texts = talks.talk.dropna().tolist()

    # Scripture refs
    all_refs = []
    for text in talk_texts:
        refs = re.findall(scripture_pattern, text)
        all_refs.extend(refs)
    top_scriptures = [{'ref': r, 'count': c} for r, c in Counter(all_refs).most_common(10)]

    # Christ mentions per talk over time
    christ_by_year = []
    for _, row in talks.iterrows():
        if pd.notna(row.talk):
            mentions = len(re.findall(christ_pattern, row.talk))
            christ_by_year.append({'year': int(row.year), 'season': row.season, 'mentions': mentions})

    # Talk list
    talk_list = []
    for _, row in talks.iterrows():
        talk_list.append({
            'title': row.title,
            'year': int(row.year),
            'season': row.season,
            'wordCount': int(row.word_count) if pd.notna(row.word_count) else 0,
        })

    # Signature phrases
    sig_phrases = get_signature_phrases(talk_texts, all_talks_text)

    # Top words
    top_words = get_top_words(talk_texts)

    # Avg talk length trend (by 5-year windows)
    length_trend = []
    for start in range(int(talks.year.min()), int(talks.year.max()) + 1, 5):
        window = talks[(talks.year >= start) & (talks.year < start + 5)]
        if len(window) > 0:
            length_trend.append({
                'period': f"{start}-{start+4}",
                'avgWords': int(window.word_count.mean()),
            })

    years_active = sorted(talks.year.unique().tolist())

    profile = {
        **leader,
        'name': name,
        'totalTalks': int(len(talks)),
        'firstTalk': int(talks.year.min()),
        'lastTalk': int(talks.year.max()),
        'totalConferences': int(talks.conf.nunique()),
        'avgWordsPerTalk': int(talks.word_count.mean()),
        'avgChristMentions': round(float(talks.talk.str.count(christ_pattern).mean()), 1),
        'topWords': top_words,
        'signaturePhrases': sig_phrases,
        'topScriptures': top_scriptures,
        'christByYear': christ_by_year,
        'lengthTrend': length_trend,
        'talks': talk_list,
        'yearsActive': [int(y) for y in years_active],
    }
    apostle_profiles.append(profile)
    print(f"  {name}: {len(talks)} talks")

insights['apostleProfiles'] = apostle_profiles

# ============================================================
# 2. ROSTER - WHO'S DUE TO SPEAK
# ============================================================
print("Computing roster...")

# Get all speakers from recent conferences
recent = df[df.year >= 2020]
all_recent_speakers = recent.speaker.unique()

roster = []
for leader in CURRENT_LEADERS:
    name = leader['name']
    # Find in data
    speaker_talks = df[df.speaker == name]
    if len(speaker_talks) == 0:
        for s in df.speaker.unique():
            if leader['name'].split()[-1].lower() in s.lower():
                speaker_talks = df[df.speaker == s]
                if len(speaker_talks) > 0:
                    name = s
                    break

    last_talk_year = int(speaker_talks.year.max()) if len(speaker_talks) > 0 else 0
    last_talk_season = speaker_talks[speaker_talks.year == last_talk_year].season.iloc[-1] if len(speaker_talks) > 0 else ''

    # Count talks in last 5 years
    recent_talks = speaker_talks[speaker_talks.year >= 2020]
    talks_per_conf = len(recent_talks) / max(1, recent_talks.conf.nunique()) if len(recent_talks) > 0 else 0

    # Conferences since last talk
    all_confs = sorted(df[['year', 'season']].drop_duplicates().values.tolist(), key=lambda x: (x[0], 0 if x[1] == 'April' else 1))
    last_conf_idx = -1
    for i, (y, s) in enumerate(all_confs):
        if y == last_talk_year and s == last_talk_season:
            last_conf_idx = i
    confs_since = len(all_confs) - 1 - last_conf_idx if last_conf_idx >= 0 else 999

    roster.append({
        **leader,
        'name': name,
        'totalTalks': int(len(speaker_talks)),
        'lastTalkYear': last_talk_year,
        'lastTalkSeason': last_talk_season,
        'confsSinceLastTalk': confs_since,
        'recentTalks': int(len(recent_talks)),
        'talksPerConf': round(float(talks_per_conf), 2),
    })

roster.sort(key=lambda x: -x['confsSinceLastTalk'])
insights['roster'] = roster

# ============================================================
# 2b. SEVENTY PROFILES - All speakers who served as Seventies
# ============================================================
print("Computing Seventy profiles...")

seventy_pattern_calling = r'(?i)sevent|first council'
seventy_speakers = df[df.calling.str.contains(seventy_pattern_calling, na=False)].speaker.unique()
print(f"  Found {len(seventy_speakers)} unique Seventy speakers")

seventy_profiles = []
for name in seventy_speakers:
    talks = df[df.speaker == name].sort_values('year')
    if len(talks) == 0:
        continue

    # Determine their seventy-specific calling (most recent one with 'Seventy' or 'First Council')
    seventy_talks = talks[talks.calling.str.contains(seventy_pattern_calling, na=False)]
    seventy_calling = seventy_talks.iloc[-1].calling if len(seventy_talks) > 0 else ''

    # Their most recent calling overall (they may have been promoted to apostle etc.)
    latest_calling = talks.iloc[-1].calling

    talk_texts = talks.talk.dropna().tolist()
    if len(talk_texts) == 0:
        continue

    # Scripture refs
    all_refs = []
    for text in talk_texts:
        refs = re.findall(scripture_pattern, text)
        all_refs.extend(refs)
    top_scriptures = [{'ref': r, 'count': c} for r, c in Counter(all_refs).most_common(10)]

    # Christ mentions per talk over time
    christ_by_year = []
    for _, row in talks.iterrows():
        if pd.notna(row.talk):
            mentions = len(re.findall(christ_pattern, row.talk))
            christ_by_year.append({'year': int(row.year), 'season': row.season, 'mentions': mentions})

    # Talk list
    talk_list = []
    for _, row in talks.iterrows():
        talk_list.append({
            'title': row.title,
            'year': int(row.year),
            'season': row.season,
            'wordCount': int(row.word_count) if pd.notna(row.word_count) else 0,
            'calling': row.calling,
            'url': row.url if pd.notna(row.url) else '',
        })

    # Signature phrases
    sig_phrases = get_signature_phrases(talk_texts, all_talks_text)

    # Top words
    top_words = get_top_words(talk_texts)

    # Avg talk length trend (by 5-year windows)
    length_trend = []
    for start in range(int(talks.year.min()), int(talks.year.max()) + 1, 5):
        window = talks[(talks.year >= start) & (talks.year < start + 5)]
        if len(window) > 0 and pd.notna(window.word_count).any():
            length_trend.append({
                'period': f"{start}-{start+4}",
                'avgWords': int(window.word_count.mean()),
            })

    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

    profile = {
        'name': name,
        'seventyCalling': seventy_calling,
        'latestCalling': latest_calling,
        'slug': slug,
        'totalTalks': int(len(talks)),
        'firstTalk': int(talks.year.min()),
        'lastTalk': int(talks.year.max()),
        'totalConferences': int(talks.conf.nunique()),
        'avgWordsPerTalk': int(talks.word_count.mean()) if pd.notna(talks.word_count).any() else 0,
        'avgChristMentions': round(float(talks.talk.str.count(christ_pattern).mean()), 1),
        'topWords': top_words,
        'signaturePhrases': sig_phrases,
        'topScriptures': top_scriptures,
        'christByYear': christ_by_year,
        'lengthTrend': length_trend,
        'talks': talk_list,
        'yearsActive': [int(y) for y in sorted(talks.year.unique().tolist())],
    }
    seventy_profiles.append(profile)

seventy_profiles.sort(key=lambda x: -x['totalTalks'])
insights['seventyProfiles'] = seventy_profiles
print(f"  Generated {len(seventy_profiles)} seventy profiles")

# ============================================================
# 3. APRIL VS OCTOBER
# ============================================================
print("Computing April vs October...")

april = df[df.season == 'April']
october = df[df.season == 'October']

april_vs_oct = {
    'title': 'April vs October',
    'subtitle': 'Are there measurable differences between spring and fall conference?',
    'april': {
        'totalTalks': int(len(april)),
        'avgWords': int(april.word_count.mean()),
        'avgChristMentions': round(float(april.talk.str.count(christ_pattern).mean()), 1),
        'uniqueSpeakers': int(april.speaker.nunique()),
    },
    'october': {
        'totalTalks': int(len(october)),
        'avgWords': int(october.word_count.mean()),
        'avgChristMentions': round(float(october.talk.str.count(christ_pattern).mean()), 1),
        'uniqueSpeakers': int(october.speaker.nunique()),
    },
    'byYear': [],
}

for year in sorted(df.year.unique()):
    a = df[(df.year == year) & (df.season == 'April')]
    o = df[(df.year == year) & (df.season == 'October')]
    april_vs_oct['byYear'].append({
        'year': int(year),
        'aprilTalks': int(len(a)),
        'octoberTalks': int(len(o)),
        'aprilAvgWords': int(a.word_count.mean()) if len(a) > 0 else 0,
        'octoberAvgWords': int(o.word_count.mean()) if len(o) > 0 else 0,
    })

insights['aprilVsOctober'] = april_vs_oct

# ============================================================
# 4. HOW TALKS BEGIN
# ============================================================
print("Computing talk openings...")

def get_opening(text, max_chars=200):
    if not text or pd.isna(text):
        return ''
    # Get first sentence or first N chars
    sentences = re.split(r'[.!?]', text)
    opening = sentences[0].strip() if sentences else text[:max_chars]
    return opening[:max_chars]

def classify_opening(text):
    if not text:
        return 'unknown'
    lower = text.lower().strip()

    # --- greeting: addressing the audience (MUST come first) ---
    if re.search(r'^(my (dear|beloved))? ?(brothers|sisters|brethren) (and|,)', lower):
        return 'greeting'
    if re.search(r'^(dear (brothers|sisters|friends|brethren))', lower):
        return 'greeting'
    if re.search(r'^(brothers and sisters|brethren and sisters|beloved brethren|beloved brothers)', lower):
        return 'greeting'
    if re.search(r'^(good (morning|afternoon|evening)|aloha|what a (joy|privilege|blessing|wonderful|glorious))', lower):
        return 'greeting'
    if re.search(r'^brethren[,.]', lower):
        return 'greeting'
    if re.search(r'^(i add my (word of welcome|welcome)|i (want to )?welcome)', lower):
        return 'greeting'

    # --- gratitude/testimony: thanks, testimony, appreciation ---
    if re.search(r'^(i (am |\'m )(grateful|thankful|humbled)|i appreciate|i (bear|add) (my )?testimony|i (know|testify) that)', lower):
        return 'gratitude/testimony'
    if re.search(r'^(we thank thee|each time we sing|with gratitude|my heart is full)', lower):
        return 'gratitude/testimony'
    if re.search(r'^thank you', lower):
        return 'gratitude/testimony'
    if re.search(r'^it.{0,5}s? (been a |a )?(blessing|privilege|honor|joy|thrill|wonderful)', lower):
        return 'gratitude/testimony'
    if re.search(r'^(who can help but be (uplifted|inspired))', lower):
        return 'gratitude/testimony'

    # --- question: opens with a question ---
    if re.search(r'^(have you ever|what (if|would|does|is|do|are|can)|why (do|is|are|does)|how (do|can|many|wonderful)|do you (ever|remember|know)|can you|could you|is it|are we|will you|would you)', lower):
        return 'question'
    if re.search(r'^(if you (had|could|were)|will you join|is the )', lower):
        return 'question'
    if re.search(r'^perhaps i could begin with .{0,20}question', lower):
        return 'question'

    # --- scripture/quote: opens with scripture or direct quote ---
    if re.search(r'^[\u201c\u201d"\u2018\u2019\']', lower):
        return 'scripture/quote'
    if re.search(r'^(the (scriptures?|bible|book of mormon|holy bible|doctrine and covenants|pearl of great price) (is|say|tell|record|teach|declare))', lower):
        return 'scripture/quote'
    if re.search(r'^(in the book of|as we read in|as (recorded|written|stated) in)', lower):
        return 'scripture/quote'
    if re.search(r'^the (lord|savior|master|prophet|apostle paul|lord jesus christ) (said|taught|declared|proclaimed|counseled|has said)', lower):
        return 'scripture/quote'
    if re.search(r'^(in the beginning was|for god so loved)', lower):
        return 'scripture/quote'
    if re.search(r'^in \d+ ?(thessalonians|corinthians|kings|samuel|chronicles|nephi|timothy|peter|john)', lower):
        return 'scripture/quote'
    if re.search(r'^after the (resurrection|crucifixion|ascension|last supper|death of)', lower):
        return 'scripture/quote'
    if re.search(r'^the day (after|before|when) jesus', lower):
        return 'scripture/quote'
    if re.search(r'\((gen|ex|lev|num|deut|matt|mark|luke|john|acts|rom|[12] cor|gal|eph|heb|james|[12] ne|mosiah|alma|hel|[34] ne|morm|ether|moro|d&c|d\&c|abr|moses)\b', lower):
        return 'scripture/quote'

    # --- reference to speaker: mentions another speaker, assignment, or prior talk ---
    if re.search(r'^(president|elder|sister|brother) [a-z]', lower):
        return 'reference to speaker'
    if re.search(r'^(at the last (general )?conference|the (previous|preceding) speaker|i (have been|was) (asked|assigned|invited)|tonight we are privileged|the (young men|choir|chorus))', lower):
        return 'reference to speaker'
    if re.search(r'^(one of the greatest evidences|since (president|elder|sister))', lower):
        return 'reference to speaker'
    if re.search(r'^(last (evening|night|session)|the (attention|counsel|remarks|words) of)', lower):
        return 'reference to speaker'
    if re.search(r'^i take as my (subject|text|theme)', lower):
        return 'reference to speaker'

    # --- personal story: first-person anecdote ---
    if re.search(r'^(i (remember|recall|once|recently|was |had |grew|learned|noticed|observed|met |visited|read |heard|found|saw |stood|drove|walked|passed|sat |attended|went|knew))', lower):
        return 'personal story'
    if re.search(r'^(when i was|some (years|months|weeks|time) ago|not long ago|as a (young|child|boy|girl|student|missionary))', lower):
        return 'personal story'
    if re.search(r'^my (mother|father|wife|husband|son|daughter|grand|family|friend|companion)', lower):
        return 'personal story'
    if re.search(r'^(several|many|a few|ten|two|three|four|five|six|seven|eight|nine|[0-9]+) (years|months|weeks|days|minutes) ago', lower):
        return 'personal story'
    if re.search(r'^(may i share|let me (share|tell you|relate))', lower):
        return 'personal story'
    if re.search(r'^(since my|while (driving|walking|sitting|traveling|serving|visiting))', lower):
        return 'personal story'
    if re.search(r'^early on in my', lower):
        return 'personal story'

    # --- narrative/parable: third-person story or illustration ---
    if re.search(r'^(there (was|lived|once)|a (man|woman|young|boy|girl|mother|father|friend|farmer|teacher|story|certain|little) )', lower):
        return 'narrative/parable'
    if re.search(r'^(one (day|evening|morning|night|time|of)|an? (unhappy|elderly|old|wise|humble|faithful))', lower):
        return 'narrative/parable'
    if re.search(r'^(anna |john |mary |samuel |sarah |david |peter |brigham young)', lower):
        return 'narrative/parable'
    if re.search(r'^(when president |when george |when the (prophet|church|pioneers|early|first))', lower):
        return 'narrative/parable'

    # --- seasonal/topical: references time, holiday, current events ---
    if re.search(r'^(on this (glorious|beautiful|wonderful|special|sacred)? ?(easter|christmas|sabbath|day|morning|afternoon|evening|occasion))', lower):
        return 'seasonal/topical'
    if re.search(r'^(this (easter|christmas|is a|is the|morning|afternoon|spring|fall|season|conference|time|has been a glorious))', lower):
        return 'seasonal/topical'
    if re.search(r'^(as we (gather|meet|celebrate|approach|assemble|come together)|the attention of (people|the world))', lower):
        return 'seasonal/topical'
    if re.search(r'^(we (are|live|gather|stand) (in|at|here|today|tonight|during|on))', lower):
        return 'seasonal/topical'

    # --- poem/hymn: opens with poetry, hymn, or song reference ---
    if re.search(r'^(we (just )?sang|the hymn|a poet|a poem|the (song|anthem|words of the hymn)|the chorus)', lower):
        return 'poem/hymn'

    # --- definition/wordplay: defines a word or term ---
    if re.search(r'^(the word |webster|the dictionary|to define|the (meaning|definition) of)', lower):
        return 'definition/wordplay'

    # --- exhortation: direct counsel or call to action ---
    if re.search(r'^(let us|let me (invite|encourage|urge|suggest)|i (invite|encourage|urge|ask|call upon|plead) (you|each|all|us|every))', lower):
        return 'exhortation'
    if re.search(r'^(we (must|need to|should|ought)|you (must|need|should|can|are))', lower):
        return 'exhortation'

    # --- doctrinal statement: declaration about doctrine or truth ---
    if re.search(r'^(the (atonement|resurrection|gospel|plan of|restoration|priesthood|church|kingdom|power|spirit|love|grace|mercy|family|temple|covenant|sacrament|gift|purpose|great|holy|second coming|days of the pioneers))', lower):
        return 'doctrinal statement'
    if re.search(r'^(god (is|loves|has|our)|jesus|our (heavenly father|savior|lord|redeemer))', lower):
        return 'doctrinal statement'
    if re.search(r'^(marriage|faith|repentance|prayer|baptism|charity|obedience|agency|salvation|revelation) is', lower):
        return 'doctrinal statement'
    if re.search(r'^(as (his|part of|children|members|disciples|sons|daughters|followers))', lower):
        return 'doctrinal statement'
    if re.search(r'^(a testimony|within this|one of the|more than \d)', lower):
        return 'doctrinal statement'
    if re.search(r'^(in our (world|day|time|lives|generation))', lower):
        return 'doctrinal statement'

    # --- broader catch-alls (better than "other") ---
    if re.search(r'^(it (is|was|has been|seems)|there (is|are|has|was)|today |tonight )', lower):
        return 'doctrinal statement'
    if re.search(r'^we (stand|have|are|know|live|believe|come|need)', lower):
        return 'doctrinal statement'
    if re.search(r'^(during the|at (one |a |times))', lower):
        return 'narrative/parable'
    if re.search(r'^(in (november|december|january|february|march|april|may|june|july|august|september|october) \d)', lower):
        return 'personal story'
    if re.search(r'^(in the |in a |on a |on the )', lower):
        return 'narrative/parable'
    if re.search(r'^(isn.t it|what a (marvelous|wonderful|glorious|great|beautiful|magnificent|remarkable|blessed|joyous|inspiring|incredible))', lower):
        return 'gratitude/testimony'
    if re.search(r'^(if our|wherever i|recently)', lower):
        return 'personal story'
    if re.search(r'^(of all|thirty|twenty|forty|fifty|sixty|seventy|eighty|ninety|\d+ years ago)', lower):
        return 'personal story'
    if re.search(r'^(at the request)', lower):
        return 'reference to speaker'
    if re.search(r'^when (commanded|asked|called|told|the savior|the lord|christ|jesus|moses|alma|nephi|moroni)', lower):
        return 'scripture/quote'
    if re.search(r'^i ', lower):
        return 'personal story'
    if re.search(r'^my ', lower):
        return 'personal story'
    if re.search(r'^(the |a |an )', lower):
        return 'doctrinal statement'
    if re.search(r'^(some |most |all |each |every |for |from |to |with |about |over |through |not |no )', lower):
        return 'doctrinal statement'
    if re.search(r'^when ', lower):
        return 'narrative/parable'
    if re.search(r'^(as i |as we |as a )', lower):
        return 'personal story'
    if re.search(r'^as ', lower):
        return 'doctrinal statement'
    if re.search(r'^(this (past|last|is|has|was|morning|afternoon|evening|great|conference|glorious|wonderful))', lower):
        return 'seasonal/topical'
    if re.search(r'^this ', lower):
        return 'doctrinal statement'
    if re.search(r'^(on (one|my|a|the|an|that))', lower):
        return 'personal story'
    if re.search(r'^on ', lower):
        return 'doctrinal statement'
    if re.search(r'^(last (week|month|year|spring|fall|summer|winter|conference|general))', lower):
        return 'personal story'
    if re.search(r'^last ', lower):
        return 'reference to speaker'
    if re.search(r'^our ', lower):
        return 'doctrinal statement'
    if re.search(r'^while ', lower):
        return 'personal story'
    if re.search(r'^what ', lower):
        return 'question'
    if re.search(r'^(after|during|following) ', lower):
        return 'narrative/parable'
    if re.search(r'^(years|shortly|just|now|since|throughout|if|you|young|those|many|it|we|may|so|here|at|or|but|only|life|once|like) ', lower):
        return 'doctrinal statement'
    if re.search(r'^(i\'m |i\u2019m )(grateful|thankful|humbled)', lower):
        return 'gratitude/testimony'
    if re.search(r'^(i\'m |i\u2019m )', lower):
        return 'personal story'
    if re.search(r'^sisters', lower):
        return 'greeting'

    return 'other'

openings_data = []
for decade in range(1970, 2030, 10):
    subset = df[(df.year >= decade) & (df.year < decade + 10)]
    types = Counter()
    for text in subset.talk.dropna():
        opening = get_opening(text)
        otype = classify_opening(opening)
        types[otype] += 1

    total = sum(types.values()) or 1
    openings_data.append({
        'decade': f"{decade}s",
        **{k: round(v / total * 100, 1) for k, v in types.items()},
    })

# Sample memorable openings
sample_openings = []
for _, row in df.sample(min(50, len(df))).iterrows():
    opening = get_opening(row.talk)
    if len(opening) > 30:
        sample_openings.append({
            'opening': opening,
            'speaker': row.speaker,
            'year': int(row.year),
            'title': row.title,
            'type': classify_opening(opening),
        })

insights['talkOpenings'] = {
    'title': 'How Talks Begin',
    'subtitle': 'The art of the opening line — how speakers start their conference talks',
    'byDecade': openings_data,
    'samples': sample_openings[:30],
}

# ============================================================
# 5. SCRIPTURE HABITS BY SPEAKER
# ============================================================
print("Computing scripture habits...")

bom_pattern = r'(?:(?:1|2|3|4)\s+)?(?:Nephi|Mosiah|Alma|Helaman|Ether|Moroni|Mormon|Jacob)\s+\d+'
dc_pattern = r'D&C\s+\d+'
nt_pattern = r'(?:Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Hebrews|James|Peter|Revelation)\s+\d+'
ot_pattern = r'(?:Genesis|Exodus|Isaiah|Jeremiah|Ezekiel|Daniel|Psalms?|Proverbs|Malachi)\s+\d+'

# Only speakers with 15+ talks
freq_speakers = df.speaker.value_counts()
freq_speakers = freq_speakers[freq_speakers >= 15].index

scripture_habits = []
for speaker in freq_speakers:
    st = df[df.speaker == speaker]
    texts = ' '.join(st.talk.dropna())
    bom = len(re.findall(bom_pattern, texts))
    dc = len(re.findall(dc_pattern, texts))
    nt = len(re.findall(nt_pattern, texts))
    ot = len(re.findall(ot_pattern, texts))
    total = bom + dc + nt + ot
    if total == 0:
        continue
    scripture_habits.append({
        'speaker': speaker,
        'talks': int(len(st)),
        'bookOfMormon': bom,
        'doctrineCovenants': dc,
        'newTestament': nt,
        'oldTestament': ot,
        'total': total,
        'bomPct': round(bom / total * 100, 1),
        'dcPct': round(dc / total * 100, 1),
        'ntPct': round(nt / total * 100, 1),
        'otPct': round(ot / total * 100, 1),
    })

scripture_habits.sort(key=lambda x: x['total'], reverse=True)
insights['scriptureHabits'] = {
    'title': 'Scripture Habits by Speaker',
    'subtitle': 'Which volumes do different speakers quote from most?',
    'speakers': scripture_habits[:40],
}

# ============================================================
# 6. TOPIC PAIRS (word co-occurrence)
# ============================================================
print("Computing topic pairs...")

key_themes = ['faith', 'repentance', 'baptism', 'temple', 'covenant', 'family',
    'prayer', 'scriptures', 'service', 'missionary', 'atonement', 'forgiveness',
    'obedience', 'charity', 'revelation', 'priesthood', 'tithing', 'sabbath',
    'agency', 'grace', 'resurrection', 'prophet', 'holy ghost', 'sacrament']

pair_counts = Counter()
for text in df.talk.dropna():
    lower = text.lower()
    present = [theme for theme in key_themes if theme in lower]
    for i in range(len(present)):
        for j in range(i + 1, len(present)):
            pair = tuple(sorted([present[i], present[j]]))
            pair_counts[pair] += 1

topic_pairs = []
for (t1, t2), count in pair_counts.most_common(30):
    topic_pairs.append({'topic1': t1, 'topic2': t2, 'count': int(count)})

insights['topicPairs'] = {
    'title': 'Topics That Go Together',
    'subtitle': 'Which gospel themes are most often discussed in the same talk?',
    'pairs': topic_pairs,
}

# ============================================================
# 7. SPEAKER SIMILARITY
# ============================================================
print("Computing speaker similarity...")

# Use word frequency vectors for speakers with 15+ talks
speaker_vectors = {}
for speaker in freq_speakers:
    texts = ' '.join(df[df.speaker == speaker].talk.dropna()).lower()
    words = re.sub(r'[^a-z\s]', '', texts).split()
    filtered = [w for w in words if len(w) > 4 and w not in stop]
    total = len(filtered) or 1
    freq = Counter(filtered)
    # Normalize
    speaker_vectors[speaker] = {w: c / total for w, c in freq.most_common(200)}

def cosine_sim(v1, v2):
    all_keys = set(v1.keys()) | set(v2.keys())
    dot = sum(v1.get(k, 0) * v2.get(k, 0) for k in all_keys)
    mag1 = math.sqrt(sum(v ** 2 for v in v1.values()))
    mag2 = math.sqrt(sum(v ** 2 for v in v2.values()))
    return dot / (mag1 * mag2) if mag1 > 0 and mag2 > 0 else 0

# Find most similar pairs
speakers_list = list(speaker_vectors.keys())
similarity_pairs = []
for i in range(min(len(speakers_list), 50)):
    for j in range(i + 1, min(len(speakers_list), 50)):
        s1, s2 = speakers_list[i], speakers_list[j]
        sim = cosine_sim(speaker_vectors[s1], speaker_vectors[s2])
        similarity_pairs.append({
            'speaker1': s1,
            'speaker2': s2,
            'similarity': round(sim, 3),
        })

similarity_pairs.sort(key=lambda x: x['similarity'], reverse=True)

insights['speakerSimilarity'] = {
    'title': 'Who Speaks Like Whom?',
    'subtitle': 'Speaker pairs with the most similar vocabulary and style',
    'pairs': similarity_pairs[:30],
}

# ============================================================
# 8. CONFERENCE THROUGH HISTORY
# ============================================================
print("Computing conference through history...")

world_events = [
    {'year': 1973, 'event': 'Oil Crisis / Watergate', 'keywords': ['crisis', 'nation', 'government', 'moral']},
    {'year': 1978, 'event': 'Priesthood Revelation (OD-2)', 'keywords': ['priesthood', 'revelation', 'all worthy']},
    {'year': 1989, 'event': 'Fall of Berlin Wall', 'keywords': ['freedom', 'nations', 'liberty', 'peace']},
    {'year': 1995, 'event': 'Family Proclamation', 'keywords': ['family', 'proclamation', 'marriage', 'gender']},
    {'year': 2001, 'event': 'September 11 Attacks', 'keywords': ['terror', 'peace', 'security', 'fear', 'nation']},
    {'year': 2008, 'event': 'Financial Crisis', 'keywords': ['economy', 'financial', 'temporal', 'debt', 'provident']},
    {'year': 2020, 'event': 'COVID-19 Pandemic', 'keywords': ['pandemic', 'virus', 'isolation', 'home', 'virtual']},
    {'year': 2024, 'event': 'President Nelson Age/Health', 'keywords': ['prophet', 'sustain', 'succession']},
]

history_data = []
for event in world_events:
    year = event['year']
    # Look at conference talks from that year
    year_talks = df[df.year == year]
    if len(year_talks) == 0:
        continue

    # Count keyword mentions
    keyword_hits = 0
    for text in year_talks.talk.dropna():
        for kw in event['keywords']:
            keyword_hits += len(re.findall(rf'\b{kw}\b', text, re.IGNORECASE))

    # Compare to average
    avg_year = df.groupby('year').apply(lambda x: sum(
        len(re.findall(rf'\b{kw}\b', t, re.IGNORECASE))
        for t in x.talk.dropna()
        for kw in event['keywords']
    )).mean()

    history_data.append({
        **event,
        'talkCount': int(len(year_talks)),
        'keywordMentions': int(keyword_hits),
        'avgKeywordMentions': round(float(avg_year), 1),
    })

insights['conferenceHistory'] = {
    'title': 'Conference Through History',
    'subtitle': 'How General Conference has responded to major world and Church events',
    'events': history_data,
}

# ============================================================
# 9. SERVICE TIMELINES (longest serving)
# ============================================================
print("Computing service timelines...")

# Build timeline of conference appearances
speaker_spans = []
for speaker in df.speaker.value_counts().head(50).index:
    st = df[df.speaker == speaker]
    speaker_spans.append({
        'speaker': speaker,
        'firstYear': int(st.year.min()),
        'lastYear': int(st.year.max()),
        'span': int(st.year.max() - st.year.min()),
        'talks': int(len(st)),
        'conferences': int(st.conf.nunique()),
    })

speaker_spans.sort(key=lambda x: x['span'], reverse=True)

insights['serviceTimelines'] = {
    'title': 'The Longest Serving',
    'subtitle': 'Who has spoken at conference over the longest period of time?',
    'speakers': speaker_spans[:40],
}

# ============================================================
# SAVE
# ============================================================
output = 'conference-app/public/insights.json'
with open(output, 'w', encoding='utf-8') as f:
    json.dump(insights, f, ensure_ascii=False, indent=2)

print(f"\nSaved to {output}")
print(f"Sections: {list(insights.keys())}")
print("Done!")
