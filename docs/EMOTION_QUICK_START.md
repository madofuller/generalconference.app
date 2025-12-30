# 😊 Emotion Analysis - Quick Start

## What Is This?

Emotion analysis adds 28 emotion labels to every conference talk, allowing you to explore the emotional tone of talks over 50+ years.

## Quick Setup (3 Steps)

### 1. Install Dependencies

```bash
cd classification
pip install -r requirements_emotions.txt
```

### 2. Run Classification

```bash
python classify_emotions_fast.py
```

**Expected time:**
- **With GPU:** 2-4 hours
- **Without GPU:** 4-10 hours

### 3. Update Web App

```bash
# Copy the enriched dataset
cp conference_talks_with_emotions.csv ../conference-app/public/conference_talks_cleaned.csv

# Restart the app
cd ../conference-app
npm run dev
```

Visit: [http://localhost:3000/emotions](http://localhost:3000/emotions)

## What You Get

### 28 Emotions

**Positive:**
- gratitude, admiration, joy, love, optimism, pride, relief, caring, excitement, approval, amusement

**Negative:**
- sadness, anger, fear, disappointment, grief, annoyance, disgust, embarrassment, nervousness, remorse, disapproval

**Cognitive:**
- confusion, curiosity, realization, surprise

**Neutral:**
- neutral

### Features in the Web App

1. **Overview Tab**
   - Bar chart of top 15 emotions
   - Statistics table with counts and percentages
   - Emotion category distribution

2. **Explore Emotion Tab**
   - Select any emotion to explore
   - See trends over time
   - Find related emotions
   - Browse talks with specific emotions

3. **Compare Tab**
   - Add up to 5 emotions to compare
   - See how different emotions trend over decades

4. **Categories Tab**
   - Pie chart of emotion categories
   - Explore emotions by category
   - Quick navigation to specific emotions

## Example Insights

Discover answers to questions like:

- **Which emotion is most common in conference talks?** (Likely: gratitude, admiration)
- **How has emotional tone changed over time?** (Compare eras)
- **Which speakers evoke which emotions?** (Filter by speaker)
- **Are talks more hopeful in certain years?** (Track optimism trends)
- **How do emotions relate to topics?** (Combine with topic analysis)

## Model Details

- **Model:** [roberta-base-go_emotions](https://huggingface.co/SamLowe/roberta-base-go_emotions)
- **Training Data:** 58K Reddit comments with fine-grained emotions
- **Task:** Multi-label classification (talks can have multiple emotions)
- **Threshold:** 0.3 (emotions with >30% confidence)

## Tips

- **Resume capability:** If interrupted, the script automatically resumes
- **Test first:** Set `SAMPLE_SIZE = 100` in the script to test on 100 talks
- **GPU recommended:** 5-10x faster than CPU
- **Batch processing:** Processes 8 talks at a time for speed

## Need Help?

See the full guide: [`EMOTION_CLASSIFICATION_GUIDE.md`](EMOTION_CLASSIFICATION_GUIDE.md)

---

**Ready to explore emotions? Run the script and discover emotional patterns in 50+ years of conference talks!** 😊



