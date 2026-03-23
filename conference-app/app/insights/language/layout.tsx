import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Language Evolution in Conference | GeneralConference.app',
  description: 'See how language in LDS General Conference has changed over time. Discover rising and falling phrases, shifting vocabulary, and evolving rhetorical trends.',
  openGraph: {
    title: 'Language Evolution in Conference | GeneralConference.app',
    description: 'See how language in LDS General Conference has changed over time. Discover rising and falling phrases, shifting vocabulary, and evolving rhetorical trends.',
    url: 'https://generalconference.app/insights/language',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
