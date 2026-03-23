import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Phrase Search in Conference Talks',
  description: 'Search for exact phrases across all LDS General Conference talks. Find specific quotes, doctrinal phrases, and recurring expressions by speakers.',
  openGraph: {
    title: 'Phrase Search in Conference Talks | GeneralConference.app',
    description: 'Search for exact phrases across all LDS General Conference talks. Find specific quotes, doctrinal phrases, and recurring expressions by speakers.',
    url: 'https://generalconference.app/phrase-search',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
