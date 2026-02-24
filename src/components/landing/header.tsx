'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6">
      <nav className="flex items-center justify-between bg-black/40 backdrop-blur-xl border border-white/10 rounded-full py-2.5 px-3 max-w-5xl mx-auto">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 px-4 group">
            <span className="font-logo font-black text-white text-xl md:text-2xl tracking-tighter transition-all group-hover:tracking-normal">LIVENET</span>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="#features" className="px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-300 text-white/60 hover:text-white hover:bg-white/5">
            Features
          </Link>
          <div className="w-[1px] h-4 bg-white/10" />
          <Link href="#demo" className="px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-300 text-white/60 hover:text-white hover:bg-white/5">
            Demo
          </Link>
          <div className="w-[1px] h-4 bg-white/10 mx-2" />
          <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-transparent text-[11px] font-bold uppercase tracking-[0.2em]" asChild>
              <Link href="/login">Log in</Link>
          </Button>
          <Button className="rounded-full bg-white text-black px-6 hover:bg-stone-200 text-[11px] font-bold uppercase tracking-[0.2em] transition-transform hover:scale-105 active:scale-95" asChild>
              <Link href="/signup">Sign Up</Link>
          </Button>
        </div>

         {/* Mobile Navigation */}
         <div className="md:hidden pr-2">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full">
                        <Menu className="w-5 h-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-black/95 backdrop-blur-2xl border-l-white/10 text-white p-0">
                    <SheetHeader className="sr-only">
                      <SheetTitle>Mobile Navigation Menu</SheetTitle>
                      <SheetDescription>
                        A menu with links to features, about, login, and sign up pages.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="flex flex-col items-center justify-center h-full gap-10">
                         <Link href="/" className="flex flex-col items-center gap-2 px-4">
                          <span className="font-logo font-black text-white text-5xl tracking-tighter">LIVENET</span>
                          <span className="font-code text-[10px] text-primary tracking-[0.4em] uppercase">IRL Streaming</span>
                        </Link>
                        <div className="flex flex-col items-center gap-6">
                          <Link href="#features" className="text-sm font-bold uppercase tracking-[0.3em] text-white/60 hover:text-white">Features</Link>
                          <div className="w-24 h-[1px] bg-white/10" />
                          <Link href="#demo" className="text-sm font-bold uppercase tracking-[0.3em] text-white/60 hover:text-white">Demo</Link>
                        </div>
                        <div className="flex flex-col gap-4 w-full px-12 pt-8">
                             <Button variant="outline" className="w-full rounded-full border-white/20 bg-transparent text-[11px] font-bold uppercase tracking-[0.2em]" asChild>
                                <Link href="/login">Log in</Link>
                            </Button>
                            <Button className="w-full rounded-full bg-white text-black text-[11px] font-bold uppercase tracking-[0.2em]" asChild>
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
