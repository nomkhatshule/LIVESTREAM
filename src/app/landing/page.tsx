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

const WordReveal = ({ text }: { text: string }) => {
  const words = text.split(' ');
  return (
    <span className="flex flex-wrap justify-center overflow-hidden">
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: 0.8,
            delay: i * 0.1,
            ease: [0.33, 1, 0.68, 1]
          }}
          className="inline-block mr-[0.2em] last:mr-0"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
};

const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex flex-col items-center text-center mb-16"
    >
      <div className="overflow-hidden">
        <motion.h2 
          initial={{ y: "100%" }}
          whileInView={{ y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-4xl md:text-7xl font-bold font-headline text-white tracking-tighter"
        >
          {title}
        </motion.h2>
      </div>
      {subtitle && (
        <p className="mt-4 text-xl text-stone-400 max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
      <motion.div 
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.5 }}
        className="w-24 h-1 bg-primary rounded-full mt-6 origin-center" 
      />
    </motion.div>
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
          <h1 className="text-5xl md:text-8xl font-bold font-headline text-white mb-6 drop-shadow-2xl tracking-tight">
            <WordReveal text="Share Every Moment" />
          </h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-xl md:text-2xl text-stone-200 max-w-2xl mb-10 drop-shadow-lg font-light"
          >
            Discover In Real Life streams from creators around the world, or start streaming and build your own community.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1.2 }}
          >
            <Button size="lg" className="bg-white text-black hover:bg-stone-200 h-14 px-8 rounded-full text-lg font-bold transition-all hover:scale-105 active:scale-95 shadow-xl" asChild>
              <Link href="/feed">
                <Clapperboard className="mr-2 h-6 w-6" />
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
