import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Talk DNA - Speaker Radar Profiles | GeneralConference.app',
  description: 'Compare General Conference speaker styles with radar charts. Analyze sentence length, scripture usage, warmth, vocabulary richness, and storytelling patterns.',
  openGraph: {
    title: 'Talk DNA - Speaker Radar Profiles | GeneralConference.app',
    description: 'Compare General Conference speaker styles with radar charts. Analyze sentence length, scripture usage, warmth, vocabulary richness, and storytelling patterns.',
    url: 'https://generalconference.app/insights/talk-dna',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
