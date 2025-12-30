# 📚 General Conference Analysis Suite

A comprehensive toolkit for scraping, analyzing, and exploring LDS General Conference talks from 1971 to present using modern web technologies and AI-powered topic classification.

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## 🎯 Overview

This project provides three powerful components:

1. **Web Scraper** - Extracts conference talk data from churchofjesuschrist.org
2. **AI Topic Classification** - Uses DeBERTa NLP model to classify talks by 60+ gospel topics
3. **Interactive Web App** - Beautiful Next.js application for exploring and analyzing talks

## ✨ Features

### 📖 Web Scraper
- Scrapes 280,000+ conference talks dating back to 1971
- Extracts titles, speakers, callings, full text, and footnotes
- Data cleaning and standardization
- Outputs to CSV/JSON formats

### 🤖 AI Topic Classification
- Zero-shot classification using DeBERTa-v3-base model
- 60+ gospel topics from Preach My Gospel
- Multi-label classification (up to 5 topics per talk)
- Fast version: 10-20x speedup with batch processing
- Resume capability with checkpoints

### 😊 AI Emotion Analysis
- Emotion classification using roberta-base-go_emotions model
- 28 emotion labels (positive, negative, cognitive, neutral)
- Multi-label emotion detection per talk
- Track emotional tone trends over 50+ years
- Batch processing for efficient analysis

### 🎨 Interactive Web Application
- **10 Powerful Features**:
  - Scripture search by volume, book, chapter, verse
  - Advanced word search with Boolean logic
  - Exact phrase search
  - AI-powered topic exploration (60+ gospel topics)
  - AI-powered emotion analysis (28 emotions)
  - Speaker analysis and statistics
  - Conference breakdowns
  - Individual talk analysis
  - Overall statistics and trends
  - Advanced filtering (by speaker, era, year)
- Built with Next.js, TypeScript, and shadcn/ui
- Beautiful visualizations with Recharts
- Real-time search with 280,000+ talks
- Responsive design for all devices

## 📁 Project Structure

```
conferencescraper/
├── scraper/                    # Web scraping scripts
│   ├── conferencescraper.py
│   ├── ConferenceScraper_Updated.ipynb
│   ├── update_recent_talks.py
│   └── clean_dataset.py
├── classification/             # AI topic & emotion classification
│   ├── classify_topics.py              # Topic classification (original)
│   ├── classify_topics_fast.py         # Topic classification (optimized)
│   ├── classify_emotions_fast.py       # Emotion classification
│   ├── requirements_emotions.txt       # Dependencies for emotions
│   ├── test_classification.py
│   └── test_fast_classification.py
├── conference-app/             # Next.js web application
│   ├── app/                    # App routes and pages
│   ├── components/             # React components
│   ├── lib/                    # Utilities and helpers
│   └── public/                 # Static assets
├── data/                       # Data files (gitignored)
│   ├── conference_talks_cleaned.csv
│   └── conference_talks (2).csv
├── docs/                       # Documentation
│   ├── NLP_TOPICS_README.md
│   ├── TOPIC_CLASSIFICATION_GUIDE.md
│   ├── EMOTION_CLASSIFICATION_GUIDE.md
│   ├── RUN_CLASSIFICATION.md
│   ├── FAST_VERSION_README.md
│   └── ...
├── scripts/                    # Utility scripts
├── requirements_nlp.txt        # Python dependencies for NLP
└── README.md                   # This file
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm or yarn

### 1. Setup Python Environment

```bash
# Clone the repository
git clone https://github.com/lukejoneslj/GeneralConferenceScraper.git
cd GeneralConferenceScraper

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements_nlp.txt
```

### 2. Run Web Scraper (Optional)

If you want to scrape fresh data:

```bash
cd scraper
python conferencescraper.py
```

**Note:** Pre-scraped data is available in the `data/` folder.

### 3. Run AI Classification (Optional)

#### Topic Classification

To add topic classification to talks:

```bash
cd classification
python classify_topics_fast.py  # Recommended: 10-20x faster
```

**Time estimate:** 10-15 hours on CPU, 4-8 hours on GPU

See [`docs/FAST_VERSION_README.md`](docs/FAST_VERSION_README.md) for optimization details.

#### Emotion Classification

To add emotion analysis to talks:

```bash
cd classification
pip install -r requirements_emotions.txt  # If not already installed
python classify_emotions_fast.py
```

**Time estimate:** 4-10 hours on CPU, 2-4 hours on GPU

See [`docs/EMOTION_CLASSIFICATION_GUIDE.md`](docs/EMOTION_CLASSIFICATION_GUIDE.md) for details.

### 4. Launch Web Application

```bash
cd conference-app

# Install dependencies
npm install

# Copy data file
cp ../data/conference_talks_cleaned.csv public/

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📊 Features in Detail

### Web Scraper

The scraper navigates churchofjesuschrist.org to extract:
- Talk titles and speakers
- Speaker callings and positions
- Full talk text
- Footnotes and scripture references
- Conference metadata (year, season)

**Output:** Clean CSV with 280,000+ talks from 1971-present

### AI Topic Classification

Uses **DeBERTa-v3-base-mnli-fever-anli** for zero-shot classification:

**60+ Topics from Preach My Gospel:**
- Restoration & Joseph Smith
- Plan of Salvation
- Jesus Christ & Atonement
- Faith, Repentance, Baptism
- Commandments & Obedience
- Temple & Covenants
- Family & Eternal Marriage
- And many more...

