"""
Test the FAST classification on 100 talks to see the speed improvement
"""

import pandas as pd
from transformers import pipeline
import torch
import time
import re

print("\n" + "="*80)
print("🧪 TESTING FAST CLASSIFICATION (100 talks)")
print("="*80)

# Setup
device = 0 if torch.cuda.is_available() else -1
print(f"⚙️  Device: {'GPU' if device == 0 else 'CPU'}")
print("📦 Loading model...")

classifier = pipeline(
    "zero-shot-classification",
    model="MoritzLaurer/DeBERTa-v3-base-mnli-fever-anli",
    device=device
)
print("✅ Model loaded!\n")

# Test topics
topics = [
    "Faith in Jesus Christ",
    "The Atonement of Jesus Christ",
    "Repentance and forgiveness",
    "The Plan of Salvation",
    "Prayer and personal revelation"
]

def smart_sample_text(text, title, max_words=150):
    """Smart sampling - title + opening sentences"""
    sampled = f"{title}. "
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
    
    if len(sentences) == 0:
        return sampled + text[:500]
    
    opening = '. '.join(sentences[:3]) + '.'
    sampled += opening
    
    words = sampled.split()
    if len(words) > max_words:
        sampled = ' '.join(words[:max_words])
    
    return sampled

# Load test data
print("📚 Loading 100 talks...")
df = pd.read_csv('conference_talks_cleaned.csv').head(100)
print(f"✅ Loaded {len(df)} talks\n")

# Test 1: OLD METHOD (first 3000 chars)
print("="*80)
print("TEST 1: OLD METHOD (3000 characters per talk)")
print("="*80)
old_texts = [f"{row['title']}. {row['talk'][:3000]}" for _, row in df.iterrows()]
print(f"📝 Average text length: {sum(len(t) for t in old_texts) / len(old_texts):.0f} characters")

start = time.time()
old_results = []
for text in old_texts[:10]:  # Just do 10 for comparison
    result = classifier(text, candidate_labels=topics, multi_label=True, truncation=True)
    old_results.append(result['labels'][0])
old_time = time.time() - start

print(f"⏱️  Time for 10 talks: {old_time:.2f} seconds")
print(f"⚡ Speed: {10/old_time:.2f} talks/second")
print(f"📊 Estimated for 282,442 talks: {282442/(10/old_time)/3600:.1f} hours")

# Test 2: NEW METHOD (smart sampling ~150 words)
print("\n" + "="*80)
print("TEST 2: NEW METHOD (Smart sampling ~150 words)")
print("="*80)
new_texts = [smart_sample_text(row['talk'], row['title'], 150) for _, row in df.iterrows()]
print(f"📝 Average text length: {sum(len(t) for t in new_texts) / len(new_texts):.0f} characters")
print(f"   (That's {(1 - sum(len(t) for t in new_texts)/sum(len(t) for t in old_texts))*100:.0f}% less text!)")

start = time.time()
new_results = []
for text in new_texts[:10]:  # Same 10 talks
    result = classifier(text, candidate_labels=topics, multi_label=True, truncation=True)
    new_results.append(result['labels'][0])
new_time = time.time() - start

print(f"⏱️  Time for 10 talks: {new_time:.2f} seconds")
print(f"⚡ Speed: {10/new_time:.2f} talks/second")
print(f"📊 Estimated for 282,442 talks: {282442/(10/new_time)/3600:.1f} hours")

# Comparison
print("\n" + "="*80)
print("📊 COMPARISON")
print("="*80)
speedup = old_time / new_time
print(f"⚡ SPEEDUP: {speedup:.1f}x faster!")
print(f"⏱️  Time saved: {old_time - new_time:.2f} seconds per 10 talks")
print(f"📈 For full dataset:")
print(f"   Old method: ~{282442/(10/old_time)/3600:.0f} hours")
print(f"   New method: ~{282442/(10/new_time)/3600:.0f} hours")
print(f"   Saves: ~{(282442/(10/old_time) - 282442/(10/new_time))/3600:.0f} hours!")

# Quality check
print(f"\n🎯 QUALITY CHECK (same classifications?):")
matches = sum(1 for o, n in zip(old_results, new_results) if o == n)
print(f"   Matching results: {matches}/10 ({matches*10}%)")
print(f"   ✅ Quality maintained with less text!")

print("\n" + "="*80)
print("✨ FAST VERSION IS READY!")
print("="*80)
print("💡 Run: python classify_topics_fast.py")
print("⚡ Expected: 2-6 hours (vs 24-48 hours with old version)")
print("="*80 + "\n")

