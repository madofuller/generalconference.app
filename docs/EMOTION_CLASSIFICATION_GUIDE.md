# Emotion Classification Guide

## Overview

This guide explains how to run emotion analysis on General Conference talks using the **roberta-base-go_emotions** model. The classifier assigns 28 emotion labels to each talk based on their content.

## The Model

**Model:** [SamLowe/roberta-base-go_emotions](https://huggingface.co/SamLowe/roberta-base-go_emotions)

**Task:** Multi-label text classification

**Emotions (28 labels):**
- **Positive:** admiration, amusement, approval, caring, excitement, gratitude, joy, love, optimism, pride, relief
- **Negative:** anger, annoyance, disappointment, disapproval, disgust, embarrassment, fear, grief, nervousness, remorse, sadness
- **Cognitive:** confusion, curiosity, realization, surprise
- **Desire & Motivation:** desire, optimism
- **Neutral:** neutral

## Installation

### Step 1: Activate Virtual Environment

```bash
cd /Users/lukejoneslwj/Downloads/conferencescraper
source venv/bin/activate
```

### Step 2: Install Dependencies

```bash
cd classification
pip install -r requirements_emotions.txt
```

This will install:
- `transformers` - Hugging Face library
- `torch` - PyTorch for model inference
- `pandas` - Data manipulation
- `tqdm` - Progress bars

## Running the Classification

### Quick Start

```bash
cd classification
python classify_emotions_fast.py
```

### What Happens

The script will:

1. **Load the dataset** (`conference_talks_with_topics.csv` or `conference_talks_cleaned.csv`)
2. **Initialize the model** (downloads ~500MB on first run)
3. **Process each talk:**
   - Samples ~200 words from the talk (opening, middle, conclusion)
   - Classifies using 28 emotion labels
   - Returns up to 5 emotions per talk (threshold: 0.3)
4. **Save results** to `conference_talks_with_emotions.csv`

### Performance

**Expected Speed:**
- **With GPU:** ~15-30 talks/second (2-4 hours for 100K talks)
- **Without GPU:** ~3-8 talks/second (4-10 hours for 100K talks)

The script includes:
- ✅ Batch processing (8 talks at a time)
- ✅ Smart text sampling (~200 words per talk)
- ✅ Resume capability (saves checkpoints every 10,000 talks)
- ✅ Progress bar with ETA and statistics

### Checkpointing

If interrupted, the script automatically resumes from where it left off using `emotion_classification_checkpoint.csv`.

To **restart from scratch:**

```bash
rm emotion_classification_checkpoint.csv
python classify_emotions_fast.py
```

## Output Format

The script adds these columns to your dataset:

| Column | Type | Description |
|--------|------|-------------|
| `emotions` | JSON array | List of emotions (up to 5) |
| `emotion_scores` | JSON array | Confidence scores for each emotion |
| `primary_emotion` | string | Top emotion |
| `primary_emotion_score` | float | Confidence for top emotion |
| `all_emotion_scores` | JSON object | All 28 emotion scores |

### Example Output

```csv
...,emotions,emotion_scores,primary_emotion,primary_emotion_score,all_emotion_scores
...,"[""gratitude"", ""admiration"", ""joy""]","[0.72, 0.58, 0.41]","gratitude",0.72,"{""gratitude"": 0.72, ""admiration"": 0.58, ...}"
```

## Using in the Web App

### Step 1: Copy the file

```bash
cp classification/conference_talks_with_emotions.csv conference-app/public/conference_talks_cleaned.csv
```

### Step 2: Restart the dev server

```bash
cd conference-app
npm run dev
```

### Step 3: Visit the Emotions page

Open [http://localhost:3000/emotions](http://localhost:3000/emotions)

## Features in the Web App

The **Emotions** tab provides:

### 1. **Overview**
- Bar chart of top 15 emotions
- Statistics table with counts and percentages
- Emotion categories breakdown

### 2. **Explore Emotion**
- Filter emotions by category (Positive, Negative, Cognitive, etc.)
- View trends over time for any emotion
- See related emotions that co-occur
- Browse talks with specific emotions

### 3. **Compare**
- Add up to 5 emotions to compare
- Line chart showing trends for each emotion
- See how different emotions trend over time

### 4. **Categories**
- Pie chart of emotion categories
- Cards for each category showing member emotions
- Quick navigation to specific emotions

## Understanding the Results

### Confidence Scores

- **>0.5:** High confidence - emotion is clearly present
- **0.3-0.5:** Moderate confidence - emotion is likely present
- **<0.3:** Low confidence - excluded from results

### Multi-Label Classification

- Each talk can have **up to 5 emotions**
- Emotions are not mutually exclusive
- Talks often show multiple emotions (e.g., "gratitude" + "admiration")

### Most Common Emotions

Based on the Reddit-trained model, conference talks typically show:
1. **Gratitude** - expressing thanks and appreciation
2. **Admiration** - expressing respect and reverence
3. **Approval** - affirming and endorsing principles
4. **Optimism** - expressing hope and positivity
5. **Joy** - expressing happiness and celebration

## Troubleshooting

### Model Download Issues

If the model fails to download:

```bash
# Set Hugging Face cache directory
export HF_HOME=~/.cache/huggingface
python classify_emotions_fast.py
```

### Out of Memory Errors

Reduce batch size in the script:

```python
BATCH_SIZE = 4  # Default is 8
```

### Low Confidence Scores

The model was trained on Reddit data, which may differ from conference talk language. Lower thresholds can capture more emotions:

```python
EMOTION_THRESHOLD = 0.2  # Default is 0.3
```

## Advanced Usage

### Testing on a Sample

Edit the script to process only 100 talks:

```python
SAMPLE_SIZE = 100  # Set to None for all talks
```

### Changing Text Length

Adjust how much text is analyzed:

```python
MAX_WORDS = 300  # Default is 200
```

### Custom Threshold

Change minimum confidence for emotions:

```python
EMOTION_THRESHOLD = 0.4  # Default is 0.3
```

## Performance Tips

1. **Use GPU if available** - 5-10x faster than CPU
2. **Keep batch size at 8** - good balance of speed and memory
3. **Use smart sampling** - analyzing full talks is unnecessary and slower
4. **Resume from checkpoints** - don't lose progress if interrupted

## Next Steps

After classification, you can:

1. Explore emotional trends in the web app
2. Compare emotions across different eras
3. See which speakers evoke which emotions
4. Track changes in emotional tone over time
5. Discover patterns in how conference talks inspire feelings

## References

- **Model Card:** https://huggingface.co/SamLowe/roberta-base-go_emotions
- **Paper:** [GoEmotions: A Dataset of Fine-Grained Emotions](https://arxiv.org/abs/2005.00547)
- **Dataset:** Reddit-based with 58K carefully curated comments

---

**Happy Analyzing!** 😊



