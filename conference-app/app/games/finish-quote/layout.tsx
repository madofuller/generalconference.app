import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Finish the Quote',
  description: 'Complete famous quotes from LDS General Conference talks. Test how well you know the words of prophets, apostles, and church leaders.',
  openGraph: {
    title: 'Finish the Quote | GeneralConference.app',
    description: 'Complete famous quotes from LDS General Conference talks. Test how well you know the words of prophets, apostles, and church leaders.',
    url: 'https://generalconference.app/games/finish-quote',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
