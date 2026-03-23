import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Scripture Insights',
  description: 'Discover how scriptures are used in LDS General Conference. See most-cited verses, speaker citation habits, and scripture influence patterns.',
  openGraph: {
    title: 'Scripture Insights | GeneralConference.app',
    description: 'Discover how scriptures are used in LDS General Conference. See most-cited verses, speaker citation habits, and scripture influence patterns.',
    url: 'https://generalconference.app/scripture-insights',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
