import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Apostle Profiles',
  description: 'View profiles of LDS apostles including the First Presidency and Quorum of the Twelve. See talk history, ordination dates, and conference speaking records.',
  openGraph: {
    title: 'Apostle Profiles | GeneralConference.app',
    description: 'View profiles of LDS apostles including the First Presidency and Quorum of the Twelve. See talk history, ordination dates, and conference speaking records.',
    url: 'https://generalconference.app/apostles',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
