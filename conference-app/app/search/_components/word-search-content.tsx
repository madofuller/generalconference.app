'use client';

import { useState, useEffect, useRef } from 'react';
import { useFilters, useFilteredFullTalks } from '@/lib/filter-context';
import { searchByWord } from '@/lib/search-utils';
import { SearchResult } from '@/lib/types';
import { SearchResults } from '@/components/search-results';

export function WordSearchContent() {
  const { filters } = useFilters();
  const { talks, loading } = useFilteredFullTalks();
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

  const [anyWords, setAnyWords] = useState('');
  const [allWords, setAllWords] = useState('');
  const [noneWords, setNoneWords] = useState('');
  const [scope, setScope] = useState<'talk_text' | 'title'>('talk_text');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search - fires 400ms after user stops typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!anyWords.trim() && !allWords.trim()) {
      setSearchResult(null);
      return;
    }

    debounceRef.current = setTimeout(() => {
      setSearching(true);
      // Use requestAnimationFrame to avoid blocking the UI
      requestAnimationFrame(() => {
        const anyWordsList = anyWords.trim() ? anyWords.trim().split(/\s+/) : [];
        const allWordsList = allWords.trim() ? allWords.trim().split(/\s+/) : [];
        const noneWordsList = noneWords.trim() ? noneWords.trim().split(/\s+/) : [];
        const result = searchByWord(talks, anyWordsList, allWordsList, noneWordsList, scope, filters);
        setSearchResult(result);
        setSearching(false);
      });
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [anyWords, allWords, noneWords, scope, talks, filters]);

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
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#1c1c13]/30 text-xl">search</span>
        <input
          type="text"
          placeholder="Start typing to search across all talks..."
          value={anyWords}
          onChange={e => setAnyWords(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#ece8d9] bg-white text-sm focus:outline-none focus:border-[#1B5E7B] focus:ring-2 focus:ring-[#1B5E7B]/10 shadow-[0px_4px_16px_rgba(27,94,123,0.04)]"
        />
        {searching && (
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#f5a623] text-xl animate-spin">progress_activity</span>
        )}
      </div>

      {/* Controls row */}
      <div className="bg-white p-4 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] mb-6 space-y-3">
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

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
              showAdvanced || allWords || noneWords
                ? 'bg-[#f5a623] text-white'
                : 'bg-[#f8f4e4] text-[#1c1c13]/50 hover:bg-[#f5a623]/10'
            }`}
          >
            <span className="material-symbols-outlined text-xs">{showAdvanced ? 'expand_less' : 'tune'}</span>
            Advanced
          </button>

          {/* Result count */}
          {searchResult && (
            <span className="text-xs text-[#1c1c13]/40 ml-auto">
              {searchResult.talks.length.toLocaleString()} talks found
            </span>
          )}
        </div>

        {/* Advanced fields */}
        {showAdvanced && (
          <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-[#ece8d9]">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1c1c13]/40 mb-1.5 block">Must contain ALL of</label>
              <input
                type="text"
                placeholder="e.g., Israel gathering"
                value={allWords}
                onChange={e => setAllWords(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#ece8d9] bg-[#fdf9e9] text-sm focus:outline-none focus:border-[#1B5E7B] focus:ring-2 focus:ring-[#1B5E7B]/10"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1c1c13]/40 mb-1.5 block">Exclude words</label>
              <input
                type="text"
                placeholder="e.g., pride"
                value={noneWords}
                onChange={e => setNoneWords(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#ece8d9] bg-[#fdf9e9] text-sm focus:outline-none focus:border-[#1B5E7B] focus:ring-2 focus:ring-[#1B5E7B]/10"
              />
            </div>
            <div className="sm:col-span-2">
              <p className="text-[10px] text-[#1c1c13]/30">
                Logic: (ANY of search bar words) AND (ALL of required words) AND NOT (excluded words)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchResult && searchResult.talks.length > 0 && (
        <SearchResults result={searchResult} title="Word Search Results" />
      )}

      {searchResult && searchResult.talks.length === 0 && (
        <div className="bg-white p-8 rounded-xl text-center shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
          <span className="material-symbols-outlined text-4xl text-[#1c1c13]/20 mb-2">search_off</span>
          <p className="text-sm text-[#1c1c13]/40">No talks found matching your search criteria</p>
        </div>
      )}

      {/* Empty state */}
      {!searchResult && !anyWords.trim() && (
        <div className="bg-white p-8 md:p-12 rounded-xl text-center shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
          <span className="material-symbols-outlined text-5xl text-[#1c1c13]/15 mb-3">text_fields</span>
          <h3 className="text-lg font-bold text-[#1c1c13]/60 mb-2">Boolean Word Search</h3>
          <p className="text-sm text-[#1c1c13]/40 max-w-md mx-auto">
            Start typing to search across all conference talks. Use Advanced mode for ALL/NONE logic.
          </p>
        </div>
      )}
    </div>
  );
}
