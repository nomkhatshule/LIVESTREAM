
'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { Clapperboard, Globe, Swords, Users } from 'lucide-react';

const aboutCards = [
  {
    icon: <Globe className="w-16 h-16 text-primary" />,
    title: 'Welcome to the Real Internet.',
    description:
      'In a world of AI slop and soulless content, AgoraLive is a stand for authenticity. We are a platform for real people, real moments, and real connections, shared as they happen.',
  },
  {
    icon: <Clapperboard className="w-16 h-16 text-primary" />,
    title: 'Your Stage, Your Rules.',
    description:
      'Go live in seconds. Whether you are a gamer, artist, musician, or just have a story to tell, our platform gives you the tools to share your passion with a global audience.',
  },
  {
    icon: <Swords className="w-16 h-16 text-primary" />,
    title: 'Shape the Show.',
    description:
      "Turn passive viewers into active co-creators. With interactive games, live challenges, and real-time reactions, your audience doesn't just watch the show—they become part of it.",
  },
  {
    icon: <Users className="w-16 h-16 text-primary" />,
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
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-4 h-[35rem]">
                  <Card className="h-full rounded-3xl">
                    <CardContent className="flex flex-col items-center justify-center text-center p-6 h-full">
                      <div className="mb-4">{card.icon}</div>
                      <h3 className="text-2xl font-bold font-headline mb-2 text-card-foreground">
                        {card.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {card.description}
                      </p>
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
