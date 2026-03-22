#!/usr/bin/env python3
"""
Historical General Conference Talk Scraper (1880-1970)
Pulls OCR text from Internet Archive conference reports and parses individual talks.

Run: python scrape_historical.py
Output: conference-app/public/historical_talks.csv

Optional flags:
  --sample N     Only process N conference reports (for testing)
  --start YEAR   Start year (default: 1880)
  --end YEAR     End year (default: 1970)
  --download-only  Just download text files, don't parse
  --parse-only     Just parse already-downloaded files
"""

import requests
import re
import os
import sys
import time
import argparse
import unicodedata
import json
import csv
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
CACHE_DIR = Path("historical_cache")
OUTPUT_CSV = Path("conference-app/public/historical_talks.csv")

IA_SEARCH_URL = (
    "https://archive.org/advancedsearch.php"
    "?q=collection%3Aconferencereport"
    "&fl[]=identifier&fl[]=title&fl[]=year"
    "&sort[]=year+asc&rows=1000&output=json"
)
IA_META_URL = "https://archive.org/metadata/{identifier}/files"
IA_DOWNLOAD_URL = "https://archive.org/download/{identifier}/{filename}"

# Language suffixes to exclude (non-English editions from 1968+)
LANGUAGE_SUFFIXES = {
    "spa", "fre", "ger", "dan", "nor", "swe", "fin", "ita",
    "por", "dut", "chi", "jpn", "kor", "ton", "sam", "tah",
}

# Speaker title patterns
TITLE_PATTERN = r"(PRESIDENT|ELDER|BISHOP|SISTER|APOSTLE|PATRIARCH|JUDGE|SUPERINTENDENT|DOCTOR|DR\.|HON\.|HONORABLE)"
SPEAKER_HEADER_RE = re.compile(
    rf"^\s*{TITLE_PATTERN}\s+([A-Z][A-Z\s.,'()&-]{{3,}})\s*$",
    re.MULTILINE,
)

# Simpler fallback: just an ALL-CAPS line that looks like a name
ALLCAPS_NAME_RE = re.compile(
    r"^\s*([A-Z][A-Z.\s]{2,}[A-Z.])\s*$",
    re.MULTILINE,
)

# Session markers
SESSION_RE = re.compile(
    r"(FIRST DAY|SECOND DAY|THIRD DAY|FOURTH DAY|"
    r"MORNING\s+(?:SESSION|MEETING)|AFTERNOON\s+(?:SESSION|MEETING)|"
    r"EVENING\s+(?:SESSION|MEETING)|PRIESTHOOD\s+(?:SESSION|MEETING)|"
    r"GENERAL\s+PRIESTHOOD\s+SESSION)",
    re.IGNORECASE,
)

# Procedural content to skip
PROCEDURAL_PATTERNS = [
    r"(?i)^official\s+report",
    r"(?i)^statistical\s+report",
    r"(?i)^auditing\s+committee",
    r"(?i)^church\s+audit",
    r"(?i)^the\s+choir\s+sang",
    r"(?i)^the\s+congregation\s+sang",
    r"(?i)^benediction\s+by",
    r"(?i)^invocation\s+by",
    r"(?i)^prayer\s+by",
    r"(?i)^conference\s+adjourned",
    r"(?i)^conference\s+was\s+adjourned",
    r"(?i)^sustaining\s+of",
    r"(?i)^the\s+authorities",
    r"(?i)^general\s+authorities",
]

# Common OCR corrections for speaker titles
OCR_TITLE_FIXES = {
    "ELDEE": "ELDER",
    "ELDEK": "ELDER",
    "ELDEB": "ELDER",
    "BLDER": "ELDER",
    "PKESIDENT": "PRESIDENT",
    "PBESIDENT": "PRESIDENT",
    "PEESIDENT": "PRESIDENT",
    "PRESIDEXT": "PRESIDENT",
    "BISHOF": "BISHOP",
    "SISTEE": "SISTER",
    "SISTEB": "SISTER",
    "APOSTLB": "APOSTLE",
}

