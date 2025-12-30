import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CODE_EXECUTOR_URL = process.env.CODE_EXECUTOR_URL || 'http://localhost:5001';

const SYSTEM_PROMPT = `You are a data analysis assistant for a General Conference talks dataset. 

DATASET SCHEMA:
- title: Talk title (string)
- speaker: Speaker name (string)
- calling: Speaker calling/position (string)
- year: Year of conference (integer, 1971-2025)
- season: Season (string: "April" or "October")
- url: URL to talk (string)
- talk: Full text of the talk (string, can be very long)
- footnotes: Footnotes text (string)
- calling_original: Original calling text (string)
- topics: JSON array of topic labels from NLP (parse with json.loads)
- topic_scores: JSON array of topic confidence scores (parse with json.loads)
- primary_topic: Top topic (string)
- primary_topic_score: Confidence score for top topic (float 0-1)
- emotions: JSON array of emotion labels from NLP (parse with json.loads)
- emotion_scores: JSON array of emotion confidence scores (parse with json.loads)
- primary_emotion: Top emotion (string)
- primary_emotion_score: Confidence score for top emotion (float 0-1)
- all_emotion_scores: JSON object with all 28 emotion scores (parse with json.loads)

AVAILABLE VARIABLES:
- df: pandas DataFrame with all the talks data
- pd: pandas library
- json: json library
- plt: matplotlib.pyplot (for charts)

YOUR TASK:
1. Analyze the user's question
2. Write Python code to answer it using pandas
3. Store the final result in a variable called 'result'
4. If visualization is helpful, create matplotlib plots

CODE REQUIREMENTS:
- Use 'df' to access the talks data
- Parse JSON columns with: json.loads(value) if pd.notna(value) else []
- Store your final answer in 'result' variable
- For DataFrames, limit to top 20 rows: result = df.head(20)
- Use print() to show intermediate steps
- Create matplotlib plots if visualization would help

EXAMPLE 1 - Count talks by speaker:
\`\`\`python
result = df['speaker'].value_counts().head(10)
print("Top 10 speakers by talk count:")
print(result)
\`\`\`

EXAMPLE 2 - Talks about "faith" over time:
\`\`\`python
import json

# Filter talks containing "faith"
faith_talks = df[df['talk'].str.contains('faith', case=False, na=False)]

# Group by year
result = faith_talks.groupby('year').size().reset_index(name='count')
result = result.sort_values('year')

print(f"Found {len(faith_talks)} talks mentioning 'faith'")
\`\`\`

EXAMPLE 3 - Most common emotions:
\`\`\`python
import json

# Parse emotions from JSON
all_emotions = []
for emotions_str in df['emotions'].dropna():
    try:
        emotions = json.loads(emotions_str)
        all_emotions.extend(emotions)
    except:
        pass

# Count them
from collections import Counter
emotion_counts = Counter(all_emotions)
result = dict(emotion_counts.most_common(10))

print(f"Total emotions found: {len(all_emotions)}")
print("Top 10 emotions:")
for emotion, count in result.items():
    print(f"  {emotion}: {count}")
\`\`\`

Now answer the user's question by writing Python code.`;

export async function POST(request: Request) {
  try {
    const { question, conversationHistory } = await request.json();

    if (!question) {
      return NextResponse.json({ error: 'No question provided' }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // Build context from recent conversation
    let contextText = '';
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-2); // Last 2 exchanges
      contextText = '\n\nRECENT CONVERSATION CONTEXT:\n';
      recentHistory.forEach((msg: any) => {
        const roleLabel = msg.role === 'assistant' ? 'Previous Response' : 'Previous Question';
        contextText += `${roleLabel}: ${msg.parts[0].text.substring(0, 500)}\n`;
      });
      contextText += '\n';
    }

    // Call Gemini API with simplified single-turn approach
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${SYSTEM_PROMPT}\n\n${contextText}Current Question: ${question}\n\nProvide ONLY the Python code to answer this question. Do not include markdown formatting, explanations, or comments - just the raw Python code.` }]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
          }
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return NextResponse.json({ error: 'Failed to get response from Gemini' }, { status: 500 });
    }

    const geminiData = await geminiResponse.json();
    const aiResponse = geminiData.candidates[0]?.content?.parts[0]?.text || '';

    // Extract Python code from response
    let code = aiResponse;
    
    // Try multiple extraction patterns for markdown code blocks
    const patterns = [
      /```python\n([\s\S]*?)\n```/,           // ```python\ncode\n```
      /```python\r?\n([\s\S]*?)\r?\n```/,     // Handle different line endings
      /```\n([\s\S]*?)\n```/,                 // ```\ncode\n```
      /```python([\s\S]*?)```/,               // ```pythoncode``` (no newline)
      /```([\s\S]*?)```/,                     // ```code``` (no language)
    ];
    
    for (const pattern of patterns) {
      const match = aiResponse.match(pattern);
      if (match && match[1]) {
        code = match[1].trim();
        break;
      }
    }
    
    // If still has backticks at start/end, remove them
    code = code.replace(/^```python\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();

    // Execute code
    const execResponse = await fetch(`${CODE_EXECUTOR_URL}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!execResponse.ok) {
      return NextResponse.json({ error: 'Failed to execute code' }, { status: 500 });
    }

    const execResult = await execResponse.json();

    // Return everything
    return NextResponse.json({
      question,
      code,
      aiResponse,
      execution: execResult,
    });

  } catch (error: any) {
    console.error('Error in ask API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

