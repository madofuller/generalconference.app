import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Topic Repetition Trends | GeneralConference.app',
  description: 'Track how General Conference topics rise and fall over time. Keyword-based analysis reveals which themes are emphasized most in each era of LDS conference.',
  openGraph: {
    title: 'Topic Repetition Trends | GeneralConference.app',
    description: 'Track how General Conference topics rise and fall over time. Keyword-based analysis reveals which themes are emphasized most in each era of LDS conference.',
    url: 'https://generalconference.app/insights/repetition',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
