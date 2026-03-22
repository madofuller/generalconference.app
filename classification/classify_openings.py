"""
AI-Powered Talk Openings Classifier
Uses Claude to classify how General Conference talks begin.
Replaces the simple regex classifier that put 56% in "other".

Run: python classification/classify_openings.py
Requires: ANTHROPIC_API_KEY environment variable (or .env file)

Output: Updates insights.json with better opening classifications
"""

import pandas as pd
import json
import os
import re
import time
import sys
from pathlib import Path
from collections import Counter

# Try to load dotenv if available
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent / "conference-app" / ".env.local")
except ImportError:
    pass

try:
    import anthropic
except ImportError:
    print("ERROR: pip install anthropic")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
CSV_PATH = Path("conference-app/public/conference_talks_cleaned.csv")
INSIGHTS_PATH = Path("conference-app/public/insights.json")
CACHE_PATH = Path("classification/openings_cache.json")

# More granular opening categories
OPENING_CATEGORIES = [
    "greeting",              # "Brothers and sisters", "My dear friends"
    "scripture/quote",       # Opens with or references a scripture
    "personal story",        # Anecdote, personal experience, memory
    "doctrinal statement",   # Bold claim about doctrine or truth
    "gratitude/testimony",   # Expressing thanks or bearing testimony
    "humor",                 # Joke or humorous anecdote
    "question",              # Opens with a question to the audience
    "historical reference",  # Reference to church history or world events
    "reference to speaker",  # Mentions another speaker, talk, or assignment
    "seasonal/topical",      # References the season, holiday, current event
    "poem/hymn",             # Opens with poetry or hymn lyrics
    "definition/wordplay",   # Defines a word or plays on language
    "exhortation",           # Direct call to action or counsel
    "narrative/parable",     # Third-person story, illustration, or parable
]

BATCH_SIZE = 40  # Openings per API call

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def get_opening(text, max_chars=300):
    """Extract the first 1-2 sentences of a talk."""
    if not text or pd.isna(text):
        return ''
    # Get first ~2 sentences
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    opening = sentences[0].strip() if sentences else text[:max_chars]
    # If first sentence is very short, grab the second too
    if len(opening) < 60 and len(sentences) > 1:
        opening = opening + " " + sentences[1].strip()
    return opening[:max_chars]


def load_cache():
    """Load cached classifications."""
    if CACHE_PATH.exists():
        return json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    return {}


def save_cache(cache):
    """Save classifications to cache."""
    CACHE_PATH.parent.mkdir(exist_ok=True)
    CACHE_PATH.write_text(json.dumps(cache, indent=2), encoding="utf-8")


