import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Church Leadership Roster',
  description: 'View the current LDS Church leadership roster including the First Presidency, Quorum of the Twelve, Seventies, and auxiliary organization leaders.',
  openGraph: {
    title: 'Church Leadership Roster | GeneralConference.app',
    description: 'View the current LDS Church leadership roster including the First Presidency, Quorum of the Twelve, Seventies, and auxiliary organization leaders.',
    url: 'https://generalconference.app/roster',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
