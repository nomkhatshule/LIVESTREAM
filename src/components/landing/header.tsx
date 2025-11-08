
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

export default function LandingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4">
      <nav className="flex items-center justify-between bg-white/10 backdrop-blur-md border border-white/30 rounded-full p-2 shadow-xl max-w-4xl mx-auto">
        <Link href="/" className="flex items-center gap-2 px-4">
          <span className="font-logo font-black text-white text-3xl">LIVENET</span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          <button className="px-4 py-1.5 rounded-full text-sm tracking-tight transition-all duration-300 hover:scale-105 active:scale-95 bg-white/20 backdrop-blur-md text-white shadow-lg">
            Features
          </button>
          <button className="px-4 py-1.5 rounded-full text-sm tracking-tight transition-all duration-300 hover:scale-105 active:scale-95 text-white/80 hover:bg-white/10">
            About
          </button>
        </div>
        <div className="hidden md:flex pl-4 items-center gap-2">
            <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white rounded-full" asChild>
                <Link href="/login">Log in</Link>
            </Button>
            <Button className="rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-white/30 hover:shadow-2xl hover:shadow-blue-500/20 active:scale-95" asChild>
                <Link href="/signup">Sign Up</Link>
            </Button>
        </div>
         <div className="md:hidden">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-white">
                        <Menu />
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-black/80 backdrop-blur-lg border-l-white/20 text-white">
                    <div className="flex flex-col items-center justify-center h-full gap-8">
                         <Link href="/" className="flex items-center gap-2 px-4">
                          <span className="font-logo font-black text-white text-4xl">LIVENET</span>
                        </Link>
                        <button className="text-2xl">Features</button>
                        <button className="text-2xl">About</button>
                        <div className="flex flex-col gap-4 w-full px-8 pt-8">
                             <Button variant="outline" className="w-full rounded-full border-white/50 bg-transparent" asChild>
                                <Link href="/login">Log in</Link>
                            </Button>
                            <Button className="w-full rounded-full bg-white text-black" asChild>
                                <Link href="/signup">Sign Up</Link>
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
      </nav>
    </header>
  );
}
