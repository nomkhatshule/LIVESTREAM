'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Gamepad2, Heart, MessageSquareMore, Search, Send, Swords } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Badge } from '../ui/badge';


const DemoComment = ({ avatar, name, text }: { avatar: string, name: string, text: string }) => (
    <div className="group flex items-start text-sm text-white pb-1">
        <Avatar className="h-6 w-6 border-2 border-secondary">
            <AvatarImage src={avatar} />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 ml-2">
             <span className="font-bold font-headline text-primary mr-1.5 text-xs">{name}</span>
             <span className="break-words text-sm">{text}</span>
        </div>
    </div>
);


const FeatureDescription = ({ title, description, alignment = 'left' }: { title: string, description: string, alignment?: 'left' | 'right' }) => (
  <div className={cn("w-full md:w-48 text-white text-center md:text-left", alignment === 'right' ? 'md:text-right' : 'md:text-left')}>
    <h4 className="font-bold font-headline">{title}</h4>
    <p className="text-xs text-stone-300 mt-1">{description}</p>
  </div>
);

const ConnectorLine = ({ className }: { className?: string }) => (
  <div className={cn("hidden md:block w-12 border-b-2 border-dashed border-zinc-600", className)} />
);


export default function ProductDemo() {
  
  return (
    <section id="demo" className="relative min-h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center p-4 overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 bg-grid-zinc-800/20 [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)]"></div>

        <div className="text-center z-10 px-4 mb-12">
             <h2 className="text-4xl md:text-6xl font-bold font-headline text-white drop-shadow-xl">
                Experience the Live Feed
            </h2>
        </div>
      
        {/* Phone Mockup and Feature Descriptions */}
        <div className="relative flex flex-col md:flex-row items-center justify-center gap-4">

            {/* Left Descriptions */}
            <div className="flex flex-col gap-8 md:gap-16 w-full md:w-48 items-center md:items-end">
              <FeatureDescription
                title="Like Any Live Stream"
                description="Like any live stream on your feed to show your support for the creator."
                alignment="right"
              />
            </div>
            
            {/* Dashed Lines - Left */}
            <div className="hidden md:flex flex-col justify-start w-12 h-40">
               <ConnectorLine className="self-end" />
            </div>

             <div className="relative w-[280px] h-[560px] md:w-[320px] md:h-[640px] bg-black rounded-[40px] border-4 border-zinc-700 shadow-2xl z-20 my-8 md:my-0">
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
                        <div className="flex items-center gap-2 mt-4">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src="https://picsum.photos/seed/demohost/200" alt="Host" />
                                <AvatarFallback>H</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold font-headline text-base">StreamSavvy</p>
                                  <Badge variant="destructive" className="px-2 py-0.5 text-xs h-5 blinking-text">LIVE</Badge>
                                </div>
                                <p className="text-xs">Vibin' with the community!</p>
                            </div>
                        </div>

                        {/* Bottom: Chat and Reactions */}
                        <div className="relative h-1/2 flex flex-col justify-end">
                            {/* Chat Messages */}
                            <div className="space-y-1.5">
                                <DemoComment avatar="https://picsum.photos/seed/user1/100" name="ChattyCathy" text="This is awesome! 🔥" />
                                <DemoComment avatar="https://picsum.photos/seed/user2/100" name="LurkerLou" text="Let's goooo! 🚀" />
                                <DemoComment avatar="https://picsum.photos/seed/user4/100" name="ArtFan" text="What a vibe!" />
                            </div>
                        </div>
                    </div>

                    {/* Right Side Action Bar */}
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 z-20 flex flex-col items-center gap-y-5 pointer-events-auto text-white p-2">
                        <div id="demo-like" className="flex flex-col items-center">
                            <Heart className="h-7 w-7 drop-shadow-md text-red-500 fill-red-500" strokeWidth={1.5} />
                            <span className="text-[10px] font-bold mt-1">1.2k</span>
                        </div>
                        <div id="demo-comment" className="flex flex-col items-center">
                            <MessageSquareMore className="h-7 w-7 drop-shadow-md" strokeWidth={1.5} />
                            <span className="text-[10px] font-bold mt-1">345</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashed Lines - Right */}
            <div className="hidden md:flex flex-col justify-end w-12 h-40">
               <ConnectorLine />
            </div>
            
            {/* Right Descriptions */}
             <div className="flex flex-col w-full md:w-48 items-center md:items-start">
               <FeatureDescription
                title="Comment on Every Live"
                description="Comment on any live stream on your feed using text, GIFs, and images to share your reactions."
              />
            </div>
        </div>
    </section>
  );
}
