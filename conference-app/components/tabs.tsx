'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface Tab {
  id: string;
  label: string;
  icon: string;
}

interface PageTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  children: (activeTab: string) => React.ReactNode;
}

export function PageTabs({ tabs, defaultTab, children }: PageTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || defaultTab || tabs[0]?.id || '');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (tabParam && tabs.some(t => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam, tabs]);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, tabs]);

  // Scroll active tab into view within the container (not the page)
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const active = container.querySelector(`[data-tab-id="${activeTab}"]`) as HTMLElement | null;
    if (!active) return;

    const containerRect = container.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    const offset = activeRect.left - containerRect.left - (containerRect.width / 2) + (activeRect.width / 2);
    container.scrollBy({ left: offset, behavior: 'smooth' });
  }, [activeTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <>
      {/* Tab Bar */}
      <div className="sticky top-[132px] lg:top-[64px] z-20 bg-[#fdf9e9]/90 backdrop-blur-md border-b border-[#ece8d9]">
        <div className="relative overflow-hidden">
          {/* Left fade */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#fdf9e9] to-transparent z-10 pointer-events-none" />
          )}
          {/* Right fade */}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#fdf9e9] to-transparent z-10 pointer-events-none" />
          )}

          <div
            ref={scrollRef}
            className="flex gap-1 overflow-x-auto scrollbar-hide px-4 md:px-8 lg:px-12 py-2"
          >
            {tabs.map(tab => (
              <button
                key={tab.id}
                data-tab-id={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 md:px-4 py-2.5 border-b-2 rounded-none text-[10px] md:text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all shrink-0',
                  activeTab === tab.id
                    ? 'border-[#f5a623] text-[#1B5E7B] bg-[#f5a623]/10'
                    : 'border-transparent text-[#1c1c13]/30 hover:text-[#1B5E7B] hover:border-[#1c1c13]/10'
                )}
              >
                <span className="material-symbols-outlined text-[14px] md:text-[16px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {children(activeTab)}
    </>
  );
}
