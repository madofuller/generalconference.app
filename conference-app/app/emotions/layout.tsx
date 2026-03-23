import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Emotion Analysis',
  description: 'Discover the emotional tone of LDS General Conference talks. Analyze gratitude, joy, love, and other emotions expressed by speakers across conferences.',
  openGraph: {
    title: 'Emotion Analysis | GeneralConference.app',
    description: 'Discover the emotional tone of LDS General Conference talks. Analyze gratitude, joy, love, and other emotions expressed by speakers across conferences.',
    url: 'https://generalconference.app/emotions',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
