#!/usr/bin/env python3
"""
Update conference talks from October 2024 onwards in the existing CSV.
This script scrapes only recent talks and replaces them in the dataset.
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
import re
import unicodedata
import time
from tqdm import tqdm
from concurrent.futures import ThreadPoolExecutor

def get_soup(url):
    """Create a tree structure (BeautifulSoup) out of a GET request's HTML."""
    try:
        r = requests.get(url, allow_redirects=True)
        r.raise_for_status()
        print(f"Successfully fetched {r.url}")
        return BeautifulSoup(r.content, "html5lib")
    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return None

def is_decade_page(url):
    """Check if a page is a decade selection page."""
    return bool(re.search(r"/study/general-conference/\d{4}\d{4}", url))

def scrape_conference_pages(main_page_url):
    """Retrieve a list of URLs for each conference (year/month) from the main page."""
    soup = get_soup(main_page_url)
    if soup is None:
        print(f"Failed to fetch content from {main_page_url}")
        return []

    all_conference_links = []

    # Find all the links to individual conferences or decades
    links = [
        "https://www.churchofjesuschrist.org" + a["href"]
        for a in soup.find_all("a", href=True)
        if re.search(r"/study/general-conference/(\d{4}/(04|10)|\d{4}\d{4})", a["href"])
    ]

    for link in links:
        if is_decade_page(link):
            # Handle decade page
            decade_soup = get_soup(link)
            if decade_soup:
                year_links = [
                    "https://www.churchofjesuschrist.org" + a["href"]
                    for a in decade_soup.find_all("a", href=True)
                    if re.search(r"/study/general-conference/\d{4}/(04|10)", a["href"])
                ]
                all_conference_links.extend(year_links)
        else:
            all_conference_links.append(link)

    print(f"Total conference links found: {len(all_conference_links)}")
    return all_conference_links

def scrape_talk_urls(conference_url):
    """Retrieve a list of URLs for each talk in a specific conference."""
    soup = get_soup(conference_url)
    if soup is None:
        return []

    talk_links = [
        "https://www.churchofjesuschrist.org" + a["href"]
        for a in soup.find_all("a", href=True)
        if re.search(r"/study/general-conference/\d{4}/(04|10)/.*", a["href"])
    ]

    # Remove duplicate links and session links
    talk_links = list(set(talk_links))
    talk_links = [link for link in talk_links if not link.endswith("session?lang=eng")]

    print(f"Found {len(talk_links)} talk links in {conference_url}")
    return talk_links

def scrape_talk_data(url):
    """Scrapes a single talk for data such as: title, conference, calling, speaker, content."""
    try:
        soup = get_soup(url)
        if soup is None:
            return {}

        # Try old structure first (pre-October 2024)
        title_tag = soup.find("h1", {"id": "title1"})
        # If old structure not found, try new structure (October 2024+)
        if not title_tag:
            # Find any h1 tag (new structure uses dynamic IDs)
            title_tag = soup.find("h1")
        title = title_tag.text.strip() if title_tag else "No Title Found"

        conference_tag = soup.find("p", {"class": "subtitle"})
        conference = conference_tag.text.strip() if conference_tag else "No Conference Found"

        author_tag = soup.find("p", {"class": "author-name"})
        speaker = author_tag.text.strip() if author_tag else "No Speaker Found"

        calling_tag = soup.find("p", {"class": "author-role"})
        calling = calling_tag.text.strip() if calling_tag else "No Calling Found"

        content_array = soup.find("div", {"class": "body-block"})
        content = "\n\n".join(paragraph.text.strip() for paragraph in content_array.find_all("p")) if content_array else "No Content Found"

        footnotes = "\n".join(
            f"{idx}. {note.text.strip()}" for idx, note in enumerate(soup.find_all("li", {"class": "study-note"}), start=1)
        ) if soup.find_all("li", {"class": "study-note"}) else "No Footnotes Found"

        year = re.search(r'/(\d{4})/', url).group(1)
        season = "April" if "/04/" in url else "October"

        return {
            "title": title,
            "speaker": speaker,
            "calling": calling,
            "year": year,
            "season": season,
            "url": url,
            "talk": content,
            "footnotes": footnotes,
        }
    except Exception as e:
        print(f"Failed to scrape {url}: {e}")
        return {}

def scrape_talk_data_parallel(urls):
    """Scrapes all talks in parallel using ThreadPoolExecutor."""
    with ThreadPoolExecutor(max_workers=10) as executor:
        results = list(tqdm(executor.map(scrape_talk_data, urls), total=len(urls), desc="Scraping talks in parallel"))
    return [result for result in results if result]

