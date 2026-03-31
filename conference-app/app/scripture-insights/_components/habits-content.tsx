'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFilteredFullTalks } from '@/lib/filter-context';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const BOM_PATTERN = /(?:(?:1|2|3|4)\s+)?(?:Nephi|Mosiah|Alma|Helaman|Ether|Moroni|Mormon|Jacob)\s+\d+/g;
const DC_PATTERN = /D&C\s+\d+/g;
const NT_PATTERN = /(?:Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Hebrews|James|Peter|Revelation)\s+\d+/g;
const OT_PATTERN = /(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Isaiah|Jeremiah|Ezekiel|Daniel|Psalms?|Proverbs|Malachi|Hosea|Joel|Amos|Micah|Habakkuk|Zechariah)\s+\d+/g;

interface SpeakerHabit {
  speaker: string;
  talks: number;
  bookOfMormon: number;
  doctrineCovenants: number;
  newTestament: number;
  oldTestament: number;
  total: number;
  bomPct: number;
  dcPct: number;
  ntPct: number;
  otPct: number;
}

function compactSpeakerLabel(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 2) return name;
  const last = parts[parts.length - 1];
  const initials = parts.slice(0, -1).map(p => `${p[0]}.`).join(' ');
  return `${initials} ${last}`;
}

const CURRENT_FIRST_PRESIDENCY_AND_TWELVE = new Set([
  'Dallin H. Oaks',
  'Henry B. Eyring',
  'D. Todd Christofferson',
  'Dieter F. Uchtdorf',
  'David A. Bednar',
  'Quentin L. Cook',
  'Neil L. Andersen',
  'Ronald A. Rasband',
  'Gary E. Stevenson',
  'Dale G. Renlund',
  'Gerrit W. Gong',
  'Ulisses Soares',
  'Patrick Kearon',
  'Gérald Caussé',
  'Clark G. Gilbert',
]);

