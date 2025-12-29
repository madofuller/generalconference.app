# Conference Scraper Notebook - Quick Start Guide

## 📓 File: `ConferenceScraper_Updated.ipynb`

A complete Google Colab notebook that scrapes and cleans all LDS General Conference talks from 1971-2025.

---

## ✨ What's New?

### Fixed October 2024+ Scraping Issue
The Church website changed its HTML structure in October 2024. This updated notebook handles both old and new structures automatically!

**The Problem:**
- Old talks (pre-Oct 2024): `<h1 id="title1">Title</h1>`
- New talks (Oct 2024+): `<h1 id="random_id">Title</h1>`

**The Solution:**
The scraper now tries the old structure first, then falls back to the new structure. All talks from 1971-2025 now scrape correctly!

---

## 🚀 How to Use

### Method 1: Google Colab (Recommended)

1. **Upload to Google Colab:**
   - Go to [colab.research.google.com](https://colab.research.google.com/)
   - Click **File → Upload notebook**
   - Select `ConferenceScraper_Updated.ipynb`

2. **Run the Notebook:**
   - Click **Runtime → Run all**
   - Wait 10-15 minutes for scraping to complete
   - The cleaned CSV will automatically download

3. **Done!**
   - You'll have `conference_talks_cleaned.csv` with 4,000+ talks

### Method 2: Local Jupyter

1. Install Jupyter: `pip install jupyter`
2. Open notebook: `jupyter notebook ConferenceScraper_Updated.ipynb`
3. Run all cells: **Cell → Run All**
4. Find the CSV in the same directory

---

## 📊 What You Get

### Output File: `conference_talks_cleaned.csv`

**4,000+ talks** from 1971-2025 with:
- ✅ Standardized calling names (102 → 46 categories)
- ✅ Cleaned speaker names (titles removed)
- ✅ Complete talk text and footnotes
- ✅ Direct URLs to each talk
- ✅ No irrelevant entries (auditing reports, session titles removed)

### Columns:
| Column | Description |
|--------|-------------|
| `title` | Talk title |
| `speaker` | Speaker name (cleaned) |
| `calling` | Standardized calling/position |
| `year` | Conference year |
| `season` | April or October |
| `url` | Direct link to talk |
| `talk` | Full text content |
| `footnotes` | Talk footnotes |
| `calling_original` | Original calling text (for reference) |

---

## 🎯 Key Features

### 1. Updated HTML Parser
Handles both old (pre-Oct 2024) and new (Oct 2024+) website structures automatically.

### 2. Calling Standardization
Reduces 102+ variations down to 46 clean categories:

**Examples:**
- "Of the Council of the Twelve" → "Of the Quorum of the Twelve Apostles"
- "First Quorum of the Seventy" → "Of the Seventy"
- "President of The Church of Jesus Christ..." → "President of the Church"

### 3. Data Cleaning
Automatically removes:
- Church Auditing Department reports
- "Presented by" entries
- Session title rows
- Entries without speakers

### 4. Parallel Scraping
Uses multi-threading for fast scraping (~10-15 minutes total).

---

## 📝 Notebook Structure

The notebook contains 18 cells organized into 8 steps:

1. **Install Libraries** - Auto-installs required packages
2. **Import Libraries** - Sets up Python environment
3. **Define Scraping Functions** - Updated HTML parser
4. **Define Cleaning Functions** - Standardization rules
5. **Scrape All Talks** - Fetches all conference talks
6. **Clean Data** - Applies standardization
7. **Display Summary** - Shows statistics
8. **Save & Download** - Exports cleaned CSV

---

## ⏱️ Performance

- **Scraping time**: 10-15 minutes (depends on internet speed)
- **Total talks**: ~4,122 talks
- **Time period**: 1971 - 2025 (54 years, 110 conferences)
- **Success rate**: 95%+ (some very old talks may have formatting issues)

---

## 🔧 Troubleshooting

### Issue: "No module named 'requests'"
**Solution**: Make sure you run the first code cell to install libraries.

### Issue: Scraping is very slow
**Solution**: This is normal. Scraping 4,000+ talks takes 10-15 minutes.

### Issue: Some talks show "No Title Found"
**Solution**: This shouldn't happen with the updated scraper. If it does, those talks may have unusual HTML structure.

### Issue: Download doesn't work in Google Colab
**Solution**: Manually download the file from the Files panel on the left sidebar.

---

## 📦 What's Included

In your `/conferencescraper` folder:

| File | Description |
|------|-------------|
| `ConferenceScraper_Updated.ipynb` | **Main notebook** - Use this in Google Colab |
| `conferencescraper.py` | Original Python script (updated) |
| `clean_dataset.py` | Standalone cleaning script |
| `update_recent_talks.py` | Script to update only recent talks |
| `conference_talks_cleaned.csv` | Pre-cleaned dataset (if you ran it locally) |
| `CLEANING_SUMMARY.md` | Detailed cleaning documentation |

---

## 🎓 Next Steps

After getting your cleaned dataset:

1. **Basic Analysis**:
   - Count talks by calling category
   - Track speaker frequency over time
   - Analyze seasonal patterns

2. **Advanced Analysis**:
   - Text analysis / sentiment analysis
   - Topic modeling
   - Word frequency analysis
   - Historical trends

3. **Visualization**:
   - Create charts showing talk distribution
   - Timeline of speakers
   - Word clouds of common themes

---

## 💡 Tips

- **First time?** Just click "Run all" and wait. It works automatically!
- **Regular updates?** Use `update_recent_talks.py` to only update recent conferences
- **Custom analysis?** The notebook provides a clean DataFrame you can manipulate
- **Need help?** Check `CLEANING_SUMMARY.md` for detailed documentation

---

## ✅ Standardized Callings (Top 10)

The notebook standardizes to these main categories:

1. Of the Quorum of the Twelve Apostles (1,208 talks)
2. Of the Seventy (893 talks)
3. President of the Church (330 talks)
4. Second Counselor in the First Presidency (308 talks)
5. First Counselor in the First Presidency (288 talks)
6. Of the Presidency of the Seventy (181 talks)
7. Assistant to the Quorum of the Twelve Apostles (147 talks)
8. President of the Quorum of the Twelve Apostles (99 talks)
9. Relief Society General President (70 talks)
10. Presiding Bishop (62 talks)

---

## 📅 Last Updated

**December 2024** - Fixed for October 2024+ website changes

---

## 🤝 Support

Having issues? Check:
1. This README
2. `CLEANING_SUMMARY.md` for standardization details
3. Comments in the notebook cells

---

**Ready to get started? Upload `ConferenceScraper_Updated.ipynb` to Google Colab and click "Run all"! 🚀**

