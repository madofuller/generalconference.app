import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conference Sessions by Year',
  description: 'Explore individual LDS General Conference sessions by year. View talk lineups, speaker rosters, topic breakdowns, and session statistics.',
  openGraph: {
    title: 'Conference Sessions by Year | GeneralConference.app',
    description: 'Explore individual LDS General Conference sessions by year. View talk lineups, speaker rosters, topic breakdowns, and session statistics.',
    url: 'https://generalconference.app/conferences',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
