
'use client';

import { broadcasts, users } from '@/lib/data';
import { notFound, useParams } from 'next/navigation';
import VideoPlayer from '@/components/broadcast/video-player';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, Share2, MoreVertical, PlusCircle, Users, ArrowUp, MessageCircleOff, MessageCircle } from 'lucide-react';
import { useUser } from '@/firebase';
import type { Broadcast } from '@/lib/data';
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

const initialMockComments = [
    { id: 1, username: 'User123', avatar: 'https://picsum.photos/seed/chat1/40/40', message: 'This is awesome! 🚀' },
    { id: 2, username: 'StreamFan', avatar: 'https://picsum.photos/seed/chat2/40/40', message: 'Love this content!' },
    { id: 3, username: 'Newbie', avatar: 'https://picsum.photos/seed/chat3/40/40', message: 'What is this song called?' },
    { id: 4, username: 'AnotherViewer', avatar: 'https://picsum.photos/seed/chat4/40/40', message: 'So cool!' },
];

export default function BroadcastPage() {
  const params = useParams();
  const { id } = params as { id: string };
  const { user } = useUser();
  const firestore = useFirestore();
  const [newMessage, setNewMessage] = useState('');
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [comments, setComments] = useState(initialMockComments);

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
      viewers: broadcastData.viewerCount || 0,
      category: broadcastData.category,
      isLive: broadcastData.isLive,
      tags: broadcastData.tags || [],
    };
  }, [broadcastData, id]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    const newComment = {
        id: Date.now(),
        username: 'You', // Simulate current user
        avatar: user?.photoURL || 'https://picsum.photos/seed/me/40/40',
        message: newMessage,
    };
    setComments(prev => [...prev, newComment]);
    setNewMessage('');
  }

  const handleLike = () => {
    console.log('Like button clicked!');
    // Logic will be added later
  }

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
              <div className="flex items-center gap-3 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white animate-pulse">
                    LIVE
                </span>
                 <span className="inline-flex items-center text-xs font-medium gap-1">
                      <Users className="h-3 w-3" />
                      {broadcast.viewers.toLocaleString()}
                  </span>
              </div>
               <p className="text-base font-semibold mt-1">{broadcast.title}</p>
            </div>
          </div>
      </div>

      {/* Overlay for information and actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-black/70 to-transparent text-white">
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1 w-full">
            {isChatVisible && (
                <>
                    <ScrollArea className="h-48 w-full pr-4">
                    <div className="flex flex-col gap-3">
                        {comments.map((comment) => (
                        <div key={comment.id} className="flex items-start gap-3 text-sm text-white bg-black/20 p-2 rounded-lg">
                            <Avatar className="h-6 w-6 border border-secondary">
                            <AvatarImage src={comment.avatar} alt={comment.username} />
                            <AvatarFallback>{comment.username.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                            <span className="font-bold text-red-500 mr-1.5">{comment.username}:</span>
                            <p className="break-words inline">{comment.message}</p>
                            </div>
                        </div>
                        ))}
                    </div>
                    </ScrollArea>
                    <form onSubmit={handleSendMessage} className="relative flex-1 mt-3">
                        <Input
                            placeholder="Add a comment..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="bg-black/50 border-white/20 text-white placeholder:text-gray-400 pr-10 h-10"
                        />
                        <Button variant="ghost" size="icon" type="submit" className="absolute inset-y-0 right-0 text-white">
                            <ArrowUp className="h-5 w-5" />
                        </Button>
                    </form>
                </>
            )}
          </div>
          
          {/* Right side: Action Buttons */}
          <div className="flex flex-col items-center space-y-5">
            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full text-white flex flex-col drop-shadow-md hover:bg-transparent hover:text-white" onClick={handleLike}>
              <Heart className="h-7 w-7" />
              <span className="text-xs mt-1">1.2k</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsChatVisible(!isChatVisible)} className="h-12 w-12 rounded-full text-white flex flex-col drop-shadow-md hover:bg-transparent hover:text-white">
                {isChatVisible ? <MessageCircleOff className="h-7 w-7" /> : <MessageCircle className="h-7 w-7" />}
               <span className="text-xs mt-1">Chat</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full text-white drop-shadow-md hover:bg-transparent hover:text-white">
              <Share2 className="h-7 w-7" />
            </Button>
             <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full text-white drop-shadow-md hover:bg-transparent hover:text-white">
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
