#!/usr/bin/env python3
"""Build the complete conference scraper notebook for Google Colab."""

import json

# Read the scraping functions from conferencescraper.py
with open('conferencescraper.py', 'r') as f:
    scraper_code = f.read()

# Read the cleaning functions from clean_dataset.py
with open('clean_dataset.py', 'r') as f:
    cleaner_code = f.read()

# Define all cells
cells = [
    # Title
    {
        "cell_type": "markdown",
        "metadata": {},
        "source": [
            "# LDS General Conference Scraper (Updated 2024)\n\n",
            "This notebook scrapes and cleans LDS General Conference talks from the official Church website.\n\n",
            "## Features:\n",
            "- ✅ **Updated HTML parser** - Works with October 2024+ new website structure\n",
            "- ✅ **Comprehensive cleaning** - Standardizes 102+ calling variations → 46 standard categories\n",
            "- ✅ **Parallel scraping** - Fast multi-threaded scraping\n",
            "- ✅ **Data quality checks** - Removes irrelevant entries\n",
            "- ✅ **Ready for analysis** - Exports clean CSV file\n\n",
            "---\n\n",
            "## Instructions:\n",
            "1. Click **Runtime → Run all** to scrape and clean all conferences\n",
            "2. Or run cells individually for step-by-step control\n",
            "3. Download the final `conference_talks_cleaned.csv` file when complete\n\n",
            "**Estimated time**: 10-15 minutes for full scrape (1971-2025)"
        ]
    },
    
    # Install libraries
    {
        "cell_type": "markdown",
        "metadata": {},
        "source": ["## Step 1: Install Required Libraries"]
    },
    {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [
            "%pip install requests beautifulsoup4 pandas tqdm html5lib -q\n",
            "print(\"✅ All libraries installed successfully!\")"
        ]
    },
    
    # Import libraries
    {
        "cell_type": "markdown",
        "metadata": {},
        "source": ["## Step 2: Import Libraries and Setup"]
    },
    {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [
            "import requests\n",
            "from bs4 import BeautifulSoup\n",
            "import pandas as pd\n",
            "import re\n",
            "import unicodedata\n",
            "import time\n",
            "from tqdm import tqdm\n",
            "from concurrent.futures import ThreadPoolExecutor\n",
            "from datetime import datetime\n\n",
            "print(f\"✅ Setup complete! Starting scrape at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\")"
        ]
    },
    
    # Scraping functions
    {
        "cell_type": "markdown",
        "metadata": {},
        "source": [
            "## Step 3: Scraping Functions (Updated for 2024+)\n\n",
            "These functions have been updated to handle the new HTML structure used from October 2024 onwards."
        ]
    },
    {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [
            "def get_soup(url):\n",
            "    \"\"\"Create a tree structure (BeautifulSoup) out of a GET request's HTML.\"\"\"\n",
            "    try:\n",
            "        r = requests.get(url, allow_redirects=True)\n",
            "        r.raise_for_status()\n",
            "        return BeautifulSoup(r.content, \"html5lib\")\n",
            "    except requests.RequestException as e:\n",
            "        print(f\"Error fetching {url}: {e}\")\n",
            "        return None\n\n",
            "def is_decade_page(url):\n",
            "    \"\"\"Check if a page is a decade selection page.\"\"\"\n",
            "    return bool(re.search(r\"/study/general-conference/\\d{4}\\d{4}\", url))\n\n",
            "def scrape_conference_pages(main_page_url):\n",
            "    \"\"\"Retrieve a list of URLs for each conference (year/month) from the main page.\"\"\"\n",
            "    soup = get_soup(main_page_url)\n",
            "    if soup is None:\n",
            "        print(f\"Failed to fetch content from {main_page_url}\")\n",
            "        return []\n",
            "    \n",
            "    all_conference_links = []\n",
            "    links = [\n",
            "        \"https://www.churchofjesuschrist.org\" + a[\"href\"]\n",
            "        for a in soup.find_all(\"a\", href=True)\n",
            "        if re.search(r\"/study/general-conference/(\\d{4}/(04|10)|\\d{4}\\d{4})\", a[\"href\"])\n",
            "    ]\n",
            "    \n",
            "    for link in tqdm(links, desc=\"Fetching conference pages\"):\n",
            "        if is_decade_page(link):\n",
            "            decade_soup = get_soup(link)\n",
            "            if decade_soup:\n",
            "                year_links = [\n",
            "                    \"https://www.churchofjesuschrist.org\" + a[\"href\"]\n",
            "                    for a in decade_soup.find_all(\"a\", href=True)\n",
            "                    if re.search(r\"/study/general-conference/\\d{4}/(04|10)\", a[\"href\"])\n",
            "                ]\n",
            "                all_conference_links.extend(year_links)\n",
            "        else:\n",
            "            all_conference_links.append(link)\n",
            "    \n",
            "    print(f\"\\n✅ Found {len(all_conference_links)} conference links\")\n",
            "    return all_conference_links\n\n",
            "def scrape_talk_urls(conference_url):\n",
            "    \"\"\"Retrieve a list of URLs for each talk in a specific conference.\"\"\"\n",
            "    soup = get_soup(conference_url)\n",
            "    if soup is None:\n",
            "        return []\n",
            "    \n",
            "    talk_links = [\n",
            "        \"https://www.churchofjesuschrist.org\" + a[\"href\"]\n",
            "        for a in soup.find_all(\"a\", href=True)\n",
            "        if re.search(r\"/study/general-conference/\\d{4}/(04|10)/.*\", a[\"href\"])\n",
            "    ]\n",
            "    \n",
            "    talk_links = list(set(talk_links))\n",
            "    talk_links = [link for link in talk_links if not link.endswith(\"session?lang=eng\")]\n",
            "    return talk_links\n\n",
            "def scrape_talk_data(url):\n",
            "    \"\"\"Scrapes a single talk - UPDATED for Oct 2024+ structure.\"\"\"\n",
            "    try:\n",
            "        soup = get_soup(url)\n",
            "        if soup is None:\n",
            "            return {}\n",
            "        \n",
            "        # UPDATED: Try old structure first, then fallback to new\n",
            "        title_tag = soup.find(\"h1\", {\"id\": \"title1\"})\n",
            "        if not title_tag:\n",
            "            title_tag = soup.find(\"h1\")  # New structure\n",
            "        title = title_tag.text.strip() if title_tag else \"No Title Found\"\n",
            "        \n",
            "        conference_tag = soup.find(\"p\", {\"class\": \"subtitle\"})\n",
            "        conference = conference_tag.text.strip() if conference_tag else \"No Conference Found\"\n",
            "        \n",
            "        author_tag = soup.find(\"p\", {\"class\": \"author-name\"})\n",
            "        speaker = author_tag.text.strip() if author_tag else \"No Speaker Found\"\n",
            "        \n",
            "        calling_tag = soup.find(\"p\", {\"class\": \"author-role\"})\n",
            "        calling = calling_tag.text.strip() if calling_tag else \"No Calling Found\"\n",
            "        \n",
            "        content_array = soup.find(\"div\", {\"class\": \"body-block\"})\n",
            "        content = \"\\n\\n\".join(p.text.strip() for p in content_array.find_all(\"p\")) if content_array else \"No Content Found\"\n",
            "        \n",
            "        footnotes = \"\\n\".join(\n",
            "            f\"{idx}. {note.text.strip()}\" for idx, note in enumerate(soup.find_all(\"li\", {\"class\": \"study-note\"}), start=1)\n",
            "        ) if soup.find_all(\"li\", {\"class\": \"study-note\"}) else \"No Footnotes Found\"\n",
            "        \n",
            "        year = re.search(r'/(\\d{4})/', url).group(1)\n",
            "        season = \"April\" if \"/04/\" in url else \"October\"\n",
            "        \n",
            "        return {\n",
            "            \"title\": title,\n",
            "            \"speaker\": speaker,\n",
            "            \"calling\": calling,\n",
            "            \"year\": year,\n",
            "            \"season\": season,\n",
            "            \"url\": url,\n",
            "            \"talk\": content,\n",
            "            \"footnotes\": footnotes,\n",
            "        }\n",
            "    except Exception as e:\n",
            "        print(f\"Failed to scrape {url}: {e}\")\n",
            "        return {}\n\n",
            "def scrape_talk_data_parallel(urls, max_workers=10):\n",
            "    \"\"\"Scrapes all talks in parallel.\"\"\"\n",
            "    with ThreadPoolExecutor(max_workers=max_workers) as executor:\n",
            "        results = list(tqdm(executor.map(scrape_talk_data, urls), total=len(urls), desc=\"Scraping talks\"))\n",
            "    return [result for result in results if result]\n\n",
            "print(\"✅ Scraping functions loaded!\")"
        ]
    },
    
    # Continue in next script section...
]

print(f"Created {len(cells)} cells so far...")
print("Creating full notebook...")

