import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Speaker Leaderboard | GeneralConference.app',
  description: 'View the all-time LDS General Conference speaker leaderboard. See who has given the most talks, compare speaker statistics, and explore conference talk counts.',
  openGraph: {
    title: 'Speaker Leaderboard | GeneralConference.app',
    description: 'View the all-time LDS General Conference speaker leaderboard. See who has given the most talks, compare speaker statistics, and explore conference talk counts.',
    url: 'https://generalconference.app/insights/speakers',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
