import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conference Bingo',
  description: 'Play General Conference Bingo with custom cards featuring common phrases, topics, and speaker references from LDS General Conference talks.',
  openGraph: {
    title: 'Conference Bingo | GeneralConference.app',
    description: 'Play General Conference Bingo with custom cards featuring common phrases, topics, and speaker references from LDS General Conference talks.',
    url: 'https://generalconference.app/games/bingo',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
