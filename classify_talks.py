"""
Classify conference talks with topics and emotions.

Uses:
- GoEmotions model for instant emotion classification (single forward pass)
- Zero-shot classification for topics with short labels

Usage:
    pip install torch --index-url https://download.pytorch.org/whl/cpu
    pip install transformers pandas tqdm
    python classify_talks.py

Estimated: ~3 hours on CPU for ~4,000 talks.
"""

import pandas as pd
import json
import os
import time
from tqdm import tqdm

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
INPUT_CSV = os.path.join("conference-app", "public", "conference_talks_cleaned.csv")
OUTPUT_CSV = os.path.join("conference-app", "public", "conference_talks_classified.csv")
MAX_TEXT_LENGTH = 512
SAVE_EVERY = 50

# ---------------------------------------------------------------------------
# Topic classification: short labels -> full app labels
# Short labels classify faster; we map them to what the app expects.
# Each short label maps to a primary full label (used as primary_topic)
# and a list of related labels (stored in topics array).
# ---------------------------------------------------------------------------
TOPIC_MAP = {
    "Jesus Christ": {
        "primary": "Jesus Christ is central to the Gospel",
        "related": ["Following Jesus Christ", "The Atonement of Jesus Christ"],
    },
    "Atonement": {
        "primary": "The Atonement of Jesus Christ",
        "related": ["Spiritual death and salvation", "Physical death and resurrection"],
    },
    "Faith": {
        "primary": "Faith and testimony",
        "related": ["Faith in Jesus Christ", "Enduring to the end"],
    },
    "Repentance": {
        "primary": "Repentance and forgiveness",
        "related": ["Repentance and redemption"],
    },
    "Family": {
        "primary": "Marriage and family relationships",
        "related": ["The Gospel blesses families and individuals", "Parenting and raising children", "Exaltation and eternal families"],
    },
    "Youth": {
        "primary": "Youth and rising generation",
        "related": ["Parenting and raising children"],
    },
    "Temple": {
        "primary": "Temples and temple work",
        "related": ["Temple ordinances and covenants", "Covenants and ordinances"],
    },
    "Family history": {
        "primary": "Family history and genealogy",
        "related": ["Temples and temple work"],
    },
    "Scriptures": {
        "primary": "Scripture study",
        "related": ["The Book of Mormon is the word of God"],
    },
    "Book of Mormon": {
        "primary": "The Book of Mormon is the word of God",
        "related": ["Scripture study"],
    },
    "Missionary work": {
        "primary": "Missionary work",
        "related": ["The spirit world and missionary work"],
    },
    "Service and charity": {
        "primary": "Service and charity",
        "related": ["Love and compassion", "Unity and fellowship"],
    },
    "Obedience": {
        "primary": "Obedience to God's commandments",
        "related": ["Honesty and integrity"],
    },
    "Prayer": {
        "primary": "Prayer and personal revelation",
        "related": ["The gift of the Holy Ghost"],
    },
    "Holy Ghost": {
        "primary": "The gift of the Holy Ghost",
        "related": ["Prayer and personal revelation"],
    },
    "Hope": {
        "primary": "Hope and optimism",
        "related": ["Enduring to the end"],
    },
    "Love": {
        "primary": "Love and compassion",
        "related": ["Gratitude and thanksgiving", "Service and charity"],
    },
    "Gratitude": {
        "primary": "Gratitude and thanksgiving",
        "related": ["Love and compassion"],
    },
    "Priesthood": {
        "primary": "Priesthood and priesthood keys",
        "related": ["The organization of the Church"],
    },
    "Prophets and revelation": {
        "primary": "Prophets and revelation",
        "related": ["The organization of the Church"],
    },
    "Restoration": {
        "primary": "The Restoration of the Gospel through Joseph Smith",
        "related": ["Church history and heritage", "The priesthood authority has been restored"],
    },
    "Plan of Salvation": {
        "primary": "The Plan of Salvation",
        "related": ["Pre-mortal life and our divine nature", "Agency and accountability"],
    },
    "Second Coming": {
        "primary": "The Second Coming of Jesus Christ",
        "related": ["Heavenly Father reveals His Gospel in every dispensation"],
    },
    "Tithing": {
        "primary": "The law of tithing",
        "related": ["Obedience to God's commandments"],
    },
    "Sabbath": {
        "primary": "Keeping the Sabbath day holy",
        "related": ["The sacrament"],
    },
    "Sacrament": {
        "primary": "The sacrament",
        "related": ["Covenants and ordinances", "Baptism and confirmation"],
    },
    "Chastity": {
        "primary": "Chastity and fidelity in marriage",
        "related": ["Marriage and family relationships"],
    },
    "Education": {
        "primary": "Education and learning",
        "related": ["Work and self-reliance"],
    },
    "Self-reliance": {
        "primary": "Work and self-reliance",
        "related": ["Education and learning"],
    },
    "Heavenly Father": {
        "primary": "God is our loving Heavenly Father",
        "related": ["The Plan of Salvation"],
    },
}

SHORT_TOPIC_LABELS = list(TOPIC_MAP.keys())

# ---------------------------------------------------------------------------
# Emotion labels — the 28 GoEmotions labels
# ---------------------------------------------------------------------------
EMOTION_LABELS = [
    "admiration", "amusement", "anger", "annoyance", "approval", "caring",
    "confusion", "curiosity", "desire", "disappointment", "disapproval",
    "disgust", "embarrassment", "excitement", "fear", "gratitude", "grief",
    "joy", "love", "nervousness", "optimism", "pride", "realization",
    "relief", "remorse", "sadness", "surprise", "neutral",
]


