'use client';

import { Suspense } from 'react';
import { Navigation, TopAppBar } from '@/components/navigation';
import { PageTabs } from '@/components/tabs';
import { JourneysContent } from './_components/journeys-content';
import { LeaderboardContent } from './_components/leaderboard-content';
import { ServiceContent } from './_components/service-content';
import { CareersContent } from './_components/careers-content';
import { SimilarityContent } from './_components/similarity-content';

const TABS = [
  { id: 'journeys', label: 'Journeys', icon: 'route' },
  { id: 'leaderboard', label: 'Leaderboard', icon: 'leaderboard' },
  { id: 'service', label: 'Service', icon: 'timeline' },
  { id: 'careers', label: 'Callings', icon: 'trending_up' },
  { id: 'similarity', label: 'Similarity', icon: 'compare_arrows' },
];

export default function SpeakerHubPage() {
  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="ml-0 lg:ml-[260px] min-h-screen flex-1 min-w-0 overflow-x-hidden pt-20 lg:pt-0" style={{ background: '#fdf9e9' }}>
        <TopAppBar title="Speaker Insights" subtitle="Explore speaker journeys, stats, and patterns" />
        <Suspense fallback={null}>
          <PageTabs tabs={TABS} defaultTab="journeys">
            {(activeTab) => (
              <>
                {activeTab === 'journeys' && <JourneysContent />}
                {activeTab === 'leaderboard' && <LeaderboardContent />}
                {activeTab === 'service' && <ServiceContent />}
                {activeTab === 'careers' && <CareersContent />}
                {activeTab === 'similarity' && <SimilarityContent />}
              </>
            )}
          </PageTabs>
        </Suspense>
      </main>
    </div>
  );
}
