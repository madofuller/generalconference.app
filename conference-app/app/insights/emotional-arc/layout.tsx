import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Emotional Arc of Conference | GeneralConference.app',
  description: 'Analyze the emotional tone of General Conference talks over time. Track joy, sorrow, hope, urgency, and other emotions across decades of LDS conference addresses.',
  openGraph: {
    title: 'Emotional Arc of Conference | GeneralConference.app',
    description: 'Analyze the emotional tone of General Conference talks over time. Track joy, sorrow, hope, urgency, and other emotions across decades of LDS conference addresses.',
    url: 'https://generalconference.app/insights/emotional-arc',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
