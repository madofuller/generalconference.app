"""
Topic Classification for General Conference Talks
Uses DeBERTa-v3-base-mnli-fever-anli for zero-shot classification
Based on Preach My Gospel topics
"""

import pandas as pd
from transformers import pipeline
from tqdm import tqdm
import torch
import json
import numpy as np
import time
from datetime import datetime, timedelta

# Startup banner
print("\n" + "="*80)
print("🤖 GENERAL CONFERENCE TOPIC CLASSIFICATION")
print("="*80)
print("📚 Model: DeBERTa-v3-base-mnli-fever-anli")
print("🏷️  Topics: 60+ gospel topics from Preach My Gospel")
print("🎯 Method: Zero-shot multi-label classification")
print("="*80 + "\n")

# Check if CUDA is available
device = 0 if torch.cuda.is_available() else -1
device_name = "🚀 GPU (CUDA)" if device == 0 else "💻 CPU"
print(f"⚙️  Device: {device_name}")

# Initialize the classifier
print("📦 Loading model (this may take a moment on first run)...")
classifier = pipeline(
    "zero-shot-classification",
    model="MoritzLaurer/DeBERTa-v3-base-mnli-fever-anli",
    device=device
)
print("✅ Model loaded successfully!")

# Define Preach My Gospel topics
# Based on all 5 lessons of Preach My Gospel
PMG_TOPICS = [
    # Lesson 1: The Message of the Restoration
    "God is our loving Heavenly Father",
    "The Gospel blesses families and individuals",
    "Heavenly Father reveals His Gospel in every dispensation",
    "Jesus Christ is central to the Gospel",
    "The Great Apostasy",
    "The Restoration of the Gospel through Joseph Smith",
    "The Book of Mormon is the word of God",
    "The priesthood authority has been restored",
    
    # Lesson 2: The Plan of Salvation
    "The Plan of Salvation",
    "Pre-mortal life and our divine nature",
    "The Creation and purpose of life",
    "Agency and accountability",
    "The Fall of Adam and Eve",
    "The Atonement of Jesus Christ",
    "Physical death and resurrection",
    "Spiritual death and salvation",
    "The spirit world and missionary work",
    "The kingdoms of glory",
    "Exaltation and eternal families",
    
    # Lesson 3: The Gospel of Jesus Christ
    "Faith in Jesus Christ",
    "Repentance and forgiveness",
    "Baptism by immersion",
    "The gift of the Holy Ghost",
    "Enduring to the end",
    "Following Jesus Christ",
    
    # Lesson 4: The Commandments
    "Chastity and fidelity in marriage",
    "The law of tithing",
    "Keeping the Sabbath day holy",
    "The Word of Wisdom",
    "Obedience to God's commandments",
    "Honesty and integrity",
    
    # Lesson 5: Laws and Ordinances
    "Baptism and confirmation",
    "The sacrament",
    "Temple ordinances and covenants",
    "Priesthood and priesthood keys",
    "The organization of the Church",
    "Prophets and revelation",
    
    # Additional important gospel topics
    "Family history and genealogy",
    "Service and charity",
    "Scripture study",
    "Prayer and personal revelation",
    "Missionary work",
    "Temples and temple work",
    "The Second Coming of Jesus Christ",
    "Faith and testimony",
    "Gratitude and thanksgiving",
    "Hope and optimism",
    "Love and compassion",
    "Repentance and redemption",
    "Church history and heritage",
    "Unity and fellowship",
    "Education and learning",
    "Work and self-reliance",
    "Marriage and family relationships",
    "Parenting and raising children",
    "Youth and rising generation",
    "Covenants and ordinances",
]

