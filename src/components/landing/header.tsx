'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function LandingHeader() {
  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <nav className="flex items-center bg-white/10 backdrop-blur-md border border-white/30 rounded-full p-2 shadow-xl">
        <Link href="/" className="flex items-center gap-2 px-4">
          <span className="font-bold font-cosmic text-white">LIVENET</span>
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
            <Button className="rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-white/30 hover:shadow-2xl hover:shadow-blue-500/20 active:scale-95" asChild>
                <Link href="/signup">Sign Up</Link>
            </Button>
        </div>
      </nav>
    </header>
  );
}