# Common OCR name corrections (add as discovered)
OCR_NAME_FIXES = {
    "THATCHES": "THATCHER",
    "THATCHEE": "THATCHER",
    "GEANT": "GRANT",
    "GBANT": "GRANT",
    "OESON": "ORSON",
    "PEATT": "PRATT",
    "PBATT": "PRATT",
    "BICHARDS": "RICHARDS",
    "EICHARDS": "RICHARDS",
    "BICHABDS": "RICHARDS",
    "TAYLOE": "TAYLOR",
    "TAYLOB": "TAYLOR",
    "WOODBUFF": "WOODRUFF",
    "WOODEUFF": "WOODRUFF",
    "YOUKG": "YOUNG",
    "YOUJSTG": "YOUNG",
    "YOTJNG": "YOUNG",
    "LTTND": "LUND",
    "SXOW": "SNOW",
    "SJTOW": "SNOW",
    "PENROSE-": "PENROSE",
    "CLAWSOX": "CLAWSON",
    "CLAWSON,": "CLAWSON",
    "SMOOT,": "SMOOT",
    "IVIXS": "IVINS",
    "CANNOA": "CANNON",
    "CAKNON": "CANNON",
    "CAKKON": "CANNON",
    "CANNOK": "CANNON",
    "BEIGHAM": "BRIGHAM",
    "BRIG": "BRIGHAM",
    "BKIGHAM": "BRIGHAM",
    "BOBEBTS": "ROBERTS",
    "EOBERTS": "ROBERTS",
    "EOBEETS": "ROBERTS",
    "FJELSTED": "FJELDSTED",
    "EOMANEY": "ROMNEY",
    "BOMNEY": "ROMNEY",
    "FIHANKLIN": "FRANKLIN",
    "FEANKLIN": "FRANKLIN",
    "FRANKIN": "FRANKLIN",
    "L": "",  # stray OCR artifact
    "D-": "D.",
}

# Fuzzy name deduplication: maps known variants to canonical name
SPEAKER_CANONICAL = {
    "Brig Ham Young": "Brigham Young",
    "Beigham Young": "Brigham Young",
    "Brigham H. Roberts": "B. H. Roberts",
    "Abraham Owen Woodruff": "Abraham O. Woodruff",
    "Francis M. L Yman": "Francis M. Lyman",
    "Frankin D. Richards": "Franklin D. Richards",
    "Franklin D- Richards": "Franklin D. Richards",
}


# ---------------------------------------------------------------------------
# Downloading
# ---------------------------------------------------------------------------
def get_conference_identifiers(start_year, end_year):
    """Get all English conference report identifiers from Internet Archive."""
    print("  Querying Internet Archive search API...")
    r = requests.get(IA_SEARCH_URL, timeout=60)
    r.raise_for_status()
    data = r.json()

    items = []
    for doc in data["response"]["docs"]:
        identifier = doc["identifier"]
        year = doc.get("year")

        # Skip non-English editions
        suffix = identifier.replace("conferencereport", "")
        if any(suffix.endswith(lang) for lang in LANGUAGE_SUFFIXES):
            continue

        # Parse year from identifier if not in metadata
        if not year:
            m = re.search(r"(\d{4})", identifier)
            if m:
                year = int(m.group(1))

        if year and start_year <= int(year) <= end_year:
            # Determine season
            if identifier.endswith("sa"):
                season = "October"
            elif identifier.endswith("a") or "apr" in identifier.lower():
                season = "April"
            else:
                # Check for semi-annual in title
                title = doc.get("title", "")
                if "semi-annual" in title.lower() or "semi annual" in title.lower():
                    season = "October"
                else:
                    season = "April"

            items.append({
                "identifier": identifier,
                "year": int(year),
                "season": season,
                "title": doc.get("title", ""),
            })

    items.sort(key=lambda x: (x["year"], x["season"]))
    print(f"  Found {len(items)} English conference reports ({start_year}-{end_year})")
    return items


def find_djvu_txt_filename(identifier):
    """Find the _djvu.txt filename for a given identifier."""
    try:
        r = requests.get(IA_META_URL.format(identifier=identifier), timeout=30)
        r.raise_for_status()
        files = r.json().get("result", [])
        for f in files:
            name = f.get("name", "")
            if name.endswith("_djvu.txt"):
                return name
    except Exception as e:
        print(f"    Error getting metadata for {identifier}: {e}")
    return None


def download_text(identifier, filename):
    """Download the text file for a conference report."""
    cache_path = CACHE_DIR / f"{identifier}.txt"
    if cache_path.exists():
        return cache_path.read_text(encoding="utf-8", errors="replace")

    url = IA_DOWNLOAD_URL.format(identifier=identifier, filename=filename)
    try:
        r = requests.get(url, timeout=60)
        r.raise_for_status()
        text = r.text
        cache_path.write_text(text, encoding="utf-8")
        return text
    except Exception as e:
        print(f"    Error downloading {identifier}: {e}")
        return None


