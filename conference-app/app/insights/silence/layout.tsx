import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vanished & Emerged Phrases | GeneralConference.app',
  description: 'Discover phrases that have vanished from or emerged in General Conference talks. Track how LDS conference language shifts with terms like covenant path and ministering.',
  openGraph: {
    title: 'Vanished & Emerged Phrases | GeneralConference.app',
    description: 'Discover phrases that have vanished from or emerged in General Conference talks. Track how LDS conference language shifts with terms like covenant path and ministering.',
    url: 'https://generalconference.app/insights/silence',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
