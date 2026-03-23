'use client';

import { useState } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { ShareButton } from '@/components/share-button';
import { useFilteredFullTalks } from '@/lib/filter-context';
import { generateFinishTheQuoteRounds, FinishTheQuoteRound, saveScore } from '@/lib/game-utils';

type GameState = 'menu' | 'playing' | 'answered' | 'results';

export default function FinishQuotePage() {
  const { talks, loading } = useFilteredFullTalks();
  const [gameState, setGameState] = useState<GameState>('menu');
  const [rounds, setRounds] = useState<FinishTheQuoteRound[]>([]);
  const [currentR, setCurrentR] = useState(0);
  const [score, setScore] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [roundResults, setRoundResults] = useState<boolean[]>([]);

  const startGame = () => {
    const r = generateFinishTheQuoteRounds(talks, 8);
    if (r.length === 0) return;
    setRounds(r);
    setCurrentR(0);
    setScore(0);
    setTotalCorrect(0);
    setRoundResults([]);
    setSelectedAnswer(null);
    setGameState('playing');
  };

  const handleAnswer = (index: number) => {
    if (gameState !== 'playing') return;
    setSelectedAnswer(index);
    const correct = index === rounds[currentR].correctIndex;
    if (correct) {
      setScore(s => s + 15);
      setTotalCorrect(c => c + 1);
    }
    setRoundResults(prev => [...prev, correct]);
    setGameState('answered');
  };

  const nextRound = () => {
    if (currentR + 1 >= rounds.length) {
      saveScore({ gameType: 'finish-quote', score, date: new Date().toISOString(), details: `${totalCorrect}/${rounds.length}` });
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
            <span className="material-symbols-outlined text-[#00668a] text-5xl animate-pulse">edit_note</span>
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
        <TopAppBar title="Finish the Quote" subtitle="Complete the prophet's words" hideEraToggle />

        <div className="px-3 sm:px-4 md:px-8 lg:px-12 pb-12 md:pb-24 max-w-3xl mx-auto">
          {gameState === 'menu' && (
            <div className="pt-12 text-center space-y-8">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#00668a] to-[#004d6b] flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-white text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-[#1c1c13] mb-2">Finish the Quote</h2>
                <p className="text-[#524534] max-w-md mx-auto leading-relaxed">
                  We show you the first half of a conference quote. Pick the correct ending from four options. How well do you know the words of the prophets?
                </p>
              </div>
              <button
                onClick={startGame}
                className="bg-gradient-to-r from-[#00668a] to-[#004d6b] text-white px-10 py-4 rounded-full font-bold text-lg shadow-[0px_8px_24px_rgba(0,102,138,0.3)] hover:shadow-[0px_12px_32px_rgba(0,102,138,0.4)] transition-all active:scale-95"
              >
                Begin
              </button>
            </div>
          )}

          {(gameState === 'playing' || gameState === 'answered') && round && (
            <div className="space-y-6 pt-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#00668a]/60">
                  Quote {currentR + 1} of {rounds.length}
                </span>
                <div className="flex gap-4 text-sm font-bold">
                  <span className="text-[#00668a]">{score} pts</span>
                  <span className="text-[#524534]">{totalCorrect} correct</span>
                </div>
              </div>

              <div className="h-1.5 bg-[#f2eede] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00668a] rounded-full transition-all duration-500"
                  style={{ width: `${((currentR + 1) / rounds.length) * 100}%` }}
                />
              </div>

              <div className="bg-[#f8f4e4] p-4 sm:p-5 md:p-8 rounded-xl relative">
                <div className="absolute top-3 left-4 text-[#00668a]/15 text-6xl font-serif">&ldquo;</div>
                <p className="text-lg md:text-xl text-[#1c1c13] font-bold italic leading-relaxed relative z-10">
                  {round.quoteStart}
                </p>
                <p className="mt-4 text-sm text-[#00668a] font-bold">How does this quote end?</p>
              </div>

              <div className="space-y-3">
                {round.options.map((option, i) => {
                  const isCorrect = i === round.correctIndex;
                  const isSelected = i === selectedAnswer;
                  let classes = 'bg-white border border-[#d7c3ae]/20 text-[#1c1c13] hover:bg-[#f8f4e4]';

                  if (gameState === 'answered') {
                    if (isCorrect) {
                      classes = 'bg-[#00668a] border-transparent text-white shadow-lg';
                    } else if (isSelected) {
                      classes = 'bg-[#ba1a1a]/10 border-[#ba1a1a]/30 text-[#ba1a1a]';
                    } else {
                      classes = 'bg-white/50 border-[#d7c3ae]/10 text-[#1c1c13]/30';
                    }
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      disabled={gameState === 'answered'}
                      className={`w-full text-left p-4 rounded-xl ${classes} font-medium transition-all duration-200 active:scale-95 flex items-start gap-3 text-sm leading-relaxed`}
                    >
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                        gameState === 'answered' && isCorrect
                          ? 'bg-white/20 text-white'
                          : 'bg-[#f2eede] text-[#00668a]'
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="italic">{option}</span>
                      {gameState === 'answered' && isCorrect && (
                        <span className="material-symbols-outlined ml-auto flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {gameState === 'answered' && (
                <div className="space-y-4">
                  <div className="bg-[#f8f4e4] p-4 rounded-xl text-center">
                    <p className="text-sm text-[#524534]">
                      <span className="font-bold text-[#1B5E7B]">{round.speaker}</span>
                      {' — '}{round.talkTitle} ({round.year})
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={nextRound}
                      className="bg-[#00668a] text-white px-8 py-3 rounded-full font-bold shadow-[0px_8px_20px_rgba(0,102,138,0.2)] transition-all active:scale-95"
                    >
                      {currentR + 1 >= rounds.length ? 'See Results' : 'Next Quote'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {gameState === 'results' && (
            <div className="pt-12 text-center space-y-8">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#00668a] to-[#004d6b] flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-white text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {totalCorrect >= 6 ? 'emoji_events' : totalCorrect >= 4 ? 'star' : 'thumb_up'}
                </span>
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-[#1c1c13] mb-1">
                  {totalCorrect >= 7 ? 'Scripture Scholar!' : totalCorrect >= 4 ? 'Well Done!' : 'Keep Studying!'}
                </h2>
                <p className="text-[#524534]">You completed {totalCorrect} of {rounds.length} quotes correctly</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-4 max-w-xs mx-auto">
                <div className="bg-[#f8f4e4] p-4 rounded-xl">
                  <p className="text-xl sm:text-2xl font-extrabold text-[#00668a]">{totalCorrect}/{rounds.length}</p>
                  <p className="text-[10px] text-[#524534] uppercase tracking-wider">Correct</p>
                </div>
                <div className="bg-[#f8f4e4] p-4 rounded-xl">
                  <p className="text-xl sm:text-2xl font-extrabold text-[#f5a623]">{score}</p>
                  <p className="text-[10px] text-[#524534] uppercase tracking-wider">Score</p>
                </div>
              </div>
              <ShareButton getText={() => {
                const grid = roundResults.map(r => r ? '✅' : '❌').join('');
                return `Finish the Quote ${totalCorrect}/${rounds.length}\n${grid}\n\ngeneralconference.app`;
              }} />
              <div className="flex gap-2 sm:gap-4 justify-center">
                <button
                  onClick={startGame}
                  className="bg-[#f8f4e4] text-[#00668a] px-8 py-3 rounded-full font-bold hover:bg-[#f2eede] transition-all active:scale-95"
                >
                  Play Again
                </button>
                <button
                  onClick={() => setGameState('menu')}
                  className="bg-[#00668a] text-white px-8 py-3 rounded-full font-bold shadow-[0px_8px_20px_rgba(0,102,138,0.2)] transition-all active:scale-95"
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
