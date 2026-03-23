import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Overall Conference Statistics',
  description: 'View comprehensive LDS General Conference statistics: talk counts by decade, word counts, speaker distributions, topic trends, and historical data.',
  openGraph: {
    title: 'Overall Conference Statistics | GeneralConference.app',
    description: 'View comprehensive LDS General Conference statistics: talk counts by decade, word counts, speaker distributions, topic trends, and historical data.',
    url: 'https://generalconference.app/overall',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