def classify_talk(text, title, speaker, max_length=512):
    """
    Classify a talk using zero-shot classification.
    Uses the title + first portion of talk for efficiency.
    """
    # Combine title and beginning of talk (for context and efficiency)
    combined_text = f"{title}. {text[:3000]}"  # Use first ~3000 chars
    
    try:
        # Run classification with multi-label=True to get scores for all topics
        result = classifier(
            combined_text,
            candidate_labels=PMG_TOPICS,
            multi_label=True,
            truncation=True
        )
        
        # Get top 5 topics with scores above threshold (0.5)
        topics = []
        scores = []
        for label, score in zip(result['labels'], result['scores']):
            if score > 0.5 and len(topics) < 5:  # Top 5 topics above threshold
                topics.append(label)
                scores.append(round(score, 4))
        
        # If no topics above threshold, take top 3
        if len(topics) == 0:
            topics = result['labels'][:3]
            scores = [round(s, 4) for s in result['scores'][:3]]
        
        return {
            'topics': topics,
            'scores': scores,
            'top_topic': topics[0] if topics else "General",
            'top_score': scores[0] if scores else 0.0
        }
    
    except Exception as e:
        print(f"Error classifying talk by {speaker}: {str(e)}")
        return {
            'topics': [],
            'scores': [],
            'top_topic': "Error",
            'top_score': 0.0
        }

