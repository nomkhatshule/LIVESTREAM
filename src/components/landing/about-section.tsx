
'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Clapperboard, Globe, Swords, Users } from 'lucide-react';
import Image from 'next/image';
import { Separator } from '../ui/separator';

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
    icon: Swords,
    title: 'Shape the Show with Interactive Games.',
    description:
      "Turn passive viewing into active co-creation with our in-stream games. Use the AI Game Master to generate endless 'Truth,' 'Dare,' or unique tasks to keep your content fresh.",
    imageUrl: 'https://cdn.pixabay.com/photo/2020/04/15/15/00/gamer-5046924_1280.jpg',
    imageHint: 'gamer controller',
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
    <section className="w-full py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {aboutCards.map((card, index) => (
              <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2">
                <div className="p-4 h-[35rem]">
                  <Card className="h-full rounded-3xl overflow-hidden bg-white border-black">
                    <CardContent className="flex flex-col p-0 h-full">
                       <div className="w-full h-3/5 bg-muted flex-shrink-0 relative">
                        {card.imageUrl && (
                          <Image 
                            src={card.imageUrl}
                            alt={card.title}
                            fill
                            className="object-cover"
                            data-ai-hint={card.imageHint}
                          />
                        )}
                       </div>
                       <Separator className="bg-black/20" />
                       <div className="p-6 flex-grow flex flex-col">
                          <h3 className="text-xl font-bold font-headline mb-2 text-black">
                            {card.title}
                          </h3>
                          <p className="text-zinc-600 text-sm">
                            {card.description}
                          </p>
                       </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  );
}
