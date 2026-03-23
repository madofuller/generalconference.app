import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Doctrinal Pendulum | GeneralConference.app',
  description: 'Track how doctrinal emphasis swings between opposing themes in General Conference. Visualize justice vs mercy, obedience vs agency, and more across decades.',
  openGraph: {
    title: 'Doctrinal Pendulum | GeneralConference.app',
    description: 'Track how doctrinal emphasis swings between opposing themes in General Conference. Visualize justice vs mercy, obedience vs agency, and more across decades.',
    url: 'https://generalconference.app/insights/doctrinal-pendulum',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
