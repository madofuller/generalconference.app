import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Topic Analysis',
  description: 'Analyze LDS General Conference talk topics over time. View topic trends, related themes, speaker preferences, and doctrinal emphasis across decades.',
  openGraph: {
    title: 'Topic Analysis | GeneralConference.app',
    description: 'Analyze LDS General Conference talk topics over time. View topic trends, related themes, speaker preferences, and doctrinal emphasis across decades.',
    url: 'https://generalconference.app/topics',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
