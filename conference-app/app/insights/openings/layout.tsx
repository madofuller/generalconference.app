import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Talk Opening Patterns',
  description: 'Analyze how General Conference talks begin. Explore opening patterns including greetings, scriptures, stories, humor, and doctrinal statements across LDS conference.',
  openGraph: {
    title: 'Talk Opening Patterns | GeneralConference.app',
    description: 'Analyze how General Conference talks begin. Explore opening patterns including greetings, scriptures, stories, humor, and doctrinal statements across LDS conference.',
    url: 'https://generalconference.app/insights/openings',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
