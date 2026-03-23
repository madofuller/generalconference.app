import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Word Search in Conference Talks',
  description: 'Search for any word across all LDS General Conference talks. See frequency, trends over time, and which speakers use specific words most often.',
  openGraph: {
    title: 'Word Search in Conference Talks | GeneralConference.app',
    description: 'Search for any word across all LDS General Conference talks. See frequency, trends over time, and which speakers use specific words most often.',
    url: 'https://generalconference.app/word-search',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