**Key Features:**
- Multi-label (up to 5 topics per talk)
- Confidence scores for each topic
- Batch processing for speed
- Resume capability with checkpoints

### AI Emotion Analysis

Uses **roberta-base-go_emotions** for multi-label emotion classification:

**28 Emotions Across 5 Categories:**
- **Positive:** gratitude, admiration, joy, love, optimism, pride, relief, caring, excitement, approval, amusement
- **Negative:** sadness, anger, fear, disappointment, grief, annoyance, disgust, embarrassment, nervousness, remorse, disapproval
- **Cognitive:** confusion, curiosity, realization, surprise
- **Desire & Motivation:** desire, optimism
- **Neutral:** neutral

**Key Features:**
- Multi-label (up to 5 emotions per talk)
- Confidence scores for each emotion
- All 28 emotion scores stored for deep analysis
- Track emotional tone over 50+ years
- Batch processing for efficient inference

### Web Application

**10 Interactive Sections:**

1. **Scriptures** - Search by scripture reference
2. **Word Search** - Boolean search with ANY/ALL/NONE operators
3. **Phrase Search** - Find exact phrases with trend analysis
4. **Topics** - AI-powered topic exploration
   - Browse 60+ gospel topics
   - See trends over 50+ years
   - Compare multiple topics
   - Find related topics
5. **Emotions** - AI-powered emotion analysis (NEW!)
   - Explore 28 emotions across talks
   - Track emotional tone over time
   - Compare emotions across eras
   - See emotion categories (positive, negative, cognitive)
6. **Speakers** - Analyze individual speakers
7. **Conferences** - Conference-by-conference breakdowns
8. **Talks** - Detailed individual talk statistics
9. **Overall** - Comprehensive statistics across all talks
10. **Filters** - Advanced filtering by speaker, era, year

**Technologies:**
- Next.js 15 with App Router
- TypeScript for type safety
- shadcn/ui for beautiful components
- Recharts for data visualization
- Tailwind CSS for styling

## 📖 Documentation

Comprehensive guides available in the [`docs/`](docs/) folder:

**Topic Classification:**
- **[NLP Topics Overview](docs/NLP_TOPICS_README.md)** - AI classification introduction
- **[Topic Classification Guide](docs/TOPIC_CLASSIFICATION_GUIDE.md)** - Detailed technical guide
- **[Quick Start Guide](docs/RUN_CLASSIFICATION.md)** - Get started quickly
- **[Fast Version](docs/FAST_VERSION_README.md)** - 10-20x speed optimization
- **[Progress Bar](docs/PROGRESS_BAR_EXAMPLE.md)** - What to expect during classification

**Emotion Analysis:**
- **[Emotion Classification Guide](docs/EMOTION_CLASSIFICATION_GUIDE.md)** - Emotion analysis setup and usage

## 🎓 Use Cases

- **Personal Study** - Find talks on specific topics
- **Lesson Preparation** - Discover relevant talks quickly
- **Research** - Analyze doctrinal emphasis over time
- **Teaching** - Explore patterns and examples
- **Insights** - Understand Church focus areas across decades

## 🛠️ Development

### Adding New Features

The codebase is modular and extensible:

- **Scraper:** Modify `scraper/conferencescraper.py`
- **Classification:** Adjust topics in `classification/classify_topics_fast.py`
- **Web App:** Add pages to `conference-app/app/`

### Running Tests

```bash
# Test classification setup
cd classification
python test_classification.py

# Test fast classification speed
python test_fast_classification.py
```

### Building for Production

```bash
cd conference-app
npm run build
npm start
```

## 📈 Performance

### Scraper
- **Speed:** ~10 minutes for full scrape (280K talks)
- **Output:** ~250MB CSV file

### Classification
- **Original:** 24-48 hours
- **Fast Version:** 10-15 hours (CPU) or 4-8 hours (GPU)
- **Speedup:** 10-20x faster with batch processing

### Web App
- **Load Time:** <2 seconds
- **Search Speed:** Real-time (instant results)
- **Data Size:** 280,000+ talks

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Original scraper based on work by [johnmwood](https://github.com/johnmwood)
- AI model: [MoritzLaurer/DeBERTa-v3-base-mnli-fever-anli](https://huggingface.co/MoritzLaurer/DeBERTa-v3-base-mnli-fever-anli)
- Data source: [The Church of Jesus Christ of Latter-day Saints](https://www.churchofjesuschrist.org/study/general-conference)
- Topics based on [Preach My Gospel](https://www.churchofjesuschrist.org/study/manual/preach-my-gospel-a-guide-to-missionary-service)

## 📧 Contact

**Luke Jones** - [@lukejoneslj](https://github.com/lukejoneslj)

Project Link: [https://github.com/lukejoneslj/GeneralConferenceScraper](https://github.com/lukejoneslj/GeneralConferenceScraper)

---

**⭐ Star this repository if you find it useful!**

---

## 🎯 Quick Commands

```bash
# Setup
git clone https://github.com/lukejoneslj/GeneralConferenceScraper.git
cd GeneralConferenceScraper
python -m venv venv
source venv/bin/activate
pip install -r requirements_nlp.txt

# Run classification (optimized)
cd classification
python classify_topics_fast.py

# Launch web app
cd conference-app
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to explore!

