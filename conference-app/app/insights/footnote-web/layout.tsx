import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Speaker Citation Network | GeneralConference.app',
  description: 'Explore the citation network of General Conference speakers. See which leaders quote each other most and discover the web of cross-references in LDS talks.',
  openGraph: {
    title: 'Speaker Citation Network | GeneralConference.app',
    description: 'Explore the citation network of General Conference speakers. See which leaders quote each other most and discover the web of cross-references in LDS talks.',
    url: 'https://generalconference.app/insights/footnote-web',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
