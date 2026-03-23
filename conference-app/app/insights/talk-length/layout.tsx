import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Talk Length Trends | GeneralConference.app',
  description: 'Analyze how General Conference talk lengths have changed over time. Compare word counts across decades, speakers, and sessions in LDS conference history.',
  openGraph: {
    title: 'Talk Length Trends | GeneralConference.app',
    description: 'Analyze how General Conference talk lengths have changed over time. Compare word counts across decades, speakers, and sessions in LDS conference history.',
    url: 'https://generalconference.app/insights/talk-length',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
