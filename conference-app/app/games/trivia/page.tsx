'use client';

import { useState, useEffect, useCallback } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { ShareButton } from '@/components/share-button';
import { useFilteredTalks } from '@/lib/filter-context';
import { generateTriviaQuestions, TriviaQuestion, saveScore, getScores, GameScore } from '@/lib/game-utils';

type GameState = 'menu' | 'playing' | 'answered' | 'results';

export default function TriviaPage() {
  const { talks, loading } = useFilteredTalks();
  const [gameState, setGameState] = useState<GameState>('menu');
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timer, setTimer] = useState(20);
  const [highScores, setHighScores] = useState<GameScore[]>([]);
  const [roundResults, setRoundResults] = useState<boolean[]>([]);

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

  const startGame = () => {
    const qs = generateTriviaQuestions(talks, 10);
    if (qs.length === 0) return;
    setQuestions(qs);
    setCurrentQ(0);
    setScore(0);
    setTotalCorrect(0);
    setSelectedAnswer(null);
    setTimer(20);
    setRoundResults([]);
    setGameState('playing');
  };

  const handleAnswer = useCallback((index: number) => {
    if (gameState !== 'playing') return;
    setSelectedAnswer(index);
    const correct = index === questions[currentQ].correctIndex;
    if (correct) {
      setScore(s => s + Math.max(1, timer));
      setTotalCorrect(c => c + 1);
    }
    setRoundResults(prev => [...prev, correct]);
    setGameState('answered');
  }, [gameState, currentQ, questions, timer]);

  const nextQuestion = () => {
    if (currentQ + 1 >= questions.length) {
      saveScore({ gameType: 'trivia', score, date: new Date().toISOString(), details: `${totalCorrect}/10` });
      setGameState('results');
    } else {
      setCurrentQ(c => c + 1);
      setSelectedAnswer(null);
      setTimer(20);
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
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1 pt-20 lg:pt-0">
        <TopAppBar title="Trivia Master" subtitle="Test your conference knowledge" hideEraToggle />

        <div className="px-3 sm:px-4 md:px-8 lg:px-12 pb-12 md:pb-24 max-w-4xl mx-auto">
          {gameState === 'menu' && (
            <div className="space-y-10 pt-8">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#f5a623] to-[#d4841a] flex items-center justify-center shadow-lg mb-6">
                  <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>quiz</span>
                </div>
                <h2 className="text-3xl font-extrabold text-[#1c1c13] mb-2">Trivia Master</h2>
                <p className="text-[#524534] max-w-md mx-auto">
                  10 questions about conference topics, speakers, callings, and stats. 20 seconds each — faster answers earn more points!
                </p>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={startGame}
                  className="bg-[#f5a623] text-white px-10 py-4 rounded-full font-bold text-lg shadow-[0px_8px_24px_rgba(245,166,35,0.3)] hover:shadow-[0px_12px_32px_rgba(245,166,35,0.4)] transition-all active:scale-95"
                >
                  Start Game
                </button>
              </div>

              {highScores.length > 0 && (
                <div className="bg-[#f8f4e4] p-4 md:p-6 rounded-xl max-w-md mx-auto">
                  <h3 className="text-sm font-bold text-[#1c1c13] mb-3 uppercase tracking-wider">High Scores</h3>
                  <div className="space-y-2">
                    {highScores.slice(0, 5).map((s, i) => (
                      <div key={i} className="flex justify-between items-center bg-white px-4 py-2.5 rounded-lg text-sm">
                        <span className="font-bold text-[#f5a623]">#{i + 1}</span>
                        <span className="font-bold text-[#1c1c13]">{s.score} pts</span>
                        <span className="text-xs text-[#524534]/60">{new Date(s.date).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {(gameState === 'playing' || gameState === 'answered') && q && (
            <div className="space-y-6 pt-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#1B5E7B]/60">
                  Question {currentQ + 1} of {questions.length}
                </span>
                <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center text-lg font-bold ${
                  timer <= 5 ? 'border-[#ba1a1a] text-[#ba1a1a]' : 'border-[#f5a623] text-[#1B5E7B]'
                }`}>
                  {gameState === 'playing' ? timer : '—'}
                </div>
              </div>

              <div className="h-1.5 bg-[#f2eede] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#f5a623] rounded-full transition-all duration-500"
                  style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
                />
              </div>

              <div className="bg-[#f8f4e4] p-4 sm:p-5 md:p-8 rounded-xl text-center space-y-3">
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-[#f5a623] bg-[#f5a623]/10 px-3 py-1 rounded-full">{q.category}</span>
                <h3 className="text-xl md:text-2xl font-bold text-[#1c1c13] leading-relaxed">{q.question}</h3>
              </div>

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
                      className={`w-full text-left p-4 rounded-xl ${bg} ${border} ${textColor} font-medium transition-all duration-200 active:scale-95 flex items-center gap-4`}
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
                    className="bg-[#f5a623] text-white px-8 py-3 rounded-full font-bold shadow-[0px_8px_20px_rgba(245,166,35,0.2)] transition-all active:scale-95"
                  >
                    {currentQ + 1 >= questions.length ? 'See Results' : 'Next Question'}
                  </button>
                </div>
              )}
            </div>
          )}

          {gameState === 'results' && (
            <div className="pt-12 text-center space-y-8">
              <div className="w-24 h-24 mx-auto rounded-full bg-[#f5a623] flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-white text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {totalCorrect >= 8 ? 'emoji_events' : totalCorrect >= 5 ? 'star' : 'thumb_up'}
                </span>
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-[#1c1c13] mb-1">
                  {totalCorrect >= 8 ? 'Conference Scholar!' : totalCorrect >= 5 ? 'Great Job!' : 'Nice Try!'}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-4 max-w-xs mx-auto">
                <div className="bg-[#f8f4e4] p-4 rounded-xl">
                  <p className="text-xl sm:text-2xl font-extrabold text-[#f5a623]">{totalCorrect}/10</p>
                  <p className="text-[10px] text-[#524534] uppercase tracking-wider">Correct</p>
                </div>
                <div className="bg-[#f8f4e4] p-4 rounded-xl">
                  <p className="text-xl sm:text-2xl font-extrabold text-[#1B5E7B]">{score}</p>
                  <p className="text-[10px] text-[#524534] uppercase tracking-wider">Score</p>
                </div>
              </div>
              <ShareButton getText={() => {
                const grid = roundResults.map(r => r ? '✅' : '❌').join('');
                return `Conference Trivia ${totalCorrect}/10 (${score} pts)\n${grid}\n\ngeneralconference.app`;
              }} />
              <div className="flex gap-2 sm:gap-4 justify-center">
                <button
                  onClick={startGame}
                  className="bg-[#f8f4e4] text-[#f5a623] px-8 py-3 rounded-full font-bold hover:bg-[#f2eede] transition-all active:scale-95"
                >
                  Play Again
                </button>
                <button
                  onClick={() => setGameState('menu')}
                  className="bg-[#f5a623] text-white px-8 py-3 rounded-full font-bold shadow-[0px_8px_20px_rgba(245,166,35,0.2)] transition-all active:scale-95"
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
