
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

const aboutCards = [
  {
    title: 'Go Live, Instantly.',
    description:
      "Forget complicated setups. With LIVENET, you're just a click away from sharing your world. Whether you're a gamer, an artist, or just want to chat, your stage is always ready.",
  },
  {
    title: 'Shape the Show with Interactive Games.',
    description:
      "Turn passive viewing into active co-creation with live challenges like 'Truth or Dare' or AI-generated tasks displayed right on your stream.",
  },
  {
    title: 'Real-Time Connections.',
    description:
      "Every stream is a community. Viewers can engage with live chat, reactions, and GIFs. Connect one-on-one with direct messaging, and build your crew by following your favorite creators.",
  },
  {
    title: 'Find Your People.',
    description:
      'Discover and be discovered. Our personalized feed connects you with creators and communities that share your vibe. On AgoraLive, you’re not just another face in the crowd.',
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
          <CarouselContent>
            {aboutCards.map((card, index) => (
              <CarouselItem key={index} className="md:basis-1/2">
                <div className="p-4 h-[35rem]">
                  <Card className="h-full rounded-3xl overflow-hidden">
                    <CardContent className="flex flex-col p-0 h-full">
                       <div className="w-full h-3/5 bg-muted flex-shrink-0" />
                       <div className="p-6 flex-grow flex flex-col">
                          <h3 className="text-2xl font-bold font-headline mb-2 text-card-foreground">
                            {card.title}
                          </h3>
                          <p className="text-muted-foreground">
                            {card.description}
                          </p>
                       </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>
      </div>
    </section>
  );
}