def classify_batch_with_claude(client, openings_batch):
    """Classify a batch of openings using Claude.

    openings_batch: list of (index, opening_text, speaker, year) tuples
    Returns: dict of index -> category
    """
    categories_list = "\n".join(f"- {c}" for c in OPENING_CATEGORIES)

    numbered_openings = "\n".join(
        f"{i+1}. [{speaker}, {year}]: \"{opening}\""
        for i, (idx, opening, speaker, year) in enumerate(openings_batch)
    )

    prompt = f"""Classify each talk opening into exactly ONE of these categories:

{categories_list}

Here are the openings to classify:

{numbered_openings}

Reply with ONLY a JSON array of objects, one per opening, in order:
[{{"n": 1, "category": "..."}}, {{"n": 2, "category": "..."}}, ...]

Rules:
- Use ONLY categories from the list above (exact spelling)
- "greeting" = starts by addressing the audience (brothers/sisters, friends, etc.)
- "scripture/quote" = opens with or immediately references a specific scripture or quote
- "personal story" = shares a personal experience, memory, or anecdote (first person)
- "doctrinal statement" = opens with a declaration about doctrine, gospel principles, or truth
- "gratitude/testimony" = expresses thanks, gratitude, or bears testimony
- "humor" = opens with a joke, funny observation, or self-deprecating humor
- "question" = opens by posing a question
- "historical reference" = references church history, historical events, or past conferences
- "reference to speaker" = mentions another speaker's talk, their assignment to speak, or conference theme
- "seasonal/topical" = references the time of year, a holiday, current event, or occasion
- "poem/hymn" = opens with poetry, hymn lyrics, or song
- "definition/wordplay" = defines a word, explores etymology, or plays with language
- "exhortation" = direct call to action, counsel, or charge to the audience
- "narrative/parable" = third-person story, illustration, or parable (not first person)
"""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}],
        )

        text = response.content[0].text.strip()

        # Extract JSON from response
        json_match = re.search(r'\[.*\]', text, re.DOTALL)
        if not json_match:
            print(f"  WARNING: Could not parse JSON from response")
            return {}

        results = json.loads(json_match.group())

        # Map back to original indices
        classifications = {}
        for item in results:
            batch_idx = item["n"] - 1
            if 0 <= batch_idx < len(openings_batch):
                orig_idx = openings_batch[batch_idx][0]
                category = item["category"]
                # Validate category
                if category in OPENING_CATEGORIES:
                    classifications[str(orig_idx)] = category
                else:
                    # Try fuzzy match
                    lower = category.lower()
                    for cat in OPENING_CATEGORIES:
                        if cat.lower() in lower or lower in cat.lower():
                            classifications[str(orig_idx)] = cat
                            break
                    else:
                        classifications[str(orig_idx)] = category  # Keep as-is

        return classifications

    except Exception as e:
        print(f"  ERROR in API call: {e}")
        return {}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("=" * 60)
    print("AI-Powered Talk Openings Classifier")
    print("=" * 60)

    # Check API key
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        # Try reading from .env.local
        env_path = Path("conference-app/.env.local")
        if env_path.exists():
            for line in env_path.read_text().splitlines():
                if line.startswith("ANTHROPIC_API_KEY="):
                    api_key = line.split("=", 1)[1].strip()
                    break

    if not api_key or api_key == "your-api-key-here":
        print("ERROR: Set ANTHROPIC_API_KEY environment variable")
        print("  export ANTHROPIC_API_KEY=sk-ant-...")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    # Load talks
    print("\n[1/4] Loading talks...")
    df = pd.read_csv(CSV_PATH)
    print(f"  {len(df)} talks loaded")

    # Extract openings
    print("\n[2/4] Extracting openings...")
    openings = []
    for idx, row in df.iterrows():
        opening = get_opening(row.get("talk", ""))
        if opening and len(opening) > 15:
            openings.append((idx, opening, row.get("speaker", "Unknown"), int(row.get("year", 0))))

    print(f"  {len(openings)} openings extracted")

    # Load cache
    cache = load_cache()
    cached_count = sum(1 for idx, _, _, _ in openings if str(idx) in cache)
    print(f"  {cached_count} already classified (cached)")

    # Filter to unclassified
    to_classify = [(idx, opening, speaker, year) for idx, opening, speaker, year in openings if str(idx) not in cache]
    print(f"  {len(to_classify)} to classify with Claude")

    # Classify in batches
    if to_classify:
        print(f"\n[3/4] Classifying with Claude (batches of {BATCH_SIZE})...")
        total_batches = (len(to_classify) + BATCH_SIZE - 1) // BATCH_SIZE

        for batch_num in range(total_batches):
            start = batch_num * BATCH_SIZE
            end = min(start + BATCH_SIZE, len(to_classify))
            batch = to_classify[start:end]

            results = classify_batch_with_claude(client, batch)
            cache.update(results)

            classified_so_far = cached_count + start + len(results)
            pct = classified_so_far / len(openings) * 100

            print(f"  Batch {batch_num+1}/{total_batches}: {len(results)} classified ({pct:.0f}% complete)")

            # Save cache after each batch
            save_cache(cache)

            # Rate limiting
            if batch_num < total_batches - 1:
                time.sleep(1)

        print(f"  Classification complete!")
    else:
        print("\n[3/4] All openings already cached, skipping API calls")

    # Build results
    print("\n[4/4] Building insights data...")

    # Count categories
    all_categories = Counter()
    talk_classifications = {}
    for idx, opening, speaker, year in openings:
        cat = cache.get(str(idx), "other")
        all_categories[cat] += 1
        talk_classifications[idx] = cat

    print(f"\n  Category distribution:")
    total = sum(all_categories.values())
    for cat, count in all_categories.most_common():
        pct = count / total * 100
        print(f"    {cat:25s} {count:5d} ({pct:5.1f}%)")

    # Build by-decade data
    openings_data = []
    for decade in range(1970, 2030, 10):
        subset_indices = df[(df.year >= decade) & (df.year < decade + 10)].index
        types = Counter()
        for idx in subset_indices:
            if idx in talk_classifications:
                types[talk_classifications[idx]] += 1

        total_decade = sum(types.values()) or 1
        openings_data.append({
            'decade': f"{decade}s",
            **{k: round(v / total_decade * 100, 1) for k, v in types.items()},
        })

    # Sample openings (pick interesting ones from each category)
    sample_openings = []
    for cat in OPENING_CATEGORIES:
        samples_for_cat = [
            (idx, opening, speaker, year)
            for idx, opening, speaker, year in openings
            if cache.get(str(idx)) == cat and len(opening) > 40
        ]
        # Pick up to 3 per category
        import random
        random.seed(42)
        random.shuffle(samples_for_cat)
        for idx, opening, speaker, year in samples_for_cat[:3]:
            sample_openings.append({
                'opening': opening,
                'speaker': speaker,
                'year': int(year),
                'title': df.loc[idx, 'title'] if idx in df.index else '',
                'type': cat,
            })

    # Update insights.json
    if INSIGHTS_PATH.exists():
        insights = json.loads(INSIGHTS_PATH.read_text(encoding="utf-8"))
    else:
        insights = {}

    insights['talkOpenings'] = {
        'title': 'How Talks Begin',
        'subtitle': 'The art of the opening line — how speakers start their conference talks',
        'byDecade': openings_data,
        'samples': sample_openings,
    }

    INSIGHTS_PATH.write_text(json.dumps(insights, indent=2), encoding="utf-8")

    print(f"\n{'=' * 60}")
    print(f"Done! Updated {INSIGHTS_PATH}")
    print(f"  {len(openings)} openings classified into {len(all_categories)} categories")
    print(f"  'other' is now: {all_categories.get('other', 0)} ({all_categories.get('other', 0) / total * 100:.1f}%)")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
