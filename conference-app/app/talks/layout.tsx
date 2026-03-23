import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Browse All Conference Talks',
  description: 'Browse and search every LDS General Conference talk. Filter by speaker, era, calling, and season. Read full text and view scripture references.',
  openGraph: {
    title: 'Browse All Conference Talks | GeneralConference.app',
    description: 'Browse and search every LDS General Conference talk. Filter by speaker, era, calling, and season. Read full text and view scripture references.',
    url: 'https://generalconference.app/talks',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
