'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Heart, MessageSquareMore } from 'lucide-react';
import React from 'react';
import { Badge } from '../ui/badge';
import { motion } from 'framer-motion';
import { StaggeredLetterReveal } from './typography-effects';

const DemoComment = ({ avatar, name, text, delay }: { avatar: string, name: string, text: string, delay: number }) => (
    <motion.div 
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ delay, duration: 0.5 }}
        className="group flex items-start text-sm text-white pb-1"
    >
        <Avatar className="h-6 w-6 border-2 border-secondary">
            <AvatarImage src={avatar} />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 ml-2">
             <span className="font-bold font-headline text-primary mr-1.5 text-xs">{name}</span>
             <span className="break-words text-sm">{text}</span>
        </div>
    </motion.div>
);


const FeatureDescription = ({ title, description, alignment = 'left' }: { title: string, description: string, alignment?: 'left' | 'right' }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
    className={cn("w-full md:w-48 text-white text-center md:text-left", alignment === 'right' ? 'md:text-right' : 'md:text-left')}
  >
    <h4 className="font-bold font-headline text-lg">{title}</h4>
    <p className="text-xs text-stone-400 mt-1 leading-relaxed">{description}</p>
  </motion.div>
);

const ConnectorLine = ({ className }: { className?: string }) => (
  <div className={cn("hidden md:block w-12 border-b-2 border-dashed border-zinc-600", className)} />
);


export default function ProductDemo() {
  
  return (
    <section id="demo" className="relative min-h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center p-4 overflow-hidden py-24">
        {/* Background elements */}
        <div className="absolute inset-0 bg-grid-zinc-800/20 [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)]"></div>

        <div className="text-center z-10 px-4 mb-16">
             <StaggeredLetterReveal 
                text="Experience the Live Feed"
                className="text-4xl md:text-7xl font-bold font-headline text-white tracking-tight justify-center"
             />
        </div>
      
        {/* Phone Mockup and Feature Descriptions */}
        <div className="relative flex flex-col md:flex-row items-center justify-center gap-x-4">

            {/* Left Descriptions */}
            <div className="flex md:flex-col justify-around w-full md:w-auto items-center md:items-end gap-12 md:gap-20">
              <div className="flex items-center gap-4">
                <FeatureDescription
                  title="Ride On"
                  description="Show creators some love and let 'em know you're riding with them."
                  alignment="right"
                />
                <ConnectorLine />
              </div>
               <div className="flex items-center gap-4">
                <FeatureDescription
                  title="Deep Engagement"
                  description="Comment on any live stream on your feed with a suite of expressive tools."
                  alignment="right"
                />
                 <ConnectorLine />
              </div>
            </div>
            
            {/* Center Phone */}
             <motion.div 
                initial={{ opacity: 0, y: 50, rotateX: 10 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative w-[280px] h-[560px] md:w-[320px] md:h-[640px] bg-black rounded-[40px] border-4 border-zinc-700 z-20 my-8 md:my-0"
             >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl z-30"></div>
                <div className="relative w-full h-full bg-black rounded-[36px] overflow-hidden">
                    {/* Video Background */}
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute top-0 left-0 w-full h-full object-cover"
                    >
                        <source src="/video/147560-791705573.mp4" type="video/mp4" />
                    </video>

                    {/* UI Overlay */}
                    <div className="absolute inset-0 flex flex-col justify-between p-3 text-white z-10 pointer-events-none">
                        {/* Top: Host Info */}
                        <div className="flex items-center gap-2 mt-8">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src="https://picsum.photos/seed/demohost/200" alt="Host" />
                                <AvatarFallback>H</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold font-headline text-base">StreamSavvy</p>
                                  <Badge variant="destructive" className="px-2 py-0.5 text-xs h-5">LIVE</Badge>
                                </div>
                                <p className="text-[10px] opacity-80 uppercase tracking-wider">NYC Street Vibes</p>
                            </div>
                        </div>

                        {/* Bottom: Chat and Reactions */}
                        <div className="relative h-1/2 flex flex-col justify-end">
                            {/* Chat Messages */}
                            <div className="space-y-1.5">
                                <DemoComment delay={0.4} avatar="https://picsum.photos/seed/user1/100" name="ChattyCathy" text="This is awesome! 🔥" />
                                <DemoComment delay={0.6} avatar="https://picsum.photos/seed/user2/100" name="LurkerLou" text="Let's goooo! 🚀" />
                                <DemoComment delay={0.8} avatar="https://picsum.photos/seed/user4/100" name="ArtFan" text="What a vibe!" />
                            </div>
                        </div>
                    </div>

                    {/* Right Side Action Bar */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1, duration: 0.5 }}
                        className="absolute top-1/2 right-0 -translate-y-1/2 z-20 flex flex-col items-center gap-y-6 pointer-events-auto text-white p-2"
                    >
                        <div id="demo-like" className="flex flex-col items-center">
                            <Heart className="h-8 w-8" strokeWidth={1.5} />
                            <span className="text-xs font-bold mt-1">1.2k</span>
                        </div>
                        <div id="demo-comment" className="flex flex-col items-center">
                            <MessageSquareMore className="h-8 w-8" strokeWidth={1.5} />
                            <span className="text-xs font-bold mt-1">345</span>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Right Descriptions */}
             <div className="flex md:flex-col justify-around w-full md:w-auto items-center md:items-start gap-12 md:gap-20">
              <div className="flex items-center gap-4">
                  <ConnectorLine />
                  <FeatureDescription
                    title="Seamless Discovery"
                    description="Flick through a vertical feed of live streams from around the world."
                  />
              </div>
              <div className="flex items-center gap-4">
                  <ConnectorLine />
                  <FeatureDescription
                    title="Gift Your Faves"
                    description="Send virtual gifts to show appreciation and stand out in the chat."
                  />
              </div>
            </div>
        </div>
    </section>
  );
}
