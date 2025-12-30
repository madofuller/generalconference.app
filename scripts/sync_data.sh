#!/bin/bash

# Script to sync the latest classified data to the Next.js public folder

PROJECT_DIR="/Users/lukejoneslwj/Downloads/conferencescraper"
SOURCE="$PROJECT_DIR/classification/conference_talks_with_emotions.csv"
DEST="$PROJECT_DIR/conference-app/public/conference_talks_cleaned.csv"

echo "🔄 Syncing classified data to Next.js app..."

if [ ! -f "$SOURCE" ]; then
    echo "❌ Error: Source file not found: $SOURCE"
    echo "   Run emotion classification first:"
    echo "   cd classification && python classify_emotions_fast.py"
    exit 1
fi

# Copy the file
cp "$SOURCE" "$DEST"

if [ $? -eq 0 ]; then
    echo "✅ Data synced successfully!"
    echo ""
    echo "📊 File details:"
    ls -lh "$DEST"
    echo ""
    echo "🔍 Columns available:"
    head -1 "$DEST" | tr ',' '\n' | nl
    echo ""
    echo "♻️  Restart Next.js to load new data:"
    echo "   general-conference restart"
else
    echo "❌ Error copying file"
    exit 1
fi

