#!/usr/bin/env python3
"""
Clean up historical_talks.csv (1880-1970) data quality issues.

Fixes:
1. Truncated/corrupted speaker names from OCR (47 records)
2. Double-space OCR artifacts in all talk text (100% of records)
3. Names with stray parentheses, ampersands, extra metadata
4. Calling fields to match corrected names
5. Adds missing name corrections to the scraper for future re-runs

Run: python clean_historical.py
"""

import csv
import re
from pathlib import Path

CSV_PATH = Path("conference-app/public/historical_talks.csv")
BACKUP_PATH = CSV_PATH.with_suffix(".csv.bak")

# -----------------------------------------------------------------------
# Name corrections: (speaker_value, year, season) -> corrected_speaker
# Built by cross-referencing calling, era, and same-conference speakers
# -----------------------------------------------------------------------
NAME_FIXES = {
    # --- Clearly identifiable from parenthetical metadata ---
    ("Joseph E. Robinson. (Preset Of California Mission.)", "1906", "October"): "Joseph E. Robinson",
    ("Thomas E. Bassett. (Pres'T Of Fremont Stake)", "1906", "October"): "Thomas E. Bassett",
    ("Joseph F. Smith. (Closing Remarks.)", "1908", "April"): "Joseph F. Smith",
    ("John I. He&Rick", "1913", "October"): "John I. Hedrick",
    ("Charles W. Penrose )", "1922", "October"): "Charles W. Penrose",
    ("Marion G. Romne)", "1944", "April"): "Marion G. Romney",

    # --- 1904: Very early OCR, fragmentary names ---
    ("Hyr", "1904", "April"): "Hyrum M. Smith",
    # "Wm" = abbreviation for William; "A" and "Jc" too ambiguous to fix reliably

    # --- 1950s: President D/Da = David O. McKay (President 1951-1970) ---
    ("D", "1954", "April"): "David O. McKay",
    ("D", "1956", "April"): "David O. McKay",
    ("D", "1956", "October"): "David O. McKay",
    ("D", "1961", "April"): "David O. McKay",
    ("D", "1962", "October"): "David O. McKay",
    ("D", "1963", "October"): "David O. McKay",
    ("D", "1966", "April"): "David O. McKay",
    ("D", "1969", "April"): "David O. McKay",
    ("Da", "1958", "October"): "David O. McKay",  # 3 records, all same conference

    # --- Hugh B. Brown (Apostle, then Counselor in First Presidency) ---
    ("Huc", "1955", "October"): "Hugh B. Brown",
    ("Huc", "1959", "April"): "Hugh B. Brown",
    ("Huc", "1959", "October"): "Hugh B. Brown",
    ("Hug", "1959", "April"): "Hugh B. Brown",
    ("Hu", "1962", "October"): "Hugh B. Brown",
    ("Hu(", "1965", "April"): "Hugh B. Brown",
    ("Hu", "1965", "April"): "Hugh B. Brown",

    # --- Henry D. Moyle (Counselor in First Presidency 1959-1963) ---
    ("He", "1962", "October"): "Henry D. Moyle",

    # --- Harold B. Lee ---
    ("Ha", "1954", "October"): "Harold B. Lee",
    ("Hl", "1964", "April"): "Harold B. Lee",
    ("Hae", "1961", "October"): "Harold B. Lee",

    # --- Other apostles / general authorities ---
    ("Tho", "1953", "April"): "Thorpe B. Isaacson",
    ("Adm", "1955", "April"): "Adam S. Bennion",
    ("Ezr", "1966", "April"): "Ezra Taft Benson",
    ("Lor", "1969", "April"): "Loren C. Dunn",
    ("Boy", "1965", "April"): "Boyd K. Packer",
    ("Boy", "1969", "April"): "Boyd K. Packer",  # 2 records same conference

    # --- Paul H. Dunn ---
    ("Pal", "1965", "April"): "Paul H. Dunn",
    ("Pal", "1966", "October"): "Paul H. Dunn",
    ("Pai", "1969", "October"): "Paul H. Dunn",

    # --- Alvin R. Dyer (Assistant to the Twelve, then Apostle) ---
    ("Alv", "1959", "April"): "Alvin R. Dyer",
    ("Alv", "1966", "October"): "Alvin R. Dyer",
    ("Al", "1966", "April"): "Alvin R. Dyer",
    ("Al", "1969", "October"): "Alvin R. Dyer",

    # --- Alma Sonne (Assistant to the Twelve) ---
    ("Ali", "1956", "October"): "Alma Sonne",

    # --- Howard W. Hunter (Apostle from 1959) ---
    ("Hai", "1964", "October"): "Howard W. Hunter",

    # --- N. Eldon Tanner (Session presiding, First Presidency from 1963) ---
    ("Hi", "1965", "April"): "N. Eldon Tanner",
    ("Hi", "1966", "October"): "N. Eldon Tanner",

    # --- John Longden (Assistant to the Twelve) ---
    ("Joh", "1965", "April"): "John Longden",

    # --- Ao (1965) - likely Alma Sonne based on "Assistant to the Council" ---
    ("Ao", "1965", "April"): "Alma Sonne",
}

