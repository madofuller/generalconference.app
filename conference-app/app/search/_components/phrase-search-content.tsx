'use client';

import { useState, useEffect, useRef } from 'react';
import { useFilters, useFilteredFullTalks } from '@/lib/filter-context';
import { searchByPhrase } from '@/lib/search-utils';
import { SearchResult } from '@/lib/types';
import { SearchResults } from '@/components/search-results';

export function PhraseSearchContent() {
  const { filters } = useFilters();
  const { talks, loading } = useFilteredFullTalks();
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [phrase, setPhrase] = useState('');
  const [scope, setScope] = useState<'talk_text' | 'title'>('talk_text');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search - fires 400ms after user stops typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!phrase.trim() || phrase.trim().length < 2) {
      setSearchResult(null);
      return;
    }

    debounceRef.current = setTimeout(() => {
      setSearching(true);
      requestAnimationFrame(() => {
        const result = searchByPhrase(talks, phrase, scope, filters);
        setSearchResult(result);
        setSearching(false);
      });
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [phrase, scope, talks, filters]);

  if (loading) {
    return (
      <div className="px-4 md:px-8 lg:px-12 py-20 flex items-center justify-center">
        <p className="text-[#1c1c13]/40">Loading talk data...</p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 lg:px-12 pt-4 md:pt-6 pb-12 md:pb-24">
      {/* Search bar */}
      <div className="relative mb-4">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#1c1c13]/30 text-xl">format_quote</span>
        <input
          type="text"
          placeholder="Start typing a phrase, e.g. plan of salvation..."
          value={phrase}
          onChange={e => setPhrase(e.target.value)}
          className="w-full pl-12 pr-12 py-3 rounded-xl border border-[#ece8d9] bg-white text-sm focus:outline-none focus:border-[#1B5E7B] focus:ring-2 focus:ring-[#1B5E7B]/10 shadow-[0px_4px_16px_rgba(27,94,123,0.04)]"
        />
        {searching && (
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#f5a623] text-xl animate-spin">progress_activity</span>
        )}
      </div>

      {/* Controls row */}
      <div className="bg-white p-4 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Scope pills */}
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1c1c13]/40">Search In</p>
            <div className="flex gap-1">
              {[
                { key: 'talk_text' as const, label: 'Full Text' },
                { key: 'title' as const, label: 'Title Only' },
              ].map(s => (
                <button
                  key={s.key}
                  onClick={() => setScope(s.key)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                    scope === s.key
                      ? 'bg-[#1B5E7B] text-white'
                      : 'bg-[#f8f4e4] text-[#1c1c13]/50 hover:bg-[#1B5E7B]/10'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick examples */}
          <div className="flex items-center gap-2 ml-auto">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1c1c13]/40 hidden sm:block">Try</p>
            {['plan of salvation', 'gathering of Israel', 'Holy Ghost'].map(ex => (
              <button
                key={ex}
                onClick={() => setPhrase(ex)}
                className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-[#f8f4e4] text-[#1c1c13]/50 hover:bg-[#f5a623]/10 hover:text-[#1B5E7B] transition-all"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary stats */}
      {searchResult && searchResult.talks.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Phrase', value: `"${phrase}"` },
            { label: 'Talks Found', value: searchResult.talks.length.toLocaleString() },
            { label: 'Total References', value: searchResult.totalReferences.toLocaleString() },
            { label: 'Refs / Talk', value: (searchResult.totalReferences / searchResult.talks.length).toFixed(1) },
          ].map(item => (
            <div key={item.label} className="bg-white p-4 rounded-xl shadow-[0px_4px_16px_rgba(27,94,123,0.04)]">
              <p className="text-[10px] uppercase tracking-wider text-[#1c1c13]/40 font-bold">{item.label}</p>
              <p className="text-lg font-bold text-[#1c1c13] mt-0.5 truncate">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search Results */}
      {searchResult && searchResult.talks.length > 0 && (
        <SearchResults result={searchResult} title={`Phrase Search: "${phrase}"`} />
      )}

      {searchResult && searchResult.talks.length === 0 && (
        <div className="bg-white p-8 rounded-xl text-center shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
          <span className="material-symbols-outlined text-4xl text-[#1c1c13]/20 mb-2">search_off</span>
          <p className="text-sm text-[#1c1c13]/40">No talks found containing &quot;{phrase}&quot;</p>
        </div>
      )}

      {/* Empty state */}
      {!searchResult && !phrase.trim() && (
        <div className="bg-white p-8 md:p-12 rounded-xl text-center shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
          <span className="material-symbols-outlined text-5xl text-[#1c1c13]/15 mb-3">format_quote</span>
          <h3 className="text-lg font-bold text-[#1c1c13]/60 mb-2">Exact Phrase Search</h3>
          <p className="text-sm text-[#1c1c13]/40 max-w-md mx-auto">
            Start typing a phrase to find every talk that contains it. Results appear as you type.
          </p>
        </div>
      )}
    </div>
  );
}
