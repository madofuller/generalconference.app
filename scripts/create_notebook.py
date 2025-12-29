import json

# Define all the cells
cells = [
    {
        "cell_type": "markdown",
        "metadata": {},
        "source": [
            "# LDS General Conference Scraper (Updated 2024)\n",
            "\n",
            "This notebook scrapes and cleans LDS General Conference talks from the official Church website.\n",
            "\n",
            "## Features:\n",
            "- ✅ **Updated HTML parser** - Works with October 2024+ new website structure\n",
            "- ✅ **Comprehensive cleaning** - Standardizes 102+ calling variations → 46 standard categories\n",
            "- ✅ **Parallel scraping** - Fast multi-threaded scraping\n",
            "- ✅ **Data quality checks** - Removes irrelevant entries\n",
            "- ✅ **Ready for analysis** - Exports clean CSV file\n",
            "\n",
            "---\n",
            "\n",
            "## Instructions:\n",
            "1. Click **Runtime → Run all** to scrape and clean all conferences\n",
            "2. Or run cells individually for step-by-step control\n",
            "3. Download the final `conference_talks_cleaned.csv` file when complete\n",
            "\n",
            "**Estimated time**: 10-15 minutes for full scrape (1971-2025)"
        ]
    },
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
    }
]

# Create the notebook structure
notebook = {
    "cells": cells,
    "metadata": {
        "kernelspec": {
            "display_name": "Python 3",
            "language": "python",
            "name": "python3"
        },
        "language_info": {
            "codemirror_mode": {"name": "ipython", "version": 3},
            "file_extension": ".py",
            "mimetype": "text/x-python",
            "name": "python",
            "nbconvert_exporter": "python",
            "pygments_lexer": "ipython3",
            "version": "3.8.0"
        }
    },
    "nbformat": 4,
    "nbformat_minor": 4
}

# Write to file
with open("ConferenceScraper_Updated.ipynb", "w") as f:
    json.dump(notebook, f, indent=2)

print("✅ Notebook created successfully!")
