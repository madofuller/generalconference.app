import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conference History Timeline',
  description: 'Explore the history of LDS General Conference through an interactive timeline. Key milestones, format changes, and historical events from 1971 to present.',
  openGraph: {
    title: 'Conference History Timeline | GeneralConference.app',
    description: 'Explore the history of LDS General Conference through an interactive timeline. Key milestones, format changes, and historical events from 1971 to present.',
    url: 'https://generalconference.app/insights/history',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
