'use client';

import { motion, useInView, Variants } from 'framer-motion';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

interface TextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
}

export const StaggeredLetterReveal = ({ text, className, delay = 0, duration = 0.5, once = true }: TextProps) => {
  const words = text.split(" ");
  
  const container: Variants = {
    hidden: { opacity: 0 },
    visible: (i: number = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.02, delayChildren: delay },
    }),
  };

  const child: Variants = {
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 100,
        duration: duration,
      },
    },
    hidden: {
      opacity: 0,
      y: 40,
      rotateX: 45,
    },
  };

  const ref = useRef(null);
  const isInView = useInView(ref, { once });

  return (
    <motion.h1
      ref={ref}
      variants={container}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={cn("flex flex-wrap perspective-1000", className)}
    >
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-flex whitespace-nowrap mr-[0.2em] last:mr-0">
          {word.split("").map((letter, letterIndex) => (
            <motion.span 
              key={`${wordIndex}-${letterIndex}`} 
              variants={child} 
              className="inline-block origin-bottom"
            >
              {letter}
            </motion.span>
          ))}
        </span>
      ))}
    </motion.h1>
  );
};

export const TextMaskReveal = ({ text, className, delay = 0, once = true }: TextProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: "-10% 0px" });

  return (
    <div ref={ref} className="overflow-hidden py-1">
      <motion.div
        initial={{ y: "100%" }}
        animate={isInView ? { y: 0 } : { y: "100%" }}
        transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
        className={className}
      >
        {text}
      </motion.div>
    </div>
  );
};

export const TechnicalHeader = ({ title, subtitle, metadata }: { title: string; subtitle?: string; metadata?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="flex flex-col items-center text-center mb-24 relative px-4">
      {metadata && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="font-code text-[10px] uppercase tracking-[0.4em] text-primary/40 mb-4 flex items-center gap-4"
        >
          <span className="w-8 h-[1px] bg-primary/20" />
          {metadata}
          <span className="w-8 h-[1px] bg-primary/20" />
        </motion.div>
      )}
      
      <div className="relative group">
        <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: "100%" }}
            className="absolute -top-4 left-0 h-[1px] bg-white/10"
        />
        <TextMaskReveal 
          text={title}
          className="text-3xl sm:text-4xl md:text-8xl font-black font-headline text-white tracking-[calc(-0.05em)] leading-none pt-4 pb-2"
        />
         <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: "100%" }}
            className="absolute -bottom-2 right-0 h-[1px] bg-white/10"
        />
      </div>

      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-8 text-base md:text-xl text-stone-500 max-w-xl font-light leading-relaxed tracking-tight"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
};

export const HUDCorners = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="relative p-6 md:p-12">
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/20" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white/20" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-white/20" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/20" />
            {children}
        </div>
    );
};

export const MetadataLabel = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="flex items-center gap-2 font-code text-[10px] uppercase tracking-[0.2em] text-primary/60 mb-2"
    >
      <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
      {text}
    </motion.div>
  );
};

export const LivePulse = () => {
  return (
    <div className="flex items-center gap-3 px-4 py-1.5 bg-red-500/5 border border-red-500/10 rounded-full backdrop-blur-sm">
      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
      <span className="font-code text-[10px] font-bold text-red-500 tracking-[0.2em] uppercase">Signal Active</span>
    </div>
  );
};

export const BlurIn = ({ text, className, delay = 0, duration = 1, once = true }: TextProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once });

  return (
    <motion.div
      ref={ref}
      initial={{ filter: "blur(10px)", opacity: 0 }}
      animate={isInView ? { filter: "blur(0px)", opacity: 1 } : { filter: "blur(10px)", opacity: 0 }}
      transition={{ duration, delay }}
      className={className}
    >
      {text}
    </motion.div>
  );
};

export const GradualSpacing = ({ text, className, delay = 0, once = true }: TextProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once });
  const words = text.split(" ");

  return (
    <div ref={ref} className="flex flex-wrap justify-center">
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-flex whitespace-nowrap mr-[0.2em] last:mr-0">
          {word.split("").map((char, i) => (
            <motion.span
              key={`${wordIndex}-${i}`}
              initial={{ opacity: 0, x: -18 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -18 }}
              transition={{ duration: 0.5, delay: delay + (wordIndex * 5 + i) * 0.03 }}
              className={cn("inline-block", className)}
            >
              {char}
            </motion.span>
          ))}
        </span>
      ))}
    </div>
  );
};
