'use client';

import { useState, useEffect } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { useFilteredTalks } from '@/lib/filter-context';
import { generateQuoteMatchQuestions, QuoteMatchQuestion, saveScore, getScores, GameScore } from '@/lib/game-utils';

type GameState = 'menu' | 'playing' | 'answered' | 'results';

export default function QuoteMatchPage() {
  const { talks, loading } = useFilteredTalks();
  const [gameState, setGameState] = useState<GameState>('menu');
  const [questions, setQuestions] = useState<QuoteMatchQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [highScores, setHighScores] = useState<GameScore[]>([]);

  useEffect(() => {
    setHighScores(getScores('quote-match'));
  }, [gameState]);

  const startGame = (diff: 'easy' | 'medium' | 'hard') => {
    setDifficulty(diff);
    const qs = generateQuoteMatchQuestions(talks, 10, diff);
    if (qs.length === 0) return;
    setQuestions(qs);
    setCurrentQ(0);
    setStreak(0);
    setBestStreak(0);
    setTotalCorrect(0);
    setSelectedAnswer(null);
    setGameState('playing');
  };

  const handleAnswer = (index: number) => {
    if (gameState !== 'playing') return;
    setSelectedAnswer(index);
    const correct = index === questions[currentQ].correctIndex;
    if (correct) {
      setStreak(s => s + 1);
      setBestStreak(b => Math.max(b, streak + 1));
      setTotalCorrect(c => c + 1);
    } else {
      setStreak(0);
    }
    setGameState('answered');
  };

  const nextQuestion = () => {
    if (currentQ + 1 >= questions.length) {
      const finalScore = totalCorrect * 10 + bestStreak * 5;
      saveScore({ gameType: 'quote-match', score: finalScore, date: new Date().toISOString(), details: difficulty });
      setGameState('results');
    } else {
      setCurrentQ(c => c + 1);
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
            <span className="material-symbols-outlined text-[#f5a623] text-5xl animate-pulse">format_quote</span>
            <p className="text-[#524534] mt-4">Loading quotes...</p>
          </div>
        </main>
      </div>
    );
  }

  const q = questions[currentQ];

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1">
        <TopAppBar title="Quote Match" subtitle="Can the greatest words find their speaker?" />

        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24 max-w-4xl mx-auto">
          {/* Menu */}
          {gameState === 'menu' && (
            <div className="space-y-12 pt-8">
              {/* Hero Quote */}
              <div className="bg-[#f8f4e4] p-6 md:p-10 lg:p-12 rounded-xl text-center relative overflow-hidden">
                <div className="absolute top-4 left-4 text-[#f5a623]/20 text-8xl font-serif">&ldquo;</div>
                <p className="text-2xl font-bold text-[#1c1c13] italic leading-relaxed max-w-2xl mx-auto relative z-10">
                  &ldquo;The joy we feel has little to do with the circumstances of our lives and everything to do with the focus of our lives.&rdquo;
                </p>
                <div className="mt-6 text-sm text-[#524534]">Source revealed after selection</div>
              </div>

              {/* Difficulty Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {([
                  { diff: 'easy' as const, label: 'Easy', desc: 'Speakers from different callings', icon: 'sentiment_satisfied' },
                  { diff: 'medium' as const, label: 'Medium', desc: 'Any conference speakers', icon: 'psychology' },
                  { diff: 'hard' as const, label: 'Hard', desc: 'Same era speakers', icon: 'local_fire_department' },
                ]).map((d) => (
                  <button
                    key={d.diff}
                    onClick={() => startGame(d.diff)}
                    className="bg-white p-4 md:p-6 lg:p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] hover:-translate-y-1 transition-all duration-300 text-center group"
                  >
                    <span className="material-symbols-outlined text-[#1B5E7B] text-4xl mb-4 block group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {d.icon}
                    </span>
                    <h3 className="font-bold text-lg text-[#1c1c13] mb-1">{d.label}</h3>
                    <p className="text-xs text-[#524534]">{d.desc}</p>
                  </button>
                ))}
              </div>

              {/* Progress Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {[
                  { label: 'Correct Answers', value: '18 / 20', icon: 'check_circle' },
                  { label: 'Best Streak', value: '12', icon: 'local_fire_department' },
                  { label: 'Total Score', value: '2,450', icon: 'diamond' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white p-6 rounded-xl shadow-sm text-center">
                    <span className="material-symbols-outlined text-[#f5a623] text-3xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
                    <p className="text-2xl font-extrabold text-[#1c1c13]">{stat.value}</p>
                    <p className="text-xs text-[#524534] uppercase tracking-wider font-bold">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Bottom CTA */}
              <div className="bg-[#f8f4e4] p-5 md:p-8 lg:p-10 rounded-xl">
                <h3 className="text-2xl md:text-3xl font-bold text-[#1c1c13] mb-3">Wisdom is better than gold.</h3>
                <p className="text-[#524534] max-w-lg leading-relaxed">
                  Quote Match is designed to help you internalize the teachings of General Conference by associating
                  profound words with the voices of those who share them.
                </p>
              </div>
            </div>
          )}

          {/* Playing/Answered */}
          {(gameState === 'playing' || gameState === 'answered') && q && (
            <div className="space-y-8 pt-8">
              {/* Progress */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-[#1B5E7B]/60">
                  Quote {currentQ + 1} of {questions.length}
                </span>
                <div className="flex gap-6 text-sm font-bold">
                  <span className="text-[#1B5E7B]">Streak: {streak}</span>
                  <span className="text-[#524534]">Correct: {totalCorrect}</span>
                </div>
              </div>

              {/* Quote */}
              <div className="bg-[#f8f4e4] p-5 md:p-8 lg:p-10 rounded-xl text-center relative">
                <div className="absolute top-3 left-4 text-[#f5a623]/20 text-7xl font-serif">&ldquo;</div>
                <p className="text-xl font-bold text-[#1c1c13] italic leading-relaxed relative z-10">
                  &ldquo;{q.quote}&rdquo;
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {q.options.map((option, i) => {
                  const isCorrect = i === q.correctIndex;
                  const isSelected = i === selectedAnswer;
                  let bg = 'bg-white hover:bg-[#f8f4e4]';
                  let textColor = 'text-[#1c1c13]';

                  if (gameState === 'answered') {
                    if (isCorrect) {
                      bg = 'bg-[#1B5E7B]';
                      textColor = 'text-white';
                    } else if (isSelected) {
                      bg = 'bg-[#ba1a1a]/10';
                      textColor = 'text-[#ba1a1a]';
                    }
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      disabled={gameState === 'answered'}
                      className={`w-full text-left p-5 rounded-xl ${bg} ${textColor} font-medium transition-all duration-200 border border-[#d7c3ae]/20 flex items-center gap-4`}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#ece8d9] flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-[#1B5E7B]">person</span>
                      </div>
                      <span>{option}</span>
                      {gameState === 'answered' && isCorrect && (
                        <span className="material-symbols-outlined ml-auto" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {gameState === 'answered' && (
                <div className="space-y-4">
                  <p className="text-sm text-[#524534] italic text-center">
                    From &ldquo;{q.talkTitle}&rdquo; ({q.year})
                  </p>
                  <div className="flex justify-end">
                    <button
                      onClick={nextQuestion}
                      className="bg-[#1B5E7B] text-white px-8 py-3 rounded-full font-bold shadow-[0px_8px_20px_rgba(27,94,123,0.2)] transition-all active:scale-95"
                    >
                      {currentQ + 1 >= questions.length ? 'See Results' : 'Next Quote'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {gameState === 'results' && (
            <div className="pt-12 space-y-8">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 mx-auto rounded-full bg-[#1B5E7B] flex items-center justify-center shadow-[0px_12px_32px_rgba(27,94,123,0.3)]">
                  <span className="material-symbols-outlined text-white text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#1c1c13]">Game Summary</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {[
                  { label: 'Correct', value: `${totalCorrect}/10` },
                  { label: 'Best Streak', value: String(bestStreak) },
                  { label: 'Total Score', value: String(totalCorrect * 10 + bestStreak * 5) },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white p-6 rounded-xl shadow-sm text-center">
                    <p className="text-3xl font-extrabold text-[#1B5E7B]">{stat.value}</p>
                    <p className="text-xs text-[#524534] uppercase tracking-wider font-bold">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => startGame(difficulty)}
                  className="bg-[#f8f4e4] text-[#1B5E7B] px-8 py-3 rounded-full font-bold hover:bg-[#f2eede] transition-all"
                >
                  Play Again
                </button>
                <button
                  onClick={() => setGameState('menu')}
                  className="bg-[#1B5E7B] text-white px-8 py-3 rounded-full font-bold shadow-[0px_8px_20px_rgba(27,94,123,0.2)] transition-all"
                >
                  Try Another Category
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
