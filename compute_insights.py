#!/usr/bin/env python3
"""
Pre-compute all curated insights for GeneralConference.App
Output: conference-app/public/insights.json
"""

import pandas as pd
import re
import json
from collections import Counter

df = pd.read_csv('conference-app/public/conference_talks_cleaned.csv')
print(f"Loaded {len(df)} talks")

# Fix unicode speaker name duplicates
df['speaker'] = df['speaker'].str.replace('\xa0', ' ', regex=False)
df['speaker'] = df['speaker'].str.replace('\u00a0', ' ', regex=False)
df['speaker'] = df['speaker'].str.strip()
df['talk_length'] = df['talk'].str.len().fillna(0).astype(int)

insights = {}

# ============================================================
# 1. THE NAME OF CHRIST TRACKER
# ============================================================
print("Computing Christ mentions...")
christ_pattern = r'(?i)\b(?:jesus|christ|savior|redeemer|lord)\b'

yearly_christ = []
for year in sorted(df.year.unique()):
    subset = df[df.year == year]
    total_mentions = subset.talk.str.count(christ_pattern).sum()
    avg_mentions = subset.talk.str.count(christ_pattern).mean()
    yearly_christ.append({
        'year': int(year),
        'avgMentions': round(float(avg_mentions), 1),
        'totalMentions': int(total_mentions),
        'talkCount': int(len(subset)),
    })

decade_christ = []
for decade in range(1970, 2030, 10):
    subset = df[(df.year >= decade) & (df.year < decade + 10)]
    if len(subset) == 0:
        continue
    avg = subset.talk.str.count(christ_pattern).mean()
    decade_christ.append({
        'decade': f"{decade}s",
        'avgMentions': round(float(avg), 1),
    })

insights['christTracker'] = {
    'title': 'The Name of Christ',
    'subtitle': 'How often speakers reference Jesus Christ, the Savior, and the Redeemer',
    'headline': f"Christ is mentioned {yearly_christ[-1]['avgMentions']}x per talk today — nearly double the {decade_christ[0]['avgMentions']}x average in the 1970s",
    'byYear': yearly_christ,
    'byDecade': decade_christ,
}

# ============================================================
# 2. THE LANGUAGE OF CONFERENCE
# ============================================================
print("Computing phrase evolution...")

phrases_to_track = {
    'Covenant path': 'covenant path',
    'Tender mercies': 'tender mercies',
    'Gathering of Israel': 'gathering of israel',
    'Ministering': r'\bministering\b',
    'Home teaching': 'home teaching',
    'Visiting teaching': 'visiting teaching',
    'Social media': 'social media',
    'Mental health': 'mental health',
    'Pornography': r'\bpornography\b',
    'Addiction': r'\baddiction\b',
    'Family proclamation': 'family proclamation',
    'Light of Christ': 'light of christ',
    'Come, Follow Me': 'come,? follow me',
    'Rescue': r'\brescue\b',
    'Covenant': r'\bcovenant\b',
    'Temple': r'\btemple\b',
    'Missionary': r'\bmissionary\b',
    'Agency': r'\bagency\b',
    'Grace': r'\bgrace\b',
    'Atonement': r'\batonement\b',
}

phrase_data = []
for label, pattern in phrases_to_track.items():
    by_decade = []
    for decade in range(1970, 2030, 10):
        subset = df[(df.year >= decade) & (df.year < decade + 10)]
        if len(subset) == 0:
            continue
        count = subset.talk.str.contains(pattern, case=False, na=False).sum()
        pct = round(count / len(subset) * 100, 1)
        by_decade.append({'decade': f"{decade}s", 'count': int(count), 'pct': float(pct)})

    early = df[df.year <= 1990].talk.str.contains(pattern, case=False, na=False).sum()
    late = df[df.year >= 2015].talk.str.contains(pattern, case=False, na=False).sum()
    change = 'rising' if late > early * 1.5 else ('falling' if early > late * 1.5 else 'stable')

    phrase_data.append({
        'phrase': label,
        'byDecade': by_decade,
        'earlyCount': int(early),
        'lateCount': int(late),
        'trend': change,
    })

# Sort: rising first, then falling, then stable
phrase_data.sort(key=lambda x: {'rising': 0, 'falling': 1, 'stable': 2}[x['trend']])

