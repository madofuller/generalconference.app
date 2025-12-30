'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  BookOpen, 
  Search, 
  MessageSquare, 
  Users, 
  Calendar,
  FileText,
  BarChart3,
  Filter,
  Tags,
  Smile
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const navigation = [
  { name: 'Scriptures', href: '/scriptures', icon: BookOpen },
  { name: 'Word Search', href: '/word-search', icon: Search },
  { name: 'Phrase Search', href: '/phrase-search', icon: MessageSquare },
  { name: 'Topics', href: '/topics', icon: Tags },
  { name: 'Emotions', href: '/emotions', icon: Smile },
  { name: 'Speakers', href: '/speakers', icon: Users },
  { name: 'Conferences', href: '/conferences', icon: Calendar },
  { name: 'Talks', href: '/talks', icon: FileText },
  { name: 'Overall', href: '/overall', icon: BarChart3 },
  { name: 'Filters', href: '/filters', icon: Filter },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <BookOpen className="h-6 w-6" />
          <span className="text-lg">SGC Analysis</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3',
                    isActive && 'bg-secondary'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <Separator />
      <div className="p-4 text-xs text-muted-foreground">
        <p>Scripture General Conference</p>
        <p>Analysis Tool v1.0</p>
      </div>
    </div>
  );
}

