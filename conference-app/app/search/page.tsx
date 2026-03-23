'use client';

import { Suspense } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { PageTabs } from '@/components/tabs';
import { WordSearchContent } from './_components/word-search-content';
import { PhraseSearchContent } from './_components/phrase-search-content';
import { ScriptureSearchContent } from './_components/scripture-search-content';
import { TalksContent } from './_components/talks-content';

const TABS = [
  { id: 'talks', label: 'Browse', icon: 'description' },
  { id: 'words', label: 'Words', icon: 'text_fields' },
  { id: 'phrases', label: 'Phrases', icon: 'format_quote' },
  { id: 'scriptures', label: 'Scriptures', icon: 'menu_book' },
];

export default function SearchPage() {
  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1 min-w-0 overflow-x-hidden pt-20 lg:pt-0 pt-20 lg:pt-0" style={{ background: '#fdf9e9' }}>
        <TopAppBar title="Search & Study" subtitle="Browse, search, and explore conference talks" />
        <Suspense fallback={<div className="px-4 md:px-8 lg:px-12 py-20 text-center text-[#1c1c13]/40">Loading...</div>}>
          <PageTabs tabs={TABS} defaultTab="talks">
            {(activeTab) => (
              <>
                {activeTab === 'talks' && <TalksContent />}
                {activeTab === 'words' && <WordSearchContent />}
                {activeTab === 'phrases' && <PhraseSearchContent />}
                {activeTab === 'scriptures' && <ScriptureSearchContent />}
              </>
            )}
          </PageTabs>
        </Suspense>
      </main>
    </div>
  );
}
