
'use client';

import Link from 'next/link';
import { LIVENETLogo } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Clapperboard, Tv, FlaskConical } from 'lucide-react';
import UserNav from '@/components/auth/user-nav';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUser } from '@/firebase';

export default function Header() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { user } = useUser();

  const getStreamLink = () => {
    if (!user) return '/login';
    // Navigate to the create page for a proper setup flow.
    return '/broadcast/create';
  }

  const noHeaderPaths = [
    '/',
    '/feed',
    '/broadcast/',
    '/live',
    '/agora-test',
    '/cards',
    '/profile',
    '/inbox-page',
    '/login',
    '/signup',
    '/landing',
    '/terms-of-service',
    '/privacy-policy',
  ];

  if (noHeaderPaths.some(p => pathname.startsWith(p))) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <LIVENETLogo className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block font-headline">
              LIVENET
            </span>
          </Link>
          <nav className="flex items-center space-x-4 text-sm font-medium">
            <Link
              href="/"
              className={cn(
                'transition-colors hover:text-foreground/80',
                pathname === '/' ? 'text-foreground' : 'text-foreground/60'
              )}
            >
              Discover
            </Link>
            <Link
              href="/feed"
              className={cn(
                'flex items-center transition-colors hover:text-foreground/80',
                pathname.startsWith('/feed')
                  ? 'text-foreground'
                  : 'text-foreground/60'
              )}
            >
              <Tv className="mr-1.5 h-4 w-4" />
              For You
            </Link>
            {!isMobile && (
              <Link
                href="#"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Following
              </Link>
            )}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <div className={cn("w-full flex-1 md:w-auto md:flex-none", { "hidden sm:block": isMobile })}>
              <form>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search streams..."
                    className="pl-9 w-full md:w-64"
                  />
                </div>
              </form>
            </div>
           <Button variant="ghost" size="icon" className="sm:hidden">
              <Search className="h-5 w-5" />
            </Button>
          <nav className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" aria-label="Start streaming" asChild>
              <Link href={getStreamLink()}>
                <Clapperboard className="h-5 w-5" />
              </Link>
            </Button>
            <UserNav />
          </nav>
        </div>
      </div>
    </header>
  );
}
