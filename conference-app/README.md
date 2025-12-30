# Scripture General Conference Analysis App

A comprehensive Next.js application for analyzing LDS General Conference talks from 1971 to present. Built with Next.js, TypeScript, shadcn/ui, and Recharts.

## Features

### 📖 Scriptures
Search for conference talks that reference specific scriptures by volume, book, chapter, and verse.

### 🔍 Word Search
Advanced Boolean search with ANY, ALL, and NONE operators to find talks containing specific words.

### 💬 Phrase Search
Find talks containing exact phrases with detailed statistics and visualizations.

### 👥 Speakers
View comprehensive information about individual speakers, including all their talks and scripture reference patterns.

### 📅 Conferences
Explore statistics and talk lists for specific conference sessions.

### 📝 Talks
Detailed analysis of individual talks with scripture breakdowns.

### 📊 Overall Statistics
View comprehensive statistics across all talks or filter by specific eras.

### 🔧 Filters
Refine searches by:
- Speaker (Presidents, Living Prophets, or custom list)
- Conference
- Era (from Joseph Fielding Smith to present)
- Year range

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Navigate to the app directory:
```bash
cd conference-app
```

2. Install dependencies (already done if you followed the creation process):
```bash
npm install
```

3. Ensure the CSV data file is in the `public` folder:
- The file `conference_talks_cleaned.csv` should be in `public/conference_talks_cleaned.csv`

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Building for Production

```bash
npm run build
npm start
```

## Technology Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui
- **Charts:** Recharts
- **Icons:** Lucide React
- **Data Parsing:** PapaParse

## Project Structure

```
conference-app/
├── app/                      # Next.js app directory
│   ├── conferences/          # Conferences page
│   ├── filters/              # Filters configuration
│   ├── overall/              # Overall statistics
│   ├── phrase-search/        # Phrase search
│   ├── scriptures/           # Scripture search
│   ├── speakers/             # Speakers page
│   ├── talks/                # Individual talks
│   ├── word-search/          # Word search
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   └── globals.css           # Global styles
├── components/               # React components
│   ├── ui/                   # shadcn/ui components
│   ├── navigation.tsx        # Sidebar navigation
│   └── search-results.tsx    # Reusable search results display
├── lib/                      # Utility functions
│   ├── data-loader.ts        # CSV data loading and parsing
│   ├── filter-context.tsx    # Global filter state management
│   ├── search-utils.ts       # Search and filtering logic
│   ├── types.ts              # TypeScript type definitions
│   └── utils.ts              # General utilities
└── public/                   # Static assets
    └── conference_talks_cleaned.csv  # Talk data
```

## Data Format

The CSV file should contain the following columns:
- `title` - Talk title
- `speaker` - Speaker name
- `calling` - Speaker's calling/position
- `year` - Year of the talk
- `season` - Season (April or October)
- `url` - URL to the talk
- `talk` - Full talk text
- `footnotes` - Talk footnotes
- `calling_original` - Original calling designation

## Eras Covered

- **Oaks Era:** 2026-present
- **Nelson Era:** 2018-2025
- **Monson Era:** 2008-2017
- **Hinckley Era:** 1995-2007
- **Hunter Era:** October 1994
- **Benson Era:** 1986-April 1994
- **Kimball Era:** 1974-1985
- **Lee Era:** October 1972-1973
- **Smith Era:** 1971-April 1972

## Features in Detail

### Search Capabilities
- **Word Search:** Boolean logic with ANY (OR), ALL (AND), and NONE (NOT) operators
- **Phrase Search:** Find exact phrases with frequency analysis
- **Scripture Search:** Search by volume, book, chapter, and verse ranges
- **Scope Options:** Search in full talk text or titles only

### Statistics & Visualizations
- Talk counts and trends over time
- Speaker statistics and rankings
- Conference breakdowns
- Era comparisons
- Scripture volume distributions
- Interactive charts and graphs

### Filtering
- Filter by speaker groups (Presidents, Living Prophets, custom)
- Filter by specific conferences
- Filter by Church leadership eras
- Filter by custom year ranges
- Filters apply to Scriptures, Word Search, and Phrase Search

## Contributing

This is a personal project for analyzing General Conference talks. Feel free to fork and modify for your own use.

## License

This project is provided as-is for educational and personal use.

## Acknowledgments

- Data sourced from The Church of Jesus Christ of Latter-day Saints General Conference talks
- Built with modern web technologies for optimal performance and user experience
