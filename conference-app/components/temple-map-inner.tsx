'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface TempleCoord {
  lat: number;
  lon: number;
  status: string;
  country: string;
  region: string;
}

interface Props {
  temples: [string, TempleCoord][];
}

const STATUS_COLORS: Record<string, string> = {
  'Operating': '#22c55e',
  'Closed for renovation': '#f59e0b',
  'Under construction': '#3b82f6',
  'Under renovation': '#f59e0b',
};

function getColor(status: string): string {
  for (const [key, color] of Object.entries(STATUS_COLORS)) {
    if (status.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return '#1B5E7B';
}

export default function TempleMapInner({ temples }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clean up previous map
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    const map = L.map(mapRef.current, {
      center: [20, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 15,
      scrollWheelZoom: true,
      zoomControl: true,
      worldCopyJump: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Add markers at multiple world copies so dots appear when wrapping
    const popupContent = (name: string, coord: TempleCoord, color: string) => `
      <div style="font-family: system-ui, sans-serif; min-width: 160px;">
        <p style="font-weight: 700; margin: 0 0 4px; font-size: 13px;">${name} Temple</p>
        <p style="margin: 0; font-size: 11px; color: #666;">
          <span style="display: inline-block; width: 8px; height: 8px; background: ${color}; border-radius: 50%; margin-right: 4px;"></span>
          ${coord.status}
        </p>
        ${coord.country ? `<p style="margin: 2px 0 0; font-size: 11px; color: #999;">${coord.region ? coord.region + ', ' : ''}${coord.country}</p>` : ''}
      </div>
    `;

    temples.forEach(([name, coord]) => {
      const color = getColor(coord.status);

      // Place marker at -360, 0, +360 so it shows on every world copy
      for (const offset of [-360, 0, 360]) {
        const icon = L.divIcon({
          className: 'temple-marker',
          html: `<div style="
            width: 12px;
            height: 12px;
            background: ${color};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          "></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });

        const marker = L.marker([coord.lat, coord.lon + offset], { icon }).addTo(map);
        marker.bindPopup(popupContent(name, coord, color), { closeButton: false, offset: [0, -4] });
      }
    });

    mapInstance.current = map;

    // Fit bounds if we have temples
    if (temples.length > 0) {
      const bounds = L.latLngBounds(temples.map(([, c]) => [c.lat, c.lon] as [number, number]));
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 6 });
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [temples]);

  return <div ref={mapRef} className="w-full h-full" />;
}
