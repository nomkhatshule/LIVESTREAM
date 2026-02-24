'use client';

import React from 'react';
import { motion } from 'framer-motion';

const InstitutionalPillar = ({ number, title, description, delay }: { number: string, title: string, description: string, delay: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-col pt-12 pb-16 md:py-24 px-8 md:px-16 group"
    >
        {/* Architectural Divider */}
        <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent hidden md:block" />
        
        <div className="relative z-10">
            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 0.1, scale: 1 }}
                className="font-headline font-black text-7xl md:text-9xl absolute -top-12 -left-4 text-white pointer-events-none"
            >
                {number}
            </motion.div>
            
            <h3 className="text-3xl md:text-5xl font-black font-headline text-white leading-none tracking-[calc(-0.04em)] uppercase mb-8 md:mb-12 relative">
                {title}
            </h3>
            
            <p className="text-stone-400 text-lg md:text-xl font-light leading-relaxed max-w-sm tracking-tight">
                {description}
            </p>
        </div>

        {/* Hover Glow Effect */}
        <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
    </motion.div>
);

export default function RealityValues() {
    return (
        <div className="w-full mt-12 md:mt-32 border-y border-white/10 bg-black/40 backdrop-blur-md relative overflow-hidden">
            {/* Background Texture/Noise */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 relative max-w-[1600px] mx-auto">
                <InstitutionalPillar 
                    number="I"
                    title="THE DOCTRINE OF MOTION"
                    description="LIVENET mandate movement.  We are a platform dedicated to the journey, capturing every step from the city sidewalk to the mountain peak. We are a community defined by movement and adventure."
                    delay={0.2}
                />
                <InstitutionalPillar 
                    number="II"
                    title="THE PURITY OF REALITY"
                    description="We have abolished the influencer. No professional rigs, no faked lives, no synthetic engagement. Just the ordinary citizen, a single device, and the absolute truth of the moment."
                    delay={0.4}
                />
                <InstitutionalPillar 
                    number="III"
                    title="THE CHASE OF INTENT"
                    description="We reject the incentive. No big checks, no artificial growth. We stream to fulfill the bucket list, to conquer the dream, and to inspire the next explorer for the sheer fucks of it."
                    delay={0.6}
                />
            </div>
        </div>
    );
}
