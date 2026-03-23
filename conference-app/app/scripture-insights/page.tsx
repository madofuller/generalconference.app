'use client';

import { Suspense } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { PageTabs } from '@/components/tabs';
import { MostCitedContent } from './_components/most-cited-content';
import { HabitsContent } from './_components/habits-content';
import { InfluenceWebContent } from './_components/influence-web-content';

const TABS = [
  { id: 'most-cited', label: 'Most Cited', icon: 'menu_book' },
  { id: 'habits', label: 'Habits', icon: 'auto_stories' },
  { id: 'influence-web', label: 'Influence Web', icon: 'hub' },
];

export default function ScriptureInsightsPage() {
  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 min-w-0 lg:ml-[260px] min-h-screen flex-1" style={{ background: '#fdf9e9' }}>
        <TopAppBar title="Scripture Insights" subtitle="Discover patterns in how scriptures are used across conference" />
        <Suspense fallback={null}>
          <PageTabs tabs={TABS} defaultTab="most-cited">
            {(activeTab) => (
              <>
                {activeTab === 'most-cited' && <MostCitedContent />}
                {activeTab === 'habits' && <HabitsContent />}
                {activeTab === 'influence-web' && <InfluenceWebContent />}
              </>
            )}
          </PageTabs>
        </Suspense>
      </main>
    </div>
  );
}