def filter_conferences_from_oct_2024(conference_urls):
    """Filter conference URLs to only include October 2024 onwards."""
    filtered = []
    for url in conference_urls:
        match = re.search(r'/(\d{4})/(04|10)', url)
        if match:
            year = int(match.group(1))
            month = match.group(2)
            # Include October 2024 onwards
            if year > 2024 or (year == 2024 and month == "10"):
                filtered.append(url)
    return filtered

def main():
    print("=" * 60)
    print("Updating Conference Talks from October 2024 onwards")
    print("=" * 60)
    
    # Load existing CSV
    csv_file = "conference_talks (2).csv"
    print(f"\nLoading existing data from {csv_file}...")
    existing_df = pd.read_csv(csv_file)
    print(f"Loaded {len(existing_df)} existing talks")
    
    # Filter out October 2024 onwards from existing data
    print("\nRemoving talks from October 2024 onwards from existing data...")
    def should_keep(row):
        year = int(row['year'])
        season = row['season']
        # Keep if before October 2024
        return year < 2024 or (year == 2024 and season == "April")
    
    old_talks_df = existing_df[existing_df.apply(should_keep, axis=1)]
    removed_count = len(existing_df) - len(old_talks_df)
    print(f"Removed {removed_count} talks from October 2024 onwards")
    print(f"Keeping {len(old_talks_df)} talks from before October 2024")
    
    # Scrape new talks
    print("\nScraping conferences from October 2024 onwards...")
    main_url = "https://www.churchofjesuschrist.org/study/general-conference?lang=eng"
    all_conference_urls = scrape_conference_pages(main_url)
    
    # Filter to only October 2024 onwards
    recent_conference_urls = filter_conferences_from_oct_2024(all_conference_urls)
    print(f"\nFound {len(recent_conference_urls)} conferences from October 2024 onwards:")
    for url in recent_conference_urls:
        print(f"  - {url}")
    
    # Get all talk URLs from recent conferences
    all_talk_urls = []
    for conference_url in tqdm(recent_conference_urls, desc="Getting talk URLs"):
        all_talk_urls.extend(scrape_talk_urls(conference_url))
    
    print(f"\nTotal talks to scrape: {len(all_talk_urls)}")
    
    # Scrape talks in parallel
    print("\nScraping talks...")
    new_talks = scrape_talk_data_parallel(all_talk_urls)
    print(f"Successfully scraped {len(new_talks)} talks")
    
    # Create DataFrame from new talks
    new_talks_df = pd.DataFrame(new_talks)
    
    # Normalize Unicode and clean data
    print("\nCleaning data...")
    for col in new_talks_df.columns:
        new_talks_df[col] = new_talks_df[col].apply(lambda x: unicodedata.normalize("NFD", x) if isinstance(x, str) else x)
        new_talks_df[col] = new_talks_df[col].apply(lambda x: x.replace("\t", "") if isinstance(x, str) else x)
    
    # Combine old and new data
    print("\nCombining old and new data...")
    combined_df = pd.concat([old_talks_df, new_talks_df], ignore_index=True)
    
    # Sort by year and season
    combined_df['year'] = combined_df['year'].astype(int)
    season_order = {'April': 0, 'October': 1}
    combined_df['season_order'] = combined_df['season'].map(season_order)
    combined_df = combined_df.sort_values(['year', 'season_order'])
    combined_df = combined_df.drop('season_order', axis=1)
    
    # Save to CSV
    output_file = "conference_talks (2).csv"
    combined_df.to_csv(output_file, index=False)
    print(f"\n{'=' * 60}")
    print(f"SUCCESS! Updated data saved to '{output_file}'")
    print(f"Total talks in dataset: {len(combined_df)}")
    print(f"  - Old talks (pre-Oct 2024): {len(old_talks_df)}")
    print(f"  - New talks (Oct 2024+): {len(new_talks_df)}")
    print(f"{'=' * 60}")
    
    # Show sample of new talks
    print("\nSample of newly scraped talks:")
    for _, talk in new_talks_df.head(5).iterrows():
        print(f"  [{talk['year']} {talk['season']}] {talk['title']} - {talk['speaker']}")

if __name__ == "__main__":
    start = time.time()
    main()
    end = time.time()
    print(f"\nTotal time taken: {end - start:.2f} seconds")

