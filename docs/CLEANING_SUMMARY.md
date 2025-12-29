# Conference Talks Dataset Cleaning Summary

## Overview
Successfully cleaned and standardized the conference talks dataset from **102 unique calling values** down to **46 standardized calling values**.

---

## Data Reduction

| Metric | Before | After | Removed |
|--------|--------|-------|---------|
| **Total Talks** | 4,340 | 4,122 | 218 |
| **Unique Callings** | 102 | 46 | -56% |
| **Unique Speakers** | N/A | 746 | - |

---

## Removed Entries

The following types of entries were removed from the dataset:

1. **Church Auditing Department reports**: 45 talks
2. **"Presented by" entries**: 52 talks  
3. **Session title rows** (morning/afternoon/evening session): 103 talks
4. **"No Speaker Found" entries**: 18 talks

**Total removed**: 218 talks

---

## Standardization Rules Applied

### 1. First Presidency
- ✓ Unified: "President of the Church" and "President of The Church of Jesus Christ of Latter-day Saints"
- ✓ Standardized counselor positions
- ✓ Included "Secretary to the First Presidency"

### 2. Quorum of the Twelve Apostles
**Before**: 
- "Of the Quorum of the Twelve Apostles"
- "Of the Council of the Twelve"
- "Of the Quorum of the Twelve"
- "Assistant to the Council of the Twelve"
- "President of the Council of the Twelve"
- "Acting President of the Quorum of the Twelve Apostles"

**After**: 
- "Of the Quorum of the Twelve Apostles" (1,208 talks)
- "President of the Quorum of the Twelve Apostles" (99 talks)
- "Assistant to the Quorum of the Twelve Apostles" (147 talks)

### 3. Seventy
**Before**: 
- "Of the Seventy"
- "Of the First Quorum of the Seventy"
- "Of the First Council of the Seventy"
- "Of the Second Quorum of the Seventy"
- "Of the Presidency of the Seventy"
- "Of the Presidency of the First Quorum of the Seventy"
- "Emeritus Member of the Seventy"
- "Released Member of the Seventy"
- Various capitalization variations

**After**: 
- "Of the Seventy" (893 talks)
- "Of the Presidency of the Seventy" (181 talks)
- "Emeritus Member of the Seventy" (18 talks)
- "Released Member of the Seventy" (8 talks)

### 4. Auxiliary Organizations
Standardized all variations of:
- Relief Society General Presidency
- Young Women General Presidency
- Primary General Presidency
- Young Men General Presidency
- Sunday School General Presidency
- Presiding Bishopric

### 5. Speaker Names
- ✓ Removed titles: "Elder", "President", "Sister", "Brother", "By"
- Example: "By Elder Dale G. Renlund" → "Dale G. Renlund"

### 6. Special Categories
- **Local Leader/Member**: Ward/stake leaders (24 talks)
- **BYU Leadership/Faculty**: BYU-affiliated speakers (2 talks)
- **Special Guest**: Astronauts, Boy Scouts leadership, etc.

---

## Final Standardized Calling Values (Top 20)

| Calling | Count |
|---------|-------|
| Of the Quorum of the Twelve Apostles | 1,208 |
| Of the Seventy | 893 |
| President of the Church | 330 |
| Second Counselor in the First Presidency | 308 |
| First Counselor in the First Presidency | 288 |
| Of the Presidency of the Seventy | 181 |
| Assistant to the Quorum of the Twelve Apostles | 147 |
| President of the Quorum of the Twelve Apostles | 99 |
| Relief Society General President | 70 |
| Presiding Bishop | 62 |
| Young Women General President | 51 |
| First Counselor in the Relief Society General Presidency | 46 |
| Second Counselor in the Relief Society General Presidency | 45 |
| Second Counselor in the Presiding Bishopric | 42 |
| First Counselor in the Presiding Bishopric | 41 |
| First Counselor in the Young Women General Presidency | 40 |
| Second Counselor in the Young Women General Presidency | 39 |
| Primary General President | 27 |
| Local Leader/Member | 24 |
| Second Counselor in the Primary General Presidency | 21 |

---

## Files Created

1. **`conference_talks_cleaned.csv`** - Main cleaned dataset ready for analysis
   - Contains standardized calling values in the `calling` column
   - Contains original calling values in the `calling_original` column for reference
   - Speaker names cleaned (titles removed)
   - Sorted by year and season

2. **`clean_dataset.py`** - Reusable cleaning script
   - Can be run again on updated data
   - All standardization rules documented in code
   - Easy to modify if needed

---

## Dataset Characteristics

- **Time Period**: 1971 - 2025 (54 years)
- **Total Talks**: 4,122
- **Unique Speakers**: 746
- **Conferences Covered**: 108 conferences (April & October each year)

---

## Next Steps

The cleaned dataset (`conference_talks_cleaned.csv`) is now ready for analysis:

- ✅ Standardized calling values
- ✅ Clean speaker names
- ✅ Irrelevant entries removed
- ✅ Sorted chronologically
- ✅ Original values preserved for reference

You can now perform analysis on:
- Trends in who speaks at conference over time
- Distribution of talks by calling
- Speaker frequency analysis
- Content analysis of talks
- And much more!

