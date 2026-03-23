'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useFilters } from '@/lib/filter-context';
import { SearchTrigger } from '@/components/global-search';

const navItems = [
  {
    section: null,
    items: [
      { name: 'Home', href: '/', icon: 'home' },
      { name: 'The Big Picture', href: '/overall', icon: 'dashboard' },
    ],
  },
  {
    section: 'Search & Study',
    items: [
      { name: 'Search', href: '/search', icon: 'search' },
      { name: 'Topics Explorer', href: '/topics', icon: 'category' },
      { name: 'Emotions Explorer', href: '/emotions', icon: 'mood' },
    ],
  },
  {
    section: 'People',
    items: [
      { name: 'People Directory', href: '/people', icon: 'groups' },
      { name: 'Speaker Insights', href: '/speakers', icon: 'route' },
    ],
  },
  {
    section: 'Insights',
    items: [
      { name: 'Scripture Insights', href: '/scripture-insights', icon: 'menu_book' },
      { name: 'Name of Christ', href: '/insights/christ', icon: 'favorite' },
      { name: 'Language Evolution', href: '/insights/language', icon: 'translate' },
      { name: 'Talk Length', href: '/insights/talk-length', icon: 'schedule' },
      { name: "Women's Trends", href: '/insights/women', icon: 'trending_up' },
      { name: 'New Voices', href: '/insights/new-voices', icon: 'person_add' },
      { name: 'Prophet Eras', href: '/insights/prophet-eras', icon: 'history' },
    ],
  },
  {
    section: 'Deep Dives',
    items: [
      { name: 'April vs October', href: '/insights/april-vs-october', icon: 'compare' },
      { name: 'How Talks Begin', href: '/insights/openings', icon: 'start' },
      { name: 'Topic Pairs', href: '/insights/topic-pairs', icon: 'hub' },
      { name: 'Through History', href: '/insights/history', icon: 'history_edu' },
      { name: 'Church Growth', href: '/membership', icon: 'trending_up' },
      { name: 'Temples', href: '/temples', icon: 'temple_buddhist' },
    ],
  },
  {
    section: 'Discoveries',
    items: [
      { name: 'Emotional Arc', href: '/insights/emotional-arc', icon: 'show_chart' },
      { name: 'Doctrinal Pendulum', href: '/insights/doctrinal-pendulum', icon: 'balance' },
      { name: 'Lost & Found', href: '/insights/silence', icon: 'swap_horiz' },
      { name: 'Talk DNA', href: '/insights/talk-dna', icon: 'fingerprint' },
      { name: 'The Calling Effect', href: '/insights/calling-effect', icon: 'swap_vert' },
      { name: 'Thematic Shifts', href: '/insights/repetition', icon: 'swap_horiz' },
    ],
  },
  {
    section: 'Games & Fun',
    items: [
      { name: 'Conference Wordle', href: '/games/wordle', icon: 'grid_on' },
      { name: 'Connections', href: '/games/connections', icon: 'apps' },
      { name: 'Decade Detective', href: '/games/decade-detective', icon: 'history_edu' },
      { name: 'Real or Fake?', href: '/games/title-or-not', icon: 'psychology' },
      { name: 'Finish the Quote', href: '/games/finish-quote', icon: 'edit_note' },
      { name: 'Trivia', href: '/games/trivia', icon: 'quiz' },
      { name: 'Bingo', href: '/games/bingo', icon: 'grid_view' },
    ],
  },
];

function MaterialIcon({ name, filled = false, className = '' }: { name: string; filled?: boolean; className?: string }) {
  return (
    <span
      className={cn('material-symbols-outlined', className)}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}

function NavContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto pr-2 -mr-2">
        {navItems.map((group, gi) => (
          <div key={gi} className="mb-1">
            {group.section && (
              <div className="pt-3 pb-1 px-4 text-[10px] font-bold text-[#1c1c13]/40 uppercase tracking-[0.2em]">
                {group.section}
              </div>
            )}
            {group.items.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/' && item.href !== '/games' && pathname.startsWith(item.href + '/'));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2 rounded-full transition-all duration-300',
                    isActive
                      ? 'bg-[#f5a623]/20 text-[#1B5E7B] font-bold'
                      : 'text-[#1c1c13]/70 hover:text-[#1B5E7B] hover:bg-[#f5a623]/10'
                  )}
                >
                  <MaterialIcon name={item.icon} filled={isActive} />
                  <span className="text-[10px] uppercase tracking-wider font-bold">
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Data Credits */}
      <div className="pt-3 border-t border-[#1c1c13]/10 shrink-0">
        <p className="text-[9px] text-[#1c1c13]/30 leading-relaxed px-2">
          Built by{' '}
          <a href="https://github.com/madofuller" target="_blank" rel="noopener noreferrer" className="text-[#1B5E7B]/50 hover:underline">
            madofuller
          </a>
          {' '}&middot;{' '}
          Talk data by{' '}
          <a href="https://github.com/lukejoneslj/GeneralConferenceScraper" target="_blank" rel="noopener noreferrer" className="text-[#1B5E7B]/50 hover:underline">
            lukejoneslj
          </a>
          {' '}&middot;{' '}
          Historical data by{' '}
          <a href="https://github.com/qhspencer/lds-data-analysis" target="_blank" rel="noopener noreferrer" className="text-[#1B5E7B]/50 hover:underline">
            qhspencer
          </a>
        </p>
      </div>

    </>
  );
}

