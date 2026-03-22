import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import Papa from 'papaparse';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface Talk {
  title: string;
  speaker: string;
  calling: string;
  year: string;
  season: string;
  primary_topic?: string;
  primary_emotion?: string;
  talk?: string;
}

let cachedTalks: Talk[] | null = null;
let cachedSummary: string | null = null;

function loadTalksServer(): Talk[] {
  if (cachedTalks) return cachedTalks;
  try {
    const csvPath = join(process.cwd(), 'public', 'conference_talks_cleaned.csv');
    const csvText = readFileSync(csvPath, 'utf-8');
    const result = Papa.parse<Talk>(csvText, { header: true, skipEmptyLines: true });
    cachedTalks = result.data;
    return cachedTalks;
  } catch {
    return [];
  }
}

function buildDataSummary(talks: Talk[]): string {
  if (cachedSummary) return cachedSummary;

  const speakers = [...new Set(talks.map(t => t.speaker))].sort();
  const topics = new Map<string, number>();
  const emotions = new Map<string, number>();
  talks.forEach(t => {
    if (t.primary_topic) topics.set(t.primary_topic, (topics.get(t.primary_topic) || 0) + 1);
    if (t.primary_emotion) emotions.set(t.primary_emotion, (emotions.get(t.primary_emotion) || 0) + 1);
  });

  const years = talks.map(t => Number(t.year)).filter(Boolean);

  cachedSummary = `Dataset: ${talks.length} General Conference talks (${Math.min(...years)}-${Math.max(...years)})
Unique speakers: ${speakers.length}
Speaker list: ${speakers.join(', ')}

Top topics (by frequency):
${Array.from(topics.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([t, c]) => `  ${t}: ${c} talks`).join('\n')}

Top emotions:
${Array.from(emotions.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([e, c]) => `  ${e}: ${c} talks`).join('\n')}

Fields per talk: title, speaker, calling, year, season, url, talk (full text), footnotes, primary_topic, primary_topic_score, primary_emotion, primary_emotion_score`;

  return cachedSummary;
}

function findRelevantTalks(talks: Talk[], message: string): Talk[] {
  const lowerMsg = message.toLowerCase();
  let filtered = talks;

  // Filter by speaker name mentions
  const speakers = [...new Set(talks.map(t => t.speaker))];
  const mentionedSpeakers = speakers.filter(s =>
    lowerMsg.includes(s.toLowerCase()) || lowerMsg.includes(s.split(' ').pop()?.toLowerCase() || '')
  );
  if (mentionedSpeakers.length > 0) {
    filtered = filtered.filter(t => mentionedSpeakers.includes(t.speaker));
  }

  // Filter by year mentions
  const yearMatch = message.match(/\b(19[7-9]\d|20[0-2]\d)\b/g);
  if (yearMatch) {
    const years = yearMatch.map(Number);
    filtered = filtered.filter(t => years.includes(Number(t.year)));
  }

  // Filter by topic mentions
  const topics = [...new Set(talks.map(t => t.primary_topic).filter(Boolean))];
  const mentionedTopics = topics.filter(t => t && lowerMsg.includes(t.toLowerCase()));
  if (mentionedTopics.length > 0) {
    filtered = filtered.filter(t => mentionedTopics.includes(t.primary_topic));
  }

  // If no specific filter matched, take a random sample
  if (filtered.length === talks.length) {
    filtered = filtered.sort(() => Math.random() - 0.5);
  }

  return filtered.slice(0, 50);
}

const SYSTEM_PROMPT = `You are an expert analyst of LDS General Conference talks. You have access to a comprehensive dataset of conference talks from 1971 to present.

When answering questions:
- Be specific and cite actual data (speaker names, years, talk titles)
- Use numbers and statistics when relevant
- Compare and contrast when asked about multiple speakers or topics
- Be engaging and insightful, not just listing facts
- When you reference a specific talk, include the speaker, title, and year

You are provided with a summary of the full dataset and relevant talk excerpts based on the user's question.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const talks = loadTalksServer();
    const summary = buildDataSummary(talks);
    const userMessage = messages[messages.length - 1]?.content || '';
    const relevantTalks = findRelevantTalks(talks, userMessage);

    const talkContext = relevantTalks.map(t =>
      `[${t.speaker} - "${t.title}" (${t.season} ${t.year}) | Topic: ${t.primary_topic || 'N/A'} | Emotion: ${t.primary_emotion || 'N/A'}]\n${(t.talk || '').substring(0, 300)}...`
    ).join('\n\n');

    const systemPrompt = `${SYSTEM_PROMPT}\n\n--- DATASET SUMMARY ---\n${summary}\n\n--- RELEVANT TALKS ---\n${talkContext}`;

    const anthropicMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: anthropicMessages,
      stream: true,
    });

    // Stream the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const event of response) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
