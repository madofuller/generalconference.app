'use client';

import { useState, useEffect, useCallback } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { useFilteredTalks } from '@/lib/filter-context';
import { generateTriviaQuestions, TriviaQuestion, saveScore, getScores, GameScore } from '@/lib/game-utils';

type GameState = 'menu' | 'playing' | 'answered' | 'results';

const categories = [
  { name: 'Mixed', icon: 'shuffle', color: 'bg-[#f5a623]', label: 'All Categories' },
  { name: 'Speakers', icon: 'person_4', color: 'bg-[#1B5E7B]', label: 'Speaker focused' },
  { name: 'Dates', icon: 'calendar_month', color: 'bg-[#00668a]', label: 'Date focused' },
  { name: 'Topics', icon: 'label', color: 'bg-[#8455ef]', label: 'Topic focused' },
  { name: 'Quotes', icon: 'format_quote', color: 'bg-[#40c2fd]', label: 'Quote focused' },
];

export default function TriviaPage() {
  const { talks, loading } = useFilteredTalks();
  const [gameState, setGameState] = useState<GameState>('menu');
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [timer, setTimer] = useState(15);
  const [highScores, setHighScores] = useState<GameScore[]>([]);

  useEffect(() => {
    setHighScores(getScores('trivia'));
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    if (timer <= 0) {
      handleAnswer(-1);
      return;
    }
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [gameState, timer]);

  const startGame = (cat?: string) => {
    setCategory(cat);
    const qs = generateTriviaQuestions(talks, 10, cat === 'Mixed' ? undefined : cat);
    if (qs.length === 0) return;
    setQuestions(qs);
    setCurrentQ(0);
    setScore(0);
    setSelectedAnswer(null);
    setTimer(15);
    setGameState('playing');
  };

  const handleAnswer = useCallback((index: number) => {
    if (gameState !== 'playing') return;
    setSelectedAnswer(index);
    if (index === questions[currentQ].correctIndex) {
      setScore(s => s + Math.max(1, timer));
    }
    setGameState('answered');
  }, [gameState, currentQ, questions, timer]);

  const nextQuestion = () => {
    if (currentQ + 1 >= questions.length) {
      saveScore({ gameType: 'trivia', score, date: new Date().toISOString(), details: category || 'Mixed' });
      setGameState('results');
    } else {
      setCurrentQ(c => c + 1);
      setSelectedAnswer(null);
      setTimer(15);
      setGameState('playing');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Navigation />
        <main className="ml-0 lg:ml-[260px] flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-[#f5a623] text-5xl animate-pulse">quiz</span>
            <p className="text-[#524534] mt-4">Loading trivia data...</p>
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
        <TopAppBar title="Trivia Game" subtitle="Test your knowledge of the restored gospel" />

        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24 max-w-4xl mx-auto">
          {/* Menu State */}
          {gameState === 'menu' && (
            <div className="space-y-12 pt-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#1c1c13] mb-2">Choose Your Path</h2>
                <p className="text-[#524534]">10 questions, 15 seconds each. Faster answers earn more points!</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {categories.slice(0, 3).map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => startGame(cat.name)}
                    className="bg-white p-4 md:p-6 lg:p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] hover:-translate-y-1 transition-all duration-300 text-center group"
                  >
                    <div className={`w-14 h-14 ${cat.color} rounded-2xl flex items-center justify-center text-white mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
                    </div>
                    <h3 className="font-bold text-[#1c1c13] text-lg mb-1">{cat.name}</h3>
                    <p className="text-xs text-[#524534]">{cat.label}</p>
                  </button>
                ))}
              </div>

              {highScores.length > 0 && (
                <div className="bg-[#f8f4e4] p-4 md:p-6 lg:p-8 rounded-xl">
                  <h3 className="text-lg font-bold text-[#1c1c13] mb-4">High Scores</h3>
                  <div className="space-y-3">
                    {highScores.slice(0, 5).map((s, i) => (
                      <div key={i} className="flex justify-between items-center bg-white px-4 py-3 rounded-lg">
                        <span className="font-bold text-[#1B5E7B]">#{i + 1}</span>
                        <span className="font-bold text-[#1c1c13]">{s.score} pts</span>
                        <span className="text-sm text-[#524534]">{s.details}</span>
                        <span className="text-xs text-[#524534]/60">{new Date(s.date).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Playing/Answered State */}
          {(gameState === 'playing' || gameState === 'answered') && q && (
            <div className="space-y-8 pt-8">
              {/* Progress & Timer */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-[#1B5E7B]/60">
                  Question {currentQ + 1} of {questions.length}
                </span>
                <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center text-xl font-bold ${
                  timer <= 5 ? 'border-[#ba1a1a] text-[#ba1a1a]' : 'border-[#f5a623] text-[#1B5E7B]'
                }`}>
                  {timer}
                </div>
              </div>

              {/* Question Card */}
              <div className="bg-[#f8f4e4] p-5 md:p-8 lg:p-10 rounded-xl text-center space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-[#1B5E7B]/60">{q.category}</span>
                <h3 className="text-2xl font-bold text-[#1c1c13] leading-relaxed">{q.question}</h3>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {q.options.map((option, i) => {
                  const isCorrect = i === q.correctIndex;
                  const isSelected = i === selectedAnswer;
                  let bg = 'bg-white hover:bg-[#f8f4e4]';
                  let border = 'border border-[#d7c3ae]/20';
                  let textColor = 'text-[#1c1c13]';

                  if (gameState === 'answered') {
                    if (isCorrect) {
                      bg = 'bg-[#1B5E7B]';
                      border = 'border-transparent';
                      textColor = 'text-white';
                    } else if (isSelected) {
                      bg = 'bg-[#ba1a1a]/10';
                      border = 'border-[#ba1a1a]/30';
                      textColor = 'text-[#ba1a1a]';
                    }
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      disabled={gameState === 'answered'}
                      className={`w-full text-left p-5 rounded-xl ${bg} ${border} ${textColor} font-medium transition-all duration-200 flex items-center gap-4`}
                    >
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        gameState === 'answered' && isCorrect
                          ? 'bg-white/20 text-white'
                          : 'bg-[#f2eede] text-[#1B5E7B]'
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      {option}
                      {gameState === 'answered' && isCorrect && (
                        <span className="material-symbols-outlined ml-auto" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {gameState === 'answered' && (
                <div className="flex justify-end">
                  <button
                    onClick={nextQuestion}
                    className="bg-[#1B5E7B] text-white px-8 py-3 rounded-full font-bold shadow-[0px_8px_20px_rgba(27,94,123,0.2)] hover:shadow-[0px_12px_32px_rgba(245,166,35,0.4)] transition-all active:scale-95"
                  >
                    {currentQ + 1 >= questions.length ? 'See Results' : 'Next Question'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Results State */}
          {gameState === 'results' && (
            <div className="pt-16 text-center space-y-8">
              <div className="w-24 h-24 mx-auto rounded-full bg-[#1B5E7B] flex items-center justify-center shadow-[0px_12px_32px_rgba(27,94,123,0.3)]">
                <span className="material-symbols-outlined text-white text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#1c1c13] mb-2">Great Job!</h2>
                <p className="text-[#524534]">You finished the set!</p>
              </div>
              <div className="w-40 h-40 mx-auto rounded-full bg-[#f5a623]/20 flex flex-col items-center justify-center">
                <span className="text-5xl font-extrabold text-[#1B5E7B]">{score}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-[#1B5E7B]/60">Points</span>
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => startGame(category)}
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
