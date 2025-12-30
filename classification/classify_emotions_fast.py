"""
FAST Emotion Classification for General Conference Talks
Uses roberta-base-go_emotions for 28-emotion multi-label classification
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
print("😊 FAST EMOTION CLASSIFICATION FOR GENERAL CONFERENCE")
print("="*80)
print("📚 Model: SamLowe/roberta-base-go_emotions")
print("🏷️  Emotions: 28 emotion labels from Reddit-based dataset")
print("⚡ Optimizations: Batch processing + Smart sampling")
print("="*80 + "\n")

# Check if CUDA is available
device = 0 if torch.cuda.is_available() else -1
device_name = "🚀 GPU (CUDA)" if device == 0 else "💻 CPU"
print(f"⚙️  Device: {device_name}")

# Initialize the classifier
print("📦 Loading emotion model (this may take a moment on first run)...")
classifier = pipeline(
    task="text-classification",
    model="SamLowe/roberta-base-go_emotions",
    top_k=None,  # Get all 28 emotions
    device=device
)
print("✅ Model loaded successfully!")

# 28 Emotion labels
EMOTIONS = [
    'admiration', 'amusement', 'anger', 'annoyance', 'approval', 'caring',
    'confusion', 'curiosity', 'desire', 'disappointment', 'disapproval',
    'disgust', 'embarrassment', 'excitement', 'fear', 'gratitude', 'grief',
    'joy', 'love', 'nervousness', 'optimism', 'pride', 'realization',
    'relief', 'remorse', 'sadness', 'surprise', 'neutral'
]

def smart_sample_text(text, title, max_words=200):
    """
    Intelligently sample text from the talk.
    For emotions, we want a bit more context than topics.
    """
    # Start with title
    sampled = f"{title}. "
    
    # Split into sentences
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
    
    if len(sentences) == 0:
        return sampled + text[:700]
    
    # Take first 4 sentences (opening - sets emotional tone)
    opening = '. '.join(sentences[:4]) + '.'
    sampled += opening
    
    # If we have more sentences, add a few from the middle and end
    if len(sentences) > 15:
        middle_start = len(sentences) // 3
        middle = '. '.join(sentences[middle_start:middle_start+2]) + '.'
        sampled += ' ' + middle
        
        # Add conclusion (emotional tone often concludes strongly)
        end = '. '.join(sentences[-2:]) + '.'
        sampled += ' ' + end
    
    # Limit to max_words
    words = sampled.split()
    if len(words) > max_words:
        sampled = ' '.join(words[:max_words])
    
    return sampled

def classify_emotions_batch(texts, batch_size=8, threshold=0.3):
    """
    Classify emotions for multiple talks at once.
    threshold: minimum score to include an emotion (0.3 is good for emotions)
    """
    results = []
    
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        
        # Process batch
        batch_results = []
        for text in batch:
            try:
                # Get all 28 emotion scores
                result = classifier(text)[0]  # Returns list of dicts with label/score
                
                # Sort by score descending
                result = sorted(result, key=lambda x: x['score'], reverse=True)
                
                # Get top emotions above threshold (max 5)
                emotions = []
                scores = []
                for item in result:
                    if item['score'] > threshold and len(emotions) < 5:
                        emotions.append(item['label'])
                        scores.append(round(item['score'], 4))
                
                # If no emotions above threshold, take top 3
                if len(emotions) == 0:
                    emotions = [item['label'] for item in result[:3]]
                    scores = [round(item['score'], 4) for item in result[:3]]
                
                # Get all 28 emotion scores for comprehensive analysis
                all_emotions = {item['label']: round(item['score'], 4) for item in result}
                
                batch_results.append({
                    'emotions': emotions,
                    'emotion_scores': scores,
                    'primary_emotion': emotions[0] if emotions else "neutral",
                    'primary_emotion_score': scores[0] if scores else 0.0,
                    'all_emotion_scores': all_emotions
                })
                
            except Exception as e:
                print(f"Error: {str(e)}")
                batch_results.append({
                    'emotions': ['neutral'],
                    'emotion_scores': [0.5],
                    'primary_emotion': "neutral",
                    'primary_emotion_score': 0.5,
                    'all_emotion_scores': {emotion: 0.0 for emotion in EMOTIONS}
                })
        
        results.extend(batch_results)
    
    return results

def main():
    # Configuration
    BATCH_SIZE = 8  # Process 8 talks at a time
    MAX_WORDS = 200  # Use ~200 words per talk (emotions need more context)
    SAMPLE_SIZE = None  # Set to a number for testing, or None for all
    RESUME = True  # Resume from checkpoint if available
    EMOTION_THRESHOLD = 0.3  # Minimum score to include emotion
    
    # Input/Output files
    input_file = '../data/conference_talks_with_topics.csv'  # Start with topics file
    output_file = 'conference_talks_with_emotions.csv'
    checkpoint_file = 'emotion_classification_checkpoint.csv'
    
    # Load the dataset
    print("\nLoading dataset...")
    df = pd.read_csv(input_file)
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
    df_to_process['emotions'] = None
    df_to_process['emotion_scores'] = None
    df_to_process['primary_emotion'] = None
    df_to_process['primary_emotion_score'] = None
    df_to_process['all_emotion_scores'] = None
    
    print("\n" + "="*60)
    print("😊 STARTING FAST EMOTION CLASSIFICATION")
    print("="*60)
    print(f"📚 Talks to process: {len(df_to_process):,}")
    print(f"🏷️  Emotions: {len(EMOTIONS)} (28 emotions)")
    print(f"⚙️  Device: {device_name}")
    print(f"⚡ Batch size: {BATCH_SIZE}")
    print(f"📝 Text per talk: ~{MAX_WORDS} words")
    print(f"🎯 Emotion threshold: {EMOTION_THRESHOLD}")
    print(f"🕐 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60 + "\n")
    
    start_time = time.time()
    classified_emotions = {}
    
    # Prepare texts for batch processing
    print("🔍 Preparing texts for classification...")
    texts = []
    for idx, row in df_to_process.iterrows():
        sampled_text = smart_sample_text(row['talk'], row['title'], MAX_WORDS)
        texts.append(sampled_text)
    print(f"✅ Prepared {len(texts):,} texts\n")
    
    # Process in batches with progress bar
    all_results = []
    
    with tqdm(total=len(texts), 
              desc="😊 Classifying",
              bar_format='{l_bar}{bar}| {n_fmt}/{total_fmt} [{elapsed}<{remaining}, {rate_fmt}]',
              ncols=100,
              colour='blue') as pbar:
        
        for batch_start in range(0, len(texts), BATCH_SIZE):
            batch_end = min(batch_start + BATCH_SIZE, len(texts))
            batch_texts = texts[batch_start:batch_end]
            
            # Classify batch
            batch_results = classify_emotions_batch(batch_texts, BATCH_SIZE, EMOTION_THRESHOLD)
            all_results.extend(batch_results)
            
            # Update progress
            pbar.update(len(batch_texts))
            
            # Track emotions for stats
            for result in batch_results:
                emotion = result['primary_emotion']
                classified_emotions[emotion] = classified_emotions.get(emotion, 0) + 1
            
            # Update postfix
            if len(all_results) % 50 == 0:
                elapsed = time.time() - start_time
                rate = len(all_results) / elapsed
                remaining_talks = len(texts) - len(all_results)
                eta_seconds = remaining_talks / rate if rate > 0 else 0
                eta = timedelta(seconds=int(eta_seconds))
                
                if batch_results:
                    last_emotion = batch_results[-1]['primary_emotion']
                    pbar.set_postfix({'Emotion': last_emotion[:15], 'ETA': str(eta).split('.')[0]})
            
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
                tqdm.write(f"😊 Top 3 emotions so far:")
                sorted_emotions = sorted(classified_emotions.items(), key=lambda x: x[1], reverse=True)[:3]
                for i, (e, c) in enumerate(sorted_emotions, 1):
                    tqdm.write(f"   {i}. {e}: {c:,} talks")
                tqdm.write("="*60 + "\n")
            
            # Save checkpoint every 10,000 talks
            if RESUME and processed > 0 and processed % 10000 == 0:
                temp_df = df_to_process.iloc[:processed].copy()
                for idx in range(processed):
                    temp_df.iloc[idx, temp_df.columns.get_loc('emotions')] = json.dumps(all_results[idx]['emotions'])
                    temp_df.iloc[idx, temp_df.columns.get_loc('emotion_scores')] = json.dumps(all_results[idx]['emotion_scores'])
                    temp_df.iloc[idx, temp_df.columns.get_loc('primary_emotion')] = all_results[idx]['primary_emotion']
                    temp_df.iloc[idx, temp_df.columns.get_loc('primary_emotion_score')] = all_results[idx]['primary_emotion_score']
                    temp_df.iloc[idx, temp_df.columns.get_loc('all_emotion_scores')] = json.dumps(all_results[idx]['all_emotion_scores'])
                
                if df_processed is not None:
                    temp_df = pd.concat([df_processed, temp_df])
                
                temp_df.to_csv(checkpoint_file, index=False)
                tqdm.write(f"💾 Checkpoint saved at {processed:,} talks\n")
    
    total_time = time.time() - start_time
    
    # Store results in dataframe
    print("\n💾 Storing results...")
    for idx, result in enumerate(all_results):
        df_to_process.iloc[idx, df_to_process.columns.get_loc('emotions')] = json.dumps(result['emotions'])
        df_to_process.iloc[idx, df_to_process.columns.get_loc('emotion_scores')] = json.dumps(result['emotion_scores'])
        df_to_process.iloc[idx, df_to_process.columns.get_loc('primary_emotion')] = result['primary_emotion']
        df_to_process.iloc[idx, df_to_process.columns.get_loc('primary_emotion_score')] = result['primary_emotion_score']
        df_to_process.iloc[idx, df_to_process.columns.get_loc('all_emotion_scores')] = json.dumps(result['all_emotion_scores'])
    
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
    print("🎉 EMOTION CLASSIFICATION COMPLETE!")
    print("="*80)
    
    # Time statistics
    hours = int(total_time // 3600)
    minutes = int((total_time % 3600) // 60)
    seconds = int(total_time % 60)
    print(f"\n⏱️  PERFORMANCE METRICS")
    print(f"   Total time: {hours}h {minutes}m {seconds}s")
    print(f"   Average speed: {len(final_df) / total_time:.2f} talks/second")
    print(f"   Total talks processed: {len(final_df):,}")
    
    # Emotion statistics
    print(f"\n😊 EMOTION STATISTICS")
    print(f"   Total talks classified: {len(final_df):,}")
    print(f"   Unique emotions found: {final_df['primary_emotion'].nunique()}")
    
    # Average confidence score
    avg_score = final_df['primary_emotion_score'].mean()
    high_confidence = len(final_df[final_df['primary_emotion_score'] > 0.5])
    print(f"   Average confidence score: {avg_score:.3f} ({avg_score*100:.1f}%)")
    print(f"   High confidence talks (>50%): {high_confidence:,} ({high_confidence/len(final_df)*100:.1f}%)")
    
    print(f"\n🏆 TOP 10 MOST COMMON EMOTIONS")
    emotion_counts = final_df['primary_emotion'].value_counts().head(10)
    for i, (emotion, count) in enumerate(emotion_counts.items(), 1):
        percentage = (count / len(final_df)) * 100
        bar = "█" * int(percentage / 2)
        print(f"   {i:2d}. {emotion:15s} │ {count:6,} ({percentage:5.1f}%) {bar}")
    
    print("\n" + "="*80)
    print(f"✨ Enriched dataset saved to: {output_file}")
    print(f"📂 File size: {final_df.memory_usage(deep=True).sum() / 1024 / 1024:.1f} MB")
    print(f"🚀 Ready to use in your Next.js app!")
    print(f"\n💡 Next steps:")
    print(f"   1. Copy the file: cp {output_file} ../conference-app/public/conference_talks_cleaned.csv")
    print(f"   2. Restart your Next.js dev server")
    print(f"   3. Visit http://localhost:3000/emotions")
    print("="*80 + "\n")

if __name__ == "__main__":
    main()



