import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Filter Conference Talks',
  description: 'Filter LDS General Conference talks by era, speaker, calling, year range, topic, and more. Customize your conference study experience with advanced filters.',
  openGraph: {
    title: 'Filter Conference Talks | GeneralConference.app',
    description: 'Filter LDS General Conference talks by era, speaker, calling, year range, topic, and more. Customize your conference study experience with advanced filters.',
    url: 'https://generalconference.app/filters',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
