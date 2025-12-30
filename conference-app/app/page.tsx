import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Search, MessageSquare, Users, Calendar, FileText, BarChart3, Filter, Tags } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const features = [
  {
    title: 'Scriptures',
    description: 'Search for conference talks that reference specific scriptures',
    icon: BookOpen,
    href: '/scriptures',
    color: 'text-blue-500'
  },
  {
    title: 'Word Search',
    description: 'Find talks containing specific words with advanced logic',
    icon: Search,
    href: '/word-search',
    color: 'text-green-500'
  },
  {
    title: 'Phrase Search',
    description: 'Search for talks containing exact phrases',
    icon: MessageSquare,
    href: '/phrase-search',
    color: 'text-purple-500'
  },
  {
    title: 'Topics',
    description: 'AI-powered topic classification using Preach My Gospel themes',
    icon: Tags,
    href: '/topics',
    color: 'text-yellow-500',
    badge: 'NEW'
  },
  {
    title: 'Speakers',
    description: 'Get detailed information about specific speakers',
    icon: Users,
    href: '/speakers',
    color: 'text-orange-500'
  },
  {
    title: 'Conferences',
    description: 'View comprehensive statistics about specific conferences',
    icon: Calendar,
    href: '/conferences',
    color: 'text-pink-500'
  },
  {
    title: 'Talks',
    description: 'Explore detailed statistics about individual talks',
    icon: FileText,
    href: '/talks',
    color: 'text-indigo-500'
  },
  {
    title: 'Overall',
    description: 'View comprehensive statistics across all talks',
    icon: BarChart3,
    href: '/overall',
    color: 'text-cyan-500'
  },
  {
    title: 'Filters',
    description: 'Refine search results by speaker, conference, era, or year',
    icon: Filter,
    href: '/filters',
    color: 'text-red-500'
  },
];

export default function Home() {
  return (
    <div className="flex h-screen">
      <Navigation />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold">Scripture General Conference Analysis</h1>
            <p className="text-xl text-muted-foreground">
              Comprehensive tool for analyzing LDS General Conference talks from 1971 to present
            </p>
          </div>

          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>About This Tool</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  This application provides powerful search and analysis capabilities for General Conference talks.
                  Explore scripture references, search for words and phrases, and analyze speaking patterns across
                  different eras of Church leadership.
                </p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-2 font-semibold">Eras Coverage</h3>
                    <p className="text-sm text-muted-foreground">
                      From Joseph Fielding Smith (1971) through Russell M. Nelson and beyond
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-2 font-semibold">Scripture Volumes</h3>
                    <p className="text-sm text-muted-foreground">
                      Book of Mormon, D&C, New Testament, Old Testament, Pearl of Great Price
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-2 font-semibold">Advanced Filtering</h3>
                    <p className="text-sm text-muted-foreground">
                      Filter by speaker, conference, era, or custom year ranges
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">Features</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Link key={feature.title} href={feature.href}>
                    <Card className="transition-all hover:shadow-lg hover:scale-105 cursor-pointer h-full">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <Icon className={`h-8 w-8 ${feature.color}`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">{feature.title}</CardTitle>
                              {feature.badge && (
                                <span className="px-2 py-0.5 text-xs font-semibold bg-yellow-500 text-white rounded">
                                  {feature.badge}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <CardDescription>{feature.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2">
                <li>Choose a feature from the navigation menu or cards above</li>
                <li>Use the <strong>Filters</strong> tab to refine your searches (optional)</li>
                <li>Perform your search or select speakers/conferences to analyze</li>
                <li>Explore the results with detailed statistics and visualizations</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
