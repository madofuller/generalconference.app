#!/usr/bin/env python3
"""
Comprehensive OCR name cleanup for historical_talks.csv.
Merges all known OCR variants, space-splits, letter substitutions,
truncations, and formatting issues into canonical speaker names.
"""

import csv
import re
from pathlib import Path
from collections import Counter

CSV_PATH = Path("conference-app/public/historical_talks.csv")

# -----------------------------------------------------------------------
# Master name mapping: bad_name -> canonical_name
# Built from the full audit of 381 suspicious names
# -----------------------------------------------------------------------

NAME_MAP = {
    # === Rudger Clawson (122 + 54 + ~10 variants) ===
    "Rudger Claw Son": "Rudger Clawson",
    "Rudger Claws On": "Rudger Clawson",
    "Rudger Cla Wson": "Rudger Clawson",
    "Rudger Clam' Son": "Rudger Clawson",
    "Rud.Ger Claw Son": "Rudger Clawson",
    "Rudcer Claw Son": "Rudger Clawson",
    "Rvdger Claw Son": "Rudger Clawson",
    "Rugder Clawson": "Rudger Clawson",
    "Ritdger Clawson": "Rudger Clawson",
    "Rtidger Clawson": "Rudger Clawson",
    "Rtjdger Clawson": "Rudger Clawson",
    "Rtjdgee, Clawson": "Rudger Clawson",
    "Rudgbr Clawson": "Rudger Clawson",
    "Rudge.R Clawson": "Rudger Clawson",
    "Rudger Clawson. Elder Rudger Clawson": "Rudger Clawson",
    "Rudg": "Rudger Clawson",

    # === Anthony W. Ivins (126 + 33 "Wins" + 18 + variants) ===
    "Anthony W. Wins": "Anthony W. Ivins",
    "Anthony W . Wins": "Anthony W. Ivins",
    "Anthony W . Iv Ins": "Anthony W. Ivins",
    "Anthony W . Ivins": "Anthony W. Ivins",
    "Anthony W, Ivins": "Anthony W. Ivins",
    "Anthony W. Iv Ins": "Anthony W. Ivins",
    "Anthony Iv. Ivins": "Anthony W. Ivins",
    "Anthony Iv. Iv Ins": "Anthony W. Ivins",
    "An To In E R. Iv Ins": "Antoine R. Ivins",  # different person
    "Antoine R. Iv Ins": "Antoine R. Ivins",
    "Antoine R Ivins": "Antoine R. Ivins",

    # === Andrew Jenson (49 + 27 + 13) ===
    "Andrew J En Son": "Andrew Jenson",
    "Andrew Jen Son": "Andrew Jenson",

    # === Albert E. Bowen (38 + 23 + 16 + variants) ===
    "Albert E. Bow En": "Albert E. Bowen",
    "Albert E. Bo Wen": "Albert E. Bowen",
    "Albert E, Bowen": "Albert E. Bowen",
    "Albert E. Bowen Elder Albert E. Bowen": "Albert E. Bowen",
    "Abert E. Bow En": "Albert E. Bowen",

    # === Anthon H. Lund (90 + 12 + variants) ===
    "Ant Hon H. Lund": "Anthon H. Lund",
    "Ant Hon H.Lund": "Anthon H. Lund",
    "A Nth On H. Lund": "Anthon H. Lund",
    "Anthon H Lund": "Anthon H. Lund",
    "Aathon H. Lund": "Anthon H. Lund",
    "Anton H. Lund": "Anthon H. Lund",

    # === Charles W. Nibley (68 + 12 + variants) ===
    "Charles W. Nib Ley": "Charles W. Nibley",
    "Charles. W. Nib Ley": "Charles W. Nibley",
    "Charles Iv. Nibley": "Charles W. Nibley",
    "Charles Iv. Nib Ley": "Charles W. Nibley",
    "Charles Ii'. Nibley": "Charles W. Nibley",
    "Chaeles W. Nibley": "Charles W. Nibley",

    # === Charles W. Penrose (96 + 5 + variants) ===
    "Charles W . Penrose": "Charles W. Penrose",
    "Charles W. Penrose President Charles W. Penrose": "Charles W. Penrose",
    "Chas. W. Penrose": "Charles W. Penrose",
    "C. W. Penrose": "Charles W. Penrose",

    # === Charles H. Hart (99 + variants) ===
    "Charles H.Hart": "Charles H. Hart",
    "Charles .H. Hart": "Charles H. Hart",
    "Charles H Hart": "Charles H. Hart",
    "Charles K Hart": "Charles H. Hart",
    "Chalres H. Hart": "Charles H. Hart",
    "Charles- A. Callis": "Charles A. Callis",

    # === Charles A. Callis (130 + variants) ===
    "Chas. A. Callis": "Charles A. Callis",

    # === Heber J. Grant (686 + variants) ===
    "He Her J. Grant": "Heber J. Grant",
    "He.Ber J. Grant": "Heber J. Grant",
    "Heber.J. Grant": "Heber J. Grant",
    "Heber J. Grant Regarding Age President Heber J. Grant": "Heber J. Grant",
    "Heber J. Grant. President Heber J. Grant": "Heber J. Grant",

    # === Joseph F. Smith (219 + many variants) ===
    "Joseph F Smith": "Joseph F. Smith",
    "Joseph F, Smith": "Joseph F. Smith",
    "Joseph F- Smith": "Joseph F. Smith",
    "Joseph. F. Smith": "Joseph F. Smith",
    "Joseph A Smith": "Joseph F. Smith",
    "Joseph E Smith": "Joseph F. Smith",
    "Joseph F. Smith. President Joseph F. Smith": "Joseph F. Smith",
    "Joseph F. Smith. Opening Address": "Joseph F. Smith",
    "Joseph F. Smith. Closing Remarks": "Joseph F. Smith",
    "Joseph P . Smith": "Joseph F. Smith",
    "Joseph P. Smith": "Joseph F. Smith",
    "Joseph P. Smith. Opening Address": "Joseph F. Smith",
    "Joseph P. Smith. Closing Remarks": "Joseph F. Smith",
    "Joseph P. Smith, Jr": "Joseph F. Smith, Jr",
    "Joseph F Smith, Jr": "Joseph F. Smith, Jr",

    # === Joseph F. Merrill (94 + variants) ===
    "Joseph F, Merrill": "Joseph F. Merrill",
    "Joseph E. Merrill": "Joseph F. Merrill",
    "Joseph H. Merrill": "Joseph F. Merrill",
    "Joseph P. Merrill": "Joseph F. Merrill",

    # === Joseph E. Robinson (56 + variants) ===
    "Joseph, E. Robinson": "Joseph E. Robinson",
    "Joseph E.. Robinson": "Joseph E. Robinson",
    "Jos. E. Robinson": "Joseph E. Robinson",

    # === Melvin J. Ballard (173 + variants) ===
    "M El Vi N J. Ballard": "Melvin J. Ballard",
    "Mel Vin J. Ballard": "Melvin J. Ballard",
    "Melvinj. Ballard": "Melvin J. Ballard",
    "Melvln J. Ballard": "Melvin J. Ballard",
    "Melvin I. Ballard": "Melvin J. Ballard",

    # === George F. Richards (169 + variants) ===
    "George F.Richards": "George F. Richards",
    "George. F. Richards": "George F. Richards",
    "George P. Richards": "George F. Richards",

    # === George Q. Cannon (40 + variants) ===
    "George Q Cannon": "George Q. Cannon",
    "George O. Cannon": "George Q. Cannon",
    "George M. Cannon": "George Q. Cannon",

    # === George Albert Smith (222 + variants) ===
    "Geo. Albert Smith": "George Albert Smith",
    "George . Ilbert Smith": "George Albert Smith",

    # === Legrand Richards (104 + variants) ===
    "Le Grand Richards": "Legrand Richards",
    "Leg Rand Richards": "Legrand Richards",

    # === Samuel O. Bennion (60 + variants) ===
    "Samuel O. Ben N Ion": "Samuel O. Bennion",
    "Samuel O. Ben N I On": "Samuel O. Bennion",
    "Samuel O.Bennion": "Samuel O. Bennion",
    "S'Amuel-O.'Bennion": "Samuel O. Bennion",
    "Samuel A. Bennion": "Samuel O. Bennion",

    # === Adam S. Bennion (21 + variants) ===
    "Adam S. Ben N Ion": "Adam S. Bennion",
    "Owen Ben N Ion": "Owen Bennion",
    "Owen Bennion": "Owen Bennion",

    # === Francis M. Lyman (87 + variants) ===
    "Franc Is M. Lyman": "Francis M. Lyman",
    "Francis M Lyman": "Francis M. Lyman",
    "Francis. M. Lyman": "Francis M. Lyman",
    "Fkancis M. Lyman": "Francis M. Lyman",

    # === Elray L. Christiansen (37 + 5 + 2) ===
    "El Ray L. Christiansen": "Elray L. Christiansen",
    "Eiray L": "Elray L. Christiansen",
    "Elray L": "Elray L. Christiansen",

    # === Orson F. Whitney (126 + variants) ===
    "Orson F. Whitne Y": "Orson F. Whitney",
    "Orson P. Whitney": "Orson F. Whitney",

    # === James E. Talmage (90 + variants) ===
    "James E.Talm Age": "James E. Talmage",
    "James E. Talma Ge": "James E. Talmage",
    "James E Talmage": "James E. Talmage",
    "James E. Talmage Elder James E. Talmage": "James E. Talmage",

    # === Hyrum M. Smith (61 + variants) ===
    "Hyrtjm M. Smith": "Hyrum M. Smith",
    "Hyrtjm G. Smith": "Hyrum G. Smith",
    "Hyrum M Smith": "Hyrum M. Smith",
    "Hyrum.M. Smith": "Hyrum M. Smith",
    "Hteum M. Smith": "Hyrum M. Smith",
    "Hybttm M, Smith": "Hyrum M. Smith",

    # === Eldred G. Smith (80 + variant) ===
    "Eld Red G. Smith": "Eldred G. Smith",

    # === Stephen L. Richards (76 + variants) ===
    "Stephen L.Richards": "Stephen L. Richards",
    "Stephen I. Richards": "Stephen L. Richards",
    "Stephens L. Richards": "Stephen L. Richards",
    "Stephen C. Richards": "Stephen L. Richards",
    "S. W. Richards": "Stephen L. Richards",

    # === German E. Ellsworth (52 + variants) ===
    "German E.Ellsworth": "German E. Ellsworth",
    "German E Ellsworth": "German E. Ellsworth",

    # === S. Dilworth Young (52 + variants) ===
    "S. Dil Worth Young": "S. Dilworth Young",
    "S. Dilwarth Young": "S. Dilworth Young",

    # === Oscar A. Kirkham (50 + variant) ===
    "Oscar A. Kirk Ham": "Oscar A. Kirkham",

    # === David O. McKay (15 + variant) ===
    "David O. Mc Kay": "David O. McKay",

    # === David A. Smith (76 + variants) ===
    "David, A. Smith": "David A. Smith",
    "Davw A. Smith": "David A. Smith",

    # === George Teasdale (33 + variant) ===
    "George Teas Dale": "George Teasdale",

    # === Don B. Colton (22 + variants) ===
    "Don B. Colt On": "Don B. Colton",
    "Don. B. Colton": "Don B. Colton",

    # === Soren Rasmussen (3 + variant) ===
    "So Ren Rasmus Sen": "Soren Rasmussen",

    # === Winslow Farr Smith (11 + variant) ===
    "Win Slow Farr Smith": "Winslow Farr Smith",
    "Win Slow F. Smith": "Winslow F. Smith",

    # === Elias S. Woodruff (16 + variants) ===
    "Eli As S. Woodruff": "Elias S. Woodruff",
    "Ellas S. Woodruff": "Elias S. Woodruff",

    # === Richard R. Lyman (118 + variants) ===
    "Richard R.Lyman": "Richard R. Lyman",
    "Richard R, Lyman": "Richard R. Lyman",

    # === Richard W. Young (9 + variant) ===
    "Richard W . Young": "Richard W. Young",

    # === John A. Widtsoe (116 + variants) ===
    "John A Widtsoe": "John A. Widtsoe",
    "John A, Widtsoe": "John A. Widtsoe",

    # === John W. Taylor (26 + variants) ===
    "John W Taylor": "John W. Taylor",
    "John. W. Taylor": "John W. Taylor",
    "Jo His Iv Taylor": "John W. Taylor",

    # === John L. Herrick (24 + variants) ===
    "John L. Herri Ck": "John L. Herrick",
    "John I. Herrick": "John L. Herrick",

    # === John R. Winder (26 + variant) ===
    "Jorn R. Winder": "John R. Winder",

    # === John Henry Smith (51 + variant) ===
    "John Henrt Smith": "John Henry Smith",

    # === Jonathan G. Kimball (10 + variants) ===
    "Jonathan G.Kimball": "Jonathan G. Kimball",
    "Jonathan G Kimball": "Jonathan G. Kimball",

    # === Marion G. Romney (131 + variant) ===
    "Marion G. Romney Elder Marion G. Romney": "Marion G. Romney",

    # === Marion D. Hanks (55 + variant) ===
    "Marion Duff Hanks": "Marion D. Hanks",

    # === Marriner W. Merrill (14 + variants) ===
    "Marriner W Merrill": "Marriner W. Merrill",
    "Marriner Iv. Merrill": "Marriner W. Merrill",
    "Marrjner Merrill": "Marriner W. Merrill",

    # === Mathias/Matthias F. Cowley (4 + variants) ===
    "Math Ias F. Cowley": "Matthias F. Cowley",
    "Mathias F. Cowley": "Matthias F. Cowley",
    "Matthias P. Cowley": "Matthias F. Cowley",

    # === Matthew Cowley (34 + variant) ===
    "Mathew Cowley": "Matthew Cowley",

    # === Bryant S. Hinckley (18 + variant) ===
    "Bryants. Hinckley": "Bryant S. Hinckley",

    # === Alonzo A. Hinckley (25 + variant) ===
    "Alonzo A.Hinckley": "Alonzo A. Hinckley",
    "Alonzoa. Hinckley": "Alonzo A. Hinckley",

    # === Walter P. Monson (24 + variants) ===
    "Walter P. Mo N Son": "Walter P. Monson",
    "Walter P. M On Son": "Walter P. Monson",

    # === Don Mack Dalton ===
    "Don Mack D Alton": "Don Mack Dalton",

    # === Preston Nibley (6 + variant) ===
    "Preston Nib Ley": "Preston Nibley",

    # === Stephen L. Chipman (10 + variant) ===
    "Stephen L. Chip Man": "Stephen L. Chipman",

    # === Thomas E. Bassett (9 + variant) ===
    "Thomas E. B As Sett": "Thomas E. Bassett",

    # === James G. Duffin (6 + variant) ===
    "James G. Duff In": "James G. Duffin",

    # === Joseph C. Bentley (5 + variant) ===
    "Joseph C. Ben T Ley": "Joseph C. Bentley",

    # === Joseph R. Murdock (4 + variant) ===
    "Joseph R.Murdock": "Joseph R. Murdock",

    # === D'Monte W. Coombs (2 + variant) ===
    "D'Monte W .Coombs": "D'Monte W. Coombs",

    # === Gustive O. Larson (2 + variant) ===
    "Gu Stive O. Larson": "Gustive O. Larson",

    # === John A. Elison ===
    "John A. Eli Son": "John A. Elison",

    # === John P. Lillywhite ===
    "John P. Lilly White": "John P. Lillywhite",

    # === Clarence H. Tingey ===
    "Clarence H. Tin Gey": "Clarence H. Tingey",

    # === Merrill D. Clayson ===
    "Merrill D. Clay Son": "Merrill D. Clayson",

    # === George R. Maycock ===
    "George R. May Cock": "George R. Maycock",

    # === Reinhold Stoof ===
    "Rein Hold St Oof": "Reinhold Stoof",

    # === Rulon S. Wells (142 + variants) ===
    "Rulon S.. Wells": "Rulon S. Wells",
    "Rulox S. Wells": "Rulon S. Wells",
    "Rulen S. Wells": "Rulon S. Wells",
    "Rulon S. Ho Wells": "Rulon S. Howells",
    "Rulon S. Howells": "Rulon S. Howells",

    # === Levi Edgar Young (164 + variant) ===
    "Levj Edgar Young": "Levi Edgar Young",

    # === Miles L. Jones (17 + variant) ===
    "Mjles L. Jones": "Miles L. Jones",

    # === Nephi L. Morris (10 + variant) ===
    "Nefhi L. Morris": "Nephi L. Morris",

    # === Thorpe B. Isaacson (77 + variant) ===
    "Teiorpe B. Isaacson": "Thorpe B. Isaacson",

    # === Howard W. Hunter (45 + variant) ===
    "Howard W, Hunter": "Howard W. Hunter",

    # === Mark E. Petersen (107 + variant) ===
    "Mark E, Petersen": "Mark E. Petersen",

    # === Nicholas G. Smith (28 + variant) ===
    "Nicholas G, Smith": "Nicholas G. Smith",

    # === Delbert L. Stapley (90 + variant) ===
    "Delbert Leon Stapley": "Delbert L. Stapley",

    # === Theodore M. Burton (30 + variant) ===
    "Theodore Moyle Burton": "Theodore M. Burton",

    # === Ezra Taft Benson (115 + variant) ===
    "Ezra Taft Benson Elder Ezra Taft Benson": "Ezra Taft Benson",

    # === George Q. Morris (29 + variant) ===
    "George Q. Morris Elder George Q. Morris": "George Q. Morris",

    # === Abraham O. Woodruff (25 + variants) ===
    "Abraham O Woodruff": "Abraham O. Woodruff",
    "Abraham O. Woodruff. Elder A. O. Woodruff": "Abraham O. Woodruff",

    # === Franklin D. Richards (45 + variant) ===
    "Franklin Dewey Richards": "Franklin D. Richards",

    # === Ben E. Rich (33 + variant) ===
    "Ben E Rich": "Ben E. Rich",
    "Ben J. Goddard": "Benjamin Goddard",

    # === J. Reuben Clark, Jr (235 + variants) ===
    "J. Reuben Clark Jr": "J. Reuben Clark, Jr",
    "J. Reuben Ceark, Jr": "J. Reuben Clark, Jr",

    # === William J. Critchlow, Jr (21 + variant) ===
    "William J. Critchlow Jr": "William J. Critchlow, Jr",

    # === Charles E. Rowan, Jr (10 + variant) ===
    "Charles E. Rowan,, Jr": "Charles E. Rowan, Jr",

    # === Hugh B. Brown (106 + variant) ===
    "Hugh. B. Brown": "Hugh B. Brown",

    # === Rey L. Pratt (76 + variants) ===
    "Ray L. Pratt": "Rey L. Pratt",
    "Rev L. Pratt": "Rey L. Pratt",

    # === Seymour B. Young (67 + variant) ===
    "Seymour. B. Young": "Seymour B. Young",

    # === Brigham Young (17 + variants) ===
    "Brigham Ham Young": "Brigham Young",
    "Brigham Ham S. Young": "Brigham S. Young",
    "B Rich Am S. Young": "Brigham S. Young",
    "B. S. Young": "Brigham S. Young",

    # === G. E. Ellsworth trailing period ===
    "G. E. Ellsworth.": "G. E. Ellsworth",

    # === Lewis Anderson (10 + variant) ===
    "Lewis R. Anderson": "Lewis Anderson",

    # === Nathan Eldon Tanner / N. Eldon Tanner ===
    "Nathan Eldon Tanner": "N. Eldon Tanner",
    "Nathan E. Tanner": "N. Eldon Tanner",

    # === How A / Howa (truncated "Howard") - too vague, remove ===

    # === Procedural entries that aren't real speakers ===
    "Of The Council Of Twelve Apostles": "_PROCEDURAL",
    "Of The Council Of The Twelve Apostles": "_PROCEDURAL",
    "Of Tfie Council Of Twelve Apostles": "_PROCEDURAL",
    "Of The Twelve Apostles And The Full Quorum Of The Twelve Apostles": "_PROCEDURAL",
    "Of Schools": "_PROCEDURAL",
    "Of Church Schools": "_PROCEDURAL",
    "Speaks": "_PROCEDURAL",

    # === Joseph L. Wirthlin vs Joseph B. Wirthlin ===
    "Joseph B. Wirthlin": "Joseph L. Wirthlin",

    # === Nephi Jensen / Nephi Pratt ===
    "Nephi U. S. C. Jensen": "Nephi Jensen",
    "Nephi L. Pratt": "Nephi Pratt",

    # === Jonathan Golden Kimball = J. Golden Kimball ===
    "Jonathan Golden Kimball": "J. Golden Kimball",
}

