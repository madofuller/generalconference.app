import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Prophet Eras Comparison | GeneralConference.app',
  description: 'Compare General Conference statistics across prophet eras. Analyze how talk topics, word counts, and speaker diversity differ under each Church president.',
  openGraph: {
    title: 'Prophet Eras Comparison | GeneralConference.app',
    description: 'Compare General Conference statistics across prophet eras. Analyze how talk topics, word counts, and speaker diversity differ under each Church president.',
    url: 'https://generalconference.app/insights/prophet-eras',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
