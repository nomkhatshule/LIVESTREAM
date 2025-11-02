'use client';

import { Button } from '@/components/ui/button';
import { Clapperboard } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import LandingHeader from '@/components/landing/header';
import AboutSection from '@/components/landing/about-section';

export default function LandingPage() {
  return (
    <>
      <LandingHeader />
      <div className="relative h-screen w-full overflow-hidden flex items-center justify-center text-center p-8">
        <Image
          src="https://cdn.pixabay.com/photo/2024/12/16/06/42/camera-9270111_1280.png"
          alt="Hero Background"
          fill
          className="object-cover -z-10"
          data-ai-hint="action camera parachute"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 flex flex-col items-center">
          <h1 className="text-5xl md:text-7xl font-bold font-headline text-primary-foreground mb-4 drop-shadow-lg">
            Share Your Moment
          </h1>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mb-8 drop-shadow-md">
            Discover live streams from creators around the world, or go live and share your passion.
          </p>
          <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
            <Link href="/feed">
              <Clapperboard className="mr-2 h-5 w-5" />
              Watch Now
            </Link>
          </Button>
        </div>
      </div>
      <section className="relative h-screen w-full bg-black flex flex-col items-center justify-center p-8">
        <Image
          src="https://cdn.pixabay.com/photo/2022/06/23/16/54/pixel-art-7280230_1280.png"
          alt="Pixel art background"
          fill
          className="object-cover"
          data-ai-hint="pixel art landscape"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-xl">
              <h2 className="text-4xl md:text-5xl font-bold font-logo uppercase tracking-widest text-accent text-center">
                NO AI SLOP
              </h2>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/30 rounded-2xl p-8 md:p-12 shadow-xl">
              <p className="text-lg md:text-xl leading-relaxed text-white text-center">
                We live in a digital world where nothing feels real anymore flooded with AI slop, AI-generated videos, fake photos, and soulless content. LIVENET was created to change that. We’re building a platform for real people, real moments, and real connections. No filters, no fakes just live, human experiences shared as they happen. Welcome to LIVENET where everything is live and real.
              </p>
            </div>
        </div>
      </section>
      <AboutSection />
    </>
  );
}
