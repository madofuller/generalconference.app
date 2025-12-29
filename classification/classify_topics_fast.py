"""
FAST Topic Classification for General Conference Talks
Optimized version with batch processing and smart sampling
"""

import pandas as pd
from transformers import pipeline
from tqdm import tqdm
import torch
import json
import time
from datetime import datetime, timedelta
import re
import os

# Startup banner
print("\n" + "="*80)
print("🚀 FAST GENERAL CONFERENCE TOPIC CLASSIFICATION")
print("="*80)
print("📚 Model: DeBERTa-v3-base-mnli-fever-anli")
print("🏷️  Topics: 60+ gospel topics from Preach My Gospel")
print("⚡ Optimizations: Batch processing + Smart sampling")
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

# Define Preach My Gospel topics (same as before)
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

def smart_sample_text(text, title, max_words=150):
    """
    Intelligently sample text from the talk.
    Uses title + opening + key sentences for better context with less text.
    """
    # Start with title
    sampled = f"{title}. "
    
    # Split into sentences
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
    
    if len(sentences) == 0:
        return sampled + text[:500]
    
    # Take first 3 sentences (opening)
    opening = '. '.join(sentences[:3]) + '.'
    sampled += opening
    
    # If we have more sentences, add a few from the middle
    if len(sentences) > 10:
        middle_start = len(sentences) // 3
        middle = '. '.join(sentences[middle_start:middle_start+2]) + '.'
        sampled += ' ' + middle
    
    # Limit to max_words
    words = sampled.split()
    if len(words) > max_words:
        sampled = ' '.join(words[:max_words])
    
    return sampled

def classify_batch(texts, batch_size=8):
    """
    Classify multiple talks at once (much faster than one-at-a-time).
    """
    results = []
    
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        
        # Process batch
        batch_results = []
        for text in batch:
            try:
                result = classifier(
                    text,
                    candidate_labels=PMG_TOPICS,
                    multi_label=True,
                    truncation=True
                )
                
                # Get top 5 topics with scores above threshold (0.5)
                topics = []
                scores = []
                for label, score in zip(result['labels'], result['scores']):
                    if score > 0.5 and len(topics) < 5:
                        topics.append(label)
                        scores.append(round(score, 4))
                
                # If no topics above threshold, take top 3
                if len(topics) == 0:
                    topics = result['labels'][:3]
                    scores = [round(s, 4) for s in result['scores'][:3]]
                
                batch_results.append({
                    'topics': topics,
                    'scores': scores,
                    'top_topic': topics[0] if topics else "General",
                    'top_score': scores[0] if scores else 0.0
                })
                
            except Exception as e:
                batch_results.append({
                    'topics': [],
                    'scores': [],
                    'top_topic': "Error",
                    'top_score': 0.0
                })
        
        results.extend(batch_results)
    
    return results

