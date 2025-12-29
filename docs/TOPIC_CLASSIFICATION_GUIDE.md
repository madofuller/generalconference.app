# Topic Classification Guide

This guide explains how to use AI-powered topic classification to enhance your General Conference analysis app with insights about gospel topics discussed across 50+ years of talks.

## Overview

The classification system uses **DeBERTa-v3-base-mnli-fever-anli**, a state-of-the-art zero-shot classification model, to automatically categorize each conference talk by gospel topics from Preach My Gospel.

### What It Does

- **Classifies** ~280,000 talks into 60+ gospel topics
- **Identifies** up to 5 topics per talk with confidence scores
- **Tracks** topic trends over time (1971-present)
- **Discovers** relationships between topics
- **Compares** emphasis across different eras

## Prerequisites

### System Requirements

- **Python 3.8+**
- **8GB+ RAM** (16GB+ recommended)
- **GPU recommended** (but CPU works, just slower)
  - With GPU: ~4-8 hours for full dataset
  - Without GPU: ~24-48 hours for full dataset

### Python Environment

It's recommended to use your existing virtual environment:

```bash
cd /Users/lukejoneslwj/Downloads/conferencescraper
source venv/bin/activate  # Activate your existing venv
```

## Installation

### Step 1: Install Required Packages

```bash
pip install -r requirements_nlp.txt
```

This installs:
- `transformers` - Hugging Face library for the AI model
- `torch` - PyTorch for neural networks
- `pandas` - Data manipulation
- `tqdm` - Progress bars
- `sentencepiece` - Tokenization
- `accelerate` - GPU acceleration (if available)

### Step 2: Verify Installation

```bash
python -c "import transformers; print(f'Transformers version: {transformers.__version__}')"
python -c "import torch; print(f'PyTorch version: {torch.__version__}')"
python -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}')"
```

## Running Classification

### Basic Usage

```bash
python classify_topics.py
```

The script will:
1. Load the DeBERTa model (~420MB download on first run)
2. Read `conference_talks_cleaned.csv`
3. Classify each talk (progress bar shown)
4. Save results to `conference_talks_with_topics.csv`
5. Print summary statistics

### What to Expect

**Console Output:**
```
Using device: CUDA
Loading model...
Model loaded successfully!

Loading dataset...
Loaded 282442 talks

Classifying talks... (this will take a while)
Processing in batches to show progress...

Processed 100/282442 talks
Latest: Russell M. Nelson - The Power of Spiritual Momentum...
Primary topic: Faith in Jesus Christ (0.892)

Processed 200/282442 talks
...
```

**Sample Progress:**
- Every 100 talks, you'll see progress updates
- Estimated time remaining shown in progress bar
- Current talk being processed displayed

### Output Files

The script creates `conference_talks_with_topics.csv` with new columns:

| Column | Description | Example |
|--------|-------------|---------|
| `topics` | JSON array of up to 5 topics | `["Faith in Jesus Christ", "Following Jesus Christ"]` |
| `topic_scores` | Confidence scores for each topic | `[0.892, 0.765]` |
| `primary_topic` | The main topic (highest score) | `"Faith in Jesus Christ"` |
| `primary_topic_score` | Confidence of primary topic | `0.892` |

## Topics Included

The classification uses **60+ gospel topics** from all 5 lessons of Preach My Gospel:

### Lesson 1: The Message of the Restoration
- God is our loving Heavenly Father
- The Gospel blesses families and individuals
- Heavenly Father reveals His Gospel in every dispensation
- Jesus Christ is central to the Gospel
- The Great Apostasy
- The Restoration of the Gospel through Joseph Smith
- The Book of Mormon is the word of God
- The priesthood authority has been restored

### Lesson 2: The Plan of Salvation
- The Plan of Salvation
- Pre-mortal life and our divine nature
- The Creation and purpose of life
- Agency and accountability
- The Fall of Adam and Eve
- The Atonement of Jesus Christ
- Physical death and resurrection
- Spiritual death and salvation
- The spirit world and missionary work
- The kingdoms of glory
- Exaltation and eternal families

### Lesson 3: The Gospel of Jesus Christ
- Faith in Jesus Christ
- Repentance and forgiveness
- Baptism by immersion
- The gift of the Holy Ghost
- Enduring to the end
- Following Jesus Christ

### Lesson 4: The Commandments
- Chastity and fidelity in marriage
- The law of tithing
- Keeping the Sabbath day holy
- The Word of Wisdom
- Obedience to God's commandments
- Honesty and integrity

### Lesson 5: Laws and Ordinances
- Baptism and confirmation
- The sacrament
- Temple ordinances and covenants
- Priesthood and priesthood keys
- The organization of the Church
- Prophets and revelation

### Additional Gospel Topics
- Family history and genealogy
- Service and charity
- Scripture study
- Prayer and personal revelation
- Missionary work
- The Second Coming of Jesus Christ
- Gratitude and thanksgiving
- Hope and optimism
- Love and compassion
- Marriage and family relationships
- Parenting and raising children
- Youth and rising generation
- And more...

## Integrating with the App

### Step 1: Replace the Data File

After classification completes:

```bash
# Backup your original file (optional)
cp conference-app/public/conference_talks_cleaned.csv conference-app/public/conference_talks_cleaned.backup.csv

# Replace with classified data
cp conference_talks_with_topics.csv conference-app/public/conference_talks_cleaned.csv
```

### Step 2: Restart the Development Server

If your Next.js dev server is running, restart it:

```bash
# Stop the server (Ctrl+C if running in foreground)
# Or kill the process if running in background

cd conference-app
npm run dev
```