def download_all(items):
    """Download all conference report texts."""
    CACHE_DIR.mkdir(exist_ok=True)
    results = []

    # Check cache first
    cached = 0
    to_download = []
    for item in items:
        cache_path = CACHE_DIR / f"{item['identifier']}.txt"
        if cache_path.exists():
            cached += 1
            results.append(item)
        else:
            to_download.append(item)

    if cached:
        print(f"  {cached} already cached, {len(to_download)} to download")

    # First pass: resolve filenames (sequential, rate-limited)
    filenames = {}
    for i, item in enumerate(to_download):
        if (i + 1) % 10 == 0:
            print(f"  Resolving filenames: {i+1}/{len(to_download)}")
        fname = find_djvu_txt_filename(item["identifier"])
        if fname:
            filenames[item["identifier"]] = fname
        else:
            # Try default pattern
            filenames[item["identifier"]] = f"{item['identifier']}_djvu.txt"
        time.sleep(0.3)  # Be nice to IA

    # Second pass: download texts (parallel)
    def _download(item):
        fname = filenames.get(item["identifier"])
        if not fname:
            return None
        text = download_text(item["identifier"], fname)
        return item if text else None

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(_download, item): item for item in to_download}
        done = 0
        for future in as_completed(futures):
            done += 1
            result = future.result()
            if result:
                results.append(result)
            if done % 10 == 0:
                print(f"  Downloaded {done}/{len(to_download)}")

    results.sort(key=lambda x: (x["year"], x["season"]))
    print(f"  Total texts available: {len(results)}")
    return results


# ---------------------------------------------------------------------------
# Parsing
# ---------------------------------------------------------------------------
def clean_ocr_text(text):
    """Basic OCR cleanup."""
    # Normalize unicode
    text = unicodedata.normalize("NFC", text)

    # Fix double-spaced words (common in older OCR) - but only in body text
    # Don't collapse ALL spaces as some are intentional formatting

    # Rejoin hyphenated line breaks: "Sat-\nurday" -> "Saturday"
    text = re.sub(r"(\w)-\s*\n\s*(\w)", r"\1\2", text)

    # Collapse multiple blank lines
    text = re.sub(r"\n{4,}", "\n\n\n", text)

    return text


def fix_ocr_title(title):
    """Fix common OCR errors in speaker titles."""
    for bad, good in OCR_TITLE_FIXES.items():
        title = title.replace(bad, good)
    return title


def fix_ocr_name(name):
    """Fix common OCR errors in speaker names."""
    words = name.split()
    fixed = []
    for w in words:
        fixed.append(OCR_NAME_FIXES.get(w, w))
    return " ".join(fixed)


def normalize_speaker_name(raw_name):
    """Clean up speaker name: title case, remove extra whitespace."""
    # Remove extra spaces (OCR artifact)
    name = re.sub(r"\s+", " ", raw_name).strip()

    # Fix OCR errors
    name = fix_ocr_name(name)

    # Remove trailing punctuation
    name = name.rstrip(".,;:-")

    # Convert to title case
    name = name.title()

    # Fix common title case issues (Mc, Mac, O')
    name = re.sub(r"\bMc([a-z])", lambda m: "Mc" + m.group(1).upper(), name)
    name = re.sub(r"\bO'([a-z])", lambda m: "O'" + m.group(1).upper(), name)

    name = name.strip()

    # Remove empty words from OCR artifact cleanup
    name = re.sub(r"\s+", " ", name).strip()

    # Apply canonical name mapping
    if name in SPEAKER_CANONICAL:
        name = SPEAKER_CANONICAL[name]

    return name


def is_procedural(text):
    """Check if a text block is procedural content rather than a talk."""
    first_200 = text[:200].strip()
    for pattern in PROCEDURAL_PATTERNS:
        if re.search(pattern, first_200):
            return True
    return False


def parse_talks_from_text(text, year, season):
    """Parse individual talks from a conference report text."""
    text = clean_ocr_text(text)
    talks = []

    # Find all speaker headers
    headers = []
    for m in SPEAKER_HEADER_RE.finditer(text):
        title_word = fix_ocr_title(m.group(1))
        name_raw = m.group(2).strip()
        headers.append({
            "start": m.start(),
            "end": m.end(),
            "title": title_word,
            "name_raw": name_raw,
            "full_match": m.group(0).strip(),
        })

    if not headers:
        return talks

    # Extract talks between headers
    for i, header in enumerate(headers):
        # Talk text runs from end of this header to start of next header
        talk_start = header["end"]
        talk_end = headers[i + 1]["start"] if i + 1 < len(headers) else len(text)

        talk_text = text[talk_start:talk_end].strip()

        # Skip very short "talks" (likely procedural)
        if len(talk_text) < 200:
            continue

        # Skip procedural content
        if is_procedural(talk_text):
            continue

        # Clean up the talk text
        # Remove session headers that might be at the end
        talk_text = SESSION_RE.sub("", talk_text).strip()

        # Remove leading/trailing whitespace per paragraph
        paragraphs = [p.strip() for p in talk_text.split("\n\n") if p.strip()]
        talk_text = "\n\n".join(paragraphs)

        # Build speaker name
        speaker = normalize_speaker_name(header["name_raw"])
        calling_title = header["title"].title()

        # Build a calling string
        calling = f"{calling_title} {speaker}" if calling_title else speaker

        # Build URL (link to the IA page)
        # We don't have individual talk URLs for historical talks

        talks.append({
            "title": "",  # Historical reports don't have individual talk titles
            "speaker": speaker,
            "calling": calling,
            "calling_original": calling,
            "year": year,
            "season": season,
            "url": "",
            "talk": talk_text,
            "footnotes": "",
        })

    return talks


