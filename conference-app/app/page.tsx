import { Navigation, TopAppBar } from '@/components/navigation';
import Link from 'next/link';

const FEATURE_CARDS = [
  {
    href: '/search',
    label: 'Search & Study',
    title: 'Search Talks',
    description: 'Browse every talk, search by words, phrases, or scriptures.',
    icon: 'search',
    color: '#1B5E7B',
    span: 'md:col-span-8',
    pills: ['Browse', 'Words', 'Phrases', 'Scriptures'],
  },
  {
    href: '/overall',
    label: 'Overview',
    title: 'The Big Picture',
    description: 'Stats, trends, and patterns across all conferences.',
    icon: 'trending_up',
    color: '#8455ef',
    span: 'md:col-span-4',
  },
  {
    href: '/people',
    label: 'People',
    title: 'People Directory',
    description: 'Apostles, Seventies, Women leaders, and the full speaker roster.',
    icon: 'groups',
    color: '#1B5E7B',
    span: 'md:col-span-4',
    pills: ['Apostles', 'Seventies', 'Women', 'Roster'],
  },
  {
    href: '/speakers',
    label: 'Speakers',
    title: 'Speaker Insights',
    description: 'Journey profiles, leaderboards, career paths, fingerprints, and similarity.',
    icon: 'route',
    color: '#f5a623',
    span: 'md:col-span-4',
    pills: ['Journeys', 'Leaderboard', 'Callings', 'Fingerprint'],
  },
  {
    href: '/scripture-insights',
    label: 'Scriptures',
    title: 'Scripture Insights',
    description: 'Most cited scriptures, citation habits, and the influence web.',
    icon: 'menu_book',
    color: '#10b981',
    span: 'md:col-span-4',
  },
];

const DISCOVERY_LINKS = [
  { href: '/insights/christ', icon: 'favorite', label: 'Name of Christ' },
  { href: '/insights/language', icon: 'translate', label: 'Language Evolution' },
  { href: '/insights/emotional-arc', icon: 'show_chart', label: 'Emotional Arc' },
  { href: '/insights/doctrinal-pendulum', icon: 'balance', label: 'Doctrinal Pendulum' },
  { href: '/insights/silence', icon: 'volume_off', label: 'The Silence' },
  { href: '/insights/talk-dna', icon: 'fingerprint', label: 'Talk DNA' },
  { href: '/insights/calling-effect', icon: 'swap_vert', label: 'Calling Effect' },
  { href: '/insights/repetition', icon: 'swap_horiz', label: 'Thematic Shifts' },
  { href: '/insights/openings', icon: 'start', label: 'How Talks Begin' },
  { href: '/insights/prophet-eras', icon: 'church', label: 'Prophet Eras' },
  { href: '/membership', icon: 'trending_up', label: 'Church Growth' },
  { href: '/temples', icon: 'temple_buddhist', label: 'Temples' },
];

const GAMES = [
  { href: '/games/wordle', icon: 'grid_on', label: 'Wordle' },
  { href: '/games/connections', icon: 'apps', label: 'Connections' },
  { href: '/games/decade-detective', icon: 'history_edu', label: 'Decade Detective' },
  { href: '/games/title-or-not', icon: 'psychology', label: 'Real or Fake?' },
  { href: '/games/finish-quote', icon: 'edit_note', label: 'Finish the Quote' },
  { href: '/games/trivia', icon: 'quiz', label: 'Trivia' },
  { href: '/games/bingo', icon: 'grid_view', label: 'Bingo' },
];