### Step 3: Explore Topics

Visit http://localhost:3000/topics to access:

- **Overview**: Top topics, statistics, trends
- **Explore Topic**: Deep dive into any specific topic
- **Compare Topics**: Side-by-side comparison of multiple topics
- **Trends**: See which topics are rising, stable, or declining

## Performance Tips

### Speed Up Classification

#### 1. Use GPU (Fastest)
If you have an NVIDIA GPU with CUDA:

```bash
# Check if CUDA is available
python -c "import torch; print(torch.cuda.is_available())"

# If True, the script will automatically use GPU
python classify_topics.py
```

#### 2. Process a Subset First (Testing)
To test with a small sample:

```python
# Edit classify_topics.py, line ~145, change:
# df = pd.read_csv('conference_talks_cleaned.csv')
# to:
df = pd.read_csv('conference_talks_cleaned.csv').head(1000)  # Only first 1000 talks
```

#### 3. Batch Processing
For very large datasets, you can split into batches:

```python
# Process talks 0-50000
df = pd.read_csv('conference_talks_cleaned.csv')
batch_df = df.iloc[0:50000]
# ... run classification ...
batch_df.to_csv('batch_1.csv', index=False)

# Then process 50000-100000, etc.
# Finally, concatenate all batches
```

### Troubleshooting

#### Out of Memory Error
If you get a memory error:

1. **Reduce batch size** in the classification script
2. **Close other applications**
3. **Process in smaller chunks** (see batch processing above)
4. **Use a machine with more RAM**

#### Model Download Issues
If the model fails to download:

```bash
# Pre-download the model
python -c "from transformers import pipeline; pipeline('zero-shot-classification', model='MoritzLaurer/DeBERTa-v3-base-mnli-fever-anli')"
```

#### CUDA Not Available
If GPU isn't detected but you have one:

```bash
# Reinstall PyTorch with CUDA support
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

## Understanding the Results

### Confidence Scores

- **0.8-1.0**: Very confident classification
- **0.6-0.8**: Confident classification
- **0.4-0.6**: Moderate confidence
- **Below 0.4**: Low confidence

High confidence doesn't mean the topic is the only theme—talks often address multiple topics.

### Multi-Label Classification

Each talk can have up to 5 topics because:
- Conference talks are rich and multifaceted
- Topics naturally overlap (e.g., "Faith in Jesus Christ" + "The Atonement")
- This provides more nuanced understanding

### Example Classification

**Talk:** "The Power of Covenants" by Russell M. Nelson (April 2021)

```json
{
  "topics": [
    "Temple ordinances and covenants",
    "Covenants and ordinances", 
    "Baptism and confirmation",
    "The Atonement of Jesus Christ",
    "Following Jesus Christ"
  ],
  "topic_scores": [0.891, 0.854, 0.743, 0.702, 0.681],
  "primary_topic": "Temple ordinances and covenants",
  "primary_topic_score": 0.891
}
```

## Summary Statistics

After classification, you'll see:

```
==============================================================
CLASSIFICATION SUMMARY
==============================================================

Total talks classified: 282442

Top 10 most common primary topics:
  Faith in Jesus Christ: 28544 (10.1%)
  Following Jesus Christ: 24120 (8.5%)
  The Atonement of Jesus Christ: 21896 (7.8%)
  Repentance and forgiveness: 18234 (6.5%)
  ...

Average confidence score: 0.753

Topic trends by decade:
  1970s: Faith in Jesus Christ (1842 talks)
  1980s: The Plan of Salvation (2156 talks)
  1990s: Faith in Jesus Christ (2421 talks)
  ...
==============================================================
```

## Advanced Usage

### Custom Topics

To add your own topics, edit `classify_topics.py`:

```python
PMG_TOPICS = [
    # ... existing topics ...
    "Your custom topic here",
    "Another custom topic",
]
```

### Adjust Threshold

To change the minimum confidence threshold:

```python
# In classify_talk function, line ~95:
if score > 0.5 and len(topics) < 5:  # Change 0.5 to your threshold
```

### Process Specific Years

To classify only certain years:

```python
df = pd.read_csv('conference_talks_cleaned.csv')
df = df[df['year'] >= 2020]  # Only 2020 and later
```

## FAQs

**Q: How accurate is the classification?**
A: The DeBERTa model achieves ~90% accuracy on NLI benchmarks. For gospel topics, expect high accuracy for clear themes and moderate accuracy for subtle topics.

**Q: Can I run this on Google Colab?**
A: Yes! Upload the CSV and script to Colab, which provides free GPU access.

**Q: Does this modify the original data?**
A: No, it creates a new file `conference_talks_with_topics.csv`. Your original CSV is untouched.

**Q: How much does this cost?**
A: Nothing! The model and all tools are free and open-source.

**Q: Can I classify in languages other than English?**
A: The model supports English. For other languages, you'd need a multilingual model.

## Next Steps

After classification:

1. ✅ Explore the **Topics tab** in your app
2. 🔍 Search for specific gospel themes
3. 📊 Compare topic trends across eras
4. 🎯 Discover related topics and connections
5. 📈 Track emphasis changes over 50+ years

## Support

For issues or questions:
- Check the Hugging Face model page: https://huggingface.co/MoritzLaurer/DeBERTa-v3-base-mnli-fever-anli
- Review the Transformers documentation: https://huggingface.co/docs/transformers

---

**Happy exploring!** 🎉

The Topics feature adds a powerful new dimension to your General Conference analysis, revealing patterns and insights across decades of inspired teachings.

