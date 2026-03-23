import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Speaker Similarity Analysis',
  description: 'Find which General Conference speakers sound most alike. Cosine similarity analysis of vocabulary patterns reveals surprising speaker pairs in LDS conference.',
  openGraph: {
    title: 'Speaker Similarity Analysis | GeneralConference.app',
    description: 'Find which General Conference speakers sound most alike. Cosine similarity analysis of vocabulary patterns reveals surprising speaker pairs in LDS conference.',
    url: 'https://generalconference.app/insights/similarity',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
