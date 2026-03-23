import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'General Conference Trivia Game',
  description: 'Test your LDS General Conference knowledge with trivia questions about talks, speakers, topics, and scripture references from past conferences.',
  openGraph: {
    title: 'General Conference Trivia Game | GeneralConference.app',
    description: 'Test your LDS General Conference knowledge with trivia questions about talks, speakers, topics, and scripture references from past conferences.',
    url: 'https://generalconference.app/games/trivia',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
