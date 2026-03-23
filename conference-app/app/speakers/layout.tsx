import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Speaker Analytics & Profiles',
  description: 'Explore LDS General Conference speaker profiles, talk counts, service timelines, career journeys, similarity analysis, and rhetorical fingerprints.',
  openGraph: {
    title: 'Speaker Analytics & Profiles | GeneralConference.app',
    description: 'Explore LDS General Conference speaker profiles, talk counts, service timelines, career journeys, similarity analysis, and rhetorical fingerprints.',
    url: 'https://generalconference.app/speakers',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
