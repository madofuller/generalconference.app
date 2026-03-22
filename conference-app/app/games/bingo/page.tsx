'use client';

import { useState } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { useFilteredTalks } from '@/lib/filter-context';
import { generateBingoCard, checkBingoWin, BingoCard, BingoItem } from '@/lib/game-utils';

const CATEGORY_COLORS: Record<string, string> = {
  phrase: 'bg-[#00668a]/10',
  topic: 'bg-[#8455ef]/10',
  speaker: 'bg-[#f5a623]/10',
  event: 'bg-[#ece8d9]',
};

const CATEGORY_MARKED: Record<string, string> = {
  phrase: 'bg-[#00668a]',
  topic: 'bg-[#8455ef]',
  speaker: 'bg-[#1B5E7B]',
  event: 'bg-[#f5a623]',
};

const CATEGORY_DOT: Record<string, string> = {
  phrase: 'bg-[#00668a]',
  topic: 'bg-[#8455ef]',
  speaker: 'bg-[#f5a623]',
  event: 'bg-[#ece8d9] border border-[#d7c3ae]',
};

const CATEGORY_LABEL: Record<string, string> = {
  phrase: 'Phrase',
  topic: 'Topic',
  speaker: 'Speaker',
  event: 'Event',
};

const BINGO_COLORS = ['bg-[#f5a623]', 'bg-[#8455ef]', 'bg-[#00668a]', 'bg-[#1B5E7B]', 'bg-[#40c2fd]'];

export default function BingoPage() {
  const { talks, loading } = useFilteredTalks();
  const [card, setCard] = useState<BingoCard | null>(null);
  const [hasWon, setHasWon] = useState(false);

  const generateCard = () => {
    const newCard = generateBingoCard(talks);
    setCard(newCard);
    setHasWon(false);
  };

  const toggleItem = (row: number, col: number) => {
    if (!card || hasWon) return;
    if (row === 2 && col === 2) return;

    const newCard = {
      items: card.items.map((r, ri) =>
        r.map((item, ci) =>
          ri === row && ci === col ? { ...item, marked: !item.marked } : item
        )
      ),
    };
    setCard(newCard);
    if (checkBingoWin(newCard)) setHasWon(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Navigation />
        <main className="ml-0 lg:ml-[260px] flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-[#f5a623] text-5xl animate-pulse">grid_view</span>
            <p className="text-[#524534] mt-4">Loading bingo data...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1">
        <TopAppBar title="Conference Bingo" subtitle="Play along with the spirit of the session" />

        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24 max-w-4xl mx-auto">
          {/* Win Banner */}
          {hasWon && (
            <div className="mb-4 md:mb-8 p-4 md:p-6 rounded-xl watercolor-gradient text-white text-center">
              <p className="text-4xl font-extrabold mb-2">BINGO!</p>
              <p className="text-white/80">Congratulations! You completed a line!</p>
            </div>
          )}

          {!card ? (
            /* Empty State */
            <div className="text-center pt-16 space-y-8">
              {/* BINGO Header */}
              <div className="flex justify-center gap-3 mb-8">
                {['B', 'I', 'N', 'G', 'O'].map((letter, i) => (
                  <div
                    key={letter}
                    className={`w-12 h-12 md:w-16 md:h-16 ${BINGO_COLORS[i]} rounded-2xl flex items-center justify-center text-white text-xl md:text-2xl font-extrabold shadow-lg`}
                  >
                    {letter}
                  </div>
                ))}
              </div>

              <p className="text-lg text-[#524534] mb-8">Generate a card to play along during conference!</p>

              <button
                onClick={generateCard}
                className="bg-[#1B5E7B] text-white px-10 py-4 rounded-full font-bold text-lg shadow-[0px_8px_24px_rgba(27,94,123,0.2)] hover:shadow-[0px_12px_32px_rgba(245,166,35,0.4)] transition-all active:scale-95"
              >
                Generate Card
              </button>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 md:gap-8 justify-center mt-8 md:mt-12 text-sm font-medium text-[#524534]">
                {Object.entries(CATEGORY_DOT).map(([cat, dotClass]) => (
                  <div key={cat} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${dotClass}`} />
                    <span className="uppercase text-xs tracking-wider">{CATEGORY_LABEL[cat]}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8 pt-4">
              {/* BINGO Header */}
              <div className="flex justify-center gap-3">
                {['B', 'I', 'N', 'G', 'O'].map((letter, i) => (
                  <div
                    key={letter}
                    className={`w-10 h-10 md:w-14 md:h-14 ${BINGO_COLORS[i]} rounded-2xl flex items-center justify-center text-white text-lg md:text-xl font-extrabold shadow-md`}
                  >
                    {letter}
                  </div>
                ))}
              </div>

              {/* Bingo Grid */}
              <div className="grid grid-cols-5 gap-1 md:gap-2">
                {card.items.map((row, ri) =>
                  row.map((item, ci) => {
                    const isFreeSpace = ri === 2 && ci === 2;
                    return (
                      <button
                        key={`${ri}-${ci}`}
                        onClick={() => toggleItem(ri, ci)}
                        className={`
                          aspect-square p-1.5 md:p-3 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold
                          flex flex-col items-center justify-center text-center
                          transition-all duration-200
                          ${item.marked || isFreeSpace
                            ? `${CATEGORY_MARKED[item.category] || 'bg-[#1B5E7B]'} text-white shadow-lg scale-[0.95]`
                            : `${CATEGORY_COLORS[item.category]} text-[#1c1c13] hover:scale-[0.95]`
                          }
                        `}
                      >
                        {isFreeSpace ? (
                          <>
                            <span className="material-symbols-outlined text-2xl mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="text-[9px] uppercase tracking-wider">Free Space</span>
                          </>
                        ) : (
                          <>
                            <span className={`text-[8px] uppercase tracking-wider mb-1 ${item.marked ? 'text-white/70' : 'text-[#1B5E7B]/60'}`}>
                              {CATEGORY_LABEL[item.category]}
                            </span>
                            <span className="leading-tight text-[11px]">
                              {item.category === 'phrase' ? `"${item.text}"` : item.text}
                            </span>
                            {item.marked && (
                              <span className="material-symbols-outlined text-white/80 text-sm mt-1" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            )}
                          </>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={generateCard}
                  className="bg-white text-[#1B5E7B] px-8 py-3 rounded-full font-bold border border-[#d7c3ae]/30 hover:bg-[#f8f4e4] transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Shuffle Card
                </button>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 md:gap-8 justify-center text-sm font-medium text-[#524534]">
                {Object.entries(CATEGORY_DOT).map(([cat, dotClass]) => (
                  <div key={cat} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${dotClass}`} />
                    <span className="uppercase text-xs tracking-wider">{CATEGORY_LABEL[cat]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