def generate_talk_titles(talks):
    """Generate titles for talks that don't have them.
    Uses the first sentence or a meaningful opening phrase."""
    for talk in talks:
        if not talk["title"]:
            text = talk["talk"][:300]
            # Try to get the first sentence
            m = re.search(r"^(.{20,120}?[.!?])\s", text)
            if m:
                title = m.group(1).strip()
                # Truncate if too long
                if len(title) > 100:
                    title = title[:97] + "..."
                talk["title"] = title
            else:
                # Fallback: first N words
                words = text.split()[:10]
                talk["title"] = " ".join(words) + "..."
    return talks


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Historical GC Talk Scraper (1880-1970)")
    parser.add_argument("--sample", type=int, help="Only process N conference reports")
    parser.add_argument("--start", type=int, default=1880, help="Start year (default: 1880)")
    parser.add_argument("--end", type=int, default=1970, help="End year (default: 1970)")
    parser.add_argument("--download-only", action="store_true", help="Just download, don't parse")
    parser.add_argument("--parse-only", action="store_true", help="Just parse cached files")
    args = parser.parse_args()

    print("=" * 60)
    print("Historical General Conference Scraper")
    print(f"Range: {args.start} - {args.end}")
    print("=" * 60)
    start_time = time.time()

    # Step 1: Get identifiers
    print("\n[1/4] Finding conference reports on Internet Archive...")
    items = get_conference_identifiers(args.start, args.end)

    if args.sample:
        items = items[:args.sample]
        print(f"  (Sampling {args.sample} reports)")

    # Step 2: Download
    if not args.parse_only:
        print("\n[2/4] Downloading OCR text files...")
        items = download_all(items)
    else:
        # Filter to only items we have cached
        items = [i for i in items if (CACHE_DIR / f"{i['identifier']}.txt").exists()]
        print(f"\n[2/4] Skipped download, using {len(items)} cached files")

    if args.download_only:
        elapsed = time.time() - start_time
        print(f"\nDownload complete. {len(items)} files cached in {CACHE_DIR}/")
        print(f"Time: {elapsed:.0f}s")
        return

    # Step 3: Parse talks
    print("\n[3/4] Parsing talks from conference reports...")
    all_talks = []
    for i, item in enumerate(items):
        cache_path = CACHE_DIR / f"{item['identifier']}.txt"
        if not cache_path.exists():
            continue

        text = cache_path.read_text(encoding="utf-8", errors="replace")
        talks = parse_talks_from_text(text, item["year"], item["season"])
        all_talks.extend(talks)

        if (i + 1) % 20 == 0:
            print(f"  Parsed {i+1}/{len(items)} reports ({len(all_talks)} talks found)")

    print(f"  Total talks parsed: {len(all_talks)}")

    # Step 4: Clean up and generate titles
    print("\n[4/4] Cleaning and generating output...")
    all_talks = generate_talk_titles(all_talks)

    # Sort by year and season
    season_order = {"April": 0, "October": 1}
    all_talks.sort(key=lambda t: (t["year"], season_order.get(t["season"], 0)))

    # Write CSV
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = ["title", "speaker", "calling", "calling_original", "year", "season", "url", "talk", "footnotes"]

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_talks)

    elapsed = time.time() - start_time

    # Stats
    years = sorted(set(t["year"] for t in all_talks))
    speakers = sorted(set(t["speaker"] for t in all_talks))

    print(f"\n{'=' * 60}")
    print(f"Done! {len(all_talks)} talks saved to {OUTPUT_CSV}")
    print(f"Year range: {years[0] if years else 'N/A'} - {years[-1] if years else 'N/A'}")
    print(f"Unique speakers: {len(speakers)}")
    print(f"Conferences processed: {len(items)}")
    print(f"Time: {elapsed:.0f}s")
    print(f"{'=' * 60}")

    # Print sample of speakers found
    print(f"\nSample speakers (first 20):")
    for s in speakers[:20]:
        count = sum(1 for t in all_talks if t["speaker"] == s)
        print(f"  {s} ({count} talks)")


if __name__ == "__main__":
    main()
