'use client';

import { useState, useEffect, useCallback } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { ShareButton } from '@/components/share-button';
import { getWordleWord, checkWordleGuess, isValidWord, saveScore, getScores } from '@/lib/game-utils';

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
];

const TILE_COLORS = {
  correct: 'bg-[#2d8f4e] text-white border-[#2d8f4e]',
  present: 'bg-[#b59f3b] text-white border-[#b59f3b]',
  absent: 'bg-[#787c7e] text-white border-[#787c7e]',
  empty: 'bg-white border-[#d3d6da]',
  tbd: 'bg-white border-[#878a8c] text-[#1c1c13]',
};

const KEY_COLORS = {
  correct: 'bg-[#2d8f4e] text-white',
  present: 'bg-[#b59f3b] text-white',
  absent: 'bg-[#787c7e] text-white',
  unused: 'bg-[#d3d6da] text-[#1c1c13]',
};

export default function WordlePage() {
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [shake, setShake] = useState(false);
  const [revealRow, setRevealRow] = useState(-1);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({ played: 0, won: 0, streak: 0 });

  useEffect(() => {
    const word = getWordleWord();
    setTargetWord(word);

    // Load today's state from localStorage
    const todayKey = `gc_wordle_${Math.floor(Date.now() / 86400000)}`;
    const saved = localStorage.getItem(todayKey);
    if (saved) {
      const state = JSON.parse(saved);
      setGuesses(state.guesses || []);
      setGameOver(state.gameOver || false);
      setWon(state.won || false);
    }

    const scores = getScores('wordle');
    setStats({
      played: scores.length,
      won: scores.filter(s => s.score > 0).length,
      streak: 0,
    });
  }, []);

  const saveState = useCallback((newGuesses: string[], isOver: boolean, isWon: boolean) => {
    const todayKey = `gc_wordle_${Math.floor(Date.now() / 86400000)}`;
    localStorage.setItem(todayKey, JSON.stringify({ guesses: newGuesses, gameOver: isOver, won: isWon }));
  }, []);

  const showMessage = (msg: string, duration = 1500) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), duration);
  };

  const submitGuess = useCallback(() => {
    if (gameOver || currentGuess.length !== 5) return;

    if (!isValidWord(currentGuess)) {
      setShake(true);
      showMessage('Not a valid word');
      setTimeout(() => setShake(false), 600);
      return;
    }

    const guess = currentGuess.toUpperCase();
    const newGuesses = [...guesses, guess];
    setGuesses(newGuesses);
    setCurrentGuess('');
    setRevealRow(newGuesses.length - 1);
    setTimeout(() => setRevealRow(-1), 1500);

    if (guess === targetWord) {
      setWon(true);
      setGameOver(true);
      saveState(newGuesses, true, true);
      saveScore({ gameType: 'wordle', score: 7 - newGuesses.length, date: new Date().toISOString(), details: `${newGuesses.length}/6` });
      showMessage(['Genius!', 'Magnificent!', 'Impressive!', 'Splendid!', 'Great!', 'Phew!'][newGuesses.length - 1] || 'Nice!', 3000);
    } else if (newGuesses.length >= 6) {
      setGameOver(true);
      saveState(newGuesses, true, false);
      saveScore({ gameType: 'wordle', score: 0, date: new Date().toISOString(), details: 'X/6' });
      showMessage(targetWord, 5000);
    } else {
      saveState(newGuesses, false, false);
    }
  }, [currentGuess, guesses, gameOver, targetWord, saveState]);

  const handleKey = useCallback((key: string) => {
    if (gameOver) return;

    if (key === 'ENTER') {
      submitGuess();
    } else if (key === '⌫' || key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (/^[A-Z]$/i.test(key) && currentGuess.length < 5) {
      setCurrentGuess(prev => prev + key.toUpperCase());
    }
  }, [currentGuess, gameOver, submitGuess]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      handleKey(e.key.toUpperCase());
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKey]);

  // Build keyboard color map
  const keyColors = new Map<string, string>();
  guesses.forEach(guess => {
    const results = checkWordleGuess(guess, targetWord);
    guess.split('').forEach((char, i) => {
      const current = keyColors.get(char);
      if (results[i] === 'correct') {
        keyColors.set(char, 'correct');
      } else if (results[i] === 'present' && current !== 'correct') {
        keyColors.set(char, 'present');
      } else if (!current) {
        keyColors.set(char, 'absent');
      }
    });
  });

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1">
        <TopAppBar title="Conference Wordle" subtitle="Guess today's sacred word" hideEraToggle />

        <div className="px-2 sm:px-4 md:px-8 pb-8 max-w-lg mx-auto flex flex-col items-center gap-3 sm:gap-4">
          {/* Message */}
          {message && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#1c1c13] text-white px-6 py-3 rounded-lg font-bold text-sm shadow-lg">
              {message}
            </div>
          )}

          {/* Stats bar */}
          <div className="flex gap-6 text-center py-2">
            <div>
              <p className="text-2xl font-extrabold text-[#1c1c13]">{stats.played}</p>
              <p className="text-[10px] uppercase tracking-wider text-[#1c1c13]/50">Played</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#2d8f4e]">{stats.played > 0 ? Math.round(stats.won / stats.played * 100) : 0}%</p>
              <p className="text-[10px] uppercase tracking-wider text-[#1c1c13]/50">Win Rate</p>
            </div>
          </div>

          {/* Board */}
          <div className="flex flex-col gap-1.5">
            {Array.from({ length: 6 }).map((_, rowIdx) => {
              const guess = guesses[rowIdx];
              const isCurrent = rowIdx === guesses.length && !gameOver;
              const isRevealing = rowIdx === revealRow;

              return (
                <div
                  key={rowIdx}
                  className={`flex gap-1.5 ${isCurrent && shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
                >
                  {Array.from({ length: 5 }).map((_, colIdx) => {
                    let char = '';
                    let colorClass = TILE_COLORS.empty;

                    if (guess) {
                      char = guess[colIdx];
                      const results = checkWordleGuess(guess, targetWord);
                      colorClass = TILE_COLORS[results[colIdx]];
                    } else if (isCurrent && colIdx < currentGuess.length) {
                      char = currentGuess[colIdx];
                      colorClass = TILE_COLORS.tbd;
                    }

                    return (
                      <div
                        key={colIdx}
                        className={`w-[52px] h-[52px] sm:w-14 sm:h-14 md:w-16 md:h-16 border-2 flex items-center justify-center text-xl sm:text-2xl md:text-3xl font-extrabold rounded-lg transition-all duration-300 ${colorClass} ${
                          isRevealing ? `animate-[flipIn_0.5s_ease-in-out_${colIdx * 0.15}s_both]` : ''
                        } ${isCurrent && colIdx === currentGuess.length - 1 ? 'scale-105' : ''}`}
                      >
                        {char}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Game Over Info */}
          {gameOver && (
            <div className={`text-center p-4 rounded-xl space-y-3 ${won ? 'bg-[#2d8f4e]/10' : 'bg-[#ba1a1a]/10'}`}>
              {won ? (
                <p className="font-bold text-[#2d8f4e]">You got it in {guesses.length}/6!</p>
              ) : (
                <p className="font-bold text-[#ba1a1a]">The word was <span className="uppercase">{targetWord}</span></p>
              )}
              <p className="text-xs text-[#1c1c13]/50">Come back tomorrow for a new word!</p>
              <ShareButton getText={() => {
                const EMOJI = { correct: '🟩', present: '🟨', absent: '⬜' };
                const grid = guesses.map(g =>
                  checkWordleGuess(g, targetWord).map(r => EMOJI[r]).join('')
                ).join('\n');
                return `Conference Wordle ${won ? guesses.length : 'X'}/6\n\n${grid}\n\ngeneralconference.app`;
              }} />
            </div>
          )}

          {/* Keyboard */}
          <div className="flex flex-col gap-1.5 w-full">
            {KEYBOARD_ROWS.map((row, ri) => (
              <div key={ri} className="flex gap-1 sm:gap-1.5 justify-center">
                {row.map(key => {
                  const isSpecial = key === 'ENTER' || key === '⌫';
                  const colorStatus = keyColors.get(key);
                  const bgClass = colorStatus ? KEY_COLORS[colorStatus as keyof typeof KEY_COLORS] : KEY_COLORS.unused;

                  return (
                    <button
                      key={key}
                      onClick={() => handleKey(key === '⌫' ? 'BACKSPACE' : key)}
                      className={`${bgClass} ${isSpecial ? 'px-3 sm:px-4 md:px-5 text-xs sm:text-sm' : 'flex-1 max-w-[36px] sm:max-w-[44px] md:max-w-[52px] text-sm sm:text-base md:text-lg'} py-4 sm:py-4 md:py-5 rounded-lg font-bold transition-colors active:scale-95 active:bg-[#787c7e]/80 min-h-[52px] sm:min-h-[56px]`}
                    >
                      {key}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
