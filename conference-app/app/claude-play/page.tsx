'use client';

import { useState, useRef, useEffect } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const EXAMPLE_PROMPTS = [
  { icon: 'person_search', text: "What did President Nelson talk about most during his presidency?" },
  { icon: 'compare', text: "Compare the speaking styles of Elder Uchtdorf and Elder Bednar" },
  { icon: 'trending_up', text: "What are the biggest topic trends in the last decade?" },
  { icon: 'timer', text: "Which speakers give the longest talks?" },
  { icon: 'church', text: "Find talks about both temples and covenants" },
  { icon: 'mood', text: "What emotions are most common in conference talks?" },
  { icon: 'favorite', text: "Who speaks most about faith in Jesus Christ?" },
  { icon: 'family_restroom', text: "How has the topic of family changed over the decades?" },
];

export default function ClaudePlayPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: content.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to get response');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let assistantContent = '';
      setMessages([...newMessages, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantContent += parsed.content;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                  return updated;
                });
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Error: ${errorMessage}. Make sure your ANTHROPIC_API_KEY is set in .env.local` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-[calc(100vh)] flex flex-col w-full" style={{ background: '#fdf9e9' }}>
        <TopAppBar title="Ask Claude About Conference" subtitle="Your spiritual study companion" />

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-40">
          {messages.length === 0 ? (
            <div className="max-w-2xl mx-auto mt-16">
              {/* Empty state */}
              <div className="text-center mb-10">
                <div
                  className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                  style={{ background: 'linear-gradient(45deg, #1B5E7B, #f5a623)' }}
                >
                  <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    auto_awesome
                  </span>
                </div>
                <h2 className="text-xl md:text-3xl font-extrabold text-[#1c1c13] mb-2">Welcome, Friend.</h2>
                <p className="text-[#1c1c13]/60 text-base">
                  I've read every conference talk since 1971. What would you like to know?
                </p>
              </div>

              {/* Prompt suggestion grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {EXAMPLE_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt.text)}
                    className="bg-white hover:bg-[#f8f4e4] border border-[#d7c3ae]/10 rounded-xl p-5 text-left transition-all duration-200 group"
                  >
                    <span
                      className="material-symbols-outlined text-[#1B5E7B] mb-2 block text-xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {prompt.icon}
                    </span>
                    <span className="text-sm font-bold text-[#1c1c13]/80 group-hover:text-[#1B5E7B] transition-colors">
                      {prompt.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-5 pt-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                      style={{ background: 'linear-gradient(45deg, #1B5E7B, #f5a623)' }}
                    >
                      <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                        auto_awesome
                      </span>
                    </div>
                  )}
                  <div
                    className={
                      msg.role === 'user'
                        ? 'bg-[#f5a623] text-white p-4 rounded-xl rounded-br-none max-w-[75%]'
                        : 'bg-white p-6 rounded-xl rounded-tl-none max-w-[85%] shadow-[0px_12px_32px_rgba(27,94,123,0.04)]'
                    }
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-9 h-9 rounded-full bg-[#1B5E7B] flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-xs font-bold">ME</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(45deg, #1B5E7B, #f5a623)' }}
                  >
                    <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                      auto_awesome
                    </span>
                  </div>
                  <div className="bg-[#f8f4e4] rounded-full px-5 py-3 flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-[#1B5E7B]/40 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[#1B5E7B]/40 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[#1B5E7B]/40 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Fixed bottom input bar */}
        <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 pb-4 pt-3 px-4 md:px-8" style={{ background: 'linear-gradient(to top, #fdf9e9 80%, transparent)' }}>
          <div className="max-w-3xl mx-auto">
            <div className="bg-white border border-[#d7c3ae]/30 rounded-full shadow-[0px_8px_32px_rgba(27,94,123,0.08)] flex items-center px-5 py-2 gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about General Conference..."
                className="flex-1 resize-none bg-transparent text-sm text-[#1c1c13] placeholder:text-[#1c1c13]/40 focus:outline-none py-2"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-30"
                style={{ background: 'linear-gradient(45deg, #1B5E7B, #f5a623)' }}
              >
                <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  send
                </span>
              </button>
            </div>
            <p className="text-[10px] text-[#1c1c13]/40 text-center mt-2 font-medium">
              AI can make mistakes. Verify important cross-references.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
