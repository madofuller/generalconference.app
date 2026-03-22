'use client';

import { useState, useEffect, useRef } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Send, Loader2, Code, BarChart3, AlertCircle, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  code?: string;
  execution?: {
    success: boolean;
    output?: string;
    error?: any;
    data?: any;
    charts?: string[];
  };
}

export default function AskPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const exampleQuestions = [
    "Which speaker has given the most talks?",
    "How many talks mention 'faith' by year?",
    "What are the most common emotions in conference talks?",
    "Show me talks about the restoration in the 1970s",
    "Which topics are trending in recent conferences?",
    "Compare talk lengths between different eras",
  ];

  const handleSubmit = async (question?: string) => {
    const q = question || input;
    if (!q.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: q,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          conversationHistory: messages.slice(-4).map(m => ({
            role: m.role,
            parts: [{ text: m.content }]
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.aiResponse || 'Analysis complete!',
        code: data.code,
        execution: data.execution,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error.message}`,
        execution: {
          success: false,
          error: { message: error.message },
        },
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const renderData = (data: any) => {
    if (!data) return null;

    if (data.type === 'dataframe') {
      return (
        <div className="rounded-md border max-h-96 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {data.columns.map((col: string) => (
                  <TableHead key={col}>{col}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.slice(0, 50).map((row: any, idx: number) => (
                <TableRow key={idx}>
                  {data.columns.map((col: string) => (
                    <TableCell key={col}>{String(row[col] || '')}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data.data.length > 50 && (
            <div className="p-2 text-sm text-[#524534] text-center border-t">
              Showing first 50 of {data.data.length} rows
            </div>
          )}
        </div>
      );
    }

    if (data.type === 'series' || data.type === 'dict') {
      const entries = Object.entries(data.data);
      return (
        <div className="rounded-md border max-h-96 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(([key, value]: [string, any]) => (
                <TableRow key={key}>
                  <TableCell className="font-medium">{key}</TableCell>
                  <TableCell>{String(value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    if (data.type === 'list') {
      return (
        <div className="rounded-md border max-h-96 overflow-auto p-4">
          <ul className="space-y-1">
            {data.data.map((item: any, idx: number) => (
              <li key={idx} className="text-sm">
                • {String(item)}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    return (
      <div className="rounded-md border p-4 bg-muted">
        <pre className="text-sm whitespace-pre-wrap">{String(data.data)}</pre>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1 flex flex-col">
        <TopAppBar title="Ask AI" subtitle="AI-powered conference insights" />

        {messages.length === 0 && (
          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
                <CardDescription>
                  Ask questions in natural language and AI will write code to analyze the data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                        1
                      </div>
                      <h3 className="font-semibold">Ask</h3>
                    </div>
                    <p className="text-sm text-[#524534]">
                      Type your question in natural language
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        2
                      </div>
                      <h3 className="font-semibold">Analyze</h3>
                    </div>
                    <p className="text-sm text-[#524534]">
                      AI writes Python code to analyze the data
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                        3
                      </div>
                      <h3 className="font-semibold">Results</h3>
                    </div>
                    <p className="text-sm text-[#524534]">
                      Get answers with tables and charts
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Example Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2">
                  {exampleQuestions.map((q, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="justify-start h-auto py-3 px-4"
                      onClick={() => handleSubmit(q)}
                    >
                      <span className="text-left">{q}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {messages.length > 0 && (
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-6 pb-6">
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2 md:gap-4 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                      <Sparkles className="h-5 w-5" />
                    </div>
                  )}
                  
                  <div className={`flex-1 space-y-3 ${message.role === 'user' ? 'max-w-lg' : 'max-w-3xl'}`}>
                    {message.role === 'user' ? (
                      <div className="rounded-lg bg-[#1B5E7B] px-4 py-3 text-white">
                        <p>{message.content}</p>
                      </div>
                    ) : (
                      <>
                        {message.code && (
                          <Card>
                            <CardHeader className="pb-3">
                              <div className="flex items-center gap-2">
                                <Code className="h-4 w-4" />
                                <CardTitle className="text-sm">Generated Code</CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="rounded-md bg-black p-4 overflow-x-auto">
                                <pre className="text-sm text-white">
                                  <code>{message.code}</code>
                                </pre>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {message.execution && (
                          <Card>
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <BarChart3 className="h-4 w-4" />
                                  <CardTitle className="text-sm">Results</CardTitle>
                                </div>
                                {message.execution.success ? (
                                  <Badge variant="default" className="bg-green-500">Success</Badge>
                                ) : (
                                  <Badge variant="destructive">Error</Badge>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {message.execution.output && (
                                <div className="rounded-md bg-muted p-4">
                                  <pre className="text-sm whitespace-pre-wrap">
                                    {message.execution.output}
                                  </pre>
                                </div>
                              )}

                              {message.execution.data && renderData(message.execution.data)}

                              {message.execution.charts && message.execution.charts.length > 0 && (
                                <div className="space-y-4">
                                  {message.execution.charts.map((chart, cidx) => (
                                    <img
                                      key={cidx}
                                      src={`data:image/png;base64,${chart}`}
                                      alt={`Chart ${cidx + 1}`}
                                      className="rounded-lg border"
                                    />
                                  ))}
                                </div>
                              )}

                              {message.execution.error && (
                                <div className="rounded-md border border-red-200 bg-red-50 p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                    <span className="font-semibold text-red-900">Error</span>
                                  </div>
                                  <p className="text-sm text-red-800 mb-2">
                                    {message.execution.error.message}
                                  </p>
                                  {message.execution.error.traceback && (
                                    <details className="text-xs text-red-700">
                                      <summary className="cursor-pointer">Show traceback</summary>
                                      <pre className="mt-2 whitespace-pre-wrap">
                                        {message.execution.error.traceback}
                                      </pre>
                                    </details>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                      <span className="text-lg">👤</span>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                  <Card className="flex-1">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-sm text-[#524534]">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing your question...
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        <div className="border-t p-4">
          <div className="max-w-4xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about conference talks..."
                className="flex-1"
                disabled={loading}
              />
              <Button type="submit" disabled={loading || !input.trim()}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}



