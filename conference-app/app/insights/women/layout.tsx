import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Women's Voices at Conference | GeneralConference.app",
  description: "Explore the history of women speaking at LDS General Conference. Track participation trends, notable addresses, and the growing role of women's voices over time.",
  openGraph: {
    title: "Women's Voices at Conference | GeneralConference.app",
    description: "Explore the history of women speaking at LDS General Conference. Track participation trends, notable addresses, and the growing role of women's voices over time.",
    url: 'https://generalconference.app/insights/women',
    siteName: 'GeneralConference.app',
    type: 'website',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
