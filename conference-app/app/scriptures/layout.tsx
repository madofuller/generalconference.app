import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Scripture References in Conference',
  description: 'Explore scripture references cited in LDS General Conference talks. Search by book, chapter, and verse across the Bible, Book of Mormon, and D&C.',
  openGraph: {
    title: 'Scripture References in Conference | GeneralConference.app',
    description: 'Explore scripture references cited in LDS General Conference talks. Search by book, chapter, and verse across the Bible, Book of Mormon, and D&C.',
    url: 'https://generalconference.app/scriptures',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
