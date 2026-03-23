import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Search Conference Talks',
  description: 'Search and study LDS General Conference talks by word, phrase, or scripture reference. Browse, filter, and explore the full text of conference addresses.',
  openGraph: {
    title: 'Search Conference Talks | GeneralConference.app',
    description: 'Search and study LDS General Conference talks by word, phrase, or scripture reference. Browse, filter, and explore the full text of conference addresses.',
    url: 'https://generalconference.app/search',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
