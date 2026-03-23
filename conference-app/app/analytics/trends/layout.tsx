import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Topic Trend Analytics',
  description: 'Track how General Conference topics have evolved over time. Compare multiple topic trends with interactive charts spanning decades of LDS conference talks.',
  openGraph: {
    title: 'Topic Trend Analytics | GeneralConference.app',
    description: 'Track how General Conference topics have evolved over time. Compare multiple topic trends with interactive charts spanning decades of LDS conference talks.',
    url: 'https://generalconference.app/analytics/trends',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