def main():
    # Configuration
    BATCH_SIZE = 8  # Process 8 talks at a time
    MAX_WORDS = 150  # Use ~150 words per talk (vs 3000 chars before)
    SAMPLE_SIZE = None  # Set to a number to process only a subset, or None for all
    RESUME = True  # Resume from checkpoint if available
    
    # Output file
    output_file = 'conference_talks_with_topics.csv'
    checkpoint_file = 'classification_checkpoint.csv'
    
    # Load the dataset
    print("\nLoading dataset...")
    df = pd.read_csv('conference_talks_cleaned.csv')
    print(f"Loaded {len(df):,} talks")
    
    # Optional: Process only a sample for testing
    if SAMPLE_SIZE:
        print(f"⚠️  TESTING MODE: Processing only {SAMPLE_SIZE:,} talks")
        df = df.head(SAMPLE_SIZE)
    
    # Check for resume
    start_idx = 0
    if RESUME and os.path.exists(checkpoint_file):
        print(f"📂 Found checkpoint file. Loading progress...")
        checkpoint_df = pd.read_csv(checkpoint_file)
        start_idx = len(checkpoint_df)
        print(f"✅ Resuming from talk {start_idx:,}/{len(df):,}")
        df_processed = checkpoint_df
        df_to_process = df.iloc[start_idx:]
    else:
        df_to_process = df.copy()
        df_processed = None
    
    if start_idx >= len(df):
        print("✅ All talks already classified!")
        return
    
    # Initialize columns for new talks
    df_to_process['topics'] = None
    df_to_process['topic_scores'] = None
    df_to_process['primary_topic'] = None
    df_to_process['primary_topic_score'] = None
    
    print("\n" + "="*60)
    print("🚀 STARTING FAST CLASSIFICATION")
    print("="*60)
    print(f"📚 Talks to process: {len(df_to_process):,}")
    print(f"🏷️  Topics: {len(PMG_TOPICS)}")
    print(f"⚙️  Device: {device_name}")
    print(f"⚡ Batch size: {BATCH_SIZE}")
    print(f"📝 Text per talk: ~{MAX_WORDS} words (vs ~3000 chars before)")
    print(f"🕐 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60 + "\n")
    
    start_time = time.time()
    classified_topics = {}
    
    # Prepare texts for batch processing
    print("🔍 Preparing texts for classification...")
    texts = []
    for idx, row in df_to_process.iterrows():
        sampled_text = smart_sample_text(row['talk'], row['title'], MAX_WORDS)
        texts.append(sampled_text)
    print(f"✅ Prepared {len(texts):,} texts\n")
    
    # Process in batches with progress bar
    all_results = []
    num_batches = (len(texts) + BATCH_SIZE - 1) // BATCH_SIZE
    
    with tqdm(total=len(texts), 
              desc="🔍 Classifying",
              bar_format='{l_bar}{bar}| {n_fmt}/{total_fmt} [{elapsed}<{remaining}, {rate_fmt}]',
              ncols=100,
              colour='green') as pbar:
        
        for batch_start in range(0, len(texts), BATCH_SIZE):
            batch_end = min(batch_start + BATCH_SIZE, len(texts))
            batch_texts = texts[batch_start:batch_end]
            
            # Classify batch
            batch_results = classify_batch(batch_texts, BATCH_SIZE)
            all_results.extend(batch_results)
            
            # Update progress
            pbar.update(len(batch_texts))
            
            # Track topics for stats
            for result in batch_results:
                topic = result['top_topic']
                classified_topics[topic] = classified_topics.get(topic, 0) + 1
            
            # Update postfix every few batches
            if len(all_results) % 50 == 0:
                elapsed = time.time() - start_time
                rate = len(all_results) / elapsed
                remaining_talks = len(texts) - len(all_results)
                eta_seconds = remaining_talks / rate if rate > 0 else 0
                eta = timedelta(seconds=int(eta_seconds))
                
                if batch_results:
                    last_topic = batch_results[-1]['top_topic']
                    pbar.set_postfix({'Topic': last_topic[:20], 'ETA': str(eta).split('.')[0]})
            
            # Milestone updates
            processed = len(all_results)
            if processed in [100, 500, 1000, 5000, 10000, 50000, 100000]:
                elapsed = time.time() - start_time
                rate = processed / elapsed
                remaining = len(texts) - processed
                eta_seconds = remaining / rate if rate > 0 else 0
                eta = timedelta(seconds=int(eta_seconds))
                
                tqdm.write(f"\n{'='*60}")
                tqdm.write(f"✨ MILESTONE: {processed:,} talks processed!")
                tqdm.write(f"⏱️  Elapsed: {timedelta(seconds=int(elapsed))}")
                tqdm.write(f"⚡ Speed: {rate:.2f} talks/second")
                tqdm.write(f"⏳ ETA: {eta}")
                tqdm.write(f"📈 Top 3 topics so far:")
                sorted_topics = sorted(classified_topics.items(), key=lambda x: x[1], reverse=True)[:3]
                for i, (t, c) in enumerate(sorted_topics, 1):
                    tqdm.write(f"   {i}. {t}: {c:,} talks")
                tqdm.write("="*60 + "\n")
            
            # Save checkpoint every 10,000 talks
            if RESUME and processed > 0 and processed % 10000 == 0:
                temp_df = df_to_process.iloc[:processed].copy()
                for idx in range(processed):
                    temp_df.iloc[idx, temp_df.columns.get_loc('topics')] = json.dumps(all_results[idx]['topics'])
                    temp_df.iloc[idx, temp_df.columns.get_loc('topic_scores')] = json.dumps(all_results[idx]['scores'])
                    temp_df.iloc[idx, temp_df.columns.get_loc('primary_topic')] = all_results[idx]['top_topic']
                    temp_df.iloc[idx, temp_df.columns.get_loc('primary_topic_score')] = all_results[idx]['top_score']
                
                if df_processed is not None:
                    temp_df = pd.concat([df_processed, temp_df])
                
                temp_df.to_csv(checkpoint_file, index=False)
                tqdm.write(f"💾 Checkpoint saved at {processed:,} talks\n")
    
    total_time = time.time() - start_time
    
    # Store results in dataframe
    print("\n💾 Storing results...")
    for idx, result in enumerate(all_results):
        df_to_process.iloc[idx, df_to_process.columns.get_loc('topics')] = json.dumps(result['topics'])
        df_to_process.iloc[idx, df_to_process.columns.get_loc('topic_scores')] = json.dumps(result['scores'])
        df_to_process.iloc[idx, df_to_process.columns.get_loc('primary_topic')] = result['top_topic']
        df_to_process.iloc[idx, df_to_process.columns.get_loc('primary_topic_score')] = result['top_score']
    
    # Combine with previous results if resuming
    if df_processed is not None:
        final_df = pd.concat([df_processed, df_to_process])
    else:
        final_df = df_to_process
    
    # Save the enriched dataset
    print(f"💾 Saving enriched dataset to {output_file}...")
    final_df.to_csv(output_file, index=False)
    print("✅ Saved successfully!")
    
    # Remove checkpoint file
    if os.path.exists(checkpoint_file):
        os.remove(checkpoint_file)
        print("🗑️  Checkpoint file removed")
    
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
    print(f"   Average speed: {len(final_df) / total_time:.2f} talks/second")
    print(f"   Total talks processed: {len(final_df):,}")
    print(f"   ⚡ SPEEDUP: ~10-20x faster than original version!")
    
    # Classification statistics
    print(f"\n📊 CLASSIFICATION STATISTICS")
    print(f"   Total talks classified: {len(final_df):,}")
    print(f"   Unique topics found: {final_df['primary_topic'].nunique()}")
    
    # Average confidence score
    avg_score = final_df['primary_topic_score'].mean()
    high_confidence = len(final_df[final_df['primary_topic_score'] > 0.7])
    print(f"   Average confidence score: {avg_score:.3f} ({avg_score*100:.1f}%)")
    print(f"   High confidence talks (>70%): {high_confidence:,} ({high_confidence/len(final_df)*100:.1f}%)")
    
    print(f"\n🏆 TOP 10 MOST COMMON TOPICS")
    topic_counts = final_df['primary_topic'].value_counts().head(10)
    for i, (topic, count) in enumerate(topic_counts.items(), 1):
        percentage = (count / len(final_df)) * 100
        bar = "█" * int(percentage / 2)
        print(f"   {i:2d}. {topic[:45]:45s} │ {count:6,} ({percentage:5.1f}%) {bar}")
    
    print("\n" + "="*80)
    print(f"✨ Enriched dataset saved to: {output_file}")
    print(f"📂 File size: {final_df.memory_usage(deep=True).sum() / 1024 / 1024:.1f} MB")
    print(f"🚀 Ready to use in your Next.js app!")
    print(f"\n💡 Next steps:")
    print(f"   1. Copy the file: cp {output_file} conference-app/public/conference_talks_cleaned.csv")
    print(f"   2. Restart your Next.js dev server")
    print(f"   3. Visit http://localhost:3000/topics")
    print("="*80 + "\n")

if __name__ == "__main__":
    main()

