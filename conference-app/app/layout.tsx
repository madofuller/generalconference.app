import type { Metadata } from "next";
import "./globals.css";
import { FilterProvider } from "@/lib/filter-context";
import { GlobalSearch } from "@/components/global-search";

const siteDescription = 'Explore 50+ years of LDS General Conference talks with interactive analytics, scripture insights, speaker statistics, games, and AI-powered search. Discover patterns, trends, and inspired messages from 1971 to today.'

export const metadata: Metadata = {
  metadataBase: new URL('https://generalconference.app'),
  title: {
    default: 'GeneralConference.app — LDS General Conference Talks, Analytics & Insights',
    template: '%s | GeneralConference.app',
  },
  description: siteDescription,
  keywords: [
    'LDS General Conference', 'General Conference talks', 'conference analytics',
    'General Conference search', 'LDS talks', 'conference speaker statistics',
    'General Conference games', 'scripture references', 'conference insights',
    'Church of Jesus Christ', 'conference history', 'apostle talks',
  ],
  openGraph: {
    title: 'GeneralConference.app — LDS General Conference Talks, Analytics & Insights',
    description: siteDescription,
    url: 'https://generalconference.app',
    siteName: 'GeneralConference.app',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GeneralConference.app',
    description: siteDescription,
  },
  alternates: {
    canonical: 'https://generalconference.app',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'GeneralConference.app',
              url: 'https://generalconference.app',
              description: 'Explore 50+ years of LDS General Conference talks with interactive analytics, scripture insights, speaker statistics, games, and AI-powered search.',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://generalconference.app/search?q={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body className="antialiased overflow-x-hidden">
        <FilterProvider>
          {children}
          <GlobalSearch />
        </FilterProvider>
      </body>
    </html>
  );
}
