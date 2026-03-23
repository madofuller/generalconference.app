import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conference Wordle',
  description: 'Play a General Conference themed Wordle game. Guess the five-letter word related to LDS conference talks, gospel topics, and church vocabulary.',
  openGraph: {
    title: 'Conference Wordle | GeneralConference.app',
    description: 'Play a General Conference themed Wordle game. Guess the five-letter word related to LDS conference talks, gospel topics, and church vocabulary.',
    url: 'https://generalconference.app/games/wordle',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
