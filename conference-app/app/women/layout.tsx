import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Women Speakers in Conference',
  description: 'Explore women who have spoken in LDS General Conference. View Relief Society, Young Women, and Primary leaders with talk history and service records.',
  openGraph: {
    title: 'Women Speakers in Conference | GeneralConference.app',
    description: 'Explore women who have spoken in LDS General Conference. View Relief Society, Young Women, and Primary leaders with talk history and service records.',
    url: 'https://generalconference.app/women',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
