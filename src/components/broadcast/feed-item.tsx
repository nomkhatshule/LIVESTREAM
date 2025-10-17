
'use client';

import {
  StreamVideo,
  StreamCall,
  Call,
  StreamVideoClient,
} from '@stream-io/video-react-sdk';
import { useEffect, useMemo, useState } from 'react';
import type { Broadcast, User as AppUser, ChatMessage } from '@/lib/data';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import VideoPlayer from '@/components/broadcast/video-player';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, UserSearch, MoreVertical, PlusCircle, Users, ArrowUp, MessageSquareMore, Share2, Clapperboard, User as UserIcon, MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

interface FeedItemProps {
  client: StreamVideoClient;
  broadcast: any; // Using any to match Firestore data structure
  isActive: boolean;
}

export default function FeedItem({ client, broadcast, isActive }: FeedItemProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [call, setCall] = useState<Call | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isChatVisible, setIsChatVisible] = useState(true);

  // Derive host information from the broadcast data
  const hostUser: AppUser = {
      id: broadcast.hostId,
      name: broadcast.hostName,
      avatarUrl: broadcast.hostAvatar,
      avatarHint: 'person portrait',
      bio: '',
      interests: [],
      watchHistory: [],
  };

  const fullBroadcast: Broadcast = {
      ...broadcast,
      user: hostUser,
      thumbnailUrl: '', // Not needed
      thumbnailHint: '',
  }

  // Real-time chat messages
  const messagesQuery = useMemoFirebase(() => {
    if (!broadcast.id || !firestore) return null;
    return query(
        collection(firestore, `broadcasts/${broadcast.id}/messages`),
        orderBy('timestamp', 'desc'),
        limit(50)
    );
  }, [broadcast.id, firestore]);

  const { data: comments } = useCollection<ChatMessage>(messagesQuery);
  const reversedComments = comments ? [...comments].reverse() : [];


  useEffect(() => {
    let callInstance: Call;
    if (isActive && client) {
        callInstance = client.call('livestream', broadcast.id);
        // Join call but don't publish audio/video
        callInstance.join().catch(err => {
            console.error(`Failed to join call ${broadcast.id}`, err);
        });
        setCall(callInstance);
    }

    return () => {
      if (callInstance) {
        callInstance.leave().catch(err => console.error(`Failed to leave call ${broadcast.id} on cleanup`, err));
        setCall(null);
      }
    };
  }, [isActive, client, broadcast.id]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !user) return;

    const messagesCollectionRef = collection(firestore, 'broadcasts', broadcast.id, 'messages');
    
    const newComment: Omit<ChatMessage, 'id'|'timestamp'> & {timestamp: any} = {
        userId: user.uid,
        username: user.displayName || "Anonymous",
        userAvatar: user.photoURL || '',
        message: newMessage,
        timestamp: serverTimestamp(),
    };

    addDocumentNonBlocking(messagesCollectionRef, newComment);
    setNewMessage('');
  };

  const handleLike = () => {
    console.log('Like button clicked!');
  };

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full snap-start" data-broadcast-id={broadcast.id}>
      {call && isActive ? (
        <StreamVideo client={client}>
          <StreamCall call={call}>
            <VideoPlayer broadcast={fullBroadcast} isHost={false} />
          </StreamCall>
        </StreamVideo>
      ) : (
        <div className="w-full h-full bg-black flex items-center justify-center text-white">
            <p>Loading Stream...</p>
        </div>
      )}

      {/* UI Overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 text-white">
        {/* Top Info */}
        <div className="bg-gradient-to-b from-black/50 to-transparent -m-4 p-4">
          <div className="flex items-start gap-4">
            <Link href={`/profile/${broadcast.hostId}`}>
              <Avatar className="h-14 w-14 border-2 border-primary">
                <AvatarImage src={broadcast.hostAvatar} alt={broadcast.hostName} />
                <AvatarFallback>{broadcast.hostName?.charAt(0)}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                 <Link href={`/profile/${broadcast.hostId}`}>
                    <p className="font-bold text-lg">{broadcast.hostName}</p>
                </Link>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 animate-pulse">
                  LIVE
                </span>
              </div>
              <p className="text-base font-semibold mt-1">{broadcast.title}</p>
              <div className="flex items-center gap-3 mt-1 text-xs">
                <Users className="h-3 w-3" />
                <span>{broadcast.viewerCount?.toLocaleString() || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions and Chat */}
        <div className="bg-gradient-to-t from-black/70 to-transparent -m-4 p-4 flex items-end gap-4">
          <div className="flex-1">
            {isChatVisible && (
              <div className="w-full max-w-sm">
                <ScrollArea className="h-48 w-full pr-4">
                  <div className="flex flex-col gap-2">
                    {reversedComments.map((comment) => (
                      <div key={comment.id} className="flex items-start gap-2 text-sm bg-black/25 p-2 rounded-lg">
                        <Avatar className="h-6 w-6 border-secondary">
                          <AvatarImage src={comment.userAvatar} alt={comment.username} />
                          <AvatarFallback>{comment.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-bold text-primary mr-1.5">{comment.username}:</span>
                          <span className="break-words">{comment.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <form onSubmit={handleSendMessage} className="relative flex-1 mt-2">
                  <Input
                    placeholder="Add a comment..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="bg-black/50 border-white/20 placeholder:text-gray-400 pr-10 h-10"
                  />
                  <Button variant="ghost" size="icon" type="submit" className="absolute inset-y-0 right-0">
                    <ArrowUp className="h-5 w-5" />
                  </Button>
                </form>
              </div>
            )}
          </div>
          <div className="flex flex-col-reverse items-center gap-y-4">
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full text-white hover:bg-white/20">
                  <MoreVertical className="h-8 w-8" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuItem>
                  <Share2 className="mr-2 h-4 w-4" />
                  <span>Share</span>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                  <Link href="/broadcast/create">
                    <Clapperboard className="mr-2 h-4 w-4" />
                    <span>Go Stream</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>My Profile</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
             <Button variant="ghost" size="icon" onClick={() => setIsChatVisible(!isChatVisible)} className="h-12 w-12 rounded-full text-white flex-col hover:bg-white/20">
               <MessageSquare className="h-8 w-8" />
               <span className="text-xs mt-1">{comments?.length || 0}</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full text-white flex-col hover:bg-white/20" onClick={handleLike}>
              <Heart className="h-8 w-8" />
              <span className="text-xs mt-1">1.2k</span>
            </Button>
             <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full text-white flex-col hover:bg-white/20">
                <PlusCircle className="h-8 w-8"/>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
