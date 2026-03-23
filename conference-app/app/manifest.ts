import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GeneralConference.app',
    short_name: 'GC App',
    description: 'Explore 50+ years of LDS General Conference talks with analytics, games, and AI-powered insights',
    start_url: '/',
    display: 'standalone',
    background_color: '#fdf9e9',
    theme_color: '#1B5E7B',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}
