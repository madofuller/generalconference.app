#!/usr/bin/env python3
"""
Smart merge and cleanup for historical_talks.csv.

The OCR source has speaker names as PAGE HEADERS that repeat on every page
of a talk. The parser treats each as a new talk. This script:

1. Merges consecutive same-speaker entries that are page-break splits
2. Removes purely procedural entries (introductions, choir notes, etc.)
3. Strips page-number artifacts from talk text
4. Regenerates titles for merged talks

Heuristic for merge vs separate talk:
- MERGE if the previous entry ends mid-sentence (page break)
- MERGE if the next entry starts lowercase (continuation)
- MERGE if the entry is short and procedural-looking
- KEEP SEPARATE if both are substantial AND prev ends with "Amen" (two real talks)
- KEEP SEPARATE if there's a session marker between them
"""

import csv
import re
from pathlib import Path

CSV_PATH = Path("conference-app/public/historical_talks.csv")

# Procedural patterns - these are not real talks
PROCEDURAL_RE = re.compile(
    r"^("
    r"the\s+(salt\s+lake\s+)?tabernacle\s+choir|"
    r"the\s+choir\s+(and\s+congregation\s+)?sang|"
    r"the\s+congregation\s+sang|"
    r"singing\s+(by|of)|"
    r"(opening\s+)?prayer\s+was\s+offered|"
    r"invocation\s+by|"
    r"benediction\s+by|"
    r"the\s+opening\s+prayer|"
    r"(he\s+)?presented\s+the\s+general\s+authorities|"
    r"the\s+following\s+(were|was)\s+sustained|"
    r"conference\s+(was\s+)?adjourned|"
    r"our\s+(next|concluding)\s+speaker|"
    r"we\s+will\s+(now\s+)?hear\s+from|"
    r"we\s+(shall|will)\s+be\s+pleased\s+to\s+hear|"
    r"we\s+will\s+ask\s+(him|her|brother|sister)|"
    r"will\s+be\s+our\s+(next|concluding)|"
    r"come\s+to\s+the\s+stand|"
    r"organists?\s|"
    r"clerk\s+of\s+general\s+conference|"
    # Speaker introductions
    r"(brother|elder|president|sister)\s+\w+\s+(will|has|is going to)\s+(speak|address|occupy|talk)|"
    r"we\s+(would|will)\s+like\s+(to\s+hear|them\s+not\s+to\s+exceed)|"
    r"(he|she)\s+will\s+occupy\s+the\s+balance|"
    r"I\s+(would\s+like\s+to\s+)?ask\s+(the\s+people|brother|sister)|"
    # Announcements & readings
    r"president\s+\w+\s+read\s+the\s+following|"
    r"the\s+following\s+(note|letter|telegram)\s+was\s+read|"
    r"has\s+been\s+(decided|sustained|appointed)|"
    r"a\s+(general\s+music|new\s+mission)|"
    # Lists of names/authorities
    r"church\s+board\s+of\s+education|"
    r"general\s+authorities\s+of\s+the\s+church|"
    # Time management
    r"we\s+(are\s+short|have\s+more|shall\s+not\s+call)|"
    r"(not\s+to|to\s+not)\s+exceed\s+\w+\s+minutes|"
    r"limit\s+(their|the)\s+(time|remarks)|"
    # Regrets and health notes
    r"I\s+regret\s+to\s+say|"
    r"(has\s+been|was)\s+taken\s+(very\s+)?sick|"
    r"on\s+account\s+of\s+(ill\s+health|being\s+in)|"
    r"unable\s+to\s+be\s+with\s+us|"
    # Choir actions within talk
    r"(brother|sister)\s+\w+\s+then\s+sang|"
    r"I\s+will\s+(state|ask\s+brother|ask\s+sister)"
    r")",
    re.IGNORECASE
)

# Session markers that indicate a real break
SESSION_RE = re.compile(
    r"(FIRST|SECOND|THIRD|FOURTH)\s+DAY|"
    r"(MORNING|AFTERNOON|EVENING|PRIESTHOOD)\s+(SESSION|MEETING)",
    re.IGNORECASE
)

