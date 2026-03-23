#!/usr/bin/env python3
"""
Compute Speaker Fingerprint data for GeneralConference.App
Replaces the old "Unique Voice" (unique word count) with a multi-dimensional
speaker profile: signature phrases, rhetorical style, topic lean, distinctiveness.

Run: python compute_fingerprints.py
Output: updates conference-app/public/insights.json with 'speakerFingerprints' key
"""

import pandas as pd
import re
import json
import math
from collections import Counter

# ---------------------------------------------------------------------------
# Load data
# ---------------------------------------------------------------------------
with open('conference-app/public/insights.json', 'r', encoding='utf-8') as f:
    insights = json.load(f)

df = pd.read_csv('conference-app/public/conference_talks_cleaned.csv')
df['speaker'] = df['speaker'].str.replace('\xa0', ' ', regex=False).str.strip()
df['talk_text'] = df['talk'].fillna('')
df['word_count'] = df['talk_text'].str.split().str.len().fillna(0).astype(int)
print(f"Loaded {len(df)} talks")

# Also load historical if available
try:
    hdf = pd.read_csv('conference-app/public/historical_talks.csv')
    hdf['speaker'] = hdf['speaker'].str.replace('\xa0', ' ', regex=False).str.strip()
    hdf['talk_text'] = hdf['talk'].fillna('')
    hdf['word_count'] = hdf['talk_text'].str.split().str.len().fillna(0).astype(int)
    print(f"Loaded {len(hdf)} historical talks")
    all_df = pd.concat([df, hdf], ignore_index=True)
except FileNotFoundError:
    all_df = df.copy()
    print("No historical talks found, using modern only")

MIN_TALKS = 10  # minimum talks to be included

stop = set("""
a about above after again against all am an and any are as at be because been
before being below between both but by can could did do does doing down during
each even few for from further get got had has have having he her here hers
herself him himself his how i if in into is it its itself just let like me
might more most must my myself no nor not now of off on once only or other
our ours ourselves out over own re same shall she should so some still such
than that the their theirs them themselves then there these they this those
through to too under until up upon us very was we were what when where which
while who whom why will with would you your yours yourself yourselves
also been being come came going went said says told want wanted may much
many made make makes well very been even still just also back could would
should might shall will upon unto like know knew known things thing shall
every shall unto upon thee thou thy thine hath doth saith wherefore
unto them which were would have been this that with from they their
into were have will been more than also those other over such after each
them being these before there some these only very much also about
great shall come people time life church good world man know lord
them been which upon would more their other could into will after
those over than also about many before even some just still well every
""".split())

# ---------------------------------------------------------------------------
# Filter to speakers with enough talks
# ---------------------------------------------------------------------------
speaker_counts = all_df.groupby('speaker').size()
qualified = speaker_counts[speaker_counts >= MIN_TALKS].index.tolist()
print(f"Qualified speakers (>= {MIN_TALKS} talks): {len(qualified)}")

# Precompute all text
all_talks_text = ' '.join(all_df['talk_text'].dropna())

# ---------------------------------------------------------------------------
# 1. SIGNATURE PHRASES (bigrams + trigrams, TF-IDF style)
# ---------------------------------------------------------------------------
print("Computing signature phrases...")

def tokenize(text):
    return re.sub(r'[^a-z\s]', '', text.lower()).split()

def get_ngrams(words, n):
    grams = []
    for i in range(len(words) - n + 1):
        gram = tuple(words[i:i+n])
        if all(w not in stop and len(w) > 2 for w in gram):
            grams.append(gram)
    return grams

# Build global bigram/trigram frequencies
print("  Building global ngram frequencies...")
all_words = tokenize(all_talks_text)
global_bigrams = Counter(get_ngrams(all_words, 2))
global_trigrams = Counter(get_ngrams(all_words, 3))
total_global_bi = sum(global_bigrams.values()) or 1
total_global_tri = sum(global_trigrams.values()) or 1

def get_signature_phrases(speaker_texts, n=8):
    """Find phrases this speaker uses disproportionately more than others."""
    words = tokenize(' '.join(speaker_texts))

    results = []

    for ngram_size, global_counts, global_total in [
        (2, global_bigrams, total_global_bi),
        (3, global_trigrams, total_global_tri),
    ]:
        speaker_ngrams = Counter(get_ngrams(words, ngram_size))
        total_speaker = sum(speaker_ngrams.values()) or 1

        for gram, count in speaker_ngrams.most_common(300):
            if count < 3:
                continue
            speaker_freq = count / total_speaker
            global_freq = global_counts.get(gram, 0.5) / global_total
            ratio = speaker_freq / global_freq
            if ratio > 2.0:
                results.append({
                    'phrase': ' '.join(gram),
                    'count': count,
                    'ratio': round(ratio, 1),
                    'size': ngram_size,
                })

    # Sort by count * ratio (frequency + distinctiveness)
    results.sort(key=lambda x: x['count'] * x['ratio'], reverse=True)
    # Deduplicate: if a trigram contains a bigram, prefer the trigram
    seen_phrases = set()
    deduped = []
    for r in results:
        words_in = set(r['phrase'].split())
        # Skip if this is a subset of an already-added phrase
        if any(words_in.issubset(set(s.split())) for s in seen_phrases):
            continue
        seen_phrases.add(r['phrase'])
        deduped.append(r)
        if len(deduped) >= n:
            break

    return deduped

