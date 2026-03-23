import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Scripture Citation Habits | GeneralConference.app',
  description: 'Analyze scripture citation patterns of General Conference speakers. See which leaders prefer Book of Mormon, Bible, or Doctrine & Covenants references.',
  openGraph: {
    title: 'Scripture Citation Habits | GeneralConference.app',
    description: 'Analyze scripture citation patterns of General Conference speakers. See which leaders prefer Book of Mormon, Bible, or Doctrine & Covenants references.',
    url: 'https://generalconference.app/insights/scripture-habits',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
