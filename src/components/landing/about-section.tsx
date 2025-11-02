
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

const aboutCards = [
  {
    icon: Clapperboard,
    title: 'Go Live, Instantly.',
    description:
      "Forget complicated setups. With LIVENET, you're just a click away from sharing your world. Whether you're a gamer, artist, or just want to chat, your stage is always ready.",
    imageUrl: 'https://cdn.pixabay.com/photo/2020/09/28/12/32/video-conference-5609681_1280.png',
    imageHint: 'live streaming setup',
  },
  {
    icon: Swords,
    title: 'Shape the Show with Interactive Games.',
    description:
      "Turn passive viewing into active co-creation with our in-stream games and challenges. Use the AI Game Master to generate endless 'Truth,' 'Dare,' or unique tasks to keep your content fresh and spontaneous.",
    imageUrl: 'https://cdn.pixabay.com/photo/2020/04/15/15/00/gamer-5046924_1280.jpg',
    imageHint: 'gamer controller',
  },
  {
    icon: Users,
    title: 'Real-Time Connections.',
    description:
      'Engage with viewers through live chat, reactions, and GIFs. Connect one-on-one with direct messaging, and build your community by following your favorite creators.',
    imageUrl: 'https://cdn.pixabay.com/photo/2025/01/22/21/06/webinar-9353158_1280.jpg',
    imageHint: 'people connecting online',
  },
  {
    icon: Globe,
    title: 'Your Profile, Your Story.',
    description:
      'Show off your personality with a custom bio and video cover banner. Upload short highlight clips from your streams to give new followers a taste of your content.',
  },
];

export default function AboutSection() {
  return (
    <section className="w-full py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <Carousel
          opts={{
            align: 'start',
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {aboutCards.map((card, index) => (
              <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2">
                <div className="p-4 h-[35rem]">
                  <Card className="h-full rounded-3xl overflow-hidden">
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
