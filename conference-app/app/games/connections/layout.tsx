import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conference Connections',
  description: 'Play Connections with General Conference themes. Group related words from LDS conference talks by topic, speaker, scripture, or doctrine.',
  openGraph: {
    title: 'Conference Connections | GeneralConference.app',
    description: 'Play Connections with General Conference themes. Group related words from LDS conference talks by topic, speaker, scripture, or doctrine.',
    url: 'https://generalconference.app/games/connections',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
