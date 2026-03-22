'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { SearchFilters, LIVING_SPEAKERS, Talk, DataEra } from './types';
import { loadTalks } from './data-loader';

interface FilterContextType {
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  resetFilters: () => void;
  livingOnly: boolean;
  setLivingOnly: (v: boolean) => void;
  dataEra: DataEra;
  setDataEra: (era: DataEra) => void;
  filterTalks: (talks: Talk[]) => Talk[];
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

const defaultFilters: SearchFilters = {
  type: 'none'
};

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [livingOnly, setLivingOnly] = useState(false);
  const [dataEra, setDataEra] = useState<DataEra>('modern');

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const filterTalks = useCallback((talks: Talk[]) => {
    let filtered = talks;

    // Filter by data era
    if (dataEra === 'modern') {
      filtered = filtered.filter(t => t.source === 'modern');
    } else if (dataEra === 'historical') {
      filtered = filtered.filter(t => t.source === 'historical');
    }

    // Filter by living speakers
    if (livingOnly) {
      filtered = filtered.filter(t => LIVING_SPEAKERS.has(t.speaker));
    }

    return filtered;
  }, [livingOnly, dataEra]);

  const value = useMemo(() => ({
    filters, setFilters, resetFilters, livingOnly, setLivingOnly, dataEra, setDataEra, filterTalks,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [filters, livingOnly, dataEra, filterTalks]);

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}

/** Convenience hook: loads all talks and applies the current era/living filters. */
export function useFilteredTalks() {
  const [allTalks, setAllTalks] = useState<Talk[]>([]);
  const [loading, setLoading] = useState(true);
  const { filterTalks } = useFilters();

  useEffect(() => {
    loadTalks().then(data => {
      setAllTalks(data);
      setLoading(false);
    });
  }, []);

  const talks = useMemo(() => filterTalks(allTalks), [filterTalks, allTalks]);

  return { talks, allTalks, loading };
}
