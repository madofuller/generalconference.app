'use client';

import { useState } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { ShareButton } from '@/components/share-button';
import { generateConnectionsPuzzle, ConnectionsPuzzle, ConnectionsGroup, saveScore } from '@/lib/game-utils';

type GameState = 'menu' | 'playing' | 'won' | 'lost';

const GROUP_COLORS = [
  { bg: 'bg-[#f5a623]' },
  { bg: 'bg-[#40c2fd]' },
  { bg: 'bg-[#8455ef]' },
  { bg: 'bg-[#1B5E7B]' },
];

export default function ConnectionsPage() {
  const [puzzle, setPuzzle] = useState<ConnectionsPuzzle | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [solvedGroups, setSolvedGroups] = useState<ConnectionsGroup[]>([]);
  const [remainingItems, setRemainingItems] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [shakeItems, setShakeItems] = useState(false);
  const [message, setMessage] = useState('');
  const [guessHistory, setGuessHistory] = useState<('correct' | 'wrong')[]>([]);

  const maxMistakes = 4;
  const SHARE_EMOJIS = ['🟨', '🟦', '🟪', '🟩'];

  const startGame = () => {
    const p = generateConnectionsPuzzle([]);
    if (!p) return;
    setPuzzle(p);
    setSelected(new Set());
    setSolvedGroups([]);
    setRemainingItems([...p.allItems]);
    setMistakes(0);
    setGameState('playing');
    setMessage('');
    setGuessHistory([]);
  };

  const toggleItem = (item: string) => {
    if (gameState !== 'playing') return;
    const next = new Set(selected);
    if (next.has(item)) {
      next.delete(item);
    } else if (next.size < 4) {
      next.add(item);
    }
    setSelected(next);
  };

  const submitGuess = () => {
    if (selected.size !== 4 || !puzzle) return;

    const selectedArr = [...selected];

    const matchedGroup = puzzle.groups.find(g =>
      !solvedGroups.includes(g) &&
      g.items.every(item => selectedArr.includes(item)) &&
      selectedArr.every(item => g.items.includes(item))
    );

    if (matchedGroup) {
      const colorIdx = solvedGroups.length;
      const coloredGroup = { ...matchedGroup, color: GROUP_COLORS[colorIdx].bg };
      const newSolved = [...solvedGroups, coloredGroup];
      setSolvedGroups(newSolved);
      setRemainingItems(prev => prev.filter(i => !selectedArr.includes(i)));
      setSelected(new Set());
      setMessage('');
      setGuessHistory(prev => [...prev, 'correct']);

      if (newSolved.length === 4) {
        setGameState('won');
        saveScore({ gameType: 'connections', score: maxMistakes - mistakes, date: new Date().toISOString(), details: `${mistakes} mistakes` });
      }
    } else {
      const almostGroup = puzzle.groups.find(g =>
        !solvedGroups.includes(g) &&
        selectedArr.filter(item => g.items.includes(item)).length === 3
      );

      setMistakes(m => m + 1);
      setGuessHistory(prev => [...prev, 'wrong']);
      setShakeItems(true);
      setTimeout(() => setShakeItems(false), 600);

      if (almostGroup) {
        setMessage('One away!');
      } else {
        setMessage('Not quite...');
      }
      setTimeout(() => setMessage(''), 2000);

      if (mistakes + 1 >= maxMistakes) {
        setGameState('lost');
        const unsolved = puzzle.groups.filter(g => !solvedGroups.includes(g));
        setSolvedGroups([...solvedGroups, ...unsolved.map((g, i) => ({
          ...g,
          color: GROUP_COLORS[solvedGroups.length + i]?.bg || 'bg-gray-400',
        }))]);
        setRemainingItems([]);
        saveScore({ gameType: 'connections', score: 0, date: new Date().toISOString(), details: `${maxMistakes} mistakes` });
      }
    }
  };

  const shuffleRemaining = () => {
    setRemainingItems(prev => {
      const arr = [...prev];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    });
  };

  const deselectAll = () => setSelected(new Set());

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1">
        <TopAppBar title="Connections" subtitle="Group the 16 items into 4 categories" hideEraToggle />

        <div className="px-2 sm:px-4 md:px-8 lg:px-12 pb-12 md:pb-24 max-w-2xl mx-auto">
          {/* Menu */}
          {gameState === 'menu' && (
            <div className="pt-12 text-center space-y-8">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#f5a623] to-[#e8941a] flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-white text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>apps</span>
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-[#1c1c13] mb-2">Connections</h2>
                <p className="text-[#524534] max-w-md mx-auto leading-relaxed">
                  Find 4 groups of 4 items that belong together. Categories include prophets, scriptures, hymns, ordinances, and more. You get 4 mistakes before the game ends.
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                {GROUP_COLORS.map((c, i) => (
                  <div key={i} className={`w-8 h-8 ${c.bg} rounded-lg`} />
                ))}
              </div>
              <button
                onClick={startGame}
                className="bg-[#f5a623] text-white px-10 py-4 rounded-full font-bold text-lg shadow-[0px_8px_24px_rgba(245,166,35,0.3)] hover:shadow-[0px_12px_32px_rgba(245,166,35,0.4)] transition-all active:scale-95"
              >
                Start Game
              </button>
            </div>
          )}

          {/* Playing / Won / Lost */}
          {gameState !== 'menu' && (
            <div className="space-y-4 pt-4">
              {message && (
                <div className="text-center py-2 px-4 bg-[#f5a623]/20 rounded-lg text-sm font-bold text-[#1c1c13]">
                  {message}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#1B5E7B]/60">
                  Find the groups
                </span>
                <div className="flex gap-1.5 items-center">
                  <span className="text-[10px] sm:text-xs text-[#1c1c13]/50 mr-1 hidden sm:inline">Mistakes remaining:</span>
                  {Array.from({ length: maxMistakes }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-colors ${
                        i < maxMistakes - mistakes ? 'bg-[#1B5E7B]' : 'bg-[#d3d6da]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {solvedGroups.map((group, i) => (
                <div
                  key={i}
                  className={`${GROUP_COLORS[i]?.bg || 'bg-gray-400'} rounded-xl p-4 text-center text-white`}
                >
                  <p className="font-extrabold text-sm uppercase tracking-wider mb-1">{group.category}</p>
                  <p className="text-white/80 text-xs">{group.items.join(', ')}</p>
                </div>
              ))}

              {remainingItems.length > 0 && (
                <div className={`grid grid-cols-4 gap-1 sm:gap-2 ${shakeItems ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
                  {remainingItems.map((item) => (
                    <button
                      key={item}
                      onClick={() => toggleItem(item)}
                      className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold text-center transition-all duration-200 min-h-[48px] sm:min-h-[56px] flex items-center justify-center leading-tight ${
                        selected.has(item)
                          ? 'bg-[#1B5E7B] text-white scale-95 shadow-lg'
                          : 'bg-[#f2eede] text-[#1c1c13] hover:bg-[#e8e0cc] active:scale-95 active:bg-[#d8d0bc]'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}

              {gameState === 'playing' && (
                <div className="flex gap-2 sm:gap-3 justify-center pt-2">
                  <button
                    onClick={shuffleRemaining}
                    className="px-3 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold border border-[#d7c3ae]/30 text-[#1c1c13]/70 hover:bg-[#f8f4e4] active:bg-[#f2eede] transition-all"
                  >
                    Shuffle
                  </button>
                  <button
                    onClick={deselectAll}
                    className="px-3 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold border border-[#d7c3ae]/30 text-[#1c1c13]/70 hover:bg-[#f8f4e4] active:bg-[#f2eede] transition-all"
                  >
                    Deselect
                  </button>
                  <button
                    onClick={submitGuess}
                    disabled={selected.size !== 4}
                    className={`px-5 sm:px-8 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all ${
                      selected.size === 4
                        ? 'bg-[#1B5E7B] text-white shadow-[0px_8px_20px_rgba(27,94,123,0.2)] active:scale-95'
                        : 'bg-[#d3d6da] text-[#1c1c13]/30 cursor-not-allowed'
                    }`}
                  >
                    Submit
                  </button>
                </div>
              )}

              {(gameState === 'won' || gameState === 'lost') && (
                <div className="text-center space-y-4 pt-4">
                  <div className={`p-4 rounded-xl ${gameState === 'won' ? 'bg-[#2d8f4e]/10' : 'bg-[#ba1a1a]/10'}`}>
                    {gameState === 'won' ? (
                      <p className="font-bold text-[#2d8f4e]">
                        {mistakes === 0 ? 'Perfect!' : mistakes === 1 ? 'Excellent!' : 'Nice work!'} You found all groups{mistakes > 0 ? ` with ${mistakes} mistake${mistakes > 1 ? 's' : ''}` : ''}!
                      </p>
                    ) : (
                      <p className="font-bold text-[#ba1a1a]">Better luck next time! The groups are revealed above.</p>
                    )}
                  </div>
                  <div className="flex gap-3 justify-center">
                    <ShareButton getText={() => {
                      const lines = guessHistory.map(r => r === 'correct' ? SHARE_EMOJIS[solvedGroups.length > 0 ? Math.min(guessHistory.filter(g => g === 'correct').indexOf(r), 3) : 0] : '❌');
                      const grid = solvedGroups.map((_, i) => SHARE_EMOJIS[i].repeat(4)).join('\n');
                      return `Conference Connections\n${grid}\n${mistakes > 0 ? `${mistakes} mistake${mistakes > 1 ? 's' : ''}` : 'Perfect!'}\n\ngeneralconference.app`;
                    }} />
                    <button
                      onClick={startGame}
                      className="bg-[#1B5E7B] text-white px-8 py-3 rounded-full font-bold shadow-[0px_8px_20px_rgba(27,94,123,0.2)] transition-all active:scale-95"
                    >
                      Play Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