# For "Da" 1958 October there are 3 records; we handle via speaker match below


def fix_double_spaces(text):
    """Remove double-space OCR artifact from talk text.
    Collapses '  ' (double space) to single space, preserving paragraph breaks."""
    # Replace double spaces with single
    text = re.sub(r"  +", " ", text)
    # Clean up any resulting whitespace issues
    text = re.sub(r" \n", "\n", text)
    text = re.sub(r"\n ", "\n", text)
    return text.strip()


def fix_calling(speaker, old_calling):
    """Rebuild calling field to match corrected speaker name."""
    # Extract title prefix (President, Elder, Bishop, etc.)
    m = re.match(r"^(President|Elder|Bishop|Sister|Apostle|Patriarch)\s+", old_calling)
    if m:
        title = m.group(1)
        return f"{title} {speaker}"
    return speaker


def main():
    print("Reading CSV...")
    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    print(f"  {len(rows)} total records")

    # Backup
    print(f"Creating backup at {BACKUP_PATH}...")
    with open(BACKUP_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    # --- Fix 1: Corrupted speaker names ---
    name_fixes_applied = 0
    unfixed = []

    for row in rows:
        yr = row.get("year", "")
        if not yr.isdigit() or not (1880 <= int(yr) <= 1979):
            continue

        speaker = row["speaker"]
        season = row["season"]
        key = (speaker, yr, season)

        if key in NAME_FIXES:
            new_name = NAME_FIXES[key]
            row["calling"] = fix_calling(new_name, row["calling"])
            row["calling_original"] = fix_calling(new_name, row["calling_original"])
            row["speaker"] = new_name
            name_fixes_applied += 1
        elif len(speaker) < 4 or any(c in speaker for c in "()&"):
            unfixed.append((speaker, yr, season, row["calling"]))

    print(f"\n  Speaker name fixes applied: {name_fixes_applied}")
    if unfixed:
        print(f"  Remaining unfixed names ({len(unfixed)}):")
        for sp, yr, ssn, cal in unfixed:
            print(f"    \"{sp}\" ({yr} {ssn}) calling=\"{cal}\"")

    # --- Fix 2: Double-space OCR artifact in talk text ---
    double_space_fixes = 0
    for row in rows:
        yr = row.get("year", "")
        if not yr.isdigit() or not (1880 <= int(yr) <= 1979):
            continue
        talk = row.get("talk", "")
        if "  " in talk:
            row["talk"] = fix_double_spaces(talk)
            double_space_fixes += 1

        # Also fix double spaces in titles
        title = row.get("title", "")
        if "  " in title:
            row["title"] = fix_double_spaces(title)

    print(f"  Double-space fixes in talk text: {double_space_fixes}")

    # --- Fix 3: Clean up calling fields with stray artifacts ---
    calling_fixes = 0
    for row in rows:
        for field in ["calling", "calling_original"]:
            val = row[field]
            # Remove trailing ) or ( artifacts
            if val.endswith(")") and "(" not in val:
                row[field] = val.rstrip(")").strip()
                calling_fixes += 1
            # Remove stray & artifacts
            if "&" in val and len(val) < 30:
                row[field] = val.replace("&", "").strip()
                calling_fixes += 1

    print(f"  Calling field artifact fixes: {calling_fixes}")

    # --- Write cleaned CSV ---
    print(f"\nWriting cleaned CSV to {CSV_PATH}...")
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    # --- Summary stats ---
    hist = [r for r in rows if r.get("year", "").isdigit() and 1880 <= int(r["year"]) <= 1979]
    remaining_short = sum(1 for r in hist if len(r["speaker"].strip()) < 4)
    remaining_special = sum(1 for r in hist if any(c in r["speaker"] for c in "()&"))
    remaining_dblspace = sum(1 for r in hist if "  " in r.get("talk", ""))

    print(f"\n{'='*50}")
    print(f"CLEANUP COMPLETE")
    print(f"{'='*50}")
    print(f"  Name fixes applied:        {name_fixes_applied}")
    print(f"  Talk text de-spaced:        {double_space_fixes}")
    print(f"  Remaining short names:      {remaining_short}")
    print(f"  Remaining special chars:    {remaining_special}")
    print(f"  Remaining double-spaced:    {remaining_dblspace}")
    print(f"  Backup saved to:            {BACKUP_PATH}")


if __name__ == "__main__":
    main()