# ---------------------------------------------------------------------------
# 2. STYLE METRICS
# ---------------------------------------------------------------------------
print("Computing style metrics...")

def compute_style(texts):
    """Compute rhetorical style metrics from a collection of talks."""
    all_text = ' '.join(texts)
    sentences = re.split(r'[.!?]+', all_text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 10]

    words = all_text.split()
    total_words = len(words) or 1

    # Average sentence length
    avg_sentence_len = sum(len(s.split()) for s in sentences) / max(len(sentences), 1)

    # Question frequency (per 1000 words)
    questions = len(re.findall(r'\?', all_text))
    question_rate = questions / total_words * 1000

    # Scripture citation density (per 1000 words)
    scripture_pattern = r'(?:(?:1|2|3|4)\s+)?(?:Nephi|Mosiah|Alma|Helaman|Ether|Moroni|Mormon|Jacob|Genesis|Exodus|Isaiah|Jeremiah|Psalms?|Proverbs|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Hebrews|James|Peter|Revelation|D&C|Moses|Abraham)\s+\d+'
    scriptures = len(re.findall(scripture_pattern, all_text, re.IGNORECASE))
    scripture_rate = scriptures / total_words * 1000

    # I vs We ratio (personal vs inclusive)
    i_count = len(re.findall(r'\bI\b', all_text))
    we_count = len(re.findall(r'\b[Ww]e\b', all_text))
    i_we_ratio = i_count / max(we_count, 1)

    # Story/anecdote markers (per 1000 words)
    story_markers = len(re.findall(
        r'(?i)\b(?:I remember|let me share|I recall|I was once|a (?:young )?(?:man|woman|boy|girl) (?:once|who)|'
        r'years ago|one day|there was a|story of|true story|personal experience|when I was)',
        all_text
    ))
    story_rate = story_markers / total_words * 1000

    # Direct address frequency ("you/your" per 1000 words)
    you_count = len(re.findall(r'\b[Yy]ou[r]?\b', all_text))
    you_rate = you_count / total_words * 1000

    # Christ/Savior reference density (per 1000 words)
    christ_refs = len(re.findall(r'(?i)\b(?:Jesus|Christ|Savior|Redeemer)\b', all_text))
    christ_rate = christ_refs / total_words * 1000

    # Exclamation frequency (enthusiasm marker, per 1000 words)
    exclamations = len(re.findall(r'!', all_text))
    exclamation_rate = exclamations / total_words * 1000

    return {
        'avgSentenceLength': round(avg_sentence_len, 1),
        'questionRate': round(question_rate, 2),
        'scriptureRate': round(scripture_rate, 2),
        'iWeRatio': round(i_we_ratio, 2),
        'storyRate': round(story_rate, 2),
        'youRate': round(you_rate, 2),
        'christRate': round(christ_rate, 2),
        'exclamationRate': round(exclamation_rate, 2),
    }

# Compute global averages for comparison
print("  Computing global style averages...")
global_style = compute_style(all_df['talk_text'].dropna().tolist())
print(f"  Global averages: {global_style}")

# ---------------------------------------------------------------------------
# 3. TOPIC LEAN (keyword-based topic profile)
# ---------------------------------------------------------------------------
print("Computing topic profiles...")

TOPICS = {
    'Faith': r'\b(?:faith|believe|believing|trust)\b',
    'Repentance': r'\b(?:repent|repentance|forgive|forgiveness|sin|sins)\b',
    'Family': r'\b(?:family|families|marriage|husband|wife|children|mother|father|parent)\b',
    'Temple': r'\b(?:temple|temples|ordinance|ordinances|sealing|endowment)\b',
    'Service': r'\b(?:service|serve|serving|charity|charitable|compassion|neighbor)\b',
    'Missionary': r'\b(?:mission|missionary|missionaries|convert|preach|proselyte)\b',
    'Prayer': r'\b(?:pray|prayer|prayers|praying|supplication)\b',
    'Scriptures': r'\b(?:scripture|scriptures|bible|book of mormon|doctrine and covenants)\b',
    'Prophets': r'\b(?:prophet|prophets|prophetic|seer|revelator|apostle|apostles)\b',
    'Atonement': r'\b(?:atonement|atone|atoning|grace|mercy|merciful|redeem|redemption)\b',
    'Covenant': r'\b(?:covenant|covenants|promise|promises|oath|vow)\b',
    'Obedience': r'\b(?:obey|obedience|obedient|commandment|commandments)\b',
    'Hope': r'\b(?:hope|hoping|hopeful|optimism|optimistic|bright|future)\b',
    'Trials': r'\b(?:trial|trials|tribulation|adversity|affliction|suffering|hardship|endure)\b',
    'Joy': r'\b(?:joy|joyful|happiness|happy|rejoice|rejoicing|gladness|delight)\b',
    'Holy Ghost': r'\b(?:holy ghost|holy spirit|spirit|spiritual|inspiration|revelation|prompted)\b',
}

