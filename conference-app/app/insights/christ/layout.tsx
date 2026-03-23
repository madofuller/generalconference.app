import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Christ-Centered Language Tracker | GeneralConference.app',
  description: 'Track references to Jesus Christ in LDS General Conference talks over time. Analyze how Christ-centered language has evolved across decades of conference addresses.',
  openGraph: {
    title: 'Christ-Centered Language Tracker | GeneralConference.app',
    description: 'Track references to Jesus Christ in LDS General Conference talks over time. Analyze how Christ-centered language has evolved across decades of conference addresses.',
    url: 'https://generalconference.app/insights/christ',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