def load_models():
    """Load both classifiers."""
    from transformers import pipeline

    print("Loading topic model (valhalla/distilbart-mnli-12-1)...")
    topic_clf = pipeline(
        "zero-shot-classification",
        model="valhalla/distilbart-mnli-12-1",
        device=-1,
    )

    print("Loading emotion model (SamLowe/roberta-base-go_emotions)...")
    emotion_clf = pipeline(
        "text-classification",
        model="SamLowe/roberta-base-go_emotions",
        top_k=None,
        device=-1,
    )

    print("Models loaded!\n")
    return topic_clf, emotion_clf


def classify_topics(classifier, text: str) -> dict:
    if not text or len(text.strip()) < 50:
        return {
            "topics": "[]",
            "topic_scores": "[]",
            "primary_topic": "",
            "primary_topic_score": 0.0,
        }

    snippet = text[:MAX_TEXT_LENGTH]
    result = classifier(snippet, candidate_labels=SHORT_TOPIC_LABELS, multi_label=True)

    # Map short labels to full app labels
    top_short = result["labels"][:3]
    top_scores = [round(s, 4) for s in result["scores"][:3]]

    primary_short = top_short[0]
    mapping = TOPIC_MAP[primary_short]

    # Build full topic list: primary + related from top hits
    all_topics = [mapping["primary"]]
    for short_label in top_short[1:]:
        m = TOPIC_MAP[short_label]
        if m["primary"] not in all_topics:
            all_topics.append(m["primary"])

    return {
        "topics": json.dumps(all_topics[:3]),
        "topic_scores": json.dumps(top_scores[:3]),
        "primary_topic": mapping["primary"],
        "primary_topic_score": top_scores[0],
    }


def classify_emotions(classifier, text: str) -> dict:
    if not text or len(text.strip()) < 50:
        return {
            "emotions": "[]",
            "emotion_scores": "[]",
            "primary_emotion": "neutral",
            "primary_emotion_score": 0.0,
            "all_emotion_scores": json.dumps({e: 0.0 for e in EMOTION_LABELS}),
        }

    snippet = text[:MAX_TEXT_LENGTH]
    results = classifier(snippet)

    all_scores = {r["label"]: round(r["score"], 4) for r in results[0]}

    sorted_emotions = sorted(all_scores.items(), key=lambda x: x[1], reverse=True)
    top_labels = [e[0] for e in sorted_emotions[:3]]
    top_scores = [e[1] for e in sorted_emotions[:3]]

    return {
        "emotions": json.dumps(top_labels),
        "emotion_scores": json.dumps(top_scores),
        "primary_emotion": top_labels[0],
        "primary_emotion_score": top_scores[0],
        "all_emotion_scores": json.dumps(all_scores),
    }


def main():
    print(f"Reading {INPUT_CSV}...")
    df = pd.read_csv(INPUT_CSV)
    print(f"Loaded {len(df)} talks.\n")

    start_idx = 0
    if os.path.exists(OUTPUT_CSV):
        existing = pd.read_csv(OUTPUT_CSV)
        if "primary_topic" in existing.columns:
            done = int(existing["primary_topic"].notna().sum())
            if done > 0:
                print(f"Found checkpoint: {done}/{len(existing)} done.")
                resp = input("Resume? (y/n): ").strip().lower()
                if resp == "y":
                    df = existing
                    start_idx = done
                    print(f"Resuming from row {start_idx}...\n")

    for col in ["topics", "topic_scores", "primary_topic", "primary_topic_score",
                 "emotions", "emotion_scores", "primary_emotion", "primary_emotion_score",
                 "all_emotion_scores"]:
        if col not in df.columns:
            df[col] = "" if col not in ["primary_topic_score", "primary_emotion_score"] else 0.0

    topic_clf, emotion_clf = load_models()

    remaining = len(df) - start_idx
    print(f"Classifying {remaining} talks...")
    print(f"Checkpoint every {SAVE_EVERY} rows.\n")

    t0 = time.time()

    for i in tqdm(range(start_idx, len(df)), initial=start_idx, total=len(df)):
        text = str(df.at[i, "talk"]) if pd.notna(df.at[i, "talk"]) else ""

        topic_result = classify_topics(topic_clf, text)
        for k, v in topic_result.items():
            df.at[i, k] = v

        emotion_result = classify_emotions(emotion_clf, text)
        for k, v in emotion_result.items():
            df.at[i, k] = v

        if (i + 1) % SAVE_EVERY == 0:
            df.to_csv(OUTPUT_CSV, index=False)
            elapsed = time.time() - t0
            done_count = i - start_idx + 1
            rate = done_count / elapsed
            eta = (remaining - done_count) / rate if rate > 0 else 0
            tqdm.write(f"  Saved. {done_count}/{remaining} done, ~{eta/60:.0f} min left")

    df.to_csv(OUTPUT_CSV, index=False)
    elapsed = time.time() - t0
    print(f"\nDone! {len(df)} talks in {elapsed/3600:.1f} hours.")
    print(f"Saved to: {OUTPUT_CSV}")
    print(f'\nTo use in the app:')
    print(f'  copy "{OUTPUT_CSV}" "{INPUT_CSV}"')


if __name__ == "__main__":
    main()
