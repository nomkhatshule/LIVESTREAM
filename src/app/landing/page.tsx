'use client';

import { Button } from '@/components/ui/button';
import { Clapperboard } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import LandingHeader from '@/components/landing/header';
import AboutSection from '@/components/landing/about-section';
import ProductDemo from '@/components/landing/product-demo';
import ManifestoSection from '@/components/landing/ManifestoSection';
import { motion, useScroll, useTransform } from 'framer-motion';
import { StaggeredLetterReveal, TextMaskReveal, BlurIn, GradualSpacing, MetadataLabel, LivePulse } from '@/components/landing/typography-effects';

const SectionHeader = ({ title, subtitle, metadata }: { title: string; subtitle?: string; metadata?: string }) => {
  return (
    <div className="flex flex-col items-center text-center mb-20 px-4">
      {metadata && <MetadataLabel text={metadata} />}
      <TextMaskReveal 
        text={title}
        className="text-4xl md:text-7xl font-bold font-headline text-white tracking-tighter"
      />
      {subtitle && (
        <BlurIn
          text={subtitle}
          delay={0.4}
          className="mt-6 text-lg md:text-xl text-stone-400 max-w-2xl mx-auto leading-relaxed font-light"
        />
      )}
      <motion.div 
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.8 }}
        className="w-16 h-[2px] bg-primary rounded-full mt-10 origin-center opacity-50" 
      />
    </div>
  );
};

export default function LandingPage() {
  const { scrollY } = useScroll();
  const yHero = useTransform(scrollY, [0, 500], [0, 200]);
  const scaleHero = useTransform(scrollY, [0, 500], [1, 1.15]);
  const opacityHero = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <>
      <LandingHeader />
      <div id="hero" className="relative h-screen w-full overflow-hidden flex items-center justify-center text-center p-8">
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
          className="relative z-20 flex flex-col items-center"
        >
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mb-6"
          >
            <LivePulse />
          </motion.div>
          <StaggeredLetterReveal 
            text="Share Every Moment" 
            className="text-6xl md:text-9xl font-bold font-headline text-white mb-8 tracking-tighter leading-[0.9] animate-text-shimmer italic"
          />
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="text-xl md:text-2xl text-white max-w-2xl mb-12 font-light tracking-tight leading-relaxed px-4"
          >
            Experience the unfiltered world. Connect with creators in real-time as they explore, create, and push boundaries.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.6 }}
          >
            <Button size="lg" className="bg-white text-black hover:bg-stone-200 h-16 px-10 rounded-full text-xl font-bold transition-all hover:scale-105 active:scale-95 group" asChild>
              <Link href="/feed">
                <Clapperboard className="mr-3 h-6 w-6 transition-transform group-hover:rotate-12" />
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

      <section id="reality" className="relative h-screen w-full bg-black flex flex-col items-center justify-center text-center p-8 overflow-hidden">
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
        <div className="relative z-10 max-w-5xl">
             <MetadataLabel text="Location: New York City / 40.7128° N" />
             <motion.h2 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="text-4xl md:text-8xl font-bold font-headline text-white tracking-tighter leading-[0.9] italic"
             >
                Reality social, <br/><span className="text-primary not-italic">by the people,</span> <br/>for the people
             </motion.h2>
        </div>
      </section>

      <ManifestoSection />

      <AboutSection />
    </>
  );
}