export function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[260px] h-full fixed left-0 top-0 bg-[#fdf9e9] flex-col p-6 space-y-6 shadow-[0px_12px_32px_rgba(27,94,123,0.08)] z-50 overflow-hidden">
        <Link href="/" className="flex items-center gap-0.5 text-[14px] font-bold text-[#1c1c13] shrink-0">
          GeneralConference<span className="text-[#F5A623]">.app</span>
        </Link>
        <SearchTrigger />
        <NavContent pathname={pathname} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside className={cn(
        'lg:hidden fixed left-0 top-0 h-full w-[280px] bg-[#fdf9e9] flex flex-col p-6 space-y-6 shadow-[0px_12px_32px_rgba(27,94,123,0.12)] z-50 transition-transform duration-300 overflow-hidden',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between shrink-0">
          <Link href="/" onClick={() => setMobileOpen(false)} className="text-[14px] font-bold text-[#1c1c13]">
            GeneralConference<span className="text-[#F5A623]">.app</span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="p-2 rounded-full hover:bg-[#f5a623]/10 active:bg-[#f5a623]/20" aria-label="Close navigation menu">
            <MaterialIcon name="close" />
          </button>
        </div>
        <NavContent pathname={pathname} onNavigate={() => setMobileOpen(false)} />
      </aside>

      {/* Mobile top bar: hamburger + centered branding */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-center h-20 pt-4 bg-[#fdf9e9]/90 backdrop-blur-md"
        style={{ display: mobileOpen ? 'none' : undefined }}
      >
        <button
          className="absolute left-4 w-11 h-11 rounded-full bg-[#fdf9e9] shadow-md flex items-center justify-center text-[#1B5E7B] active:bg-[#f5a623]/20 transition-colors z-50"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
        >
          <MaterialIcon name="menu" />
        </button>
        <Link href="/" className="text-[13px] font-bold text-[#1c1c13]">
          GeneralConference<span className="text-[#F5A623]">.app</span>
        </Link>
      </div>
    </>
  );
}

export function LivingToggle() {
  const { livingOnly, setLivingOnly } = useFilters();

  return (
    <button
      onClick={() => setLivingOnly(!livingOnly)}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all',
        livingOnly
          ? 'bg-[#f5a623] text-white shadow-md'
          : 'bg-[#f8f4e4] text-[#1c1c13]/50 hover:bg-[#f5a623]/20'
      )}
      title={livingOnly ? 'Showing living speakers only — click to show all' : 'Showing all speakers — click to filter to living only'}
    >
      <MaterialIcon name={livingOnly ? 'person' : 'groups'} className="text-base" />
      <span className="hidden sm:inline">{livingOnly ? 'Living Only' : 'All Speakers'}</span>
    </button>
  );
}

export function DataEraToggle() {
  const { dataEra, setDataEra } = useFilters();

  // Historical/All eras hidden for now — data is still available, just not exposed in UI yet
  const options: { value: 'modern' | 'historical' | 'all'; label: string; shortLabel: string; icon: string }[] = [
    { value: 'modern', label: '1971 Onward', shortLabel: '1971+', icon: 'verified' },
    // { value: 'historical', label: '1839 – 1970', shortLabel: '1839+', icon: 'history_edu' },
    // { value: 'all', label: 'All Years', shortLabel: 'All', icon: 'select_all' },
  ];

  // Hide toggle entirely when only one era option is available
  if (options.length <= 1) return null;

  return (
    <div className="flex items-center gap-0.5 bg-[#f8f4e4] rounded-full p-0.5">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => setDataEra(opt.value)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all',
            dataEra === opt.value
              ? 'bg-[#1B5E7B] text-white shadow-md'
              : 'text-[#1c1c13]/50 hover:text-[#1B5E7B] hover:bg-[#f5a623]/10'
          )}
          title={opt.label}
        >
          <MaterialIcon name={opt.icon} className="text-sm" />
          <span className="hidden sm:inline">{opt.label}</span>
          <span className="sm:hidden">{opt.shortLabel}</span>
        </button>
      ))}
    </div>
  );
}

export function TopAppBar({ title, subtitle, hideEraToggle = false, scrollsAway = false }: { title: string; subtitle?: string; hideEraToggle?: boolean; scrollsAway?: boolean }) {
  const { dataEra } = useFilters();

  return (
    <header className={`${scrollsAway ? 'lg:sticky lg:top-0' : 'sticky top-20 lg:top-0'} w-full z-30 bg-[#fdf9e9]/80 backdrop-blur-xl px-4 py-3 md:px-8 md:py-4`}>
      <div className="flex justify-between items-center">
        <div className="lg:ml-0">
          <h1 className="text-lg md:text-2xl font-bold text-[#1c1c13] tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs md:text-sm font-medium text-[#1c1c13]/60 hidden sm:block">{subtitle}</p>
          )}
        </div>
        {!hideEraToggle && (
          <div className="flex items-center gap-2 md:gap-4">
            <DataEraToggle />
          </div>
        )}
      </div>
      {dataEra !== 'modern' && (
        <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <MaterialIcon name="info" className="text-amber-600 text-base flex-shrink-0" />
          <p className="text-[10px] md:text-xs text-amber-800">
            {dataEra === 'historical'
              ? 'Showing pre-1971 data from the Journal of Discourses (1839–1886) and historical conference reports (1880–1970). Older texts may contain OCR errors.'
              : 'Includes pre-1971 data from the Journal of Discourses and historical conference reports. Older texts may contain OCR errors.'}
          </p>
        </div>
      )}
    </header>
  );
}
