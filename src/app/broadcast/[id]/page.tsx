
'use client';

import { notFound, useParams } from 'next/navigation';
import VideoPlayer from '@/components/broadcast/video-player';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, UserSearch, MoreVertical, PlusCircle, Users, ArrowUp, MessageSquareMore, Share2, Clapperboard, User as UserIcon, Trophy, Check, CornerUpLeft } from 'lucide-react';
import { useUser, useMemoFirebase, useUserDocument } from '@/firebase';
import type { Broadcast, ChatMessage } from '@/lib/data';
import { useDoc, useFirestore, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, limit, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import { useMemo, useState, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useCallStateHooks } from '@stream-io/video-react-sdk';
import { Badge } from '@/components/ui/badge';
import ChallengeDisplayCard from '@/components/broadcast/ChallengeDisplayCard';
import CountdownTimer from '@/components/broadcast/CountdownTimer';
import { Textarea } from '@/components/ui/textarea';


export default function BroadcastPage() {
  const params = useParams();
  const { id } = params as { id: string };
  const { user } = useUser();
  const { userDocument } = useUserDocument();
  const firestore = useFirestore();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isChatVisible, setIsChatVisible] = useState(true);

  const broadcastDocRef = useMemoFirebase(() => {
    if (!id || !firestore) return undefined;
    return doc(firestore, 'broadcasts', id);
  }, [id, firestore]);
  const { data: broadcastData, isLoading: isBroadcastLoading } = useDoc<any>(broadcastDocRef);

  const messagesQuery = useMemoFirebase(() => {
    if (!id || !firestore) return undefined;
    return query(collection(firestore, `broadcasts/${id}/messages`), orderBy('timestamp', 'desc'), limit(100));
  }, [id, firestore]);
  const { data: comments } = useCollection<ChatMessage>(messagesQuery);
  
  const likesCollectionRef = useMemoFirebase(() => {
    if (!id || !firestore) return null;
    return collection(firestore, 'broadcasts', id, 'likes');
  }, [id, firestore]);
  const { data: likes } = useCollection(likesCollectionRef);

  const hasLiked = useMemo(() => {
    if (!user || !likes) return false;
    return likes.some(like => like.id === user.uid);
  }, [user, likes]);

  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants(); // Remote participants
  const viewerCount = participants.length;
  
  const broadcast: Broadcast | undefined = useMemo(() => {
    if (!broadcastData) return undefined;
    const hostUser = { name: broadcastData.hostName, avatarUrl: broadcastData.hostAvatar, id: broadcastData.hostId, avatarHint: '', bio: '', interests: [], watchHistory: [] };
    return {
      id: id,
      title: broadcastData.title,
      user: hostUser,
      thumbnailUrl: '', // Not needed on live view
      thumbnailHint: '',
      viewers: broadcastData.viewerCount || 0, // This is a fallback, real count is from participants
      category: broadcastData.category,
      isLive: broadcastData.isLive,
      tags: broadcastData.tags || [],
      hostId: broadcastData.hostId,
      hostName: broadcastData.hostName,
      hostAvatar: broadcastData.hostAvatar,
      activeChallenge: broadcastData.activeChallenge,
      activeChallengeType: broadcastData.activeChallengeType,
      challengeStartTime: broadcastData.challengeStartTime,
      challengeDurationSeconds: broadcastData.challengeDurationSeconds,
      challengeCardPosition: broadcastData.challengeCardPosition,
      challengeCardSize: broadcastData.challengeCardSize,
    };
  }, [broadcastData, id]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !user || !broadcast || !userDocument) return;

    const messagesCollection = collection(firestore, `broadcasts/${broadcast.id}/messages`);
    const newComment: Omit<ChatMessage, 'id' | 'timestamp'> & {timestamp: any; replyingTo?: string;} = {
        userId: user.uid,
        username: userDocument.username || 'Anonymous',
        userAvatar: userDocument.profilePicture || '',
        message: newMessage,
        timestamp: serverTimestamp(),
    };
    
    const mentionMatch = newMessage.match(/^@(\w+)\s/);
    if (mentionMatch) {
      newComment.replyingTo = mentionMatch[1];
    }
    
    addDocumentNonBlocking(messagesCollection, newComment);

     // Create a notification for the host
    if (user.uid !== broadcast.hostId) {
        const hostNotificationsRef = collection(firestore, `users/${broadcast.hostId}/notifications`);
        addDocumentNonBlocking(hostNotificationsRef, {
            userId: broadcast.hostId,
            type: 'comment',
            actorId: user.uid,
            actorName: userDocument.username || 'Someone',
            actorAvatar: userDocument.profilePicture || '',
            entityId: broadcast.id,
            entityInfo: `commented: "${newMessage.substring(0, 50)}${newMessage.length > 50 ? '...' : ''}"`,
            isRead: false,
            timestamp: serverTimestamp(),
        });
    }

    setNewMessage('');
  }

  const handleLike = () => {
    if (!broadcast?.isLive) {
        toast({ title: 'Stream is offline', description: 'You can only like live streams.', variant: 'destructive'});
        return;
    }
    if (!user || !userDocument) {
      toast({ title: 'Login Required', description: 'You must be logged in to like a stream.', variant: 'destructive'});
      return;
    }
    if (!firestore || !broadcast.id) return;
    
    const likeDocRef = doc(firestore, 'broadcasts', broadcast.id, 'likes', user.uid);
    
    if (hasLiked) {
      deleteDoc(likeDocRef);
    } else {
      setDoc(likeDocRef, { 
        userId: user.uid,
        timestamp: serverTimestamp() 
      });

      // Don't create a notification if the user likes their own stream
      if (user.uid !== broadcast.hostId) {
          const hostNotificationsRef = collection(firestore, `users/${broadcast.hostId}/notifications`);
          addDocumentNonBlocking(hostNotificationsRef, {
              userId: broadcast.hostId,
              type: 'like',
              actorId: user.uid,
              actorName: userDocument.username || 'Someone',
              actorAvatar: userDocument.profilePicture || '',
              entityId: broadcast.id,
              entityInfo: `liked your stream: "${broadcast.title}"`,
              isRead: false,
              timestamp: serverTimestamp(),
          });
      }
    }
  };
  
  const handleReplyClick = (username: string) => {
    setNewMessage(`@${username} `);
    textareaRef.current?.focus();
}

  if (isBroadcastLoading) {
    return <BroadcastSkeleton />;
  }

  if (!broadcast) {
    notFound();
  }
  
  const cardPosition = broadcast.challengeCardPosition || { x: 0, y: 0 };
  const cardSize = broadcast.challengeCardSize || { width: 384, height: 550 };

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full bg-black snap-start">
      <VideoPlayer broadcast={broadcast} isHost={false} />
      
      {broadcast.activeChallenge && broadcast.activeChallengeType && (
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
              style={{
                  transform: `translate(calc(-50% + ${cardPosition.x}px), calc(-50% + ${cardPosition.y}px)) scale(0.8)`,
                  width: `${cardSize.width}px`,
                  height: `${cardSize.height}px`,
              }}
            >
                <ChallengeDisplayCard 
                    text={broadcast.activeChallenge}
                    type={broadcast.activeChallengeType}
                    timer={broadcast.challengeStartTime && broadcast.challengeDurationSeconds ? (
                        <CountdownTimer 
                            startTime={broadcast.challengeStartTime} 
                            durationSeconds={broadcast.challengeDurationSeconds} 
                        />
                    ) : null}
                />
            </div>
        )}

      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent text-white">
         <div className="flex items-start gap-4">
            <Avatar className={cn("h-14 w-14 border-4 border-destructive", broadcast.isLive && "animate-breathing")}>
                <AvatarImage src={broadcast.user.avatarUrl} alt={broadcast.user.name} />
                <AvatarFallback>{broadcast.user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold font-headline text-lg">{broadcast.user.name}</p>
              </div>
              <p className="text-base font-normal mt-1">{broadcast.title}</p>
              <div className="flex items-center gap-3 mt-1">
                 <span className="inline-flex items-center text-xs font-medium gap-1">
                      <Users className="h-3 w-3" />
                      {viewerCount.toLocaleString()}
                  </span>
              </div>
            </div>
          </div>
      </div>

      {/* Overlay for information and actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-black/70 to-transparent text-white pointer-events-none">
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1 w-full max-w-md">
            {isChatVisible && (
              <div className="pointer-events-auto">
                <div className="h-80 w-full rounded-xl bg-black/40 p-3 backdrop-blur-sm">
                  <ScrollArea className="h-full pr-2">
                    <div className="flex flex-col-reverse gap-y-1">
                        {comments && comments.map((comment) => (
                        <div key={comment.id} className="group flex items-start gap-2 text-sm py-1.5 border-b border-white/10">
                            <Avatar className="h-6 w-6 border-secondary">
                            <AvatarImage src={comment.userAvatar} alt={comment.username} />
                            <AvatarFallback>{comment.username.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <Link href={`/profile/${comment.userId}`} className="pointer-events-auto">
                                <span className="font-bold font-headline text-primary mr-1.5 hover:underline">{comment.username}:</span>
                              </Link>
                              {comment.replyingTo && <Link href={`/profile/${comment.replyingTo}`} className="text-accent font-semibold mr-1.5 hover:underline pointer-events-auto">@{comment.replyingTo}</Link>}
                              <p className="break-words inline">{comment.message.replace(/^@\w+\s/, '')}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 pointer-events-auto" onClick={() => handleReplyClick(comment.username)}>
                                <CornerUpLeft className="h-4 w-4" />
                            </Button>
                        </div>
                        ))}
                    </div>
                  </ScrollArea>
                </div>
                 <form onSubmit={handleSendMessage} className="relative w-full pointer-events-auto items-center gap-2 mt-2">
                      <Textarea
                          ref={textareaRef}
                          placeholder="Add a comment..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                           onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendMessage(e);
                              }
                          }}
                          className="bg-black/50 border-white/20 placeholder:text-gray-400 w-full min-h-[40px] h-10 resize-none rounded-full py-2 pr-12 pl-4"
                      />
                      <Button variant="ghost" size="icon" type="submit" className="absolute top-1/2 -translate-y-1/2 right-1 text-white h-9 w-9">
                          <ArrowUp className="h-5 w-5" />
                      </Button>
                  </form>
              </div>
            )}
          </div>
          
          {/* Right side: Action Buttons */}
          <div className="flex flex-col items-center space-y-5 pointer-events-auto">
            <Button variant="ghost" size="icon" className="h-15 w-15 rounded-full text-white flex-col justify-center items-center drop-shadow-md hover:bg-transparent hover:text-white">
                <PlusCircle className="h-16 w-16"/>
            </Button>
            <Button variant="ghost" size="icon" className="h-15 w-15 rounded-full text-white flex-col drop-shadow-md hover:bg-transparent hover:text-white" onClick={handleLike}>
              <Heart className={cn("h-16 w-16", hasLiked && "fill-red-500 text-red-500")} />
              <span className="text-xs mt-1">{likes?.length || 0}</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsChatVisible(!isChatVisible)} className="h-15 w-15 rounded-full text-white flex-col justify-center items-center drop-shadow-md hover:bg-transparent hover:text-white">
               <MessageSquareMore className="h-16 w-16" />
               <span className="text-xs mt-1">{comments?.length || 0}</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-15 w-15 rounded-full text-white flex-col justify-center items-center drop-shadow-md hover:bg-transparent hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" height="64px" viewBox="0 -960 960 960" width="64px" fill="currentColor"><path d="m608-368 46-166-142-98-46 166 142 98ZM160-207l-33-16q-31-13-42-44.5t3-62.5l72-156v279Zm160 87q-33 0-56.5-24T240-201v-239l107 294q3 7 5 13.5t7 12.5h-39Zm206-5q-31 11-62-3t-42-45L245-662q-11-31 3-61.5t45-41.5l301-110q31-11 61.5 3t41.5 45l178 489q11 31-3 61.5T827-235L526-125Zm-28-75 302-110-179-490-301 110 178 490Zm62-300Z"/></svg>
            </Button>
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-14 w-14 rounded-full text-white flex-col justify-center items-center drop-shadow-md hover:bg-transparent hover:text-white">
                  <MoreVertical className="h-16 w-16" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuItem>
                  <Share2 className="mr-2 h-4 w-4" />
                  <span>Share</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <UserSearch className="mr-2 h-4 w-4" />
                  <span>User Search</span>
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