# Truncated single-word fragments - map to _UNKNOWN (will be removed)
SINGLE_WORD_FRAGMENTS = [
    "Mark", "Joseph", "Ezra", "Bruce", "Ster", "Frankl", "Rich",
    "Delbe", "Gordc", "Miltc", "Spenc", "Carl", "James", "Nathan",
    "Smith", "Adam", "George", "Thom", "Thor", "John", "Josep",
    "Gordo", "Henr", "Legra", "Legrj", "Spence", "Wendell", "William",
    "Bernard", "Vict", "German", "Orson", "Oscar", "Paul", "Samuel",
    "Elias", "Jesse", "Cliffc", "Bernak", "Bernar", "Bernare", "Brucl",
    "Delbi", "Eldi", "Eldr", "Hartm", "Hartn", "Josef", "Legb",
    "Levi", "Milk", "Mose", "Natha", "Orso", "Richa", "Robef",
    "Spencj", "Stei", "Step", "Thon", "Thorf", "Theodc", "Boyd",
    "Asahel", "How A", "Howa",
]


def fix_calling(speaker, old_calling):
    """Rebuild calling to match corrected speaker name."""
    m = re.match(r"^(President|Elder|Bishop|Sister|Apostle|Patriarch)\s+", old_calling)
    if m:
        return f"{m.group(1)} {speaker}"
    return speaker


