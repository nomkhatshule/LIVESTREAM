'use client';
import { broadcasts, users } from '@/lib/data';
import { notFound, useSearchParams, useParams } from 'next/navigation';
import VideoPlayer from '@/components/broadcast/video-player';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Share2, Star, MessageCircle, MoreVertical } from 'lucide-react';
import { useUser, useUserDocument } from '@/firebase';
import type { Broadcast } from '@/lib/data';

export default function BroadcastPage() {
  const params = useParams();
  const { id } = params as { id: string };
  const { user } = useUser();
  const { userDocument } = useUserDocument();
  const searchParams = useSearchParams();
  const isHost = searchParams.get('host') === 'true';

  let broadcast: Broadcast | undefined = broadcasts.find((b) => b.id === id);
  
  // If no broadcast is found and the user is the host, create a temporary one.
  if (!broadcast && isHost && user) {
    const hostUser = users.find(u => u.id === user.uid) || users[0];
    broadcast = {
      id: id,
      title: `My Live Stream`,
      user: { ...hostUser, name: userDocument?.username || user.displayName || 'Anonymous User' },
      thumbnailUrl: 'https://picsum.photos/seed/newstream/600/400',
      thumbnailHint: 'live broadcast',
      viewers: 0,
      category: 'Talk Show',
      isLive: true,
      tags: ['New', 'Live'],
    };
  }

  if (!broadcast) {
    notFound();
  }

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full bg-black snap-start">
      <VideoPlayer broadcast={broadcast} isHost={isHost && user?.uid === broadcast?.user.id} />
      
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent">
         {/* Header can go here if needed, for now it's clean */}
      </div>

      {/* Overlay for information and actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-black/70 to-transparent text-white">
        <div className="flex items-end justify-between">
          {/* Left side: Broadcaster Info & Title */}
          <div className="flex-1 mr-8">
            <div className="flex items-center mb-2">
              <Avatar className="h-10 w-10 mr-3 border-2 border-primary">
                <AvatarImage src={broadcast.user.avatarUrl} alt={broadcast.user.name} data-ai-hint={broadcast.user.avatarHint} />
                <AvatarFallback>{broadcast.user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-lg">{broadcast.user.name}</p>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="h-7 text-xs px-2.5 bg-primary">Follow</Button>
                  <Button size="sm" variant="secondary" className="h-7 text-xs px-2.5">Subscribe <Star className="ml-1.5 h-3 w-3" /></Button>
                </div>
              </div>
            </div>
            <h1 className="text-lg font-semibold mb-1">{broadcast.title}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              {broadcast.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="bg-white/20 border-transparent text-white text-xs">{tag}</Badge>
              ))}
            </div>
          </div>
          
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
