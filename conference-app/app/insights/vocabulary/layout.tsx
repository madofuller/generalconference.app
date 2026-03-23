import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Speaker Vocabulary Fingerprints | GeneralConference.app',
  description: 'Explore unique vocabulary fingerprints of LDS General Conference speakers. Analyze speaking styles, topic preferences, and rhetorical patterns across decades of talks.',
  openGraph: {
    title: 'Speaker Vocabulary Fingerprints | GeneralConference.app',
    description: 'Explore unique vocabulary fingerprints of LDS General Conference speakers. Analyze speaking styles, topic preferences, and rhetorical patterns across decades of talks.',
    url: 'https://generalconference.app/insights/vocabulary',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
