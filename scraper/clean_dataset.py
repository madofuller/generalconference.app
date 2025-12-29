#!/usr/bin/env python3
"""
Clean and standardize the conference talks dataset.
This script standardizes calling names, speaker names, and removes irrelevant data.
"""

import pandas as pd
import re

def clean_speaker_name(speaker):
    """Remove titles (Elder, President, Sister, Brother) from speaker names."""
    if pd.isna(speaker) or speaker == "No Speaker Found":
        return speaker
    
    # Remove common titles
    cleaned = re.sub(r'\b(By\s+)?(Elder|President|Sister|Brother)\s+', '', speaker, flags=re.IGNORECASE)
    # Remove standalone "By" at the beginning
    cleaned = re.sub(r'^By\s+', '', cleaned, flags=re.IGNORECASE)
    return cleaned.strip()

def standardize_calling(calling):
    """Standardize calling names to consistent values."""
    if pd.isna(calling) or calling == "No Calling Found":
        return calling
    
    # Convert to lowercase for easier matching
    calling_lower = calling.lower()
    
    # ========== FIRST PRESIDENCY ==========
    if 'president of the church' in calling_lower or 'president of the church of jesus christ' in calling_lower:
        return "President of the Church"
    
    if 'first counselor in the first presidency' in calling_lower:
        return "First Counselor in the First Presidency"
    
    if 'second counselor in the first presidency' in calling_lower:
        return "Second Counselor in the First Presidency"
    
    if 'counselor in the first presidency' in calling_lower and 'first' not in calling_lower and 'second' not in calling_lower:
        return "Counselor in the First Presidency"
    
    if 'secretary to the first presidency' in calling_lower or 'secretary to first presidency' in calling_lower:
        return "Secretary to the First Presidency"
    
    # ========== QUORUM OF THE TWELVE APOSTLES ==========
    # President of Q12
    if ('president of the quorum of the twelve' in calling_lower or 
        'president of the council of the twelve' in calling_lower):
        return "President of the Quorum of the Twelve Apostles"
    
    # Acting President of Q12
    if ('acting president of the quorum of the twelve' in calling_lower or 
        'acting president of the council of the twelve' in calling_lower):
        return "Acting President of the Quorum of the Twelve Apostles"
    
    # Assistant to Q12
    if 'assistant to the council of the twelve' in calling_lower or 'assistant to the quorum of the twelve' in calling_lower:
        return "Assistant to the Quorum of the Twelve Apostles"
    
    # Regular Q12 members
    if ('of the quorum of the twelve' in calling_lower or 
        'of the council of the twelve' in calling_lower or
        'quorum of the 12' in calling_lower or
        'council of the 12' in calling_lower):
        return "Of the Quorum of the Twelve Apostles"
    
    # ========== SEVENTY ==========
    # Presidency of Seventy
    if 'presidency of the seventy' in calling_lower or 'presidency of the first quorum of the seventy' in calling_lower:
        return "Of the Presidency of the Seventy"
    
    # Emeritus/Released Seventy
    if 'emeritus' in calling_lower and 'seventy' in calling_lower:
        return "Emeritus Member of the Seventy"
    
    if 'released' in calling_lower and 'seventy' in calling_lower:
        return "Released Member of the Seventy"
    
    # First Quorum of the Seventy / First Council of the Seventy
    if ('first quorum of the seventy' in calling_lower or 
        'first council of the seventy' in calling_lower or
        'first quorum of the 70' in calling_lower):
        return "Of the Seventy"
    
    # Second Quorum of the Seventy
    if 'second quorum of the seventy' in calling_lower:
        return "Of the Seventy"
    
    # General "Of the Seventy"
    if 'of the seventy' in calling_lower or 'of the 70' in calling_lower or 'quorum of 70' in calling_lower:
        return "Of the Seventy"
    
    # ========== PRESIDING BISHOPRIC ==========
    if 'presiding bishop' in calling_lower and 'counselor' not in calling_lower:
        return "Presiding Bishop"
    
    if 'first counselor in the presiding bishopric' in calling_lower:
        return "First Counselor in the Presiding Bishopric"
    
    if 'second counselor in the presiding bishopric' in calling_lower:
        return "Second Counselor in the Presiding Bishopric"
    
    if 'of the presiding bishopric' in calling_lower:
        return "Of the Presiding Bishopric"
    
    # ========== RELIEF SOCIETY ==========
    if 'relief society general president' in calling_lower:
        if 'recently released' in calling_lower or 'released as' in calling_lower or 'former' in calling_lower:
            return "Recently Released Relief Society General President"
        elif 'first counselor' in calling_lower:
            return "First Counselor in the Relief Society General Presidency"
        elif 'second counselor' in calling_lower:
            return "Second Counselor in the Relief Society General Presidency"
        else:
            return "Relief Society General President"
    
    if 'of the relief society general board' in calling_lower:
        return "Of the Relief Society General Board"
    
    # ========== YOUNG WOMEN ==========
    if 'young women' in calling_lower:
        if 'recently released' in calling_lower or 'released as' in calling_lower or 'former' in calling_lower:
            return "Recently Released Young Women General President"
        elif 'first counselor' in calling_lower:
            return "First Counselor in the Young Women General Presidency"
        elif 'second counselor' in calling_lower:
            return "Second Counselor in the Young Women General Presidency"
        elif 'general president' in calling_lower or 'president of the young women' in calling_lower:
            return "Young Women General President"
    
    # ========== PRIMARY ==========
    if 'primary' in calling_lower:
        if 'recently released' in calling_lower:
            return "Recently Released Primary General President"
        elif 'first counselor' in calling_lower:
            return "First Counselor in the Primary General Presidency"
        elif 'second counselor' in calling_lower:
            return "Second Counselor in the Primary General Presidency"
        elif 'general president' in calling_lower:
            return "Primary General President"
    
    # ========== YOUNG MEN ==========
    if 'young men' in calling_lower:
        if 'recently released' in calling_lower and 'first counselor' in calling_lower:
            return "Recently Released First Counselor in the Young Men General Presidency"
        elif 'recently released' in calling_lower and 'second counselor' in calling_lower:
            return "Recently Released Second Counselor in the Young Men General Presidency"
        elif 'first counselor' in calling_lower:
            return "First Counselor in the Young Men General Presidency"
        elif 'second counselor' in calling_lower:
            return "Second Counselor in the Young Men General Presidency"
        elif 'general president' in calling_lower or 'president, aaronic priesthood' in calling_lower:
            return "Young Men General President"
    
    # ========== SUNDAY SCHOOL ==========
    if 'sunday school' in calling_lower:
        if 'recently released' in calling_lower:
            return "Recently Released Sunday School General President"
        elif 'first counselor' in calling_lower:
            return "First Counselor in the Sunday School General Presidency"
        elif 'second counselor' in calling_lower:
            return "Second Counselor in the Sunday School General Presidency"
        elif 'general president' in calling_lower:
            return "Sunday School General President"
    
    # ========== OTHER CHURCH POSITIONS ==========
    if 'patriarch to the church' in calling_lower:
        return "Patriarch to the Church"
    
    if 'church audit' in calling_lower:
        return "Church Auditing Department"
    
    if 'church finance' in calling_lower:
        return "Church Finance Committee"
    
    if 'church leadership committee' in calling_lower:
        return "Church Leadership Committee"
    
    # ========== LOCAL LEADERSHIP / MEMBERS ==========
    # If it mentions a specific ward/stake, mark as "Local Leader/Member"
    if ('ward' in calling_lower or 'stake' in calling_lower or 
        'bishop,' in calling_lower or 'president,' in calling_lower):
        return "Local Leader/Member"
    
    # BYU-related callings
    if 'brigham young university' in calling_lower or 'byu' in calling_lower:
        return "BYU Leadership/Faculty"
    
    # Other special cases
    if 'boy scouts' in calling_lower:
        return "Boy Scouts Leadership"
    
    if 'astronaut' in calling_lower:
        return "Special Guest"
    
    # If nothing matches, return original
    return calling

