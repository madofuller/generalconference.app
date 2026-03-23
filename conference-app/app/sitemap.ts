import { MetadataRoute } from 'next'
import { readFileSync } from 'fs'
import { join } from 'path'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://generalconference.app'

  // Static routes grouped by priority
  const home = ['/']
  const core = ['/search', '/speakers', '/talks', '/overall', '/people']
  const category = [
    '/apostles', '/apostle-timeline', '/seventies', '/women',
    '/roster', '/conferences', '/scriptures', '/scripture-insights',
    '/topics', '/emotions', '/membership', '/temples',
    '/analytics', '/games',
    '/word-search', '/phrase-search', '/filters',
  ]
  const analyticsPages = [
    '/analytics/emotions', '/analytics/speakers', '/analytics/trends',
  ]
  const gamePages = [
    '/games/wordle', '/games/trivia', '/games/bingo',
    '/games/connections', '/games/decade-detective',
    '/games/finish-quote', '/games/title-or-not',
  ]
  const insightPages = [
    '/insights/vocabulary', '/insights/service', '/insights/christ',
    '/insights/language', '/insights/new-voices', '/insights/speakers',
    '/insights/talk-length', '/insights/women', '/insights/prophet-eras',
    '/insights/april-vs-october', '/insights/openings', '/insights/topic-pairs',
    '/insights/history', '/insights/similarity', '/insights/careers',
    '/insights/scripture-habits', '/insights/calling-effect',
    '/insights/footnote-web', '/insights/doctrinal-pendulum',
    '/insights/emotional-arc', '/insights/scriptures', '/insights/repetition',
    '/insights/silence', '/insights/talk-dna',
  ]

  // Read dynamic slugs from insights.json at build time
  let apostleSlugs: string[] = []
  let seventySlugs: string[] = []
  let womenSlugs: string[] = []

  try {
    const insightsPath = join(process.cwd(), 'public', 'insights.json')
    const data = JSON.parse(readFileSync(insightsPath, 'utf-8'))
    apostleSlugs = (data.apostleProfiles || []).map((p: { slug: string }) => p.slug)
    seventySlugs = (data.seventyProfiles || []).map((p: { slug: string }) => p.slug)
    womenSlugs = (data.womenProfiles || []).map((p: { slug: string }) => p.slug)
  } catch {
    // If insights.json is unavailable, skip dynamic routes
  }

  const entries: MetadataRoute.Sitemap = []

  const add = (paths: string[], priority: number, changeFrequency: 'weekly' | 'monthly' | 'daily') => {
    for (const path of paths) {
      entries.push({
        url: `${baseUrl}${path}`,
        lastModified: new Date(),
        changeFrequency,
        priority,
      })
    }
  }

  add(home, 1.0, 'weekly')
  add(core, 0.9, 'weekly')
  add(category, 0.8, 'weekly')
  add(analyticsPages, 0.7, 'weekly')
  add(gamePages, 0.6, 'monthly')
  add(insightPages, 0.7, 'monthly')

  // Dynamic routes
  for (const slug of apostleSlugs) {
    entries.push({
      url: `${baseUrl}/apostles/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  }
  for (const slug of seventySlugs) {
    entries.push({
      url: `${baseUrl}/seventies/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  }
  for (const slug of womenSlugs) {
    entries.push({
      url: `${baseUrl}/women/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  }

  return entries
}
