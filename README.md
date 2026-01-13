# If you don’t have experience with GitHub but still want to run this software on your device, become a channel member of my YouTube channel, and I’ll help you set it up.

👉 [Join the channel here](https://www.youtube.com/channel/UCE3Q1BsHrW6FK4aSUdO32bQ/join)


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

### 🤖 Topic Classification
- Zero-shot classification using DeBERTa-v3-base model
- 60+ gospel topics from Preach My Gospel
- Multi-label classification (up to 5 topics per talk)
- Fast version: 10-20x speedup with batch processing
- Resume capability with checkpoints

### 😊 Emotion Analysis
- Emotion classification using roberta-base-go_emotions model
- 28 emotion labels (positive, negative, cognitive, neutral)
- Multi-label emotion detection per talk
- Track emotional tone trends over 50+ years
- Batch processing for efficient analysis

### 🎨 Interactive Web Application
- **10 Features**:
  - Advanced word search with Boolean logic
  - Exact phrase search
  - Topic exploration (60+ gospel topics)
  - Emotion analysis (28 emotions)
  - Speaker analysis and statistics
  - Conference breakdowns
  - Individual talk analysis
  - Overall statistics and trends
  - Advanced filtering (by speaker, era, year)
  - Ask AI. Ask any question in natural language and a Gemini Agent writes and executes Python code on your machine to answer it.
- Built with Next.js, TypeScript, and shadcn/ui
- Beautiful visualizations with Recharts
- Real-time search with 280,000+ talks
- Responsive design for all devices

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

### 2. Run Web Scraper

```bash
cd scraper
python conferencescraper.py
```

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

**You can run the topic and emotion classification models in Google Colab for faster processing**

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

**Technologies:**
- Next.js 15 with App Router
- TypeScript for type safety
- shadcn/ui for beautiful components
- Recharts for data visualization
- Tailwind CSS for styling
- Flask for executing Python code from AskAI

## 📝 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Original scraper based on work by [johnmwood](https://github.com/johnmwood)
- AI model: [MoritzLaurer/DeBERTa-v3-base-mnli-fever-anli](https://huggingface.co/MoritzLaurer/DeBERTa-v3-base-mnli-fever-anli)
- Data source: [The Church of Jesus Christ of Latter-day Saints](https://www.churchofjesuschrist.org/study/general-conference)
- Topics based on [Preach My Gospel](https://www.churchofjesuschrist.org/study/manual/preach-my-gospel-a-guide-to-missionary-service)


**⭐ Star this repository if you find it useful!**

---

