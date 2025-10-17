'use client';

import type { Broadcast, User, Category } from '@/lib/data';
import RecommendedForYou from '@/components/recommended-for-you';
import BroadcastCard from '@/components/broadcast-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Clapperboard } from 'lucide-react';
import Link from 'next/link';

interface HomePageClientProps {
  liveBroadcasts: Broadcast[];
  upcomingBroadcasts: Broadcast[];
  categories: Omit<Category, 'icon'>[];
  currentUser: User;
}

export default function HomePageClient({
  liveBroadcasts,
  upcomingBroadcasts,
  categories,
  currentUser,
}: HomePageClientProps) {
  const [filteredBroadcasts, setFilteredBroadcasts] = useState(liveBroadcasts);
  const [activeTab, setActiveTab] = useState('All');

  // This effect ensures that if the server-provided broadcasts change, the UI updates.
  useEffect(() => {
    handleTabChange(activeTab);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveBroadcasts]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'All') {
      setFilteredBroadcasts(liveBroadcasts);
    } else {
      setFilteredBroadcasts(
        liveBroadcasts.filter((b) => b.category === value)
      );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="relative w-full h-96 rounded-2xl overflow-hidden flex items-center justify-center text-center p-8 bg-gradient-to-br from-primary via-primary/70 to-background">
         <div className="absolute inset-0 bg-black/50" />
         <div className="relative z-10 flex flex-col items-center">
            <h1 className="text-5xl md:text-7xl font-bold font-headline text-primary-foreground mb-4 drop-shadow-lg">
                The Stage is Yours
            </h1>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mb-8 drop-shadow-md">
                Discover live streams from creators around the world, or go live and share your passion.
            </p>
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                <Link href="/feed">
                    <Clapperboard className="mr-2 h-5 w-5" />
                    Watch Now
                </Link>
            </Button>
         </div>
      </section>

      <RecommendedForYou currentUser={currentUser} allBroadcasts={liveBroadcasts} />

      <section className="mt-12">
        <h2 className="text-3xl font-bold font-headline mb-4">Live Now</h2>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full mb-6">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 md:w-auto md:grid-cols-9">
            <TabsTrigger value="All">All</TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger key={cat.name} value={cat.name}>
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredBroadcasts.map((broadcast) => (
            <BroadcastCard key={broadcast.id} broadcast={broadcast} />
          ))}
        </div>
         {filteredBroadcasts.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-16">
                <p className="text-lg">No live streams in this category right now.</p>
                <p>Why not explore another?</p>
            </div>
        )}
      </section>
    </div>
  );
}
