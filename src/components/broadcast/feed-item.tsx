
'use client';

import {
  StreamVideo,
  StreamCall,
  Call,
  StreamVideoClient,
} from '@stream-io/video-react-sdk';
import { useEffect, useState, useMemo, useRef } from 'react';
import type { Broadcast, User as AppUser, ChatMessage } from '@/lib/data';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, serverTimestamp, doc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import VideoPlayer from '@/components/broadcast/video-player';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MoreVertical, PlusCircle, Users, ArrowUp, MessageSquare, Share2, Clapperboard, User as UserIcon, PlayCircle, Loader2, CornerUpLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


interface FeedItemProps {
  client: StreamVideoClient;
  broadcast: any; // Using any to match Firestore data structure
}

export default function FeedItem({ client, broadcast }: FeedItemProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [call, setCall] = useState<Call | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // State to manage if user wants to play and the joining status
  const [isPlaying, setIsPlaying] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

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
  const reversedComments = useMemo(() => comments ? [...comments].reverse() : [], [comments]);
  
  // Real-time likes
  const likesQuery = useMemoFirebase(() => {
    if (!broadcast.id || !firestore) return null;
    return collection(firestore, `broadcasts/${broadcast.id}/likes`);
  }, [broadcast.id, firestore]);
  const { data: likes } = useCollection(likesQuery);
  const hasLiked = useMemo(() => {
    if (!user || !likes) return false;
    return likes.some(like => like.id === user.uid);
  }, [user, likes]);


  useEffect(() => {
    // This effect now only runs when the user explicitly clicks play
    if (!isPlaying || !client || call) return;

    let callInstance: Call;
    const joinCall = async () => {
        setIsJoining(true);
        callInstance = client.call('livestream', broadcast.id);
        
        try {
            await callInstance.join();
            setCall(callInstance);
            setIsJoined(true);
        } catch (err) {
             console.error(`Failed to join call ${broadcast.id}`, err);
             toast({
                title: 'Error Joining Stream',
                description: 'Could not connect to the broadcast.',
                variant: 'destructive',
             });
             setIsJoined(false);
             setIsPlaying(false); // Reset play state on failure
        } finally {
            setIsJoining(false);
        }
    };
    
    joinCall();

    return () => {
      // Cleanup when the component unmounts
      if (callInstance) {
        callInstance.leave().catch(err => console.error(`Failed to leave call ${broadcast.id} on cleanup`, err));
        setCall(null);
        setIsJoined(false);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, client, broadcast.id]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !user) return;

    const messagesCollectionRef = collection(firestore, 'broadcasts', broadcast.id, 'messages');
    
    const newComment: Omit<ChatMessage, 'id'|'timestamp'> & {timestamp: any, replyingTo?: string} = {
        userId: user.uid,
        username: user.displayName || "Anonymous",
        userAvatar: user.photoURL || '',
        message: newMessage,
        timestamp: serverTimestamp(),
    };
    
    const mentionMatch = newMessage.match(/^@(\w+)\s/);
    if (mentionMatch) {
      newComment.replyingTo = mentionMatch[1];
    }


    addDocumentNonBlocking(messagesCollectionRef, newComment);
    setNewMessage('');
  };

  const handleLike = () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'You must be logged in to like a stream.',
        variant: 'destructive',
      });
      return;
    }
    if (!firestore || !broadcast.id) return;
    
    // Use user's UID as document ID to prevent multiple likes
    const likeDocRef = doc(firestore, 'broadcasts', broadcast.id, 'likes', user.uid);
    
    // This is an idempotent operation.
    setDocumentNonBlocking(likeDocRef, { 
      userId: user.uid,
      timestamp: serverTimestamp() 
    }, {});
  };

  const handlePlay = () => {
    setIsPlaying(true);
  }
  
  const handleReply = (username: string) => {
    setNewMessage(`@${username} `);
    textareaRef.current?.focus();
  }


  return (
    <div className="relative h-[calc(100vh-4rem)] w-full snap-start" data-broadcast-id={broadcast.id}>
      
      {/* Show the video player if joined, otherwise show the placeholder/button */}
      {call && isPlaying && isJoined ? (
        <StreamVideo client={client}>
          <StreamCall call={call}>
            <VideoPlayer broadcast={fullBroadcast} isHost={false} />
          </StreamCall>
        </StreamVideo>
      ) : (
        <div className="w-full h-full bg-black flex items-center justify-center text-white relative">
            <div className="absolute inset-0 bg-black/50 z-10" />
            <img src={broadcast.thumbnailUrl || `https://picsum.photos/seed/${broadcast.id}/1280/720`} alt="Broadcast thumbnail" className="w-full h-full object-cover blur-sm"/>
            
            <div className="absolute z-20 flex flex-col items-center">
                {isJoining ? (
                    <>
                        <Loader2 className="h-16 w-16 animate-spin text-white mb-4" />
                        <p className="text-lg font-semibold">Joining Stream...</p>
                    </>
                ) : (
                     <Button variant="ghost" size="icon" className="h-32 w-32 text-white/80 hover:text-white hover:bg-transparent" onClick={handlePlay}>
                        <PlayCircle className="h-32 w-32" />
                    </Button>
                )}
            </div>
        </div>
      )}

      {/* UI Overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 text-white z-30 pointer-events-none">
        {/* Top Info */}
        <div className="bg-gradient-to-b from-black/50 to-transparent -m-4 p-4">
          <div className="flex items-start gap-4 pointer-events-auto">
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
        <div className="bg-gradient-to-t from-black/70 to-transparent -m-4 p-4 flex items-end gap-4 pointer-events-auto">
          <div className="flex-1">
            {isChatVisible && (
              <div className="w-full max-w-sm">
                <ScrollArea className="h-48 w-full pr-4">
                  <div className="flex flex-col gap-2">
                    {reversedComments.map((comment) => (
                      <div key={comment.id} className="group flex items-start gap-2 text-sm bg-black/25 p-2 rounded-lg">
                        <Avatar className="h-6 w-6 border-secondary">
                          <AvatarImage src={comment.userAvatar} alt={comment.username} />
                          <AvatarFallback>{comment.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <span className="font-bold text-primary mr-1.5">{comment.username}:</span>
                          {comment.replyingTo && <Link href={`/profile/`} className="text-accent font-semibold mr-1.5 hover:underline">@{comment.replyingTo}</Link>}
                          <span className="break-words">{comment.message.replace(/^@\w+\s/, '')}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleReply(comment.username)}>
                            <CornerUpLeft className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <form onSubmit={handleSendMessage} className="relative w-full mt-2">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Add a comment..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="bg-black/50 border-white/20 placeholder:text-gray-400 pr-10 w-full min-h-[40px] h-10 resize-none"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                        }
                    }}
                  />
                  <Button variant="ghost" size="icon" type="submit" className="absolute top-1/2 -translate-y-1/2 right-1 text-white">
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
              <Heart className={cn("h-8 w-8", hasLiked && "fill-red-500 text-red-500")} />
              <span className="text-xs mt-1 tabular-nums">{likes?.length || 0}</span>
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
