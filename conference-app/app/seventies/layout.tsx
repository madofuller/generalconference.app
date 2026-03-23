import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Seventies Directory',
  description: 'Browse all General Authority Seventies who have spoken in LDS General Conference. View talk counts, service periods, and quorum assignments.',
  openGraph: {
    title: 'Seventies Directory | GeneralConference.app',
    description: 'Browse all General Authority Seventies who have spoken in LDS General Conference. View talk counts, service periods, and quorum assignments.',
    url: 'https://generalconference.app/seventies',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
