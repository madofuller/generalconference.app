import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Decade Detective',
  description: 'Can you guess which decade a General Conference talk was given? Read excerpts from LDS conference talks and test your knowledge of church history.',
  openGraph: {
    title: 'Decade Detective | GeneralConference.app',
    description: 'Can you guess which decade a General Conference talk was given? Read excerpts from LDS conference talks and test your knowledge of church history.',
    url: 'https://generalconference.app/games/decade-detective',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
