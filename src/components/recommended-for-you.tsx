'use client';

import { useState, useEffect } from 'react';
import type { Broadcast } from '@/lib/data';
import { getPersonalizedRecommendations } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import BroadcastCard from './broadcast-card';
import { Sparkles } from 'lucide-react';
import { UserProfile } from '@/firebase';

interface RecommendedForYouProps {
  currentUser: UserProfile;
  allBroadcasts: Broadcast[];
}

export default function RecommendedForYou({ currentUser, allBroadcasts }: RecommendedForYouProps) {
  const [recommendations, setRecommendations] = useState<Broadcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchRecommendations = async () => {
      setIsLoading(true);
      try {
        const { recommendations: recommendedIds } = await getPersonalizedRecommendations({
          // @ts-ignore
          watchHistory: currentUser.watchHistory || [],
          // @ts-ignore
          profileInformation: currentUser.bio || '',
          // @ts-ignore
          interests: currentUser.interests || [],
        });

        const recommendedBroadcasts = recommendedIds
          .map((id) => allBroadcasts.find((b) => b.id === id))
          .filter((b): b is Broadcast => !!b);
        
        setRecommendations(recommendedBroadcasts);
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
        // Fallback to showing a few popular items or nothing
        setRecommendations(allBroadcasts.slice(0, 4));
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [currentUser, allBroadcasts]);

  if (isLoading) {
    return (
      <section className="mt-12">
        <h2 className="text-3xl font-bold font-headline mb-4 flex items-center">
            <Sparkles className="mr-3 h-8 w-8 text-primary" />
            Recommended For You
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (recommendations.length === 0) {
    return null; // Don't show the section if there are no recommendations
  }

  return (
    <section className="mt-12">
      <h2 className="text-3xl font-bold font-headline mb-6 flex items-center">
        <Sparkles className="mr-3 h-8 w-8 text-primary" />
        Recommended For You
      </h2>
      <Carousel
        opts={{
          align: 'start',
        }}
        className="w-full"
      >
        <CarouselContent>
          {recommendations.map((broadcast) => (
            <CarouselItem key={broadcast.id} className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
              <div className="p-1">
                <BroadcastCard broadcast={broadcast} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </section>
  );
}
