'use client';

import Link from 'next/link';
import { AgoraLiveLogo } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Clapperboard, Users } from 'lucide-react';
import UserNav from '@/components/auth/user-nav';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <AgoraLiveLogo className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block font-headline">
              AgoraLive
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/"
              className="transition-colors hover:text-foreground/80 text-foreground"
            >
              Discover
            </Link>
            <Link
              href="#"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Following
            </Link>
          </nav>
        </div>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <form>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search streams..."
                  className="pl-9 w-full md:w-80"
                />
              </div>
            </form>
          </div>
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" aria-label="Start streaming">
              <Clapperboard className="h-5 w-5" />
            </Button>
            <UserNav />
          </nav>
        </div>
      </div>
    </header>
  );
}
