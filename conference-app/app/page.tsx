import { Navigation, TopAppBar } from '@/components/navigation';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1">
        <TopAppBar title="GeneralConference.App" subtitle="Inspired messages for modern life" />

        <div className="px-4 sm:px-6 md:px-8 lg:px-12 pb-8 md:pb-24 space-y-6 md:space-y-16">
          {/* Hero Section */}
          <section className="relative pt-6 sm:pt-8 md:pt-12 pb-4 md:pb-8 overflow-hidden">
            <div className="max-w-4xl">
              <h2 className="text-2xl sm:text-3xl md:text-[48px] lg:text-[56px] font-extrabold text-[#1c1c13] leading-[1.15] tracking-tight mb-4 md:mb-6">
                Explore 50+ years of <br className="hidden sm:block" />
                <span className="text-[#1B5E7B]">inspired messages</span>
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-[#1c1c13]/70 leading-relaxed mb-6 md:mb-10 max-w-2xl">
                A warm, welcoming invitation to discover wisdom, peace, and clarity.
                Dive deep into decades of General Conference talks through modern
                search and playful exploration.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link
                  href="/scriptures"
                  className="bg-[#1B5E7B] text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-base sm:text-lg shadow-[0px_8px_24px_rgba(27,94,123,0.2)] hover:shadow-[0px_12px_32px_rgba(245,166,35,0.4)] transition-all active:scale-[0.98] text-center"
                >
                  Start Exploring
                </Link>
                <Link
                  href="/overall"
                  className="bg-white text-[#1B5E7B] px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold text-base sm:text-lg hover:bg-[#f8f4e4] transition-all border border-[#d7c3ae]/20 text-center"
                >
                  View Stats
                </Link>
              </div>
            </div>
            <div className="absolute -right-20 top-0 w-96 h-96 bg-[#f5a623]/10 rounded-full blur-[100px] -z-10" />
          </section>

          {/* Bento Grid */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 md:gap-6">
            {/* Discover Talks */}
            <Link href="/scriptures" className="col-span-1 md:col-span-8 bg-white p-4 sm:p-5 md:p-6 lg:p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] group hover:-translate-y-1 transition-all duration-300 active:scale-[0.99]">
              <div className="flex justify-between items-start mb-4 sm:mb-6 md:mb-12">
                <div>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#1B5E7B]/60 mb-1.5 sm:mb-2 block">Curation</span>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1c1c13]">Discover Talks</h3>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#f5a623]/20 rounded-xl flex items-center justify-center text-[#1B5E7B]">
                  <span className="material-symbols-outlined text-xl sm:text-2xl">search_check</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="p-3 sm:p-5 bg-[#f2eede] rounded-lg">
                  <p className="font-bold text-[#1c1c13] mb-0.5 sm:mb-1 text-sm sm:text-base">Topic Collections</p>
                  <p className="text-xs sm:text-sm text-[#1c1c13]/60">Find every message on Faith, Hope, or Charity.</p>
                </div>
                <div className="p-3 sm:p-5 bg-[#f2eede] rounded-lg">
                  <p className="font-bold text-[#1c1c13] mb-0.5 sm:mb-1 text-sm sm:text-base">Recent Sessions</p>
                  <p className="text-xs sm:text-sm text-[#1c1c13]/60">Catch up on the latest inspired guidance.</p>
                </div>
              </div>
            </Link>

            {/* Ask Anything */}
            <Link href="/claude-play" className="col-span-1 md:col-span-4 bg-[#00668a] text-white p-4 sm:p-5 md:p-6 lg:p-8 rounded-xl shadow-[0px_12px_32px_rgba(0,102,138,0.15)] group hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[200px] sm:min-h-[240px] active:scale-[0.99]">
              <div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                  <span className="material-symbols-outlined text-xl sm:text-2xl">auto_awesome</span>
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-4">Ask Anything</h3>
                <p className="text-white/80 leading-relaxed text-sm sm:text-base">
                  Search by feeling or complex questions. &quot;What has been said about finding peace during job loss?&quot;
                </p>
              </div>
              <div className="mt-4 sm:mt-8">
                <div className="h-10 sm:h-12 bg-white/10 rounded-full flex items-center px-4 backdrop-blur-md border border-white/20">
                  <span className="text-xs sm:text-sm opacity-60">Type your question...</span>
                </div>
              </div>
            </Link>

            {/* See the Big Picture */}
            <Link href="/overall" className="col-span-1 md:col-span-4 bg-[#f8f4e4] p-4 sm:p-5 md:p-6 lg:p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.04)] group hover:-translate-y-1 transition-all duration-300 active:scale-[0.99]">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#8455ef]/20 rounded-xl flex items-center justify-center text-[#6b38d4] mb-4 sm:mb-6">
                <span className="material-symbols-outlined text-xl sm:text-2xl">trending_up</span>
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-[#1c1c13] mb-2 sm:mb-3">See the Big Picture</h3>
              <p className="text-[#1c1c13]/60 mb-4 sm:mb-6 text-sm sm:text-base">Visualize how topics have evolved over 50 years with our interactive trend maps.</p>
              <div className="h-24 sm:h-32 w-full bg-white rounded-lg overflow-hidden relative">
                <div className="absolute inset-0 flex items-end px-2 gap-1">
                  <div className="flex-1 bg-[#8455ef]/40 rounded-t" style={{ height: '30%' }} />
                  <div className="flex-1 bg-[#8455ef]/60 rounded-t" style={{ height: '50%' }} />
                  <div className="flex-1 bg-[#8455ef]/30 rounded-t" style={{ height: '40%' }} />
                  <div className="flex-1 bg-[#8455ef] rounded-t" style={{ height: '80%' }} />
                  <div className="flex-1 bg-[#8455ef]/50 rounded-t" style={{ height: '60%' }} />
                </div>
              </div>
            </Link>

            {/* Have Some Fun */}
            <Link href="/games" className="col-span-1 md:col-span-8 bg-white p-4 sm:p-5 md:p-6 lg:p-8 rounded-xl shadow-[0px_12px_32px_rgba(27,94,123,0.06)] group hover:-translate-y-1 transition-all duration-300 active:scale-[0.99]">
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4 md:mb-8">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#f5a623] rounded-full flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-xl sm:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>sports_esports</span>
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1c1c13]">Have Some Fun</h3>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6">
                {[
                  { emoji: '\u{1F9E9}', title: 'Quote Match', sub: 'Who said that?' },
                  { emoji: '\u{1F3AF}', title: 'Bingo', sub: 'Play along live' },
                  { emoji: '\u{1F4DC}', title: 'Trivia', sub: 'Test yourself' },
                ].map((game) => (
                  <div key={game.title} className="text-center p-2 sm:p-4 rounded-xl hover:bg-[#f2eede] transition-colors">
                    <div className="text-2xl sm:text-4xl mb-1 sm:mb-2">{game.emoji}</div>
                    <p className="font-bold text-[#1c1c13] text-xs sm:text-base">{game.title}</p>
                    <p className="text-[10px] sm:text-xs text-[#1c1c13]/50 hidden sm:block">{game.sub}</p>
                  </div>
                ))}
              </div>
            </Link>
          </section>

          {/* Beloved Voices */}
          <section>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-4 mb-4 md:mb-8">
              <div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1c1c13] mb-1 sm:mb-2">Beloved Voices</h3>
                <p className="text-sm sm:text-base text-[#1c1c13]/60">Revisit the messages from the most frequent conference speakers.</p>
              </div>
              <Link href="/speakers" className="text-[#1B5E7B] font-bold flex items-center gap-2 group text-sm sm:text-base">
                View All Speakers
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-lg sm:text-xl">arrow_forward</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {[
                { name: 'Thomas S. Monson', talks: '238 Talks' },
                { name: 'Gordon B. Hinckley', talks: '212 Talks' },
                { name: 'Boyd K. Packer', talks: '194 Talks' },
                { name: 'Dallin H. Oaks', talks: '156 Talks' },
              ].map((speaker) => (
                <div key={speaker.name} className="bg-white p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center active:scale-[0.98]">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 bg-[#ece8d9] rounded-full mx-auto mb-2 sm:mb-4 flex items-center justify-center border-2 sm:border-4 border-[#fdf9e9]">
                    <span className="material-symbols-outlined text-[#1B5E7B] text-2xl sm:text-4xl">person</span>
                  </div>
                  <p className="font-bold text-[#1c1c13] text-sm sm:text-base leading-tight">{speaker.name}</p>
                  <p className="text-xs sm:text-sm text-[#1B5E7B]">{speaker.talks}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="px-4 sm:px-6 md:px-8 lg:px-12 py-8 sm:py-12 bg-[#ece8d9]/30 border-t border-[#d7c3ae]/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-8">
            <div className="text-lg sm:text-xl font-bold text-[#1c1c13]">
              GeneralConference<span className="text-[#F5A623]">.App</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-xs sm:text-sm font-medium text-[#1c1c13]/60">
              <span className="hover:text-[#1B5E7B] transition-colors cursor-pointer">Privacy Policy</span>
              <span className="hover:text-[#1B5E7B] transition-colors cursor-pointer">Terms of Service</span>
              <span className="hover:text-[#1B5E7B] transition-colors cursor-pointer">Feedback</span>
            </div>
            <div className="text-xs sm:text-sm text-[#1c1c13]/40">&copy; 2024 GeneralConference.App</div>
          </div>
        </footer>
      </main>

      {/* FAB */}
      <Link
        href="/claude-play"
        className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 w-14 h-14 sm:w-16 sm:h-16 bg-[#1B5E7B] text-white rounded-full shadow-[0px_12px_32px_rgba(27,94,123,0.3)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
      >
        <span className="material-symbols-outlined text-2xl sm:text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
      </Link>
    </div>
  );
}
