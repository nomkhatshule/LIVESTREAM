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
  const letters = text.split("");
  const container: Variants = {
    hidden: { opacity: 0 },
    visible: (i: number = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.03, delayChildren: delay * i },
    }),
  };

  const child: Variants = {
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
        duration: duration,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      filter: "blur(8px)",
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
      className={cn("flex flex-wrap", className)}
    >
      {letters.map((letter, index) => (
        <motion.span key={index} variants={child} className="inline-block">
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
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
        transition={{ duration: 0.8, delay, ease: [0.33, 1, 0.68, 1] }}
        className={className}
      >
        {text}
      </motion.div>
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

  return (
    <div ref={ref} className="flex justify-center space-x-1">
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, x: -18 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -18 }}
          transition={{ duration: 0.5, delay: delay + i * 0.03 }}
          className={cn("inline-block", className)}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
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
    <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      <span className="font-code text-[10px] font-bold text-red-500 tracking-widest uppercase">Live Signal</span>
    </div>
  );
};