def compute_topic_profile(texts):
    """Compute relative topic emphasis for a speaker."""
    all_text = ' '.join(texts).lower()
    total_words = len(all_text.split()) or 1

    profile = {}
    for topic, pattern in TOPICS.items():
        hits = len(re.findall(pattern, all_text, re.IGNORECASE))
        profile[topic] = round(hits / total_words * 1000, 2)

    return profile

# Global topic profile for normalization
global_topic = compute_topic_profile(all_df['talk_text'].dropna().tolist())

# ---------------------------------------------------------------------------
# 4. DISTINCTIVENESS SCORE
# ---------------------------------------------------------------------------
print("Computing distinctiveness scores...")

def distinctiveness_score(style, topic_profile, global_style, global_topic):
    """How different is this speaker from the average?
    Higher = more distinctive voice."""

    # Style distance
    style_keys = ['avgSentenceLength', 'questionRate', 'scriptureRate',
                  'iWeRatio', 'storyRate', 'youRate', 'christRate']
    style_diffs = []
    for k in style_keys:
        if global_style[k] > 0:
            diff = abs(style[k] - global_style[k]) / global_style[k]
            style_diffs.append(min(diff, 3.0))  # cap at 3x deviation

    # Topic distance
    topic_diffs = []
    for topic in TOPICS:
        if global_topic.get(topic, 0) > 0:
            diff = abs(topic_profile.get(topic, 0) - global_topic[topic]) / global_topic[topic]
            topic_diffs.append(min(diff, 3.0))

    # Combined score (0-100 scale)
    avg_style = sum(style_diffs) / max(len(style_diffs), 1)
    avg_topic = sum(topic_diffs) / max(len(topic_diffs), 1)

    raw = (avg_style * 0.6 + avg_topic * 0.4) * 50
    return round(min(raw, 100), 1)

# ---------------------------------------------------------------------------
# BUILD FINGERPRINTS
# ---------------------------------------------------------------------------
print("Building speaker fingerprints...")

fingerprints = []
for speaker in qualified:
    speaker_df = all_df[all_df.speaker == speaker]
    texts = speaker_df['talk_text'].dropna().tolist()

    if not texts or sum(len(t) for t in texts) < 1000:
        continue

    n_talks = len(texts)
    total_words = int(speaker_df['word_count'].sum())

    phrases = get_signature_phrases(texts)
    style = compute_style(texts)
    topic_profile = compute_topic_profile(texts)
    score = distinctiveness_score(style, topic_profile, global_style, global_topic)

    # Find their most distinctive topic (biggest positive deviation from average)
    top_topic = None
    top_topic_ratio = 0
    for topic in TOPICS:
        if global_topic.get(topic, 0) > 0 and topic_profile.get(topic, 0) > 0:
            ratio = topic_profile[topic] / global_topic[topic]
            if ratio > top_topic_ratio:
                top_topic_ratio = ratio
                top_topic = topic

    fingerprints.append({
        'speaker': speaker,
        'talks': n_talks,
        'totalWords': total_words,
        'distinctivenessScore': score,
        'signaturePhrases': [{'phrase': p['phrase'], 'count': p['count'], 'ratio': p['ratio']} for p in phrases],
        'style': style,
        'topicProfile': topic_profile,
        'topTopic': top_topic,
        'topTopicRatio': round(top_topic_ratio, 2),
    })

    if len(fingerprints) % 50 == 0:
        print(f"  Processed {len(fingerprints)} speakers...")

# Sort by distinctiveness score
fingerprints.sort(key=lambda x: x['distinctivenessScore'], reverse=True)

print(f"  Total fingerprints: {len(fingerprints)}")
print(f"  Top 5 most distinctive:")
for fp in fingerprints[:5]:
    phrases = ', '.join(p['phrase'] for p in fp['signaturePhrases'][:3])
    print(f"    {fp['speaker']}: score={fp['distinctivenessScore']}, top_topic={fp['topTopic']}, phrases=[{phrases}]")

# ---------------------------------------------------------------------------
# SAVE
# ---------------------------------------------------------------------------
insights['speakerFingerprints'] = {
    'title': 'Speaker Fingerprint',
    'subtitle': 'What makes each speaker sound like themselves',
    'globalStyle': global_style,
    'globalTopicProfile': global_topic,
    'speakers': fingerprints,
}

# Remove old vocabulary data if present
insights.pop('vocabulary', None)

output = 'conference-app/public/insights.json'
with open(output, 'w', encoding='utf-8') as f:
    json.dump(insights, f, ensure_ascii=False)

print(f"\nSaved to {output}")
print("Done!")
