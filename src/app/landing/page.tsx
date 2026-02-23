'use client';

import { Button } from '@/components/ui/button';
import { Clapperboard } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import LandingHeader from '@/components/landing/header';
import AboutSection from '@/components/landing/about-section';
import ProductDemo from '@/components/landing/product-demo';
import ManifestoSection from '@/components/landing/ManifestoSection';
import RealityValues from '@/components/landing/RealityValues';
import { motion, useScroll, useTransform } from 'framer-motion';
import { StaggeredLetterReveal, MetadataLabel, LivePulse, TechnicalHeader, HUDCorners } from '@/components/landing/typography-effects';

export default function LandingPage() {
  const { scrollY } = useScroll();
  const yHero = useTransform(scrollY, [0, 500], [0, 200]);
  const scaleHero = useTransform(scrollY, [0, 500], [1, 1.15]);
  const opacityHero = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <>
      <LandingHeader />
      <div id="hero" className="relative h-screen w-full overflow-hidden flex items-center justify-center text-center p-4 md:p-8">
        <div className="absolute inset-0 bg-black -z-10" />
        <motion.div 
          style={{ scale: scaleHero }}
          className="absolute inset-0 z-0"
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            src="/video/186843-879056520_small.mp4"
            className="w-full h-full object-cover opacity-80"
            key="hero-video"
          />
        </motion.div>
        <div className="absolute inset-0 bg-black/30 z-10" />
        <motion.div 
          style={{ y: yHero, opacity: opacityHero }}
          className="relative z-20 flex flex-col items-center max-w-7xl w-full"
        >
          <HUDCorners>
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mb-6 md:mb-10 flex justify-center"
            >
              <LivePulse />
            </motion.div>
            <div className="flex flex-col items-center">
              <StaggeredLetterReveal 
                text="Share Every" 
                className="text-4xl sm:text-6xl md:text-[10rem] font-black font-headline text-white tracking-[calc(-0.06em)] leading-[0.8] animate-text-shimmer italic justify-center"
              />
              <StaggeredLetterReveal 
                text="Moment" 
                className="text-4xl sm:text-6xl md:text-[10rem] font-black font-headline text-white mb-6 md:mb-8 tracking-[calc(-0.06em)] leading-[0.8] animate-text-shimmer italic justify-center"
                delay={0.2}
              />
            </div>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="text-base md:text-xl text-stone-300 max-w-3xl mb-8 md:mb-12 font-light tracking-tight leading-relaxed px-2 md:px-4 mx-auto"
            >
              Go outside and be adventurous. Join a global community of explorers streaming their real-world adventures live from city streets to mountain peaks.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.6 }}
              className="flex justify-center"
            >
              <Button size="lg" className="bg-white text-black hover:bg-stone-200 h-14 md:h-16 px-8 md:px-12 rounded-none text-[10px] md:text-sm font-bold uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95 group border border-white" asChild>
                <Link href="/feed">
                  Start Your Journey
                </Link>
              </Button>
            </motion.div>
          </HUDCorners>
        </motion.div>

        {/* Floating Metadata for Hero */}
        <div className="absolute bottom-12 left-12 z-20 hidden lg:block text-left">
           <MetadataLabel text="Signal: High / 1080p" delay={2} />
           <div className="font-code text-[10px] text-white/40 uppercase tracking-widest mt-1">
             Status: Broadcasting Global
           </div>
        </div>
        <div className="absolute bottom-12 right-12 z-20 hidden lg:block text-right">
           <MetadataLabel text="System: LIVENET v2.0" delay={2.2} />
           <div className="font-code text-[10px] text-white/40 uppercase tracking-widest mt-1">
             Connection: Encrypted
           </div>
        </div>
      </div>
      
      <ProductDemo />

      <section id="reality" className="relative min-h-screen w-full bg-black flex flex-col items-center justify-center text-center p-4 md:p-8 overflow-hidden py-24 md:py-32">
        <motion.div
            initial={{ scale: 1.2 }}
            whileInView={{ scale: 1 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
        >
            <Image
                src="https://cdn.pixabay.com/photo/2016/08/21/20/13/time-square-1610667_1280.jpg"
                alt="City street at night"
                fill
                className="object-cover opacity-60"
            />
        </motion.div>
        <div className="absolute inset-0 bg-black/40 z-10" />
        <div className="relative z-10 max-w-6xl w-full">
             <TechnicalHeader 
                metadata="Location: Global / 0.0000° N"
                title="REALITY SOCIAL"
                subtitle="Built for the people, not the influencers. A new era of connection focused on movement, adventure, and pure inspiration."
             />
             <RealityValues />
        </div>
      </section>

      <ManifestoSection />

      <AboutSection />
    </>
  );
}
