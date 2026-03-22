#!/usr/bin/env python3
"""
Quick scraper to generate conference_talks_cleaned.csv for the web app.
Run: python scrape_data.py
Output: conference-app/public/conference_talks_cleaned.csv
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
import re
import unicodedata
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

def get_soup(url):
    try:
        r = requests.get(url, allow_redirects=True, timeout=30)
        r.raise_for_status()
        return BeautifulSoup(r.content, "html.parser")
    except Exception as e:
        print(f"  Error fetching {url}: {e}")
        return None

def scrape_conference_pages(main_url):
    soup = get_soup(main_url)
    if not soup:
        return []

    all_links = []
    links = [
        "https://www.churchofjesuschrist.org" + a["href"]
        for a in soup.find_all("a", href=True)
        if re.search(r"/study/general-conference/(\d{4}/(04|10)|\d{4}\d{4})", a["href"])
    ]

    for link in links:
        if re.search(r"/study/general-conference/\d{4}\d{4}", link):
            # Decade page
            decade_soup = get_soup(link)
            if decade_soup:
                year_links = [
                    "https://www.churchofjesuschrist.org" + a["href"]
                    for a in decade_soup.find_all("a", href=True)
                    if re.search(r"/study/general-conference/\d{4}/(04|10)", a["href"])
                ]
                all_links.extend(year_links)
        else:
            all_links.append(link)

    # Deduplicate
    all_links = list(dict.fromkeys(all_links))
    print(f"Found {len(all_links)} conference pages")
    return all_links

def scrape_talk_urls(conference_url):
    soup = get_soup(conference_url)
    if not soup:
        return []

    talk_links = [
        "https://www.churchofjesuschrist.org" + a["href"]
        for a in soup.find_all("a", href=True)
        if re.search(r"/study/general-conference/\d{4}/(04|10)/[\w-]+", a["href"])
        and not a["href"].endswith("session?lang=eng")
    ]
    return list(set(talk_links))

def scrape_talk(url):
    try:
        soup = get_soup(url)
        if not soup:
            return None

        title_tag = soup.find("h1", {"id": "title1"}) or soup.find("h1")
        title = title_tag.text.strip() if title_tag else "No Title Found"

        author_tag = soup.find("p", {"class": "author-name"})
        speaker = author_tag.text.strip() if author_tag else "No Speaker Found"

        calling_tag = soup.find("p", {"class": "author-role"})
        calling = calling_tag.text.strip() if calling_tag else "No Calling Found"

        content_div = soup.find("div", {"class": "body-block"})
        content = "\n\n".join(p.text.strip() for p in content_div.find_all("p")) if content_div else ""

        footnotes_list = soup.find_all("li", {"class": "study-note"})
        footnotes = "\n".join(f"{i+1}. {n.text.strip()}" for i, n in enumerate(footnotes_list)) if footnotes_list else ""

        year = re.search(r'/(\d{4})/', url).group(1)
        season = "April" if "/04/" in url else "October"

        # Clean speaker name
        speaker = re.sub(r'\b(By\s+)?(Elder|President|Sister|Brother)\s+', '', speaker, flags=re.IGNORECASE).strip()

        return {
            "title": title, "speaker": speaker, "calling": calling,
            "calling_original": calling,
            "year": int(year), "season": season, "url": url,
            "talk": content, "footnotes": footnotes,
        }
    except Exception as e:
        print(f"  Failed: {url} - {e}")
        return None

def main():
    print("=" * 60)
    print("GeneralConference.App - Data Scraper")
    print("=" * 60)

    start = time.time()
    main_url = "https://www.churchofjesuschrist.org/study/general-conference?lang=eng"

    print("\n[1/3] Finding conference pages...")
    conference_urls = scrape_conference_pages(main_url)

    print("\n[2/3] Finding talk URLs...")
    all_talk_urls = []
    for i, conf_url in enumerate(conference_urls):
        urls = scrape_talk_urls(conf_url)
        all_talk_urls.extend(urls)
        if (i + 1) % 10 == 0:
            print(f"  Processed {i+1}/{len(conference_urls)} conferences ({len(all_talk_urls)} talks found)")

    all_talk_urls = list(set(all_talk_urls))
    print(f"  Total unique talk URLs: {len(all_talk_urls)}")

    print("\n[3/3] Scraping talks (parallel)...")
    talks = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(scrape_talk, url): url for url in all_talk_urls}
        done = 0
        for future in as_completed(futures):
            done += 1
            result = future.result()
            if result:
                talks.append(result)
            if done % 100 == 0:
                print(f"  Scraped {done}/{len(all_talk_urls)} talks ({len(talks)} successful)")

    print(f"\n  Total talks scraped: {len(talks)}")

    # Create DataFrame and clean
    df = pd.DataFrame(talks)

    # Remove auditing/presented rows
    df = df[~df['calling'].str.contains("Church Auditing", na=False)]
    df = df[~df['speaker'].str.contains("Presented by", na=False)]
    df = df[df['speaker'] != 'No Speaker Found']
    df = df[~df['title'].str.contains(r'morning|afternoon|evening', case=False, na=False)]

    # Normalize unicode
    for col in df.columns:
        df[col] = df[col].apply(lambda x: unicodedata.normalize("NFC", x) if isinstance(x, str) else x)

    # Sort
    df = df.sort_values(['year', 'season'])

    # Save
    output = "conference-app/public/conference_talks_cleaned.csv"
    df.to_csv(output, index=False)

    elapsed = time.time() - start
    print(f"\n{'=' * 60}")
    print(f"Done! {len(df)} talks saved to {output}")
    print(f"Year range: {df['year'].min()} - {df['year'].max()}")
    print(f"Unique speakers: {df['speaker'].nunique()}")
    print(f"Time: {elapsed:.0f}s")
    print(f"{'=' * 60}")

if __name__ == "__main__":
    main()
