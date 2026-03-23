import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Scripture References Analysis | GeneralConference.app',
  description: 'Explore scripture citation data from LDS General Conference. See the most-referenced verses, books, and volumes with links to the Gospel Library.',
  openGraph: {
    title: 'Scripture References Analysis | GeneralConference.app',
    description: 'Explore scripture citation data from LDS General Conference. See the most-referenced verses, books, and volumes with links to the Gospel Library.',
    url: 'https://generalconference.app/insights/scriptures',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
