import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conference Games',
  description: 'Play fun LDS General Conference games including Wordle, Trivia, Bingo, Connections, and more. Test your knowledge of conference talks and speakers.',
  openGraph: {
    title: 'Conference Games | GeneralConference.app',
    description: 'Play fun LDS General Conference games including Wordle, Trivia, Bingo, Connections, and more. Test your knowledge of conference talks and speakers.',
    url: 'https://generalconference.app/games',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
