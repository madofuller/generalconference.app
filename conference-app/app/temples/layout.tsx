import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Temple Data & Map',
  description: 'Explore LDS temple data with an interactive map. View temple locations, dedication dates, sizes, architectural styles, and regional distribution worldwide.',
  openGraph: {
    title: 'Temple Data & Map | GeneralConference.app',
    description: 'Explore LDS temple data with an interactive map. View temple locations, dedication dates, sizes, architectural styles, and regional distribution worldwide.',
    url: 'https://generalconference.app/temples',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
