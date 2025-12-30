"""
Diagnostic script to identify exactly what's causing speaker name duplicates
"""

import pandas as pd
from collections import defaultdict

def diagnose_speaker_duplicates(csv_path):
    print(f"Loading data from {csv_path}...")
    df = pd.read_csv(csv_path)
    
    # Group similar names
    speaker_groups = defaultdict(list)
    for speaker in df['speaker'].unique():
        # Normalize for grouping
        normalized = ' '.join(str(speaker).split()).strip()
        speaker_groups[normalized].append(speaker)
    
    # Check duplicates
    print("\n=== Diagnosing Duplicates ===\n")
    for normalized, variations in speaker_groups.items():
        if len(variations) > 1:
            print(f"\n'{normalized}' has {len(variations)} variations:")
            for i, var in enumerate(variations, 1):
                count = len(df[df['speaker'] == var])
                # Show the actual bytes/characters
                print(f"\n  Variation {i}: '{var}' ({count} talks)")
                print(f"    Repr: {repr(var)}")
                print(f"    Bytes: {var.encode('utf-8')}")
                print(f"    Len: {len(var)}")
                # Show each character with its Unicode code point
                print(f"    Characters:")
                for j, char in enumerate(var):
                    print(f"      [{j}] '{char}' (U+{ord(char):04X}, decimal {ord(char)})")
                
                # Show first few rows with this variation
                examples = df[df['speaker'] == var].head(2)
                print(f"    Example talks:")
                for idx, row in examples.iterrows():
                    print(f"      - {row['title']} ({row['season']} {row['year']})")
            
            # Stop after showing a few examples
            if normalized == 'Gordon B. Hinckley':
                break

if __name__ == "__main__":
    import sys
    csv_path = '../data/conference_talks_cleaned.csv'
    if len(sys.argv) > 1:
        csv_path = sys.argv[1]
    
    diagnose_speaker_duplicates(csv_path)

