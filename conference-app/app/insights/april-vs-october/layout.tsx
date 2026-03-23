import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'April vs October Conference',
  description: 'Compare April and October General Conference sessions side by side. Discover differences in talk counts, word lengths, Christ mentions, and speaker rosters.',
  openGraph: {
    title: 'April vs October Conference | GeneralConference.app',
    description: 'Compare April and October General Conference sessions side by side. Discover differences in talk counts, word lengths, Christ mentions, and speaker rosters.',
    url: 'https://generalconference.app/insights/april-vs-october',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
