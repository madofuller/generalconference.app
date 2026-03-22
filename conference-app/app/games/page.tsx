'use client';

import { Navigation, TopAppBar } from '@/components/navigation';
import Link from 'next/link';

const games = [
  {
    title: 'Trivia Master',
    description: 'Test your memory on recent conference themes and speaker highlights.',
    icon: 'quiz',
    href: '/games/trivia',
    color: 'bg-[#f5a623]',
    questions: '25 Questions',
  },
  {
    title: 'Quote Match',
    description: 'Can you attribute these powerful words to the right speaker?',
    icon: 'menu_book',
    href: '/games/quote-match',
    color: 'bg-[#8455ef]',
    questions: '18 Questions',
  },
  {
    title: 'Conference Bingo',
    description: 'A family favorite! Listen for key topics and mark your board.',
    icon: 'grid_view',
    href: '/games/bingo',
    color: 'bg-[#40c2fd]',
    questions: 'Live Play',
  },
];

export default function GamesHub() {
  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1">
        <TopAppBar title="Games Hub" subtitle="Strengthen your testimony through play" />

        <div className="px-4 md:px-8 lg:px-12 pb-12 md:pb-24 space-y-8 md:space-y-16">
          {/* Hero */}
          <section className="pt-8">
            <div className="inline-block px-4 py-1.5 bg-[#f5a623]/20 rounded-full text-[#1B5E7B] text-xs font-bold uppercase tracking-widest mb-6">
              Play & Learn
            </div>
            <h2 className="text-3xl md:text-[40px] lg:text-[48px] font-extrabold text-[#1c1c13] leading-[1.1] tracking-tight mb-4">
              Have Some <span className="text-[#f5a623] italic">Fun!</span>
            </h2>
            <p className="text-lg text-[#1c1c13]/70 leading-relaxed max-w-2xl mb-6 md:mb-12">
              Experience the words of the prophets in a whole new way. Challenge your knowledge, match inspired quotes, and find joy in the journey.
            </p>

            {/* Game Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {games.map((game) => (
                <Link
                  key={game.title}
                  href={game.href}
                  className="bg-white p-4 md:p-6 lg:p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center group"
                >
                  <div className={`w-16 h-16 ${game.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
                    <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{game.icon}</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#1c1c13] mb-2">{game.title}</h3>
                  <p className="text-sm text-[#1c1c13]/60 mb-6 leading-relaxed">{game.description}</p>
                  <span className="mt-auto bg-[#1B5E7B] text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-[0px_8px_20px_rgba(27,94,123,0.2)] hover:shadow-[0px_12px_32px_rgba(245,166,35,0.4)] transition-all">
                    Start Playing
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Daily Challenge */}
          <section className="bg-[#f8f4e4] p-5 md:p-8 lg:p-10 rounded-xl relative overflow-hidden">
            <div className="absolute top-4 right-4 w-10 h-10 bg-[#f5a623] rounded-full flex items-center justify-center text-white">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-[#1c1c13] mb-3 italic">Daily Spiritual Challenge</h3>
            <p className="text-[#1c1c13]/70 mb-8 max-w-lg">
              Earn badges and keep your &quot;Study Streak&quot; alive by completing daily mini-games and quizzes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
              {[
                { icon: 'local_fire_department', value: '12 Days', label: 'Streak' },
                { icon: 'workspace_premium', value: '8 Badges', label: 'Earned' },
                { icon: 'diamond', value: '450 XP', label: 'Total' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white px-6 py-4 rounded-xl flex items-center gap-3 shadow-sm">
                  <span className="material-symbols-outlined text-[#1B5E7B]" style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
                  <div>
                    <p className="text-lg font-bold text-[#1c1c13]">{stat.value}</p>
                    <p className="text-xs text-[#1c1c13]/50">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
