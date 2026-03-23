import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Apostle Timeline',
  description: 'Interactive timeline of all LDS apostles from 1835 to present. Visualize service periods, ages at calling, life spans, and prophetic succession.',
  openGraph: {
    title: 'Apostle Timeline | GeneralConference.app',
    description: 'Interactive timeline of all LDS apostles from 1835 to present. Visualize service periods, ages at calling, life spans, and prophetic succession.',
    url: 'https://generalconference.app/apostle-timeline',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
