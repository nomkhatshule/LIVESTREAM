'use client';

import { Button } from '@/components/ui/button';
import { Clapperboard } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import LandingHeader from '@/components/landing/header';
import AboutSection from '@/components/landing/about-section';
import ProductDemo from '@/components/landing/product-demo';

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
          <p className="text-xl text-stone-200 max-w-2xl mb-8 drop-shadow-md">
            Discover In Real Life streams from creators around the world, or start streaming and build your own community.
          </p>
          <Button size="lg" className="bg-black text-white hover:bg-black/80" asChild>
            <Link href="/feed">
              <Clapperboard className="mr-2 h-5 w-5" />
              Watch Now
            </Link>
          </Button>
        </div>
      </div>
      <section className="relative h-screen w-full bg-black flex flex-col items-center justify-center text-center p-8">
        <Image
            src="https://cdn.pixabay.com/photo/2016/08/21/20/13/time-square-1610667_1280.jpg"
            alt="City street at night"
            fill
            className="object-cover"
            data-ai-hint="city street"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10">
             <h2 className="text-4xl md:text-6xl font-bold font-headline text-white drop-shadow-xl">
                Reality social, by the people, for the people
            </h2>
        </div>
      </section>
      
      <ProductDemo />

      <section className="relative w-full bg-black flex flex-col items-center justify-center p-8 py-20 lg:py-32">
        <Image
          src="https://cdn.midjourney.com/36ee8fa8-29f4-46e0-be75-a695ae1c59e1/0_0.png"
          alt="Pixel art background"
          fill
          className="object-cover"
          data-ai-hint="pixel art landscape"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 w-full max-w-3xl flex flex-col items-center gap-4">
            <div className="bg-white/80 backdrop-blur-md border border-black/10 rounded-2xl p-8 shadow-xl max-w-2xl text-center">
               <div className="inline-block bg-black text-white border-2 border-white/20 rounded-md px-3 py-1 mb-6">
                 <h3 className="text-sm font-bold font-cosmic uppercase tracking-widest">
                   A Manifesto
                 </h3>
               </div>
              <div className="text-lg leading-relaxed text-black space-y-1 font-headline">
                <p>This is for people on the move.</p>
                <br/>
                <p>For the walk through a city at night.</p>
                <p>For the new restaurant.</p>
                <p>For the morning run.</p>
                <p>For the push to the top of the trail.</p>
                <br/>
                <p>For cooking at home,</p>
                <p>trying new recipes,</p>
                <p>traveling when you can.</p>
                <br/>
                <p>For stepping outside</p>
                <p>just to feel alive.</p>
                <br/>
                <p>This is for adventure.</p>
                <p>For movement.</p>
                <p>For inspiration.</p>
                <p>For chasing that one dream</p>
                <p>that keeps you up at night.</p>
                <br/>
                <p>You don’t need to be famous.</p>
                <p>You don’t need followers.</p>
                <p>You just need to be doing something.</p>
                <br/>
                <p>There’s a world to explore.</p>
                <p>People to meet.</p>
                <p>Goals to reach.</p>
                <br/>
                <p className="font-bold">Just go do it.</p>
              </div>
            </div>
        </div>
      </section>
      <AboutSection />
    </>
  );
}
