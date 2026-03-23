import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Title or Not',
  description: 'Is it a real General Conference talk title or a fake? Test your knowledge of LDS conference talk titles in this fun guessing game.',
  openGraph: {
    title: 'Title or Not | GeneralConference.app',
    description: 'Is it a real General Conference talk title or a fake? Test your knowledge of LDS conference talk titles in this fun guessing game.',
    url: 'https://generalconference.app/games/title-or-not',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
