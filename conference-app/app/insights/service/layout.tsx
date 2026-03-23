import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Years of Service Analysis | GeneralConference.app',
  description: 'Discover how General Conference speakers evolve over their years of service. Track apostle and leader speaking patterns, frequency, and tenure statistics.',
  openGraph: {
    title: 'Years of Service Analysis | GeneralConference.app',
    description: 'Discover how General Conference speakers evolve over their years of service. Track apostle and leader speaking patterns, frequency, and tenure statistics.',
    url: 'https://generalconference.app/insights/service',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