# Page artifacts to strip
PAGE_ARTIFACT_RE = re.compile(
    r"\s*\d+\s*GENERAL\s+CONFERENCE\s*\d*\s*$|"
    r"^\s*\d+\s*GENERAL\s+CONFERENCE\s*\d*\s*|"
    r"\s*GENERAL\s+CONFERENCE\s*\d+\s*$|"
    r"^\s*GENERAL\s+CONFERENCE\s*\d+\s*|"
    r"^\s*\d{1,3}\s*$",
    re.MULTILINE
)


def strip_artifacts(text):
    """Remove page numbers, 'GENERAL CONFERENCE' headers, etc."""
    text = PAGE_ARTIFACT_RE.sub("", text)
    # Remove standalone page numbers between paragraphs
    text = re.sub(r"\n\s*\d{1,3}\s*\n", "\n", text)
    # Collapse excessive newlines
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def ends_with_sentence(text):
    """Check if text ends with a proper sentence ending."""
    cleaned = text.rstrip()
    cleaned = re.sub(r"\s*\d+\s*$", "", cleaned)
    cleaned = re.sub(r"\s*GENERAL\s+CONFERENCE\s*\d*\s*$", "", cleaned, flags=re.IGNORECASE)
    cleaned = cleaned.rstrip()
    return bool(re.search(r"[.!?]\s*$|Amen\.?\s*$", cleaned))


def ends_with_amen(text):
    """Check if text ends with 'Amen' (strong talk boundary signal)."""
    cleaned = text.rstrip()
    cleaned = re.sub(r"\s*\d+\s*$", "", cleaned)
    cleaned = re.sub(r"\s*GENERAL\s+CONFERENCE\s*\d*\s*$", "", cleaned, flags=re.IGNORECASE)
    cleaned = cleaned.rstrip()
    return bool(re.search(r"Amen\.?\s*$", cleaned, re.IGNORECASE))


def starts_lowercase(text):
    """Check if text starts with a lowercase letter (mid-sentence continuation)."""
    stripped = text.lstrip()
    # Skip leading page numbers
    stripped = re.sub(r"^\d+\s*", "", stripped)
    return bool(stripped) and stripped[0].islower()


def is_procedural(text):
    """Check if text is purely procedural (choir, prayer, introductions)."""
    # Check first 300 chars
    first = text[:300].strip()
    # Remove leading page artifacts
    first = re.sub(r"^\d+\s*", "", first)
    first = re.sub(r"^GENERAL\s+CONFERENCE\s*\d*\s*", "", first, flags=re.IGNORECASE)
    first = first.strip()
    return bool(PROCEDURAL_RE.search(first))


def has_session_marker(text):
    """Check if text contains a session break marker."""
    return bool(SESSION_RE.search(text[:200]))


def generate_title(text, max_len=100):
    """Generate a title from the first sentence of the talk."""
    # Strip leading artifacts
    clean = re.sub(r"^\d+\s*", "", text.strip())
    clean = re.sub(r"^GENERAL\s+CONFERENCE\s*\d*\s*", "", clean, flags=re.IGNORECASE)
    clean = clean.strip()

    # Try first sentence
    m = re.search(r"^(.{20,120}?[.!?])\s", clean)
    if m:
        title = m.group(1).strip()
        if len(title) > max_len:
            title = title[:max_len-3] + "..."
        return title

    # Fallback: first N words
    words = clean.split()[:10]
    return " ".join(words) + "..."


