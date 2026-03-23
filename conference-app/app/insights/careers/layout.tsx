import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Career Progressions | GeneralConference.app',
  description: 'Trace the career paths of General Conference speakers through Church callings. Visualize how leaders progress from Seventy to Apostle to Church President.',
  openGraph: {
    title: 'Career Progressions | GeneralConference.app',
    description: 'Trace the career paths of General Conference speakers through Church callings. Visualize how leaders progress from Seventy to Apostle to Church President.',
    url: 'https://generalconference.app/insights/careers',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
