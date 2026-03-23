"""
Scrape Journal of Discourses talks from scriptures.byu.edu
Covers 1851-1886 era conference addresses.

Output format matches historical_talks.csv:
title,speaker,calling,calling_original,year,season,url,talk,footnotes
"""

import csv
import re
import time
import sys
import os
import requests
from html.parser import HTMLParser

BASE_URL = "https://scriptures.byu.edu"


class TalkTextExtractor(HTMLParser):
    """Extract clean text from BYU talk HTML."""
    def __init__(self):
        super().__init__()
        self.text_parts = []
        self.skip = False
        self.in_discourse_body = False
        self.in_discourse_header = False
        self.current_field = None
        self.metadata = {}

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        cls = attrs_dict.get('class', '')

        if 'discourseHeader' in cls:
            self.in_discourse_header = True
        elif 'discourseBody' in cls:
            self.in_discourse_body = True
            self.in_discourse_header = False
        elif self.in_discourse_header:
            if 'title' in cls and 'talktitle' not in cls and 'subtitle' not in cls:
                self.current_field = 'title'
            elif 'subtitle' in cls:
                self.current_field = 'subtitle'
            elif 'speaker' in cls:
                self.current_field = 'speaker'
            elif 'date' in cls:
                self.current_field = 'date'
            elif 'reportedBy' in cls:
                self.current_field = 'reportedBy'

        # Skip citation markers and page breaks
        if 'citation' in cls or 'break' in cls:
            self.skip = True
        if tag == 'a':
            self.skip = True

    def handle_endtag(self, tag):
        if tag == 'div':
            if self.current_field:
                self.current_field = None
            self.skip = False
        if tag == 'a':
            self.skip = False
        if tag == 'span':
            self.skip = False

    def handle_data(self, data):
        if self.current_field and self.in_discourse_header:
            # Extract metadata
            text = data.strip()
            if text:
                field = self.current_field
                if field == 'speaker' and text.startswith('Speaker: '):
                    text = text[9:]
                elif field == 'date' and text.startswith('Date: '):
                    text = text[6:]
                elif field == 'reportedBy' and text.startswith('Reported By: '):
                    text = text[13:]
                self.metadata[field] = text
        elif self.in_discourse_body and not self.skip:
            text = data.strip()
            if text:
                self.text_parts.append(text)

    def get_text(self):
        return ' '.join(self.text_parts)

    def get_metadata(self):
        return self.metadata


def parse_date(date_str):
    """Parse date string like '1/16/1853' into year and season."""
    if not date_str:
        return None, None

    match = re.search(r'(\d{1,2})/(\d{1,2})/(\d{4})', date_str)
    if match:
        month = int(match.group(1))
        year = int(match.group(3))
        # April conference = months 3-6, October = months 7-12, 1-2
        if 3 <= month <= 6:
            season = 'April'
        elif month >= 7 or month <= 2:
            season = 'October'
        else:
            season = 'April'
        return year, season

    # Try to extract just a year
    match = re.search(r'(\d{4})', date_str)
    if match:
        return int(match.group(1)), None

    return None, None


def get_volume_talks(vol_num):
    """Get list of talk IDs and basic info from a JoD volume."""
    url = f"{BASE_URL}/citation_index/jod_ajax/{vol_num}"
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()

    talks = []
    # Pattern: getTalk('10001')
    for match in re.finditer(r"getTalk\('(\d+)'\)", resp.text):
        talk_id = match.group(1)
        talks.append(talk_id)

    return talks


def get_talk_content(talk_id):
    """Fetch and parse a single talk."""
    url = f"{BASE_URL}/content/talks_ajax/{talk_id}"
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()

    parser = TalkTextExtractor()
    parser.feed(resp.text)

    metadata = parser.get_metadata()
    text = parser.get_text()

    # Clean up text
    text = re.sub(r'\s+', ' ', text).strip()
    # Remove hyphenation artifacts
    text = text.replace('- ', '')

    return {
        'title': metadata.get('title', ''),
        'speaker': metadata.get('speaker', ''),
        'subtitle': metadata.get('subtitle', ''),
        'date': metadata.get('date', ''),
        'reported_by': metadata.get('reportedBy', ''),
        'text': text,
        'talk_id': talk_id,
    }


def main():
    output_file = os.path.join(os.path.dirname(__file__), '..',
                                'conference-app', 'public', 'jod_talks.csv')

    # Check for resume
    existing_ids = set()
    if os.path.exists(output_file):
        with open(output_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                existing_ids.add(row.get('url', '').split('/')[-1])
        print(f"Resuming — {len(existing_ids)} talks already scraped")

    mode = 'a' if existing_ids else 'w'

    with open(output_file, mode, newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        if not existing_ids:
            writer.writerow(['title', 'speaker', 'calling', 'calling_original',
                           'year', 'season', 'url', 'talk', 'footnotes'])

        total_scraped = len(existing_ids)

        for vol in range(1, 27):
            print(f"\n=== Volume {vol} ===")
            talk_ids = get_volume_talks(vol)
            print(f"  {len(talk_ids)} talks found")

            for talk_id in talk_ids:
                if talk_id in existing_ids:
                    continue

                try:
                    talk = get_talk_content(talk_id)
                    year, season = parse_date(talk['date'])

                    if not year:
                        # Try to extract from subtitle
                        if talk['subtitle']:
                            match = re.search(r'(\d{4})', talk['subtitle'])
                            if match:
                                year = int(match.group(1))

                    url = f"https://scriptures.byu.edu/#/jod/{talk_id}"

                    writer.writerow([
                        talk['title'],
                        talk['speaker'],
                        '',  # calling — JoD doesn't have standard callings
                        '',  # calling_original
                        year or '',
                        season or '',
                        url,
                        talk['text'],
                        '',  # footnotes
                    ])
                    f.flush()

                    total_scraped += 1
                    print(f"  [{total_scraped}] {talk['speaker']}: {talk['title'][:50]}... ({year})")

                    # Be polite — 0.5s between requests
                    time.sleep(0.5)

                except Exception as e:
                    print(f"  ERROR on talk {talk_id}: {e}")
                    time.sleep(2)

    print(f"\nDone! {total_scraped} talks saved to {output_file}")


if __name__ == '__main__':
    main()
