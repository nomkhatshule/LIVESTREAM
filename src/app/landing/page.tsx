
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
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover -z-10"
        >
          <source src="https://cdn.midjourney.com/video/74dca46e-4efb-4400-bbc0-94587f904b8a/0.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 flex flex-col items-center">
          <h1 className="text-5xl md:text-7xl font-bold font-headline text-white mb-4 drop-shadow-lg">
            Share Every Moment
          </h1>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mb-8 drop-shadow-md">
            Discover live streams from creators around the world, or go live and share your passion.
          </p>
          <Button size="lg" className="bg-black text-white hover:bg-black/80" asChild>
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
        <div className="relative z-10 w-full max-w-3xl flex flex-col items-center gap-4">
            <div className="bg-white/80 backdrop-blur-md border-2 border-destructive/50 rounded-full py-2 px-6 shadow-xl">
              <h2 className="text-lg font-bold font-headline uppercase tracking-widest text-black text-center">
                NO AI SLOP!!
              </h2>
            </div>
            <div className="bg-white/80 backdrop-blur-md border-2 border-destructive/50 rounded-2xl p-8 shadow-xl max-w-2xl">
              <div className="text-base leading-relaxed text-black text-center space-y-4">
                <p>
                  We live in a digital world where nothing feels real anymore, flooded with AI slop, AI-generated videos, fake photos, and soulless content.
                </p>
                <p>
                  LIVENET was created to change that. We’re building a platform for real people, real moments, and real connections.
                </p>
                 <p>
                  No filters, no fakes, just live, human experiences shared as they happen. Welcome to LIVENET, where everything is live and real.
                </p>
              </div>
            </div>
        </div>
      </section>
      <AboutSection />
    </>
  );
}
