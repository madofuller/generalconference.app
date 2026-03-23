import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Emotion Analytics',
  description: 'Analyze emotional patterns in LDS General Conference talks. Track how gratitude, joy, love, and faith are expressed across speakers and decades.',
  openGraph: {
    title: 'Emotion Analytics | GeneralConference.app',
    description: 'Analyze emotional patterns in LDS General Conference talks. Track how gratitude, joy, love, and faith are expressed across speakers and decades.',
    url: 'https://generalconference.app/analytics/emotions',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