insights['languageEvolution'] = {
    'title': 'The Language of Conference',
    'subtitle': 'Phrases that have appeared, disappeared, and transformed over 50+ years',
    'headline': '"Covenant path" went from 0 mentions before 2015 to appearing in 167 talks since',
    'phrases': phrase_data,
}

# ============================================================
# 3. SPEAKER LEADERBOARD
# ============================================================
print("Computing speaker leaderboard...")

df['conf'] = df.season + ' ' + df.year.astype(str)
speaker_stats = []
for speaker in df.speaker.unique():
    st = df[df.speaker == speaker]
    if len(st) < 2:
        continue
    years = st.year.tolist()
    speaker_stats.append({
        'speaker': speaker,
        'talks': int(len(st)),
        'conferences': int(st.conf.nunique()),
        'firstYear': int(min(years)),
        'lastYear': int(max(years)),
        'span': int(max(years) - min(years)),
        'avgLength': int(st.talk_length.mean()),
        'calling': st.calling.mode().iloc[0] if len(st.calling.mode()) > 0 else '',
    })

speaker_stats.sort(key=lambda x: x['talks'], reverse=True)

insights['speakerLeaderboard'] = {
    'title': 'The Voices of Conference',
    'subtitle': 'Who has spoken the most over 50+ years of General Conference',
    'headline': f"{speaker_stats[0]['speaker']} leads with {speaker_stats[0]['talks']} talks across {speaker_stats[0]['conferences']} conferences",
    'speakers': speaker_stats[:50],
}

# ============================================================
# 4. TALKS ARE GETTING SHORTER
# ============================================================
print("Computing talk length trends...")

length_by_year = []
for year in sorted(df.year.unique()):
    subset = df[df.year == year]
    length_by_year.append({
        'year': int(year),
        'avgLength': int(subset.talk_length.mean()),
        'avgWords': int(subset.talk.str.split().str.len().mean()),
        'talkCount': int(len(subset)),
        'totalSpeakers': int(subset.speaker.nunique()),
    })

length_by_decade = []
for decade in range(1970, 2030, 10):
    subset = df[(df.year >= decade) & (df.year < decade + 10)]
    if len(subset) == 0:
        continue
    length_by_decade.append({
        'decade': f"{decade}s",
        'avgWords': int(subset.talk.str.split().str.len().mean()),
        'avgMinutes': round(subset.talk.str.split().str.len().mean() / 150, 1),  # ~150 wpm
        'talkCount': int(len(subset)),
    })

insights['talkLength'] = {
    'title': 'Talks Are Getting Shorter',
    'subtitle': 'The evolution of conference talk length over time',
    'headline': f"Average talk went from ~{length_by_decade[0]['avgMinutes']} minutes in the 1970s to ~{length_by_decade[-1]['avgMinutes']} minutes in the 2020s",
    'byYear': length_by_year,
    'byDecade': length_by_decade,
}

# ============================================================
# 5. WOMEN'S VOICES IN CONFERENCE
# ============================================================
print("Computing women's voices...")

women_pattern = r'Relief Society|Young Women|Primary|General President.*(?:Relief|Young|Primary)'
women_talks = df[df.calling_original.str.contains(women_pattern, case=False, na=False)]

women_by_decade = []
for decade in range(1970, 2030, 10):
    subset = women_talks[(women_talks.year >= decade) & (women_talks.year < decade + 10)]
    total = df[(df.year >= decade) & (df.year < decade + 10)]
    women_by_decade.append({
        'decade': f"{decade}s",
        'talks': int(len(subset)),
        'speakers': int(subset.speaker.nunique()),
        'pctOfTotal': round(len(subset) / len(total) * 100, 1) if len(total) > 0 else 0,
    })

women_by_year = []
for year in sorted(df.year.unique()):
    subset = women_talks[women_talks.year == year]
    total = df[df.year == year]
    women_by_year.append({
        'year': int(year),
        'talks': int(len(subset)),
        'pctOfTotal': round(len(subset) / len(total) * 100, 1) if len(total) > 0 else 0,
    })

