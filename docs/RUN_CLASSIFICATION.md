# Quick Start: Run Topic Classification

## TL;DR - Quick Commands

```bash
# 1. Activate your virtual environment
cd /Users/lukejoneslwj/Downloads/conferencescraper
source venv/bin/activate

# 2. Install NLP dependencies
pip install -r requirements_nlp.txt

# 3. Run classification (this takes several hours)
python classify_topics.py

# 4. Copy the results to your app
cp conference_talks_with_topics.csv conference-app/public/conference_talks_cleaned.csv

# 5. Restart your Next.js app and visit /topics
cd conference-app
npm run dev
```

## What This Does

✨ **Classifies every conference talk** (280,000+ talks) into 60+ gospel topics from Preach My Gospel

📊 **Creates visualizations** showing:
- Which topics are most discussed
- How topics trend over 50+ years
- Which topics are rising or declining
- Related topics that appear together
- Topic comparisons across eras

🤖 **Uses AI** (DeBERTa-v3-base) for accurate zero-shot classification

## Time Estimates

- **With GPU**: 4-8 hours
- **Without GPU (CPU only)**: 24-48 hours

💡 **Tip**: Run overnight or on a weekend!

## Testing First (Recommended)

Want to test with a small sample first?

```bash
# Edit classify_topics.py
# Find line ~145 and change:
# df = pd.read_csv('conference_talks_cleaned.csv')
# to:
df = pd.read_csv('conference_talks_cleaned.csv').head(100)

# Run on just 100 talks to test
python classify_topics.py
```

## What You'll See

```
Using device: CUDA (or CPU)
Loading model...
Model loaded successfully!

Loading dataset...
Loaded 282442 talks

Classifying talks... (this will take a while)
Processing in batches to show progress...

Processed 100/282442 talks
Latest: Russell M. Nelson - The Power of Spiritual Momentum...
Primary topic: Faith in Jesus Christ (0.892)
```

## After Classification

Your new file `conference_talks_with_topics.csv` will have 4 new columns:

1. **topics** - Array of topics (up to 5 per talk)
2. **topic_scores** - Confidence scores for each topic
3. **primary_topic** - Main topic (highest confidence)
4. **primary_topic_score** - Confidence score (0-1)

## Topics Included (60+ total)

From Preach My Gospel lessons:
- Faith in Jesus Christ
- The Atonement of Jesus Christ
- Repentance and forgiveness
- The Plan of Salvation
- Temple ordinances and covenants
- The Restoration through Joseph Smith
- The Book of Mormon is the word of God
- Family and eternal families
- Prayer and personal revelation
- Scripture study
- Missionary work
- Service and charity
- And 50+ more...

## Troubleshooting

### "Out of memory" error
- Close other applications
- Process in smaller batches (see guide)
- Use a machine with more RAM

### "Model download failed"
- Check internet connection
- Try: `pip install --upgrade transformers`

### "CUDA not available" (but you have a GPU)
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

## Need More Help?

See the full guide: `TOPIC_CLASSIFICATION_GUIDE.md`

---

Ready to discover amazing insights about General Conference topics? Let's go! 🚀

