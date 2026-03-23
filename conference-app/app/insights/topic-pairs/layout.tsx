import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Topic Pairs Analysis',
  description: 'Discover which General Conference topics appear together most often. Explore co-occurring themes and paired subjects across decades of LDS conference talks.',
  openGraph: {
    title: 'Topic Pairs Analysis | GeneralConference.app',
    description: 'Discover which General Conference topics appear together most often. Explore co-occurring themes and paired subjects across decades of LDS conference talks.',
    url: 'https://generalconference.app/insights/topic-pairs',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
