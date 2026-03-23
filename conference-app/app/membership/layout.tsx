import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Church Membership Growth Data',
  description: 'Track LDS Church membership growth over time with interactive charts. View annual membership numbers, growth rates, and historical trends.',
  openGraph: {
    title: 'Church Membership Growth Data | GeneralConference.app',
    description: 'Track LDS Church membership growth over time with interactive charts. View annual membership numbers, growth rates, and historical trends.',
    url: 'https://generalconference.app/membership',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
