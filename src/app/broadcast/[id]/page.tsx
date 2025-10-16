'use client';
import { broadcasts, users } from '@/lib/data';
import { notFound, useParams } from 'next/navigation';
import VideoPlayer from '@/components/broadcast/video-player';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, Share2, Star, MessageCircle, MoreVertical, PlusCircle } from 'lucide-react';
import { useUser } from '@/firebase';
import type { Broadcast } from '@/lib/data';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';


export default function BroadcastPage() {
  const params = useParams();
  const { id } = params as { id: string };
  const { user } = useUser();
  const firestore = useFirestore();

  const broadcastDocRef = useMemo(() => {
    if (!id) return undefined;
    // The document ID in Firestore is just the ID, not prefixed.
    return doc(firestore, 'broadcasts', id);
  }, [id, firestore]);

  const { data: broadcastData, isLoading: isBroadcastLoading } = useDoc<any>(broadcastDocRef);

  const broadcast: Broadcast | undefined = useMemo(() => {
    if (!broadcastData) {
        // Fallback to mock data if firestore data not available
        return broadcasts.find((b) => b.id === id);
    }
    const hostUser = users.find(u => u.id === broadcastData.hostId) || users[0];
    return {
      id: id,
      title: broadcastData.title,
      user: { ...hostUser, name: broadcastData.hostName, avatarUrl: broadcastData.hostAvatar },
      thumbnailUrl: '', // Not needed on live view
      thumbnailHint: '',
      viewers: broadcastData.viewers || 0,
      category: broadcastData.category,
      isLive: broadcastData.isLive,
      tags: broadcastData.tags || [],
    };
  }, [broadcastData, id]);


  if (isBroadcastLoading) {
    return <BroadcastSkeleton />;
  }

  if (!broadcast) {
    notFound();
  }
  
  return (
    <div className="relative h-[calc(100vh-4rem)] w-full bg-black snap-start">
      <VideoPlayer broadcast={broadcast} isHost={false} />
      
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent text-white">
         <div className="flex items-start gap-4">
            <div className="relative w-12 h-12 shrink-0">
                <Avatar className="h-12 w-12 border-2 border-primary">
                    <AvatarImage src={broadcast.user.avatarUrl} alt={broadcast.user.name} data-ai-hint={broadcast.user.avatarHint} />
                    <AvatarFallback>{broadcast.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <Button size="icon" className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary hover:bg-primary/90">
                    <PlusCircle className="h-5 w-5"/>
                </Button>
            </div>
            <div>
                <p className="font-bold text-lg">{broadcast.user.name}</p>
                <h1 className="text-base font-semibold">{broadcast.title}</h1>
            </div>
          </div>
      </div>

      {/* Overlay for information and actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-black/70 to-transparent text-white">
        <div className="flex items-end justify-between">
          {/* Left side: Broadcaster Info & Title is now moved to top */}
          <div className="flex-1 mr-8" />
          
          {/* Right side: Action Buttons */}
          <div className="flex flex-col items-center space-y-5">
            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 text-white flex flex-col">
              <Heart className="h-7 w-7" />
              <span className="text-xs mt-1">1.2k</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 text-white flex flex-col">
              <MessageCircle className="h-7 w-7" />
               <span className="text-xs mt-1">203</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 text-white">
              <Share2 className="h-7 w-7" />
            </Button>
             <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 text-white">
              <MoreVertical className="h-7 w-7" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BroadcastSkeleton() {
  return (
    <div className="relative h-[calc(100vh-4rem)] w-full bg-black">
      {/* Top left skeleton */}
      <div className="absolute top-0 left-0 p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>

      {/* Bottom right skeleton */}
      <div className="absolute bottom-0 right-0 p-4 pb-8">
        <div className="flex flex-col items-center space-y-5">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}
