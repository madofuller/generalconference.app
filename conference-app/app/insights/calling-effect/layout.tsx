import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Calling Effect on Talks | GeneralConference.app',
  description: 'Discover how Church callings affect General Conference talk style. Analyze changes in word count, topics, and tone as speakers advance through leadership roles.',
  openGraph: {
    title: 'Calling Effect on Talks | GeneralConference.app',
    description: 'Discover how Church callings affect General Conference talk style. Analyze changes in word count, topics, and tone as speakers advance through leadership roles.',
    url: 'https://generalconference.app/insights/calling-effect',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
