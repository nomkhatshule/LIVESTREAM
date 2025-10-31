'use client';

import { AgoraLiveLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function LandingHeader() {
  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <nav className="flex items-center bg-white/10 backdrop-blur-md border border-white/30 rounded-full p-2 shadow-xl">
        <Link href="/" className="flex items-center gap-2 px-4">
          <AgoraLiveLogo className="h-6 w-6" />
          <span className="font-bold font-headline text-white">AgoraLive</span>
        </Link>
        <div className="flex items-center gap-1">
          <button className="px-4 py-1.5 rounded-full text-sm tracking-tight transition-all duration-300 hover:scale-105 active:scale-95 bg-white/20 backdrop-blur-md text-white shadow-lg">
            Features
          </button>
          <button className="px-4 py-1.5 rounded-full text-sm tracking-tight transition-all duration-300 hover:scale-105 active:scale-95 text-white/80 hover:bg-white/10">
            Pricing
          </button>
          <button className="px-4 py-1.5 rounded-full text-sm tracking-tight transition-all duration-300 hover:scale-105 active:scale-95 text-white/80 hover:bg-white/10">
            About
          </button>
        </div>
        <div className="pl-4 flex items-center gap-2">
            <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white rounded-full" asChild>
                <Link href="/login">Log in</Link>
            </Button>
            <Button className="rounded-full bg-primary text-primary-foreground" asChild>
                <Link href="/signup">Sign Up</Link>
            </Button>
        </div>
      </nav>
    </header>
  );
}