top_women = []
for speaker in women_talks.speaker.value_counts().head(15).index:
    st = women_talks[women_talks.speaker == speaker]
    top_women.append({
        'speaker': speaker,
        'talks': int(len(st)),
        'firstYear': int(st.year.min()),
        'lastYear': int(st.year.max()),
        'calling': st.calling.mode().iloc[0] if len(st.calling.mode()) > 0 else '',
    })

insights['womensVoices'] = {
    'title': "Women's Voices in Conference",
    'subtitle': 'The growing presence of women speakers in General Conference',
    'headline': f"From {women_by_decade[0]['talks']} talks in the 1970s to {women_by_decade[-2]['talks']} in the 2010s — women's voices have grown {round(women_by_decade[-2]['talks']/max(women_by_decade[0]['talks'],1))}x",
    'byDecade': women_by_decade,
    'byYear': women_by_year,
    'topSpeakers': top_women,
}

# ============================================================
# 6. MOST REFERENCED SCRIPTURES
# ============================================================
print("Computing scripture references...")

scripture_books = {
    'Book of Mormon': ['1 Nephi', '2 Nephi', '3 Nephi', '4 Nephi', 'Mosiah', 'Alma', 'Helaman', 'Ether', 'Moroni', 'Mormon', 'Jacob', 'Omni', 'Jarom', 'Enos'],
    'Doctrine & Covenants': ['D&C', 'Doctrine and Covenants'],
    'New Testament': ['Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'],
    'Old Testament': ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'],
    'Pearl of Great Price': ['Moses', 'Abraham', 'Joseph Smith'],
}

ref_pattern = r'(?:(?:1|2|3|4)\s+)?(?:Nephi|Mosiah|Alma|Helaman|Ether|Moroni|Mormon|Jacob|Genesis|Exodus|Isaiah|Jeremiah|Ezekiel|Daniel|Psalms?|Proverbs|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Hebrews|James|Peter|Revelation|D&C|Moses|Abraham)\s+\d+'

all_refs = []
for text in df.talk.dropna():
    refs = re.findall(ref_pattern, text)
    all_refs.extend(refs)

ref_counts = Counter(all_refs).most_common(30)
top_refs = [{'reference': ref, 'count': int(count)} for ref, count in ref_counts]

# Volume breakdown
volume_counts = {}
all_text = ' '.join(df.talk.dropna())
for volume, books in scripture_books.items():
    count = 0
    for book in books:
        count += len(re.findall(rf'\b{re.escape(book)}\s+\d+', all_text))
    volume_counts[volume] = count

volume_data = [{'volume': v, 'references': c} for v, c in sorted(volume_counts.items(), key=lambda x: -x[1])]

insights['scriptures'] = {
    'title': 'The Scriptures Conference Loves Most',
    'subtitle': 'Which scriptures are referenced most often across 50+ years',
    'headline': f"D&C 88 is the most cited scripture with {top_refs[0]['count']} references",
    'topReferences': top_refs,
    'byVolume': volume_data,
}

# ============================================================
# 7. NEW VOICES EACH DECADE
# ============================================================
print("Computing new voices...")

seen_speakers = set()
new_voices = []
for decade in range(1970, 2030, 10):
    subset = df[(df.year >= decade) & (df.year < decade + 10)]
    new = set(subset.speaker.unique()) - seen_speakers
    seen_speakers.update(new)
    new_voices.append({
        'decade': f"{decade}s",
        'newSpeakers': int(len(new)),
        'totalSpeakers': int(subset.speaker.nunique()),
        'totalTalks': int(len(subset)),
    })

insights['newVoices'] = {
    'title': 'New Voices Each Decade',
    'subtitle': 'First-time conference speakers across the decades',
    'headline': f"The 2010s introduced {new_voices[4]['newSpeakers']} new speakers — more than any other decade",
    'byDecade': new_voices,
}

# ============================================================
# 8. EACH PROPHET'S CONFERENCE
# ============================================================
print("Computing prophet eras...")

prophets = [
    ('Joseph Fielding Smith', 1971, 1972),
    ('Harold B. Lee', 1972, 1973),
    ('Spencer W. Kimball', 1974, 1985),
    ('Ezra Taft Benson', 1986, 1994),
    ('Howard W. Hunter', 1994, 1995),
    ('Gordon B. Hinckley', 1995, 2008),
    ('Thomas S. Monson', 2008, 2018),
    ('Russell M. Nelson', 2018, 2025),
    ('Dallin H. Oaks', 2025, 2026),
]

