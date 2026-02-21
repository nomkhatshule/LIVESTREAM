'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Clapperboard, Users } from 'lucide-react';
import Image from 'next/image';
import { Separator } from '../ui/separator';
import { motion } from 'framer-motion';

const aboutCards = [
  {
    icon: Clapperboard,
    title: 'Go Live, Instantly.',
    description:
      "Forget complicated setups. With LIVENET, you're just a click away from sharing your world. Whether you're a gamer, artist, or just want to chat, your stage is always ready.",
    imageUrl: 'https://media.istockphoto.com/id/1000032126/vector/video-chat-application-concept-male-hand-holding-smart-phone-with-young-woman-on-display.jpg?s=612x612&w=0&k=20&c=v2gHq6nDoi7C7JxTLgSFApchXCULzUOePdg3wTCWnLk=',
    imageHint: 'live streaming setup',
  },
  {
    icon: Users,
    title: 'Real-Time Connections.',
    description:
      "Engage with viewers through live chat, reactions, and GIFs. Connect one-on-one with direct messaging, and build your community by following your favorite creators.",
    imageUrl: 'https://cdn.pixabay.com/photo/2025/01/22/21/06/webinar-9353158_1280.jpg',
    imageHint: 'people connecting online',
  },
  {
    icon: Users,
    title: 'Stream with Your Squad.',
    description:
      'Why stream alone? Invite multiple friends to join your broadcast for collaborative streams, group chats, and podcasts. Share the spotlight and create moments together.',
    imageUrl: 'https://media.istockphoto.com/id/1302440408/de/vektor/videokonferenzbildschirm.jpg?s=612x612&w=0&k=20&c=vtKcv91xvlf4IW3IIuoX3XRup5pi7znFEwpx0xW2ifI=',
    imageHint: 'friends video call',
  },
];

export default function AboutSection() {
  return (
    <section id="features" className="w-full py-24 lg:py-32 bg-white overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center text-center mb-16"
        >
            <h2 className="text-4xl md:text-6xl font-bold font-headline text-black mb-4">
                Built for the Move
            </h2>
            <div className="w-20 h-1 bg-primary rounded-full" />
        </motion.div>

        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {aboutCards.map((card, index) => (
              <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 h-[35rem]"
                >
                  <Card className="h-full rounded-[2.5rem] overflow-hidden bg-stone-50 border-stone-200 shadow-sm hover:shadow-xl transition-shadow duration-500">
                    <CardContent className="flex flex-col p-0 h-full">
                       <div className="w-full h-3/5 bg-muted flex-shrink-0 relative group">
                        {card.imageUrl && (
                          <Image 
                            src={card.imageUrl}
                            alt={card.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                            data-ai-hint={card.imageHint}
                          />
                        )}
                       </div>
                       <Separator className="bg-black/5" />
                       <div className="p-8 flex-grow flex flex-col">
                          <div className="mb-4 text-primary">
                             <card.icon className="w-8 h-8" />
                          </div>
                          <h3 className="text-2xl font-bold font-headline mb-3 text-black">
                            {card.title}
                          </h3>
                          <p className="text-zinc-600 text-base leading-relaxed">
                            {card.description}
                          </p>
                       </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block">
            <CarouselPrevious className="-left-12 border-stone-200 text-black hover:bg-stone-100" />
            <CarouselNext className="-right-12 border-stone-200 text-black hover:bg-stone-100" />
          </div>
        </Carousel>
      </div>
    </section>
  );
}
