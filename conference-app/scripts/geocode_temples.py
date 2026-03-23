"""Geocode temple locations from names and save to JSON."""
import csv
import json
import time
import urllib.request
import urllib.parse
import re
import sys

def clean_name(name):
    return re.sub(r'\s*\(edit\)\s*', '', name).replace(' Temple', '').strip()

def geocode(query, retries=2):
    """Use Nominatim to geocode a location."""
    url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(query)}&format=json&limit=1"
    headers = {'User-Agent': 'TempleMapApp/1.0'}
    req = urllib.request.Request(url, headers=headers)
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode())
                if data:
                    return float(data[0]['lat']), float(data[0]['lon'])
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(2)
    return None, None

# US state abbreviation map for better geocoding
US_STATES = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
    'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
    'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
    'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
    'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
    'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
    'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
    'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
    'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
    'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
    'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC',
}

CANADIAN_PROVINCES = {'Alberta', 'British Columbia', 'Manitoba', 'Ontario', 'Quebec', 'Saskatchewan'}

def build_query(name, region, country):
    """Build a geocoding query from temple info."""
    cleaned = clean_name(name)

    # For US temples, the name is usually "City State"
    for state in US_STATES:
        if cleaned.endswith(' ' + state):
            city = cleaned[:-len(state)-1]
            return f"{city}, {state}, USA"

    # Canadian provinces
    for prov in CANADIAN_PROVINCES:
        if cleaned.endswith(' ' + prov):
            city = cleaned[:-len(prov)-1]
            return f"{city}, {prov}, Canada"

    # For international, name typically is "City Country"
    if country and country != 'United States':
        return f"{cleaned}, {country}"

    # Fallback
    if region:
        return f"{cleaned}, {region}"

    return cleaned

def main():
    temples_file = 'conference-app/public/temples1.csv'
    output_file = 'conference-app/public/temple_coordinates.json'

    coords = {}

    with open(temples_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)  # skip header

        for row in reader:
            if len(row) < 7:
                continue
            num = row[1].strip()
            name = row[3].strip()
            region = row[4].strip()
            country = row[5].strip()
            status = row[2].strip()

            if not name or not num:
                continue

            cleaned = clean_name(name)
            query = build_query(name, region, country)

            print(f"[{num}] Geocoding: {cleaned} -> {query}...", end=' ', flush=True)
            lat, lon = geocode(query)

            if lat is None:
                # Try just the city name
                parts = cleaned.split()
                if len(parts) > 1:
                    city_only = ' '.join(parts[:-1])
                    print(f"retry with '{city_only}'...", end=' ', flush=True)
                    lat, lon = geocode(city_only)

            if lat is not None:
                coords[cleaned] = {'lat': lat, 'lon': lon, 'status': status, 'country': country, 'region': region}
                print(f"OK ({lat:.4f}, {lon:.4f})")
            else:
                print("FAILED")

            time.sleep(1.1)  # Nominatim rate limit: 1 req/sec

    with open(output_file, 'w') as f:
        json.dump(coords, f, indent=2)

    print(f"\nDone! Geocoded {len(coords)} temples. Saved to {output_file}")

if __name__ == '__main__':
    main()