export default function Home() {
  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1 overflow-x-hidden pt-20 lg:pt-0" style={{ background: '#fdf9e9' }}>
        <TopAppBar title="GeneralConference.app" hideEraToggle />

        <div className="px-4 sm:px-6 md:px-8 lg:px-12 pb-20 md:pb-24 space-y-8 md:space-y-14">
          {/* Hero */}
          <section className="pt-4 sm:pt-8 md:pt-12 pb-2 md:pb-4">
            <div className="max-w-4xl">
              <h2 className="text-[28px] sm:text-3xl md:text-[48px] lg:text-[56px] font-extrabold text-[#1c1c13] leading-[1.15] tracking-tight mb-3 md:mb-6">
                Explore 50+ years of <br className="hidden sm:block" />
                <span className="text-[#1B5E7B]">inspired messages</span>
              </h2>
              <p className="text-[15px] sm:text-lg md:text-xl text-[#1c1c13]/70 leading-relaxed mb-5 md:mb-10 max-w-2xl">
                Search every conference talk, explore speaker journeys, discover scripture patterns,
                and play games — all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link
                  href="/search"
                  className="bg-[#1B5E7B] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-[15px] sm:text-lg shadow-[0px_8px_24px_rgba(27,94,123,0.2)] hover:shadow-[0px_12px_32px_rgba(245,166,35,0.4)] transition-all active:scale-[0.98] text-center"
                >
                  Start Exploring
                </Link>
                <Link
                  href="/games"
                  className="bg-white text-[#1B5E7B] px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-[15px] sm:text-lg hover:bg-[#f8f4e4] transition-all border border-[#d7c3ae]/20 text-center"
                >
                  Play Games
                </Link>
              </div>
            </div>
          </section>

          {/* Feature Bento Grid */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-5">
            {FEATURE_CARDS.map(card => (
              <Link
                key={card.href}
                href={card.href}
                className={`${card.span} col-span-1 bg-white p-5 md:p-6 lg:p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] group hover:-translate-y-1 transition-all duration-300 active:scale-[0.99]`}
              >
                <div className="flex justify-between items-start mb-3 md:mb-5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1c1c13]/40 mb-1 block">{card.label}</span>
                    <h3 className="text-lg md:text-2xl font-bold text-[#1c1c13]">{card.title}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${card.color}20` }}>
                    <span className="material-symbols-outlined text-xl" style={{ color: card.color }}>{card.icon}</span>
                  </div>
                </div>
                <p className="text-sm text-[#1c1c13]/60 mb-3">{card.description}</p>
                {card.pills && (
                  <div className="flex flex-wrap gap-1.5">
                    {card.pills.map(pill => (
                      <span key={pill} className="px-2.5 py-1 rounded-full bg-[#f8f4e4] text-[10px] font-bold uppercase tracking-wider text-[#1c1c13]/50">
                        {pill}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </section>

          {/* Insights & Discoveries */}
          <section>
            <div className="flex justify-between items-end mb-4 md:mb-6">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-[#1c1c13] mb-1">Insights & Discoveries</h3>
                <p className="text-sm text-[#1c1c13]/50">Unique analyses you won't find anywhere else.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
              {DISCOVERY_LINKS.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 bg-white p-3 md:p-4 rounded-xl shadow-[0px_4px_16px_rgba(27,94,123,0.04)] hover:shadow-[0px_8px_24px_rgba(27,94,123,0.08)] hover:-translate-y-0.5 transition-all active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[#1B5E7B] text-xl shrink-0">{item.icon}</span>
                  <span className="text-xs md:text-sm font-bold text-[#1c1c13] leading-tight">{item.label}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Games */}
          <section>
            <div className="flex justify-between items-end mb-4 md:mb-6">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-[#1c1c13] mb-1">Games & Fun</h3>
                <p className="text-sm text-[#1c1c13]/50">Test your knowledge and play along during conference.</p>
              </div>
              <Link href="/games" className="text-[#1B5E7B] font-bold flex items-center gap-1 text-sm hover:gap-2 transition-all">
                All Games
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
              {GAMES.map(game => (
                <Link
                  key={game.href}
                  href={game.href}
                  className="flex items-center gap-3 bg-white p-3 md:p-4 rounded-xl shadow-[0px_4px_16px_rgba(27,94,123,0.04)] hover:shadow-[0px_8px_24px_rgba(27,94,123,0.08)] hover:-translate-y-0.5 transition-all active:scale-[0.98]"
                >
                  <div className="w-9 h-9 bg-[#f5a623]/20 rounded-lg flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#f5a623] text-lg">{game.icon}</span>
                  </div>
                  <span className="text-xs md:text-sm font-bold text-[#1c1c13]">{game.label}</span>
                </Link>
              ))}
            </div>
          </section>

        </div>

        {/* Footer */}
        <footer className="px-4 sm:px-6 md:px-8 lg:px-12 py-8 bg-[#ece8d9]/30 border-t border-[#d7c3ae]/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-lg font-extrabold tracking-tight text-[#1c1c13]">
              GeneralConference<span className="text-[#1B5E7B]">.app</span>
            </div>
            <div className="text-xs text-[#1c1c13]/40 text-center max-w-md">
              Not affiliated with The Church of Jesus Christ of Latter-day Saints. All conference talk content belongs to its respective copyright holders.
            </div>
            <div className="flex flex-col items-center md:items-end gap-1">
              <div className="text-xs text-[#1c1c13]/40 flex items-center gap-1.5">
                Built by{' '}
                <a href="https://github.com/madofuller" target="_blank" rel="noopener noreferrer" className="text-[#1B5E7B]/60 hover:text-[#1B5E7B] transition-colors font-medium inline-flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                  madofuller
                </a>
              </div>
              <div className="text-xs text-[#1c1c13]/40">&copy; 2026 GeneralConference.app</div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