export function HabitsContent() {
  const { talks, loading } = useFilteredFullTalks();
  const [livingOnly, setLivingOnly] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const sync = () => setIsMobile(window.innerWidth < 640);
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  const allSpeakerHabits = useMemo(() => {
    if (talks.length === 0) return [];

    // Group talks by speaker (only speakers with 5+ talks)
    const speakerTalks = new Map<string, string[]>();
    const speakerCounts = new Map<string, number>();
    talks.forEach(t => {
      if (!t.talk || !t.speaker) return;
      speakerCounts.set(t.speaker, (speakerCounts.get(t.speaker) || 0) + 1);
      if (!speakerTalks.has(t.speaker)) speakerTalks.set(t.speaker, []);
      speakerTalks.get(t.speaker)!.push(t.talk);
    });

    const habits: SpeakerHabit[] = [];
    for (const [speaker, texts] of speakerTalks) {
      const count = speakerCounts.get(speaker) || 0;
      if (count < 5) continue;

      const allText = texts.join(' ');
      const bom = (allText.match(BOM_PATTERN) || []).length;
      const dc = (allText.match(DC_PATTERN) || []).length;
      const nt = (allText.match(NT_PATTERN) || []).length;
      const ot = (allText.match(OT_PATTERN) || []).length;
      const total = bom + dc + nt + ot;
      if (total === 0) continue;

      habits.push({
        speaker,
        talks: count,
        bookOfMormon: bom,
        doctrineCovenants: dc,
        newTestament: nt,
        oldTestament: ot,
        total,
        bomPct: Math.round(bom / total * 1000) / 10,
        dcPct: Math.round(dc / total * 1000) / 10,
        ntPct: Math.round(nt / total * 1000) / 10,
        otPct: Math.round(ot / total * 1000) / 10,
      });
    }

    habits.sort((a, b) => b.total - a.total);
    return habits;
  }, [talks]);

  const speakers = useMemo(() => {
    let list = allSpeakerHabits;
    if (livingOnly) {
      list = list.filter(s => CURRENT_FIRST_PRESIDENCY_AND_TWELVE.has(s.speaker));
    }
    return list;
  }, [allSpeakerHabits, livingOnly]);

  if (loading) {
    return <p className="text-[#1c1c13]/40 text-center py-12">Loading scripture data...</p>;
  }

  const chartData = speakers.slice(0, 25).map(s => ({
    speaker: isMobile
      ? compactSpeakerLabel(s.speaker)
      : (s.speaker.length > 18 ? s.speaker.substring(0, 16) + '...' : s.speaker),
    'Book of Mormon': s.bomPct,
    'D&C': s.dcPct,
    'New Testament': s.ntPct,
    'Old Testament': s.otPct,
  }));

  return (
    <div className="px-4 md:px-8 lg:px-12 pt-4 md:pt-6 pb-12 md:pb-24">
      {/* Living toggle */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setLivingOnly(!livingOnly)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
            livingOnly
              ? 'bg-[#f5a623] text-white shadow-md'
              : 'bg-[#f8f4e4] text-[#1c1c13]/50 hover:bg-[#f5a623]/20'
          }`}
        >
          <span className="material-symbols-outlined text-base">{livingOnly ? 'person' : 'groups'}</span>
          {livingOnly ? 'Living Only' : 'All Speakers'}
        </button>
        <span className="text-xs text-[#524534]">
          {speakers.length} speakers
          {livingOnly ? ' (First Presidency + Twelve)' : ''}
        </span>
      </div>

      {/* Stacked Bar Chart */}
      <div className="bg-white p-4 md:p-6 lg:p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] mb-6 md:mb-10">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 mb-4">Scripture Volume Breakdown by Speaker (%)</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(360, chartData.length * (isMobile ? 24 : 28))}>
            <BarChart data={chartData} layout="vertical" margin={isMobile ? { left: 0, right: 4, top: 4, bottom: 0 } : { left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ece8d9" />
              <XAxis type="number" unit="%" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} />
              <YAxis type="category" dataKey="speaker" interval={0} width={isMobile ? 86 : 140} tick={{ fontSize: isMobile ? 10 : 11 }} />
              <Tooltip
                allowEscapeViewBox={{ x: true, y: true }}
                reverseDirection={{ x: true, y: false }}
                offset={12}
                wrapperStyle={{ zIndex: 30 }}
                contentStyle={{
                  borderRadius: 10,
                  border: '1px solid #ece8d9',
                  boxShadow: '0 8px 24px rgba(27,94,123,0.12)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
              <Bar dataKey="Book of Mormon" stackId="a" fill="#3b82f6" />
              <Bar dataKey="D&C" stackId="a" fill="#6366f1" />
              <Bar dataKey="New Testament" stackId="a" fill="#ef4444" />
              <Bar dataKey="Old Testament" stackId="a" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-[#524534] py-8 text-center">No speakers found with scripture references</p>
        )}
      </div>

      {/* Detail Table */}
      <div className="bg-white p-4 md:p-6 lg:p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)]">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 mb-4">Raw Numbers</h3>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#ece8d9]">
              <th className="text-left p-2 text-[10px] uppercase tracking-wider text-[#1c1c13]/40">Speaker</th>
              <th className="text-right p-2 text-[10px] uppercase tracking-wider text-blue-500">BoM</th>
              <th className="text-right p-2 text-[10px] uppercase tracking-wider text-indigo-500">D&C</th>
              <th className="text-right p-2 text-[10px] uppercase tracking-wider text-red-500">NT</th>
              <th className="text-right p-2 text-[10px] uppercase tracking-wider text-amber-500">OT</th>
              <th className="text-right p-2 text-[10px] uppercase tracking-wider text-[#1c1c13]/40">Total</th>
            </tr>
          </thead>
          <tbody>
            {speakers.slice(0, 40).map(s => (
              <tr key={s.speaker} className="border-b border-[#ece8d9]/50 hover:bg-[#f8f4e4]/50">
                <td className="p-2 font-medium text-[#1c1c13]">{s.speaker}</td>
                <td className="p-2 text-right">{s.bookOfMormon}</td>
                <td className="p-2 text-right">{s.doctrineCovenants}</td>
                <td className="p-2 text-right">{s.newTestament}</td>
                <td className="p-2 text-right">{s.oldTestament}</td>
                <td className="p-2 text-right font-bold">{s.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
