
'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useInView, useSpring } from 'framer-motion';
import { TextMaskReveal, GradualSpacing } from './typography-effects';

const ManifestoLine = ({ children, index }: { children: React.ReactNode, index: number }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { amount: 0.5, once: false });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0.1, y: 10, filter: "blur(4px)" }}
            animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0.1, y: 10, filter: "blur(4px)" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.05 }}
            className="mb-6 last:mb-0"
        >
            {children}
        </motion.div>
    );
};

export default function ManifestoSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end end"]
    });

    const videoScale = useTransform(scrollYProgress, [0, 1], [1.1, 1]);
    const videoOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.4, 0.7, 0.7, 0.4]);
    const smoothVideoScale = useSpring(videoScale, { damping: 20, stiffness: 100 });

    const lines = [
        "This is for people on the move.",
        "For the walk through a city at night.",
        "For the new restaurant.",
        "For the morning run.",
        "For the push to the top of the trail.",
        "For cooking at home,",
        "trying new recipes,",
        "traveling when you can.",
        "For stepping outside",
        "just to feel alive.",
        "This is for adventure.",
        "For movement.",
        "For inspiration.",
        "For chasing that one dream",
        "that keeps you up at night.",
        "You don’t need to be famous.",
        "You don’t need followers.",
        "You just need to be doing something.",
        "There’s a world to explore.",
        "People to meet.",
        "Goals to reach.",
        "Just go do it."
    ];

    return (
        <section 
            ref={sectionRef} 
            id="manifesto" 
            className="relative w-full bg-black min-h-[300vh] flex flex-col items-center"
        >
            {/* Sticky Background Video */}
            <div className="sticky top-0 left-0 w-full h-screen overflow-hidden">
                <motion.video
                    style={{ scale: smoothVideoScale, opacity: videoOpacity }}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute top-0 left-0 w-full h-full object-cover"
                >
                    <source src="/video/181376-866506956_small.mp4" type="video/mp4" />
                </motion.video>
                <div className="absolute inset-0 bg-gradient-to-b from-black via-black/40 to-black" />
            </div>

            {/* Content that scrolls over the sticky background */}
            <div className="relative z-10 w-full -mt-[100vh] flex flex-col items-center">
                <div className="h-screen flex items-center justify-center">
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1 }}
                        className="bg-white/10 border border-white/20 rounded-full px-8 py-3 backdrop-blur-md shadow-2xl"
                    >
                        <TextMaskReveal 
                            text="OUR MANIFESTO"
                            className="text-xs md:text-sm font-bold font-headline uppercase tracking-[0.4em] text-white"
                        />
                    </motion.div>
                </div>

                <div className="max-w-4xl px-8 pb-[50vh] text-center">
                    <div className="text-3xl md:text-5xl lg:text-7xl font-headline text-white leading-tight font-bold space-y-12 tracking-tight">
                        {lines.map((line, i) => (
                            <ManifestoLine key={i} index={i}>
                                {line}
                            </ManifestoLine>
                        ))}
                    </div>
                </div>

                {/* Final CTA */}
                <div className="h-screen flex items-center justify-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", damping: 15 }}
                        className="flex flex-col items-center gap-12"
                    >
                        <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                        <GradualSpacing 
                            text="Be Adventurous"
                            className="text-white text-5xl md:text-8xl font-headline italic font-black uppercase tracking-tighter"
                        />
                        <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