def clean_dataset(input_file, output_file):
    """Main function to clean and standardize the dataset."""
    print("=" * 80)
    print("CLEANING CONFERENCE TALKS DATASET")
    print("=" * 80)
    
    # Load the CSV
    print(f"\nLoading data from {input_file}...")
    df = pd.read_csv(input_file)
    print(f"Loaded {len(df)} talks")
    
    # Display original unique callings
    print(f"\nOriginal unique callings: {df['calling'].nunique()}")
    
    # Clean speaker names
    print("\nCleaning speaker names (removing titles)...")
    df['speaker'] = df['speaker'].apply(clean_speaker_name)
    
    # Standardize callings
    print("Standardizing calling names...")
    df['calling_original'] = df['calling']  # Keep original for reference
    df['calling'] = df['calling'].apply(standardize_calling)
    
    print(f"Standardized unique callings: {df['calling'].nunique()}")
    
    # Remove rows with "Church Auditing Department" in the calling
    print("\nRemoving Church Auditing Department reports...")
    before_count = len(df)
    df = df[df['calling'] != 'Church Auditing Department']
    removed_audit = before_count - len(df)
    print(f"Removed {removed_audit} Church Auditing Department reports")
    
    # Remove rows with "Presented by" in the speaker column
    print("Removing 'Presented by' entries...")
    before_count = len(df)
    df = df[~df['speaker'].str.contains("Presented by", na=False)]
    removed_presented = before_count - len(df)
    print(f"Removed {removed_presented} 'Presented by' entries")
    
    # Remove session titles (morning, afternoon, evening)
    print("Removing session title rows...")
    before_count = len(df)
    df = df[~df['title'].str.contains(r'\b(morning|afternoon|evening)\s+session\b', case=False, na=False, regex=True)]
    removed_sessions = before_count - len(df)
    print(f"Removed {removed_sessions} session title rows")
    
    # Remove "No Speaker Found" entries
    print("Removing 'No Speaker Found' entries...")
    before_count = len(df)
    df = df[df['speaker'] != 'No Speaker Found']
    removed_no_speaker = before_count - len(df)
    print(f"Removed {removed_no_speaker} 'No Speaker Found' entries")
    
    # Sort by year and season
    print("\nSorting by year and season...")
    df['year'] = df['year'].astype(int)
    season_order = {'April': 0, 'October': 1}
    df['season_order'] = df['season'].map(season_order)
    df = df.sort_values(['year', 'season_order'])
    df = df.drop('season_order', axis=1)
    
    # Reorder columns for better readability
    column_order = ['title', 'speaker', 'calling', 'year', 'season', 'url', 'talk', 'footnotes', 'calling_original']
    df = df[column_order]
    
    # Save cleaned dataset
    print(f"\nSaving cleaned dataset to {output_file}...")
    df.to_csv(output_file, index=False)
    
    # Display summary statistics
    print("\n" + "=" * 80)
    print("CLEANING SUMMARY")
    print("=" * 80)
    print(f"Total talks in cleaned dataset: {len(df)}")
    print(f"Unique speakers: {df['speaker'].nunique()}")
    print(f"Unique callings (standardized): {df['calling'].nunique()}")
    print(f"Year range: {df['year'].min()} - {df['year'].max()}")
    
    print("\n" + "=" * 80)
    print("STANDARDIZED CALLING VALUES")
    print("=" * 80)
    calling_counts = df['calling'].value_counts()
    for calling, count in calling_counts.items():
        print(f"{calling}: {count} talks")
    
    print("\n" + "=" * 80)
    print(f"SUCCESS! Cleaned dataset saved to '{output_file}'")
    print("=" * 80)
    
    return df

if __name__ == "__main__":
    input_file = "conference_talks (2).csv"
    output_file = "conference_talks_cleaned.csv"
    
    df = clean_dataset(input_file, output_file)
    
    print("\nYou can now use 'conference_talks_cleaned.csv' for your analysis!")

