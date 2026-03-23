import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Speaker Pattern Analytics',
  description: 'Compare LDS General Conference speakers side by side. Analyze speaking patterns, topic preferences, emotional profiles, and rhetorical styles.',
  openGraph: {
    title: 'Speaker Pattern Analytics | GeneralConference.app',
    description: 'Compare LDS General Conference speakers side by side. Analyze speaking patterns, topic preferences, emotional profiles, and rhetorical styles.',
    url: 'https://generalconference.app/analytics/speakers',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
