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
      <AboutSection />
    </>
  );
}
