"""
Script to clean and deduplicate speaker names in the conference talks dataset.
This fixes issues where speakers appear multiple times due to whitespace or formatting differences.
"""

import pandas as pd
import sys
from pathlib import Path

def clean_speaker_names(csv_path):
    """
    Clean speaker names by:
    1. Trimming whitespace
    2. Normalizing multiple spaces to single space
    3. Fixing common inconsistencies
    """
    print(f"Loading data from {csv_path}...")
    df = pd.read_csv(csv_path)
    
    original_count = len(df)
    print(f"Total talks: {original_count:,}")
    
    # Count unique speakers before cleaning
    unique_before = df['speaker'].nunique()
    print(f"Unique speakers before cleaning: {unique_before:,}")
    
    # Show speakers with potential duplicates (by counting variations)
    speaker_counts = df['speaker'].value_counts()
    print("\n=== Before Cleaning ===")
    print("Checking for potential duplicates...\n")
    
    # Group similar names (just for display)
    from collections import defaultdict
    speaker_groups = defaultdict(list)
    for speaker in df['speaker'].unique():
        # Normalize for grouping
        normalized = ' '.join(speaker.split()).strip()
        speaker_groups[normalized].append(speaker)
    
    # Show duplicates
    duplicates_found = False
    for normalized, variations in speaker_groups.items():
        if len(variations) > 1:
            duplicates_found = True
            print(f"'{normalized}' has {len(variations)} variations:")
            for var in variations:
                count = len(df[df['speaker'] == var])
                print(f"  - '{var}' ({count} talks)")
    
    if not duplicates_found:
        print("No obvious duplicates found based on normalized names.")
    
    # Clean all text fields
    print("\n=== Cleaning Data ===")
    
    # Speaker names - more aggressive cleaning
    df['speaker'] = df['speaker'].astype(str).str.strip()
    # Remove all whitespace variations and normalize to single space
    df['speaker'] = df['speaker'].str.replace(r'\s+', ' ', regex=True)
    # Remove any non-breaking spaces and other Unicode spaces
    df['speaker'] = df['speaker'].str.replace('\xa0', ' ', regex=False)
    df['speaker'] = df['speaker'].str.replace('\u00a0', ' ', regex=False)
    df['speaker'] = df['speaker'].str.replace('\u202f', ' ', regex=False)
    df['speaker'] = df['speaker'].str.replace('\u2009', ' ', regex=False)
    # Trim again after replacements
    df['speaker'] = df['speaker'].str.strip()
    df['speaker'] = df['speaker'].str.replace(r'\s+', ' ', regex=True)
    
    # Other text fields
    df['title'] = df['title'].astype(str).str.strip()
    df['calling'] = df['calling'].astype(str).str.strip()
    df['season'] = df['season'].astype(str).str.strip()
    df['url'] = df['url'].astype(str).str.strip()
    df['calling_original'] = df['calling_original'].astype(str).str.strip()
    
    # Count unique speakers after cleaning
    unique_after = df['speaker'].nunique()
    print(f"Unique speakers after cleaning: {unique_after:,}")
    print(f"Reduction: {unique_before - unique_after} duplicate variations removed")
    
    # Show top speakers
    print("\n=== Top 15 Speakers (After Cleaning) ===")
    top_speakers = df['speaker'].value_counts().head(15)
    for i, (speaker, count) in enumerate(top_speakers.items(), 1):
        print(f"{i:2d}. {speaker:30s} - {count:3d} talks")
    
    # Save cleaned data
    output_path = csv_path.replace('.csv', '_deduped.csv')
    if output_path == csv_path:
        output_path = csv_path.replace('.csv', '_cleaned_deduped.csv')
    
    print(f"\n💾 Saving cleaned data to {output_path}...")
    df.to_csv(output_path, index=False)
    print("✅ Done!")
    
    print(f"\n📋 Summary:")
    print(f"  - Input file: {csv_path}")
    print(f"  - Output file: {output_path}")
    print(f"  - Total talks: {len(df):,}")
    print(f"  - Unique speakers: {unique_after:,}")
    print(f"  - Duplicates removed: {unique_before - unique_after}")
    
    return output_path

def main():
    # Default paths
    csv_path = '../data/conference_talks_cleaned.csv'
    
    # Check if path was provided as argument
    if len(sys.argv) > 1:
        csv_path = sys.argv[1]
    
    # Check if file exists
    if not Path(csv_path).exists():
        print(f"❌ Error: File not found: {csv_path}")
        print("\nUsage: python deduplicate_speakers.py [path_to_csv]")
        print("Example: python deduplicate_speakers.py ../data/conference_talks_cleaned.csv")
        sys.exit(1)
    
    # Clean the data
    output_path = clean_speaker_names(csv_path)
    
    print(f"\n💡 Next steps:")
    print(f"  1. Review the output file: {output_path}")
    print(f"  2. If satisfied, replace the original:")
    print(f"     cp {output_path} {csv_path}")
    print(f"  3. Copy to web app:")
    print(f"     cp {csv_path} ../conference-app/public/conference_talks_cleaned.csv")

if __name__ == "__main__":
    main()

