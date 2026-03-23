'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';

interface TempleCoord {
  lat: number;
  lon: number;
  status: string;
  country: string;
  region: string;
}

interface TempleMapProps {
  filterStatus: string;
  filterContinent: string;
  searchTerm: string;
}

// Dynamically import the map to avoid SSR issues with Leaflet
const MapInner = dynamic(() => import('./temple-map-inner'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-[#e8f4f8] rounded-xl">
      <p className="text-[#1c1c13]/40 animate-pulse">Loading map...</p>
    </div>
  ),
});

export default function TempleMap({ filterStatus, filterContinent, searchTerm }: TempleMapProps) {
  const [coords, setCoords] = useState<Record<string, TempleCoord>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/temple_coordinates.json')
      .then(r => r.json())
      .then(data => {
        setCoords(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let entries = Object.entries(coords);
    if (filterStatus !== 'all') {
      entries = entries.filter(([, c]) => c.status === filterStatus);
    }
    if (filterContinent !== 'all') {
      // We don't have continent in coords, but we can approximate
      // This will be handled by the parent passing filtered data
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      entries = entries.filter(([name, c]) =>
        name.toLowerCase().includes(term) ||
        c.country.toLowerCase().includes(term) ||
        c.region.toLowerCase().includes(term)
      );
    }
    return entries;
  }, [coords, filterStatus, searchTerm]);

  if (loading) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-[#e8f4f8] rounded-xl">
        <p className="text-[#1c1c13]/40 animate-pulse">Loading temple locations...</p>
      </div>
    );
  }

  if (Object.keys(coords).length === 0) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-[#e8f4f8] rounded-xl">
        <p className="text-[#1c1c13]/40">Temple coordinates not yet available</p>
      </div>
    );
  }

  return (
    <div className="h-[500px] md:h-[600px] rounded-xl overflow-hidden relative z-0">
      <MapInner temples={filtered} />
    </div>
  );
}
