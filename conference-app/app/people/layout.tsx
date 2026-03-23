import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'People - Apostles, Seventies & Women Leaders',
  description: 'Explore LDS General Conference speakers: apostle profiles, timeline history, Seventies directory, women leaders, and speaker tracking tools.',
  openGraph: {
    title: 'People - Apostles, Seventies & Women Leaders | GeneralConference.app',
    description: 'Explore LDS General Conference speakers: apostle profiles, timeline history, Seventies directory, women leaders, and speaker tracking tools.',
    url: 'https://generalconference.app/people',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