def main():
    # Load the dataset
    print("\nLoading dataset...")
    df = pd.read_csv('conference_talks_cleaned.csv')
    print(f"Loaded {len(df)} talks")
    
    # Initialize columns for classification results
    df['topics'] = None
    df['topic_scores'] = None
    df['primary_topic'] = None
    df['primary_topic_score'] = None
    
    # Classify each talk
    print("\n" + "="*60)
    print("🚀 STARTING CLASSIFICATION")
    print("="*60)
    print(f"📚 Total talks to process: {len(df):,}")
    print(f"🏷️  Topics to classify: {len(PMG_TOPICS)}")
    print(f"⚙️  Device: {'GPU (CUDA)' if device == 0 else 'CPU'}")
    print(f"🕐 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60 + "\n")
    
    start_time = time.time()
    classified_topics = {}
    
    # Progress bar with custom format
    with tqdm(total=len(df), 
              desc="🔍 Classifying",
              bar_format='{l_bar}{bar}| {n_fmt}/{total_fmt} [{elapsed}<{remaining}, {rate_fmt}]',
              ncols=100,
              colour='green') as pbar:
        
        for idx, row in df.iterrows():
            result = classify_talk(row['talk'], row['title'], row['speaker'])
            
            # Store results
            df.at[idx, 'topics'] = json.dumps(result['topics'])
            df.at[idx, 'topic_scores'] = json.dumps(result['scores'])
            df.at[idx, 'primary_topic'] = result['top_topic']
            df.at[idx, 'primary_topic_score'] = result['top_score']
            
            # Track topics for stats
            topic = result['top_topic']
            classified_topics[topic] = classified_topics.get(topic, 0) + 1
            
            # Update progress bar with current info
            if (idx + 1) % 10 == 0:
                elapsed = time.time() - start_time
                rate = (idx + 1) / elapsed
                remaining_talks = len(df) - (idx + 1)
                eta_seconds = remaining_talks / rate if rate > 0 else 0
                eta = timedelta(seconds=int(eta_seconds))
                
                pbar.set_postfix({
                    'Speaker': row['speaker'][:20],
                    'Topic': topic[:25],
                    'Conf': f"{topic[:15]}",
                    'ETA': str(eta).split('.')[0]
                })
            
            pbar.update(1)
            
            # Print milestone updates
            if (idx + 1) in [100, 500, 1000, 5000, 10000, 50000, 100000, 150000, 200000, 250000]:
                elapsed = time.time() - start_time
                rate = (idx + 1) / elapsed
                remaining = len(df) - (idx + 1)
                eta_seconds = remaining / rate if rate > 0 else 0
                eta = timedelta(seconds=int(eta_seconds))
                
                tqdm.write(f"\n{'='*60}")
                tqdm.write(f"✨ MILESTONE: {idx + 1:,} talks processed!")
                tqdm.write(f"⏱️  Elapsed: {timedelta(seconds=int(elapsed))}")
                tqdm.write(f"⚡ Speed: {rate:.2f} talks/second")
                tqdm.write(f"⏳ ETA: {eta}")
                tqdm.write(f"📊 Latest: {row['speaker']} - '{row['title'][:40]}...'")
                tqdm.write(f"🏷️  Topic: {result['top_topic']} (confidence: {result['top_score']:.1%})")
                tqdm.write(f"📈 Top 3 topics so far:")
                sorted_topics = sorted(classified_topics.items(), key=lambda x: x[1], reverse=True)[:3]
                for i, (t, c) in enumerate(sorted_topics, 1):
                    tqdm.write(f"   {i}. {t}: {c:,} talks")
                tqdm.write("="*60 + "\n")
    
    total_time = time.time() - start_time
    
    # Save the enriched dataset
    output_file = 'conference_talks_with_topics.csv'
    print(f"\n\n💾 Saving enriched dataset to {output_file}...")
    df.to_csv(output_file, index=False)
    print("✅ Saved successfully!")
    
    # Print summary statistics
    print("\n" + "="*80)
    print("🎉 CLASSIFICATION COMPLETE!")
    print("="*80)
    
    # Time statistics
    hours = int(total_time // 3600)
    minutes = int((total_time % 3600) // 60)
    seconds = int(total_time % 60)
    print(f"\n⏱️  PERFORMANCE METRICS")
    print(f"   Total time: {hours}h {minutes}m {seconds}s")
    print(f"   Average speed: {len(df) / total_time:.2f} talks/second")
    print(f"   Total talks processed: {len(df):,}")
    
    # Classification statistics
    print(f"\n📊 CLASSIFICATION STATISTICS")
    print(f"   Total talks classified: {len(df):,}")
    print(f"   Unique topics found: {df['primary_topic'].nunique()}")
    
    # Average confidence score
    avg_score = df['primary_topic_score'].mean()
    high_confidence = len(df[df['primary_topic_score'] > 0.7])
    print(f"   Average confidence score: {avg_score:.3f} ({avg_score*100:.1f}%)")
    print(f"   High confidence talks (>70%): {high_confidence:,} ({high_confidence/len(df)*100:.1f}%)")
    
    print(f"\n🏆 TOP 10 MOST COMMON TOPICS")
    topic_counts = df['primary_topic'].value_counts().head(10)
    for i, (topic, count) in enumerate(topic_counts.items(), 1):
        percentage = (count / len(df)) * 100
        bar = "█" * int(percentage / 2)
        print(f"   {i:2d}. {topic[:45]:45s} │ {count:6,} ({percentage:5.1f}%) {bar}")
    
    # Topics by era
    print(f"\n📅 TOPIC TRENDS BY DECADE")
    df['decade'] = (df['year'] // 10) * 10
    for decade in sorted(df['decade'].unique()):
        decade_df = df[df['decade'] == decade]
        top_topic = decade_df['primary_topic'].value_counts().head(1)
        if len(top_topic) > 0:
            topic_name = top_topic.index[0]
            count = top_topic.values[0]
            print(f"   {decade}s: {topic_name[:40]:40s} ({count:4,} talks)")
    
    print("\n" + "="*80)
    print(f"✨ Enriched dataset saved to: {output_file}")
    print(f"📂 File size: {df.memory_usage(deep=True).sum() / 1024 / 1024:.1f} MB")
    print(f"🚀 Ready to use in your Next.js app!")
    print(f"\n💡 Next steps:")
    print(f"   1. Copy the file: cp {output_file} conference-app/public/conference_talks_cleaned.csv")
    print(f"   2. Restart your Next.js dev server")
    print(f"   3. Visit http://localhost:3000/topics")
    print("="*80 + "\n")

if __name__ == "__main__":
    main()

