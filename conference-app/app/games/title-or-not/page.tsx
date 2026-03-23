'use client';

import { useState } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { ShareButton } from '@/components/share-button';
import { useFilteredTalks } from '@/lib/filter-context';
import { generateTitleOrNotRounds, TitleOrNotItem, saveScore } from '@/lib/game-utils';

type GameState = 'menu' | 'playing' | 'answered' | 'results';

export default function TitleOrNotPage() {
  const { talks, loading } = useFilteredTalks();
  const [gameState, setGameState] = useState<GameState>('menu');
  const [rounds, setRounds] = useState<TitleOrNotItem[]>([]);
  const [currentR, setCurrentR] = useState(0);
  const [score, setScore] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [roundResults, setRoundResults] = useState<boolean[]>([]);

  const startGame = () => {
    const r = generateTitleOrNotRounds(talks, 12);
    if (r.length === 0) return;
    setRounds(r);
    setCurrentR(0);
    setRoundResults([]);
    setScore(0);
    setTotalCorrect(0);
    setSelectedAnswer(null);
    setStreak(0);
    setBestStreak(0);
    setGameState('playing');
  };

  const handleAnswer = (answer: boolean) => {
    if (gameState !== 'playing') return;
    setSelectedAnswer(answer);
    const round = rounds[currentR];
    const correct = answer === round.isReal;

    if (correct) {
      setScore(s => s + 10);
      setTotalCorrect(c => c + 1);
      setStreak(s => {
        const newStreak = s + 1;
        setBestStreak(b => Math.max(b, newStreak));
        return newStreak;
      });
    } else {
      setStreak(0);
    }
    setRoundResults(prev => [...prev, correct]);
    setGameState('answered');
  };

  const nextRound = () => {
    if (currentR + 1 >= rounds.length) {
      saveScore({ gameType: 'title-or-not', score, date: new Date().toISOString(), details: `${totalCorrect}/${rounds.length}` });
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
          <span className="material-symbols-outlined text-[#e84393] text-5xl animate-pulse">psychology</span>
        </main>
      </div>
    );
  }

  const round = rounds[currentR];

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1 pt-20 lg:pt-0">
        <TopAppBar title="Real or Fake?" subtitle="Spot the real conference talk titles" hideEraToggle />

        <div className="px-3 sm:px-4 md:px-8 lg:px-12 pb-12 md:pb-24 max-w-3xl mx-auto">
          {/* Menu */}
          {gameState === 'menu' && (
            <div className="pt-12 text-center space-y-8">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#e84393] to-[#c2185b] flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-white text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-[#1c1c13] mb-2">Real or Fake?</h2>
                <p className="text-[#524534] max-w-md mx-auto leading-relaxed">
                  We&apos;ll show you talk titles — some are real conference talks, others are convincing fakes. Can you tell the difference?
                </p>
              </div>
              <div className="flex gap-6 justify-center">
                <div className="bg-[#2d8f4e]/10 px-5 py-3 rounded-xl text-center">
                  <span className="material-symbols-outlined text-[#2d8f4e] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <p className="text-xs font-bold text-[#2d8f4e] mt-1">Real</p>
                  <p className="text-[10px] text-[#524534]">Actual talk title</p>
                </div>
                <div className="bg-[#ba1a1a]/10 px-5 py-3 rounded-xl text-center">
                  <span className="material-symbols-outlined text-[#ba1a1a] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                  <p className="text-xs font-bold text-[#ba1a1a] mt-1">Fake</p>
                  <p className="text-[10px] text-[#524534]">We made it up</p>
                </div>
              </div>
              <button
                onClick={startGame}
                className="bg-gradient-to-r from-[#e84393] to-[#c2185b] text-white px-10 py-4 rounded-full font-bold text-lg shadow-[0px_8px_24px_rgba(232,67,147,0.3)] hover:shadow-[0px_12px_32px_rgba(232,67,147,0.4)] transition-all active:scale-95"
              >
                Start Playing
              </button>
            </div>
          )}

          {/* Playing / Answered */}
          {(gameState === 'playing' || gameState === 'answered') && round && (
            <div className="space-y-6 pt-6">
              {/* Progress */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#e84393]/60">
                  Title {currentR + 1} of {rounds.length}
                </span>
                <div className="flex gap-4 text-sm font-bold">
                  <span className="text-[#e84393]">{score} pts</span>
                  <span className="text-[#524534]">{totalCorrect}/{currentR + (gameState === 'answered' ? 1 : 0)} correct</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-[#f2eede] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#e84393] to-[#c2185b] rounded-full transition-all duration-500"
                  style={{ width: `${((currentR + 1) / rounds.length) * 100}%` }}
                />
              </div>

              {/* Title Card */}
              <div className="bg-white p-4 sm:p-6 md:p-10 rounded-2xl shadow-[0px_12px_32px_rgba(27,94,123,0.08)] text-center space-y-6">
                <div className="inline-block px-3 py-1 bg-[#e84393]/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#e84393]">
                  Is this a real talk title?
                </div>
                <h3 className="text-2xl md:text-3xl font-extrabold text-[#1c1c13] italic leading-snug">
                  &ldquo;{round.title}&rdquo;
                </h3>

                {gameState === 'answered' && round.isReal && (
                  <p className="text-sm text-[#524534]">
                    By <span className="font-bold text-[#1B5E7B]">{round.speaker}</span> ({round.year})
                  </p>
                )}
              </div>

              {/* Answer Buttons */}
              {gameState === 'playing' && (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleAnswer(true)}
                    className="p-5 rounded-xl bg-[#2d8f4e]/10 border-2 border-[#2d8f4e]/20 hover:border-[#2d8f4e] hover:bg-[#2d8f4e]/20 transition-all active:scale-95 flex flex-col items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[#2d8f4e] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span className="font-bold text-[#2d8f4e]">Real Talk</span>
                  </button>
                  <button
                    onClick={() => handleAnswer(false)}
                    className="p-5 rounded-xl bg-[#ba1a1a]/10 border-2 border-[#ba1a1a]/20 hover:border-[#ba1a1a] hover:bg-[#ba1a1a]/20 transition-all active:scale-95 flex flex-col items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[#ba1a1a] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                    <span className="font-bold text-[#ba1a1a]">Fake Title</span>
                  </button>
                </div>
              )}

              {/* Feedback */}
              {gameState === 'answered' && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl text-center ${
                    selectedAnswer === round.isReal
                      ? 'bg-[#2d8f4e]/10 text-[#2d8f4e]'
                      : 'bg-[#ba1a1a]/10 text-[#ba1a1a]'
                  }`}>
                    <p className="font-bold text-lg">
                      {selectedAnswer === round.isReal ? 'Correct!' : 'Wrong!'}
                    </p>
                    <p className="text-sm opacity-80 mt-1">
                      This title is <span className="font-bold">{round.isReal ? 'REAL' : 'FAKE'}</span>
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={nextRound}
                      className="bg-gradient-to-r from-[#e84393] to-[#c2185b] text-white px-8 py-3 rounded-full font-bold shadow-[0px_8px_20px_rgba(232,67,147,0.2)] transition-all active:scale-95"
                    >
                      {currentR + 1 >= rounds.length ? 'See Results' : 'Next Title'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {gameState === 'results' && (
            <div className="pt-12 text-center space-y-8">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#e84393] to-[#c2185b] flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-white text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {totalCorrect >= 10 ? 'emoji_events' : totalCorrect >= 7 ? 'star' : 'thumb_up'}
                </span>
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-[#1c1c13] mb-1">
                  {totalCorrect >= 10 ? 'Sharp Eye!' : totalCorrect >= 7 ? 'Well Done!' : 'Good Effort!'}
                </h2>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-sm mx-auto">
                <div className="bg-[#f8f4e4] p-4 rounded-xl">
                  <p className="text-xl sm:text-2xl font-extrabold text-[#e84393]">{totalCorrect}/{rounds.length}</p>
                  <p className="text-[10px] text-[#524534] uppercase tracking-wider">Correct</p>
                </div>
                <div className="bg-[#f8f4e4] p-4 rounded-xl">
                  <p className="text-xl sm:text-2xl font-extrabold text-[#f5a623]">{bestStreak}</p>
                  <p className="text-[10px] text-[#524534] uppercase tracking-wider">Best Streak</p>
                </div>
                <div className="bg-[#f8f4e4] p-4 rounded-xl">
                  <p className="text-xl sm:text-2xl font-extrabold text-[#1B5E7B]">{score}</p>
                  <p className="text-[10px] text-[#524534] uppercase tracking-wider">Score</p>
                </div>
              </div>
              <ShareButton getText={() => {
                const grid = roundResults.map(r => r ? '✅' : '❌').join('');
                return `Real or Fake? ${totalCorrect}/${rounds.length}\n${grid}\n\ngeneralconference.app`;
              }} />
              <div className="flex gap-2 sm:gap-4 justify-center">
                <button
                  onClick={startGame}
                  className="bg-[#f8f4e4] text-[#e84393] px-8 py-3 rounded-full font-bold hover:bg-[#f2eede] transition-all active:scale-95"
                >
                  Play Again
                </button>
                <button
                  onClick={() => setGameState('menu')}
                  className="bg-gradient-to-r from-[#e84393] to-[#c2185b] text-white px-8 py-3 rounded-full font-bold shadow-[0px_8px_20px_rgba(232,67,147,0.2)] transition-all active:scale-95"
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
