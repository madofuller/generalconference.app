import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conference Analytics Dashboard',
  description: 'Comprehensive LDS General Conference analytics with charts and visualizations. Explore talk statistics, speaker patterns, and decade-over-decade trends.',
  openGraph: {
    title: 'Conference Analytics Dashboard | GeneralConference.app',
    description: 'Comprehensive LDS General Conference analytics with charts and visualizations. Explore talk statistics, speaker patterns, and decade-over-decade trends.',
    url: 'https://generalconference.app/analytics',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
