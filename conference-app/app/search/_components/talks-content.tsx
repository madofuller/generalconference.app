'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useFilteredTalks } from '@/lib/filter-context';
import { loadFullTalks } from '@/lib/data-loader';
import { Talk, ERAS } from '@/lib/types';
import { countScriptureReferences } from '@/lib/search-utils';

type SortKey = 'newest' | 'oldest' | 'title' | 'speaker';

export function TalksContent() {
  const { talks, loading } = useFilteredTalks();
  const [search, setSearch] = useState('');
  const [selectedEra, setSelectedEra] = useState('all');
  const [selectedCalling, setSelectedCalling] = useState('all');
  const [selectedSeason, setSelectedSeason] = useState('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [selectedTalk, setSelectedTalk] = useState<Talk | null>(null);
  const [fullTalkText, setFullTalkText] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 50;

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, selectedEra, selectedCalling, selectedSeason, sort]);

  // Lazy-load full talk text when a talk is selected
  const selectTalk = useCallback((talk: Talk | null) => {
    setSelectedTalk(talk);
    setFullTalkText(null);
    if (talk) {
      setLoadingText(true);
      loadFullTalks().then(fullTalks => {
        const match = fullTalks.find(
          ft => ft.title === talk.title && ft.speaker === talk.speaker && ft.year === talk.year && ft.season === talk.season
        );
        setFullTalkText(match?.talk || null);
        setLoadingText(false);
      });
    }
  }, []);

  const sOrd = (s?: string) => s === 'October' ? 1 : 0;

  // Apply filters in layers so each filter's counts reflect the others
  const { filtered, callingGroups, eraCounts } = useMemo(() => {
    let base = talks;

    // Search (applies to everything)
    if (search.trim()) {
      const q = search.toLowerCase();
      base = base.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.speaker.toLowerCase().includes(q) ||
        (t.calling || '').toLowerCase().includes(q)
      );
    }

    // Season filter (applies to everything)
    const afterSeason = selectedSeason !== 'all'
      ? base.filter(t => t.season === selectedSeason)
      : base;

    // After search + season, apply era to get calling counts
    const afterEra = selectedEra !== 'all'
      ? (() => {
          const era = ERAS.find(e => e.name === selectedEra);
          if (!era) return afterSeason;
          return afterSeason.filter(t => {
            const afterStart = t.year > era.start || (t.year === era.start && sOrd(t.season) >= sOrd(era.startSeason));
            const beforeEnd = era.end === null || t.year < era.end || (t.year === era.end && sOrd(t.season) <= sOrd(era.endSeason));
            return afterStart && beforeEnd;
          });
        })()
      : afterSeason;

    // Calling counts based on search + season + era (before calling filter)
    const callingCounts = new Map<string, number>();
    afterEra.forEach(t => {
      const c = t.calling || 'Unknown';
      callingCounts.set(c, (callingCounts.get(c) || 0) + 1);
    });
    const callingGroups = Array.from(callingCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([calling, count]) => ({ calling, count }));

    // After search + season + calling, compute era counts
    const afterCalling = selectedCalling !== 'all'
      ? afterSeason.filter(t => t.calling === selectedCalling)
      : afterSeason;

    const eraCountMap = new Map<string, number>();
    afterCalling.forEach(t => {
      const eraMatch = ERAS.find(e => {
        const afterStart = t.year > e.start || (t.year === e.start && sOrd(t.season) >= sOrd(e.startSeason));
        const beforeEnd = e.end === null || t.year < e.end || (t.year === e.end && sOrd(t.season) <= sOrd(e.endSeason));
        return afterStart && beforeEnd;
      });
      const name = eraMatch?.name || 'Unknown';
      eraCountMap.set(name, (eraCountMap.get(name) || 0) + 1);
    });

    // Final filtered result (all filters applied)
    let result = afterEra;
    if (selectedCalling !== 'all') {
      result = result.filter(t => t.calling === selectedCalling);
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sort === 'newest') return b.year - a.year || (b.season === 'October' ? 1 : -1);
      if (sort === 'oldest') return a.year - b.year || (a.season === 'April' ? -1 : 1);
      if (sort === 'title') return a.title.localeCompare(b.title);
      return a.speaker.localeCompare(b.speaker);
    });

    return { filtered: result, callingGroups, eraCounts: eraCountMap };
  }, [talks, search, selectedEra, selectedCalling, selectedSeason, sort]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const talkWithText = selectedTalk && fullTalkText ? { ...selectedTalk, talk: fullTalkText } : selectedTalk;
  const scriptureRefs = talkWithText?.talk ? countScriptureReferences(talkWithText) : 0;

  if (loading) {
    return <p className="text-[#1c1c13]/40">Loading...</p>;
  }

  return (
    <div className="px-4 md:px-8 lg:px-12 pt-4 md:pt-6 pb-12 md:pb-24">

      {/* Search bar */}
      <div className="relative mb-4">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#1c1c13]/30 text-xl">search</span>
        <input
          type="text"
          placeholder="Search talks by title, speaker, or calling..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#ece8d9] bg-white text-sm focus:outline-none focus:border-[#1B5E7B] focus:ring-2 focus:ring-[#1B5E7B]/10 shadow-[0px_4px_16px_rgba(27,94,123,0.04)]"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[#ece8d9] transition-colors"
          >
            <span className="material-symbols-outlined text-[#1c1c13]/40 text-lg">close</span>
          </button>
        )}
      </div>

      {/* Filters row */}
      <div className="bg-white p-4 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] mb-6 space-y-3">
        {/* Era pills */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1c1c13]/40 mb-2">Era</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedEra('all')}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                selectedEra === 'all'
                  ? 'bg-[#1B5E7B] text-white'
                  : 'bg-[#f8f4e4] text-[#1c1c13]/50 hover:bg-[#1B5E7B]/10'
              }`}
            >
              All Eras
            </button>
            {ERAS.slice(0, 10).map(era => {
              const count = eraCounts.get(era.name) || 0;
              return (
                <button
                  key={era.name}
                  onClick={() => setSelectedEra(era.name === selectedEra ? 'all' : era.name)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                    selectedEra === era.name
                      ? 'bg-[#1B5E7B] text-white'
                      : count === 0
                        ? 'bg-[#f8f4e4] text-[#1c1c13]/20'
                        : 'bg-[#f8f4e4] text-[#1c1c13]/50 hover:bg-[#1B5E7B]/10'
                  }`}
                >
                  {era.name} ({count.toLocaleString()})
                </button>
              );
            })}
          </div>
        </div>

        {/* Calling filter */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1c1c13]/40 mb-2">Calling</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCalling('all')}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                selectedCalling === 'all'
                  ? 'bg-[#8455ef] text-white'
                  : 'bg-[#f8f4e4] text-[#1c1c13]/50 hover:bg-[#8455ef]/10'
              }`}
            >
              All Callings
            </button>
            {callingGroups.slice(0, 12).map(({ calling, count }) => (
              <button
                key={calling}
                onClick={() => setSelectedCalling(calling === selectedCalling ? 'all' : calling)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider transition-all ${
                  selectedCalling === calling
                    ? 'bg-[#8455ef] text-white'
                    : 'bg-[#f8f4e4] text-[#1c1c13]/50 hover:bg-[#8455ef]/10'
                }`}
              >
                {calling.length > 40 ? calling.substring(0, 37) + '...' : calling} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Season + Sort row */}
        <div className="flex flex-wrap gap-4 items-center pt-1">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1c1c13]/40">Season</p>
            <div className="flex gap-1">
              {[
                { key: 'all', label: 'Both' },
                { key: 'April', label: 'April' },
                { key: 'October', label: 'October' },
              ].map(s => (
                <button
                  key={s.key}
                  onClick={() => setSelectedSeason(s.key)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                    selectedSeason === s.key
                      ? 'bg-[#f5a623] text-white'
                      : 'bg-[#f8f4e4] text-[#1c1c13]/50 hover:bg-[#f5a623]/10'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1c1c13]/40">Sort</p>
            <div className="flex gap-1">
              {[
                { key: 'newest' as SortKey, label: 'Newest' },
                { key: 'oldest' as SortKey, label: 'Oldest' },
                { key: 'speaker' as SortKey, label: 'Speaker' },
                { key: 'title' as SortKey, label: 'Title' },
              ].map(s => (
                <button
                  key={s.key}
                  onClick={() => setSort(s.key)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                    sort === s.key
                      ? 'bg-[#f5a623] text-white'
                      : 'bg-[#f8f4e4] text-[#1c1c13]/50 hover:bg-[#f5a623]/10'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {(search || selectedEra !== 'all' || selectedCalling !== 'all' || selectedSeason !== 'all') && (
            <button
              onClick={() => { setSearch(''); setSelectedEra('all'); setSelectedCalling('all'); setSelectedSeason('all'); }}
              className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 hover:bg-red-100 transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">close</span>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-[#1c1c13]/40">
          {filtered.length.toLocaleString()} talks
          {search && ` matching "${search}"`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Talk list */}
        <div className={`${selectedTalk ? 'lg:col-span-1' : 'lg:col-span-3'} space-y-2`}>
          {paginated.map((t, i) => {
            const isSelected = selectedTalk?.title === t.title && selectedTalk?.year === t.year && selectedTalk?.speaker === t.speaker;
            return (
              <button
                key={`${t.speaker}-${t.title}-${t.year}-${i}`}
                onClick={() => selectTalk(isSelected ? null : t)}
                className={`w-full text-left p-3 md:p-4 rounded-xl transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#1B5E7B] text-white shadow-lg'
                    : 'bg-white hover:bg-[#f5a623]/5 shadow-[0px_4px_16px_rgba(27,94,123,0.04)] hover:shadow-[0px_8px_24px_rgba(27,94,123,0.08)]'
                }`}
              >
                <p className={`font-bold text-sm leading-tight ${isSelected ? 'text-white' : 'text-[#1c1c13]'}`}>
                  {t.title}
                </p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                  <span className={`text-xs font-medium ${isSelected ? 'text-white/80' : 'text-[#1B5E7B]'}`}>{t.speaker}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-white/50' : 'text-[#1c1c13]/30'}`}>&middot;</span>
                  <span className={`text-[10px] ${isSelected ? 'text-white/60' : 'text-[#1c1c13]/40'}`}>{t.season} {t.year}</span>
                  {t.calling && (
                    <>
                      <span className={`text-[10px] ${isSelected ? 'text-white/50' : 'text-[#1c1c13]/30'}`}>&middot;</span>
                      <span className={`text-[10px] ${isSelected ? 'text-white/60' : 'text-[#1c1c13]/40'}`}>{t.calling}</span>
                    </>
                  )}
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="bg-white p-8 rounded-xl text-center">
              <span className="material-symbols-outlined text-4xl text-[#1c1c13]/20 mb-2">search_off</span>
              <p className="text-sm text-[#1c1c13]/40">No talks match your filters</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-white shadow-sm disabled:opacity-30 hover:bg-[#f5a623]/10 transition-all"
              >
                Prev
              </button>
              <span className="text-xs text-[#1c1c13]/40">
                {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-white shadow-sm disabled:opacity-30 hover:bg-[#f5a623]/10 transition-all"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Talk detail panel */}
        {selectedTalk && (
          <div className="lg:col-span-2 lg:sticky lg:top-24 lg:self-start space-y-4 order-first lg:order-none">
            {/* Header card */}
            <div className="bg-white p-5 md:p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg md:text-2xl font-extrabold text-[#1c1c13] leading-tight">{selectedTalk.title}</h2>
                  <p className="text-sm text-[#1B5E7B] font-medium mt-1">{selectedTalk.speaker}</p>
                </div>
                <button
                  onClick={() => selectTalk(null)}
                  className="p-2 rounded-full hover:bg-[#ece8d9] transition-colors flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[#1c1c13]/30">close</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'Conference', value: `${selectedTalk.season} ${selectedTalk.year}` },
                  { label: 'Calling', value: selectedTalk.calling || 'Unknown' },
                  { label: 'Scriptures', value: scriptureRefs.toString() },
                  { label: 'Source', value: selectedTalk.source === 'historical' ? 'Historical (OCR)' : 'Modern' },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-[10px] uppercase tracking-wider text-[#1c1c13]/40 font-bold">{item.label}</p>
                    <p className="text-sm font-bold text-[#1c1c13] mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedTalk.url && (
                  <a
                    href={selectedTalk.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B5E7B] text-white rounded-full text-xs font-bold hover:bg-[#1B5E7B]/90 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    {selectedTalk.source === 'historical' ? 'View on Internet Archive' : 'Read Full Talk'}
                  </a>
                )}
                {selectedTalk.primary_topic && (
                  <span className="px-3 py-2 bg-[#8455ef]/10 text-[#8455ef] rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {selectedTalk.primary_topic}
                  </span>
                )}
                {selectedTalk.primary_emotion && (
                  <span className="px-3 py-2 bg-pink-500/10 text-pink-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {selectedTalk.primary_emotion}
                  </span>
                )}
                {selectedTalk.source === 'historical' && (
                  <span className="px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-[10px] font-bold">
                    OCR — may contain errors
                  </span>
                )}
              </div>
            </div>

            {/* Talk text preview */}
            {loadingText && (
              <div className="bg-white p-5 md:p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
                <p className="text-sm text-[#1c1c13]/40 animate-pulse">Loading talk text...</p>
              </div>
            )}
            {fullTalkText && (
              <div className="bg-white p-5 md:p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1c1c13]/40 mb-4">Preview</h3>
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm text-[#1c1c13]/80 leading-relaxed whitespace-pre-wrap">
                    {fullTalkText.substring(0, 2000)}
                    {fullTalkText.length > 2000 && (
                      <span className="text-[#1c1c13]/30">... ({(fullTalkText.length - 2000).toLocaleString()} more characters)</span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