def main():
    print("Reading CSV...")
    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    total = len(rows)
    print(f"  {total} total records")

    # Build full map including fragments
    full_map = dict(NAME_MAP)
    for frag in SINGLE_WORD_FRAGMENTS:
        full_map[frag] = "_UNKNOWN"

    # Apply fixes
    fixed = 0
    removed_procedural = 0
    removed_unknown = 0
    kept = []

    for row in rows:
        speaker = row["speaker"]
        if speaker in full_map:
            target = full_map[speaker]
            if target == "_PROCEDURAL":
                removed_procedural += 1
                continue
            elif target == "_UNKNOWN":
                removed_unknown += 1
                continue
            else:
                row["speaker"] = target
                row["calling"] = fix_calling(target, row["calling"])
                row["calling_original"] = fix_calling(target, row["calling_original"])
                fixed += 1
        kept.append(row)

    # Write cleaned CSV
    print(f"\nWriting cleaned CSV...")
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(kept)

    # Stats
    counts = Counter(r["speaker"] for r in kept)
    print(f"\n{'='*50}")
    print(f"CLEANUP COMPLETE")
    print(f"{'='*50}")
    print(f"  Names fixed:              {fixed}")
    print(f"  Procedural rows removed:  {removed_procedural}")
    print(f"  Unknown fragments removed:{removed_unknown}")
    print(f"  Records before:           {total}")
    print(f"  Records after:            {len(kept)}")
    print(f"  Unique speakers:          {len(counts)}")

    # Verify: any remaining short/suspicious names?
    remaining_bad = [n for n in counts if len(n) < 5 or any(c in n for c in "()&")]
    if remaining_bad:
        print(f"\n  Remaining short/special names ({len(remaining_bad)}):")
        for n in sorted(remaining_bad):
            print(f"    \"{n}\" ({counts[n]})")


if __name__ == "__main__":
    main()
