
'use client';

import { Button } from '@/components/ui/button';
import { Clapperboard } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import LandingHeader from '@/components/landing/header';
import { motion, useScroll, useTransform } from 'framer-motion';
import { StaggeredLetterReveal, MetadataLabel, LivePulse, TechnicalHeader, HUDCorners } from '@/components/landing/typography-effects';
import dynamic from 'next/dynamic';

const AboutSection = dynamic(() => import('@/components/landing/about-section'), { ssr: false });
const ProductDemo = dynamic(() => import('@/components/landing/product-demo'), { ssr: false });
const ManifestoSection = dynamic(() => import('@/components/landing/ManifestoSection'), { ssr: false });
const RealityValues = dynamic(() => import('@/components/landing/RealityValues'), { ssr: false });

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
          className="relative z-20 flex flex-col items-center w-full mt-12 md:mt-0"
        >
          <div className="w-fit mx-auto">
            <HUDCorners>
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="mb-4 md:mb-6 flex justify-center"
              >
                <LivePulse />
              </motion.div>
              <div className="flex flex-col items-center">
                <StaggeredLetterReveal 
                  text="Share Every" 
                  className="text-4xl sm:text-6xl md:text-[9rem] font-black font-headline text-white tracking-[calc(-0.06em)] leading-[0.8] animate-text-shimmer italic"
                />
                <StaggeredLetterReveal 
                  text="Moment" 
                  className="text-4xl sm:text-6xl md:text-[9rem] font-black font-headline text-white tracking-[calc(-0.06em)] leading-[0.8] animate-text-shimmer italic"
                  delay={0.2}
                />
              </div>
            </HUDCorners>
          </div>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="text-base md:text-lg text-stone-300 max-w-2xl mt-4 mb-6 md:mb-8 font-light tracking-tight leading-relaxed px-4 mx-auto"
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

      <section id="reality" className="relative min-h-screen w-full bg-black flex flex-col items-center justify-center p-0 overflow-hidden py-32 md:py-48">
        {/* Architectural Background */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1634643172134-c9e93dec8b87?q=80&w=2070&auto=format&fit=crop"
            alt="Gotham Architectural Pillars"
            fill
            className="object-cover opacity-25 scale-105 saturate-0 transition-all duration-3000 ease-out brightness-[0.7] contrast-[1.2]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black" />
        </div>
        
        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto px-6 mb-24 md:mb-40 text-center">
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="font-code text-primary text-xs md:text-sm tracking-[0.8em] uppercase block mb-6 md:mb-8 font-bold"
            >
              The Pillars of Truth
            </motion.span>
            
            <div className="flex flex-col items-center gap-6">
              <StaggeredLetterReveal 
                text="REALITY SOCIAL"
                className="text-7xl sm:text-[10rem] md:text-[14rem] font-black font-headline text-white tracking-[calc(-0.06em)] leading-[0.75] uppercase text-center drop-shadow-2xl"
              />
            </div>
            
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "200px" }}
              className="h-1 bg-white/20 mx-auto mt-12 mb-12"
            />
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-xl md:text-4xl text-stone-300 max-w-4xl mx-auto font-light tracking-tighter leading-tight italic"
            >
              "We aren't here for the fame. We are here for the journey."
            </motion.p>
          </div>
          
          <RealityValues />
        </div>
      </section>

      <ManifestoSection />

      <AboutSection />
    </>
  );
}
