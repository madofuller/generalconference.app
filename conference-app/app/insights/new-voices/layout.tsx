import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'New Voices at Conference | GeneralConference.app',
  description: 'Track first-time General Conference speakers by year. Analyze when new voices are introduced and how speaker diversity has changed in LDS conference history.',
  openGraph: {
    title: 'New Voices at Conference | GeneralConference.app',
    description: 'Track first-time General Conference speakers by year. Analyze when new voices are introduced and how speaker diversity has changed in LDS conference history.',
    url: 'https://generalconference.app/insights/new-voices',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
