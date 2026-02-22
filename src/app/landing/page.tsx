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
import { StaggeredLetterReveal, TextMaskReveal, BlurIn, GradualSpacing } from '@/components/landing/typography-effects';

const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  return (
    <div className="flex flex-col items-center text-center mb-16 px-4">
      <TextMaskReveal 
        text={title}
        className="text-4xl md:text-7xl font-bold font-headline text-white tracking-tighter"
      />
      {subtitle && (
        <BlurIn
          text={subtitle}
          delay={0.4}
          className="mt-6 text-lg md:text-xl text-stone-400 max-w-2xl mx-auto leading-relaxed"
        />
      )}
      <motion.div 
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.8 }}
        className="w-24 h-1 bg-primary rounded-full mt-8 origin-center" 
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
            className="w-full h-full object-cover"
            key="hero-video"
          />
        </motion.div>
        <div className="absolute inset-0 bg-black/50 z-10" />
        <motion.div 
          style={{ y: yHero, opacity: opacityHero }}
          className="relative z-20 flex flex-col items-center"
        >
          <StaggeredLetterReveal 
            text="Share Every Moment" 
            className="text-6xl md:text-9xl font-bold font-headline text-white mb-8 drop-shadow-2xl tracking-tighter leading-none animate-text-shimmer"
          />
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="text-xl md:text-2xl text-stone-200/80 max-w-2xl mb-12 drop-shadow-lg font-light tracking-tight leading-relaxed px-4"
          >
            Discover In Real Life streams from creators around the world, or start streaming and build your own community.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.6 }}
          >
            <Button size="lg" className="bg-white text-black hover:bg-stone-200 h-16 px-10 rounded-full text-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.3)]" asChild>
              <Link href="/feed">
                <Clapperboard className="mr-3 h-6 w-6" />
                Watch Now
              </Link>
            </Button>
          </motion.div>
        </motion.div>
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
                className="object-cover"
            />
        </motion.div>
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 max-w-5xl">
             <motion.h2 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="text-4xl md:text-8xl font-bold font-headline text-white drop-shadow-2xl tracking-tighter leading-none"
             >
                Reality social, <br/><span className="text-primary italic">by the people,</span> <br/>for the people
             </motion.h2>
        </div>
      </section>

      <ManifestoSection />

      <AboutSection />
    </>
  );
}