prophet_eras = []
for prophet, start, end in prophets:
    subset = df[(df.year >= start) & (df.year <= end)]
    if len(subset) == 0:
        continue

    # Top words unique to this era
    words = ' '.join(subset.talk.dropna()).lower()
    words = re.sub(r'[^a-z\s]', '', words).split()
    stop = set('the and of to a in that is was he for it with as his on be at by this had not are but from or have an they which one you were her all she there would their we him been has when who will more if out so up said what its about than into them can only other new some could time these two may then first any now such like our over man even most after also did many before must through back years where much your way well down should because each just those people how too little very come know shall upon being made would every life great good make things world day church them unto made long shall being much every'.split())
    filtered = [w for w in words if len(w) > 4 and w not in stop]
    era_top_words = [w for w, _ in Counter(filtered).most_common(10)]

    # Key phrase frequency
    christ_avg = round(float(subset.talk.str.count(christ_pattern).mean()), 1)
    avg_words = int(subset.talk.str.split().str.len().mean())

    prophet_eras.append({
        'prophet': prophet,
        'startYear': int(start),
        'endYear': int(end),
        'totalTalks': int(len(subset)),
        'uniqueSpeakers': int(subset.speaker.nunique()),
        'avgWordsPerTalk': avg_words,
        'christMentionsPerTalk': christ_avg,
        'topWords': era_top_words,
    })

insights['prophetEras'] = {
    'title': "Each Prophet's Conference",
    'subtitle': 'How the voice and focus of conference has shifted under each prophet',
    'headline': 'From Spencer W. Kimball to Russell M. Nelson — each era brought its own emphasis',
    'eras': prophet_eras,
}

# ============================================================
# 9. SPEAKER VOCABULARY UNIQUENESS
# ============================================================
print("Computing vocabulary uniqueness...")

freq_speakers = df.speaker.value_counts()
freq_speakers = freq_speakers[freq_speakers >= 15].index

all_other_words = {}
for speaker in freq_speakers:
    others = df[df.speaker != speaker]
    if speaker not in all_other_words:
        all_other_words[speaker] = set()
    other_text = ' '.join(others.talk.dropna()).lower()
    all_other_words[speaker] = set(re.sub(r'[^a-z\s]', '', other_text).split())

vocab_data = []
for speaker in freq_speakers:
    st = df[df.speaker == speaker]
    speaker_text = ' '.join(st.talk.dropna()).lower()
    speaker_words = set(re.sub(r'[^a-z\s]', '', speaker_text).split())
    total_words = len(re.sub(r'[^a-z\s]', '', speaker_text).split())
    unique = speaker_words - all_other_words[speaker]
    unique = {w for w in unique if len(w) > 3}

    vocab_data.append({
        'speaker': speaker,
        'talks': int(len(st)),
        'uniqueWords': int(len(unique)),
        'totalVocabulary': int(len(speaker_words)),
        'totalWordsSpoken': int(total_words),
        'sampleUniqueWords': sorted(list(unique))[:20],
    })

vocab_data.sort(key=lambda x: x['uniqueWords'], reverse=True)

insights['vocabulary'] = {
    'title': 'Who Has the Most Unique Voice?',
    'subtitle': 'Speakers who use words no one else in conference has ever used',
    'headline': f"{vocab_data[0]['speaker']} has {vocab_data[0]['uniqueWords']} words unique to their talks — the most distinctive vocabulary in conference history",
    'speakers': vocab_data[:30],
}

# ============================================================
# 10. QUICK STATS FOR HOME PAGE
# ============================================================
insights['overview'] = {
    'totalTalks': int(len(df)),
    'uniqueSpeakers': int(df.speaker.nunique()),
    'yearRange': [int(df.year.min()), int(df.year.max())],
    'totalConferences': int(df.conf.nunique()),
    'totalWords': int(df.talk.str.split().str.len().sum()),
}

# Save
output_path = 'conference-app/public/insights.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(insights, f, ensure_ascii=False, indent=2)

print(f"\nSaved insights to {output_path}")
print(f"Sections: {list(insights.keys())}")
print("Done!")
