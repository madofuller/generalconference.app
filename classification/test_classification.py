"""
Quick test script to verify the classification setup works
Tests on just 5 talks to ensure everything is configured correctly
"""

import pandas as pd
from transformers import pipeline
import torch
import json
from datetime import datetime

print("\n" + "="*80)
print("🧪 TESTING CLASSIFICATION SETUP")
print("="*80)

# Check device
device = 0 if torch.cuda.is_available() else -1
device_name = "🚀 GPU (CUDA)" if device == 0 else "💻 CPU"
print(f"⚙️  Device: {device_name}")

# Load model
print("📦 Loading model...")
classifier = pipeline(
    "zero-shot-classification",
    model="MoritzLaurer/DeBERTa-v3-base-mnli-fever-anli",
    device=device
)
print("✅ Model loaded successfully!")

# Load test data (just 5 talks)
print("\n📚 Loading test data (5 talks)...")
df = pd.read_csv('conference_talks_cleaned.csv').head(5)
print(f"✅ Loaded {len(df)} talks for testing")

# Test topics
test_topics = [
    "Faith in Jesus Christ",
    "The Atonement of Jesus Christ",
    "Repentance and forgiveness",
    "The Plan of Salvation",
    "Prayer and personal revelation"
]

print(f"\n🏷️  Testing with {len(test_topics)} topics")
print("\n🔍 Classifying test talks...")

for idx, row in df.iterrows():
    print(f"\n   Talk {idx + 1}/{len(df)}: {row['speaker']} - '{row['title'][:50]}...'")
    
    # Classify
    text = f"{row['title']}. {row['talk'][:3000]}"
    result = classifier(text, candidate_labels=test_topics, multi_label=True, truncation=True)
    
    # Show results
    top_topic = result['labels'][0]
    top_score = result['scores'][0]
    print(f"   ✅ Primary topic: {top_topic} (confidence: {top_score:.1%})")
    print(f"   📊 Top 3 topics:")
    for i in range(min(3, len(result['labels']))):
        print(f"      {i+1}. {result['labels'][i]}: {result['scores'][i]:.1%}")

print("\n" + "="*80)
print("🎉 TEST COMPLETED SUCCESSFULLY!")
print("="*80)
print("\n✅ Your setup is working correctly!")
print("💡 You're ready to run the full classification:")
print("   python classify_topics.py")
print("\n⚠️  Note: The full classification will take several hours.")
print("   Consider running it overnight or on a weekend.")
print("="*80 + "\n")