def main():
    print("Reading CSV...")
    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    print(f"  {len(rows)} records")

    # Step 1: Strip page artifacts from all talk text
    print("\nStep 1: Stripping page artifacts...")
    for row in rows:
        row["talk"] = strip_artifacts(row["talk"])

    # Step 2: Merge consecutive same-speaker entries
    print("Step 2: Merging consecutive same-speaker page splits...")
    merged = []
    i = 0
    merge_count = 0

    while i < len(rows):
        current = dict(rows[i])  # copy
        key = (current["speaker"], current["year"], current["season"])

        # Look ahead and merge consecutive same-speaker entries
        j = i + 1
        while j < len(rows):
            next_row = rows[j]
            next_key = (next_row["speaker"], next_row["year"], next_row["season"])

            if next_key != key:
                break

            # Decide: merge or keep separate?
            should_merge = False

            # Strong merge signals:
            if starts_lowercase(next_row["talk"]):
                should_merge = True  # Continuation mid-sentence
            elif not ends_with_sentence(current["talk"]):
                should_merge = True  # Previous entry ends mid-sentence
            elif is_procedural(next_row["talk"]) and len(next_row["talk"]) < 500:
                should_merge = True  # Short procedural fragment
            elif is_procedural(current["talk"]) and len(current["talk"]) < 500:
                should_merge = True  # Current is short procedural, merge into next
            elif len(next_row["talk"]) < 500:
                should_merge = True  # Very short fragment, likely page artifact
            elif not ends_with_amen(current["talk"]) and not has_session_marker(next_row["talk"]):
                should_merge = True  # No "Amen" boundary, no session break
            # Strong keep-separate signals:
            elif ends_with_amen(current["talk"]) and len(current["talk"]) > 2000 and len(next_row["talk"]) > 2000:
                should_merge = False  # Both substantial, proper ending = two real talks

            if should_merge:
                current["talk"] = current["talk"] + "\n\n" + next_row["talk"]
                merge_count += 1
                j += 1
            else:
                break

        merged.append(current)
        i = j

    print(f"  Merged {merge_count} page splits")
    print(f"  Records: {len(rows)} -> {len(merged)}")

    # Step 3: Remove procedural-only entries
    print("Step 3: Removing procedural entries...")

    # Build set of Church Presidents for stricter filtering
    # (Presidents have many short procedural remarks - introductions, session mgmt)
    CHURCH_PRESIDENTS = {
        "John Taylor", "Wilford Woodruff", "Lorenzo Snow",
        "Joseph F. Smith", "Heber J. Grant", "George Albert Smith",
        "David O. McKay", "Joseph Fielding Smith", "Harold B. Lee",
        "Spencer W. Kimball",
    }

    cleaned = []
    removed = 0
    for row in merged:
        text = row["talk"].strip()
        speaker = row["speaker"]
        calling = row.get("calling", "")
        is_president = speaker in CHURCH_PRESIDENTS and "President" in calling

        # Remove if entirely procedural AND short
        if is_procedural(text) and len(text) < 1500:
            removed += 1
            continue
        # Remove if extremely short (likely a page artifact or intro)
        if len(text) < 150:
            removed += 1
            continue
        # Church president short remarks are almost always procedural
        # (introductions, session openings, time management)
        if is_president and len(text) < 1000:
            removed += 1
            continue
        # Any speaker's very short entry is likely procedural
        if len(text) < 400:
            removed += 1
            continue
        cleaned.append(row)

    print(f"  Removed {removed} procedural/artifact entries")

    # Step 4: Regenerate titles for merged talks
    print("Step 4: Regenerating titles...")
    for row in cleaned:
        row["title"] = generate_title(row["talk"])

    # Write output
    print(f"\nWriting {len(cleaned)} records...")
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(cleaned)

    # Stats
    from collections import Counter
    counts = Counter(r["speaker"] for r in cleaned)

    print(f"\n{'='*50}")
    print(f"SMART MERGE COMPLETE")
    print(f"{'='*50}")
    print(f"  Records: {len(rows)} -> {len(cleaned)}")
    print(f"  Page splits merged:  {merge_count}")
    print(f"  Procedural removed:  {removed}")
    print(f"  Unique speakers:     {len(counts)}")

    # Show impact on top speakers
    print(f"\nTop 15 speakers (post-merge):")
    for name, c in counts.most_common(15):
        print(f"  {c:4d}  {name}")

    # Show Grant specifically
    grant_count = counts.get("Heber J. Grant", 0)
    print(f"\nHeber J. Grant: {grant_count} talks")

    # Show avg talk length
    lengths = [len(r["talk"]) for r in cleaned]
    import statistics
    print(f"Talk length: mean={statistics.mean(lengths):.0f}, median={statistics.median(lengths):.0f}")


if __name__ == "__main__":
    main()
