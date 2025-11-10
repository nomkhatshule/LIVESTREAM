
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Gamepad2, Heart, MessageSquareMore, Search, Swords } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';

// Simplified reaction type for the demo
type DemoReaction = {
  id: number;
  emoji: string;
  x: number;
  key: number;
};

const FloatingReaction = ({ reaction }: { reaction: DemoReaction }) => (
  <div
    key={reaction.key}
    className="animate-float-up absolute bottom-0 text-3xl opacity-0"
    style={{ left: `${reaction.x}%` }}
  >
    {reaction.emoji}
  </div>
);

const DemoComment = ({ avatar, name, text, attachment }: { avatar: string, name: string, text?: string, attachment?: { type: 'image' | 'gif', url: string, alt: string } }) => (
    <div className="flex items-start gap-2 text-sm text-white p-1.5 rounded-lg bg-black/20 backdrop-blur-sm w-fit">
        <Avatar className="h-6 w-6 border-2 border-secondary">
            <AvatarImage src={avatar} />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
            <span className="font-bold font-headline text-primary mr-1.5">{name}</span>
            {text && <span className="break-words">{text}</span>}
            {attachment && (
                <div className="mt-1">
                    <Image src={attachment.url} width={100} height={80} alt={attachment.alt} className="rounded-md" />
                </div>
            )}
        </div>
    </div>
);


export default function ProductDemo() {
  const [reactions, setReactions] = useState<DemoReaction[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setReactions(prevReactions => {
        const newReaction: DemoReaction = {
          id: Date.now(),
          emoji: Math.random() > 0.5 ? '❤️' : '👍',
          x: Math.random() * 80 + 10,
          key: Math.random(),
        };
        // Keep the array from growing indefinitely
        const updatedReactions = [...prevReactions, newReaction].slice(-20);
        return updatedReactions;
      });
    }, 1000); // Add a new reaction every second

    return () => clearInterval(interval);
  }, []);


  return (
    <section className="relative min-h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center p-4 overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 bg-grid-zinc-800/20 [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)]"></div>

        <div className="text-center z-10 px-4 mb-12">
             <h2 className="text-4xl md:text-6xl font-bold font-headline text-white drop-shadow-xl">
                Experience the Live Feed
            </h2>
        </div>
      
        {/* Phone Mockup */}
        <div className="relative w-[260px] h-[560px] md:w-[300px] md:h-[640px] bg-zinc-900 rounded-[40px] border-[10px] border-black shadow-2xl overflow-hidden z-20">
            {/* Video Background */}
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute top-0 left-0 w-full h-full object-cover"
                poster="https://cdn.midjourney.com/a857a58a-3511-4355-901c-6d9b54178577/0_0.png"
            >
                <source src="https://cdn.pixabay.com/video/2016/08/22/4727-179738642_tiny.mp4" type="video/mp4" />
            </video>

            {/* UI Overlay */}
            <div className="absolute inset-0 flex flex-col justify-between p-3 text-white z-10 pointer-events-none">
                {/* Top: Host Info */}
                <div className="flex items-center gap-2">
                    <Avatar className={cn("h-10 w-10 border-2 border-destructive animate-breathing")}>
                        <AvatarImage src="https://picsum.photos/seed/demohost/200" alt="Host" />
                        <AvatarFallback>H</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-bold font-headline text-base">StreamSavvy</p>
                        <p className="text-xs">Vibin' with the community!</p>
                    </div>
                </div>

                {/* Bottom: Chat and Reactions */}
                <div className="relative h-1/2 flex flex-col justify-end">
                    {/* Floating Reactions */}
                     <div className="absolute bottom-16 left-0 h-64 w-48 z-20">
                        {reactions.map((r) => <FloatingReaction key={r.key} reaction={r} />)}
                     </div>

                    {/* Chat Messages */}
                    <div className="space-y-1.5">
                        <DemoComment avatar="https://picsum.photos/seed/user1/100" name="ChattyCathy" text="This is awesome! 🔥" />
                        <DemoComment avatar="https://picsum.photos/seed/user2/100" name="LurkerLou" text="Let's goooo! 🚀" />
                        <DemoComment avatar="https://picsum.photos/seed/user3/100" name="GifMaster" attachment={{ type: 'gif', url: 'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExaGlicjRqdG1zZGlmNW1hZHE1d3Z2dHRlZGhyMmh2emlmcjZrbmE5NSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/hVrxCqNNE1i4w/giphy.gif', alt: 'Mind blown' }} />
                        <DemoComment avatar="https://picsum.photos/seed/user4/100" name="ArtFan" attachment={{ type: 'image', url: 'https://picsum.photos/seed/chat-image/200/150', alt: 'Cool art' }} />

                    </div>
                </div>
            </div>

             {/* Right Side Action Bar */}
            <div className="absolute top-1/2 right-0 -translate-y-1/2 z-20 flex flex-col items-center gap-y-5 pointer-events-auto text-white p-2">
                <div className="flex flex-col items-center">
                    <Heart className="h-7 w-7 drop-shadow-md text-red-500 fill-red-500" strokeWidth={1.5} />
                    <span className="text-[10px] font-bold mt-1">1.2k</span>
                </div>
                <div className="flex flex-col items-center">
                    <MessageSquareMore className="h-7 w-7 drop-shadow-md" strokeWidth={1.5} />
                    <span className="text-[10px] font-bold mt-1">345</span>
                </div>
                <div className="flex flex-col items-center">
                   <Gamepad2 className="h-7 w-7 drop-shadow-md" strokeWidth={1.5} />
                   <span className="text-[10px] font-bold mt-1">Fun</span>
                </div>
                <div className="flex flex-col items-center">
                   <Search className="h-7 w-7 drop-shadow-md" strokeWidth={1.5} />
                    <span className="text-[10px] font-bold mt-1">AI</span>
                </div>
            </div>
        </div>
    </section>
  );
}
