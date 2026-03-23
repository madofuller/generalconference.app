'use client';

import { useState } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { ShareButton } from '@/components/share-button';
import { useFilteredFullTalks } from '@/lib/filter-context';
import { generateDecadeDetectiveRounds, DecadeDetectiveRound, saveScore } from '@/lib/game-utils';

type GameState = 'menu' | 'playing' | 'answered' | 'results';

export default function DecadeDetectivePage() {
  const { talks, loading } = useFilteredFullTalks();
  const [gameState, setGameState] = useState<GameState>('menu');
  const [rounds, setRounds] = useState<DecadeDetectiveRound[]>([]);
  const [currentR, setCurrentR] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [roundResults, setRoundResults] = useState<('exact' | 'close' | 'wrong')[]>([]);

  const startGame = () => {
    const r = generateDecadeDetectiveRounds(talks, 8);
    if (r.length === 0) return;
    setRounds(r);
    setCurrentR(0);
    setScore(0);
    setSelectedAnswer(null);
    setStreak(0);
    setBestStreak(0);
    setRoundResults([]);
    setGameState('playing');
  };

  const handleAnswer = (decade: number) => {
    if (gameState !== 'playing') return;
    setSelectedAnswer(decade);
    const round = rounds[currentR];
    const correct = decade === round.decade;

    if (correct) {
      setScore(s => s + 15);
      setStreak(s => {
        const newStreak = s + 1;
        setBestStreak(b => Math.max(b, newStreak));
        return newStreak;
      });
      setRoundResults(prev => [...prev, 'exact']);
    } else {
      const diff = Math.abs(decade - round.decade);
      if (diff <= 10) {
        setScore(s => s + 5);
        setRoundResults(prev => [...prev, 'close']);
      } else {
        setRoundResults(prev => [...prev, 'wrong']);
      }
      setStreak(0);
    }
    setGameState('answered');
  };

  const nextRound = () => {
    if (currentR + 1 >= rounds.length) {
      saveScore({ gameType: 'decade-detective', score, date: new Date().toISOString(), details: `${score} pts` });
      setGameState('results');
    } else {
      setCurrentR(c => c + 1);
      setSelectedAnswer(null);
      setGameState('playing');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Navigation />
        <main className="ml-0 lg:ml-[260px] flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-[#8455ef] text-5xl animate-pulse">history_edu</span>
            <p className="text-[#524534] mt-4 text-sm">Loading conference talks...</p>
          </div>
        </main>
      </div>
    );
  }

  const round = rounds[currentR];

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1">
        <TopAppBar title="Decade Detective" subtitle="When was this talk given?" hideEraToggle />

        <div className="px-3 sm:px-4 md:px-8 lg:px-12 pb-12 md:pb-24 max-w-3xl mx-auto">
          {/* Menu */}
          {gameState === 'menu' && (
            <div className="pt-12 text-center space-y-8">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#8455ef] to-[#6a3dcc] flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-white text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>history_edu</span>
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-[#1c1c13] mb-2">Decade Detective</h2>
                <p className="text-[#524534] max-w-md mx-auto leading-relaxed">
                  Read an excerpt from a real conference talk and guess which decade it was given. Language, topics, and style change over time — can you detect the era?
                </p>
              </div>
              <div className="flex flex-wrap gap-4 justify-center text-sm">
                <div className="bg-[#f8f4e4] px-4 py-3 rounded-xl text-center">
                  <p className="font-bold text-[#8455ef]">8 Rounds</p>
                  <p className="text-[10px] text-[#524534]">Per Game</p>
                </div>
                <div className="bg-[#f8f4e4] px-4 py-3 rounded-xl text-center">
                  <p className="font-bold text-[#8455ef]">+15 pts</p>
                  <p className="text-[10px] text-[#524534]">Exact Decade</p>
                </div>
                <div className="bg-[#f8f4e4] px-4 py-3 rounded-xl text-center">
                  <p className="font-bold text-[#8455ef]">+5 pts</p>
                  <p className="text-[10px] text-[#524534]">Within 10 Years</p>
                </div>
              </div>
              <button
                onClick={startGame}
                className="bg-[#8455ef] text-white px-10 py-4 rounded-full font-bold text-lg shadow-[0px_8px_24px_rgba(132,85,239,0.3)] hover:shadow-[0px_12px_32px_rgba(132,85,239,0.4)] transition-all active:scale-95"
              >
                Start Investigating
              </button>
            </div>
          )}

          {/* Playing / Answered */}
          {(gameState === 'playing' || gameState === 'answered') && round && (
            <div className="space-y-6 pt-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#8455ef]/60">
                  Round {currentR + 1} of {rounds.length}
                </span>
                <div className="flex gap-4 text-sm font-bold">
                  <span className="text-[#8455ef]">{score} pts</span>
                  {streak > 1 && <span className="text-[#f5a623]">{streak} streak!</span>}
                </div>
              </div>

              <div className="h-1.5 bg-[#f2eede] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#8455ef] rounded-full transition-all duration-500"
                  style={{ width: `${((currentR + 1) / rounds.length) * 100}%` }}
                />
              </div>

              <div className="bg-[#f8f4e4] p-4 sm:p-5 md:p-8 rounded-xl relative">
                <div className="absolute top-3 left-4 text-[#8455ef]/15 text-6xl font-serif">&ldquo;</div>
                <p className="text-base md:text-lg text-[#1c1c13] leading-relaxed italic relative z-10">
                  {round.excerpt}
                </p>
                {gameState === 'answered' && (
                  <div className="mt-4 pt-4 border-t border-[#d7c3ae]/30">
                    <p className="text-sm text-[#524534]">
                      <span className="font-bold text-[#1B5E7B]">{round.speaker}</span>
                      {' — '}{round.title} ({round.year})
                    </p>
                  </div>
                )}
              </div>

              <p className="text-center text-sm font-bold text-[#1c1c13]/60">What decade was this from?</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {round.options.map((decade) => {
                  const isCorrect = decade === round.decade;
                  const isSelected = decade === selectedAnswer;
                  let classes = 'bg-white border border-[#d7c3ae]/20 text-[#1c1c13] hover:bg-[#f8f4e4]';

                  if (gameState === 'answered') {
                    if (isCorrect) {
                      classes = 'bg-[#8455ef] border-transparent text-white shadow-lg';
                    } else if (isSelected) {
                      classes = 'bg-[#ba1a1a]/10 border-[#ba1a1a]/30 text-[#ba1a1a]';
                    } else {
                      classes = 'bg-white/50 border-[#d7c3ae]/10 text-[#1c1c13]/30';
                    }
                  }

                  return (
                    <button
                      key={decade}
                      onClick={() => handleAnswer(decade)}
                      disabled={gameState === 'answered'}
                      className={`p-4 rounded-xl font-extrabold text-xl sm:text-2xl transition-all duration-200 active:scale-95 ${classes}`}
                    >
                      {decade}s
                      {gameState === 'answered' && isCorrect && (
                        <span className="material-symbols-outlined block text-sm mt-1" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {gameState === 'answered' && (
                <div className="space-y-4">
                  {selectedAnswer === round.decade ? (
                    <p className="text-center text-sm font-bold text-[#2d8f4e]">Correct! +15 points</p>
                  ) : Math.abs((selectedAnswer || 0) - round.decade) <= 10 ? (
                    <p className="text-center text-sm font-bold text-[#f5a623]">Close! Within a decade. +5 points</p>
                  ) : (
                    <p className="text-center text-sm font-bold text-[#ba1a1a]">It was the {round.decade}s</p>
                  )}
                  <div className="flex justify-end">
                    <button
                      onClick={nextRound}
                      className="bg-[#8455ef] text-white px-8 py-3 rounded-full font-bold shadow-[0px_8px_20px_rgba(132,85,239,0.2)] transition-all active:scale-95"
                    >
                      {currentR + 1 >= rounds.length ? 'See Results' : 'Next Excerpt'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {gameState === 'results' && (
            <div className="pt-12 text-center space-y-8">
              <div className="w-24 h-24 mx-auto rounded-full bg-[#8455ef] flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-white text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {score >= 80 ? 'emoji_events' : score >= 40 ? 'star' : 'thumb_up'}
                </span>
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-[#1c1c13] mb-1">
                  {score >= 100 ? 'Master Detective!' : score >= 60 ? 'Great Investigating!' : 'Nice Try!'}
                </h2>
                <p className="text-[#524534]">You scored {score} points across {rounds.length} rounds</p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-sm mx-auto">
                <div className="bg-[#f8f4e4] p-4 rounded-xl">
                  <p className="text-xl sm:text-2xl font-extrabold text-[#8455ef]">{score}</p>
                  <p className="text-[10px] text-[#524534] uppercase tracking-wider">Points</p>
                </div>
                <div className="bg-[#f8f4e4] p-4 rounded-xl">
                  <p className="text-xl sm:text-2xl font-extrabold text-[#f5a623]">{bestStreak}</p>
                  <p className="text-[10px] text-[#524534] uppercase tracking-wider">Best Streak</p>
                </div>
                <div className="bg-[#f8f4e4] p-4 rounded-xl">
                  <p className="text-xl sm:text-2xl font-extrabold text-[#1B5E7B]">{Math.round(score / (rounds.length * 15) * 100)}%</p>
                  <p className="text-[10px] text-[#524534] uppercase tracking-wider">Accuracy</p>
                </div>
              </div>
              <ShareButton getText={() => {
                const EMOJI = { exact: '🎯', close: '🟨', wrong: '❌' };
                const grid = roundResults.map(r => EMOJI[r]).join('');
                return `Decade Detective ${score}/${rounds.length * 15} pts\n${grid}\n\ngeneralconference.app`;
              }} />
              <div className="flex gap-2 sm:gap-4 justify-center">
                <button
                  onClick={startGame}
                  className="bg-[#f8f4e4] text-[#8455ef] px-8 py-3 rounded-full font-bold hover:bg-[#f2eede] transition-all active:scale-95"
                >
                  Play Again
                </button>
                <button
                  onClick={() => setGameState('menu')}
                  className="bg-[#8455ef] text-white px-8 py-3 rounded-full font-bold shadow-[0px_8px_20px_rgba(132,85,239,0.2)] transition-all active:scale-95"
                >
                  Back to Menu
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
