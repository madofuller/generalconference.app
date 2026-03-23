'use client';

import { Suspense } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { PageTabs, Tab } from '@/components/tabs';
import { ApostlesContent } from './_components/apostles-content';
import { TimelineContent } from './_components/timeline-content';
import { SeventiesContent } from './_components/seventies-content';
import { WomenContent } from './_components/women-content';
import { RosterContent } from './_components/roster-content';

const tabs: Tab[] = [
  { id: 'apostles', label: 'Apostles', icon: 'shield_person' },
  { id: 'timeline', label: 'Timeline', icon: 'timeline' },
  { id: 'seventies', label: 'Seventies', icon: 'groups' },
  { id: 'women', label: 'Women', icon: 'person_celebrate' },
  { id: 'roster', label: "Who's Due", icon: 'assignment_ind' },
];

export default function PeoplePage() {
  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1 min-w-0 overflow-x-hidden" style={{ background: '#fdf9e9' }}>
        <TopAppBar title="People" subtitle="Apostles, Seventies, Women leaders, and speaker tracking" />
        <Suspense fallback={null}>
          <PageTabs tabs={tabs} defaultTab="apostles">
            {(activeTab) => (
              <div className="pt-4 md:pt-6">
                {activeTab === 'apostles' && <ApostlesContent />}
                {activeTab === 'timeline' && <TimelineContent />}
                {activeTab === 'seventies' && <SeventiesContent />}
                {activeTab === 'women' && <WomenContent />}
                {activeTab === 'roster' && <RosterContent />}
              </div>
            )}
          </PageTabs>
        </Suspense>
      </main>
    </div>
  );
}
