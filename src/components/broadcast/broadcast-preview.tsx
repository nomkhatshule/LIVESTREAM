

'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import type { Broadcast, User as AppUser, ChatMessage } from '@/lib/data';
import { useUser, useFirestore, useMemoFirebase, useUserDocument } from '@/firebase';
import { collection, query, orderBy, limit, serverTimestamp, doc, writeBatch } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageSquareMore, Search, Users, ArrowUp, CornerUpLeft, Dice6, Play, Loader2, Swords, UserCheck, UserPlus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useInView } from 'react-intersection-observer';
import { Button } from '@/components/ui/button';
import AIChat from './ai-chat';
import { useStreamStore } from '@/lib/stream-store';
import ChallengeCard from './ChallengeCard';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import GifPicker, { GiphyResult } from '../inbox/GifPicker';
import Image from 'next/image';


interface BroadcastPreviewUIManagerProps {
    broadcast: Broadcast;
    comments: ChatMessage[];
    likes: any[];
    hasLiked: boolean;
    isFollowing: boolean;
    onLike: () => void;
    onFollow: () => void;
    onSendMessage: (message: string) => void;
    onSendGif: (gif: GiphyResult) => void;
    onReply: (username: string) => void;
    currentUserAvatar?: string;
    onPlay: () => void;
    isCurrentActiveStream: boolean;
    isConnecting: boolean;
    isConnected: boolean;
}

function BroadcastPreviewUIManager({ 
    broadcast, 
    comments, 
    likes, 
    hasLiked,
    isFollowing, 
    onLike,
    onFollow, 
    onSendMessage,
    onSendGif, 
    onReply, 
    currentUserAvatar,
    onPlay,
    isCurrentActiveStream,
    isConnecting,
    isConnected,
}: BroadcastPreviewUIManagerProps) {
    const [newMessage, setNewMessage] = useState('');
    const [isChatVisible, setIsChatVisible] = useState(true);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isChallengeVisible, setIsChallengeVisible] = useState(false);
    const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
    const { user } = useUser();

    const reversedComments = useMemo(() => comments ? [...comments].reverse() : [], [comments]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            onSendMessage(newMessage);
            setNewMessage('');
        }
    };
    
    const handleReplyClick = (username: string) => {
        onReply(username);
        setNewMessage(`@${username} `);
        textareaRef.current?.focus();
    }
    
    const handleGifSelect = (gif: GiphyResult) => {
        onSendGif(gif);
        setIsGifPickerOpen(false);
    }

    const broadcastContext = `The streamer is ${broadcast.hostName}. The stream is titled "${broadcast.title}" under the category "${broadcast.category}".`;

    // Only show the play button if this is the active stream and the user hasn't intentionally connected yet.
    const showPlayButton = isCurrentActiveStream && !isConnected;

    return (
        <div className="absolute inset-0 flex flex-col justify-between p-3 md:p-4 text-white z-30 pointer-events-none">
             {/* Dimmer and Play Button Overlay */}
            {showPlayButton && (
                <div className="absolute inset-0 bg-black/40 z-20 flex items-center justify-center pointer-events-auto">
                    <button
                        onClick={onPlay}
                        disabled={isConnecting}
                        className="group flex flex-col items-center justify-center text-white transition-transform hover:scale-110 disabled:opacity-50"
                    >
                        {isConnecting ? (
                            <Loader2 className="h-24 w-24 animate-spin" />
                        ) : (
                            <Play className="h-24 w-24 fill-white/80 drop-shadow-2xl" />
                        )}
                        <span className="mt-2 text-lg font-semibold drop-shadow-lg">
                            {isConnecting ? 'Joining...' : 'Watch Live'}
                        </span>
                    </button>
                </div>
            )}

            {isChallengeVisible && broadcast.activeChallenge && broadcast.activeChallengeType && (
                <ChallengeCard
                    text={broadcast.activeChallenge}
                    type={broadcast.activeChallengeType}
                    size="small"
                    variant="simple"
                    onClose={() => setIsChallengeVisible(false)}
                />
            )}
            
            {/* Top Info */}
            <div className="bg-gradient-to-b from-black/50 to-transparent -m-4 p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        <Link href={`/profile/${broadcast.hostId}`} className="pointer-events-auto">
                            <Avatar className={cn("h-12 w-12 border-4 border-destructive", broadcast.isLive && "animate-breathing-prominent")}>
                                <AvatarImage src={broadcast.hostAvatar} alt={broadcast.hostName} />
                                <AvatarFallback>{broadcast.hostName?.charAt(0) || 'A'}</AvatarFallback>
                            </Avatar>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <Link href={`/profile/${broadcast.hostId}`} className="pointer-events-auto">
                                    <p className="font-bold font-headline text-base md:text-lg hover:underline">{broadcast.hostName}</p>
                                </Link>
                                {user && user.uid !== broadcast.hostId && !isFollowing && (
                                    <Button size="sm" className="h-7 rounded-full px-4 text-xs pointer-events-auto" onClick={onFollow} variant='default'>
                                        Follow
                                    </Button>
                                )}
                            </div>
                            <p className="text-sm md:text-base font-normal mt-1">{broadcast.title}</p>
                            <div className="flex items-center gap-2 text-xs mt-1">
                                <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span>{broadcast.viewers?.toLocaleString() || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Right Side Vertical Action Bar */}
             <div className="absolute top-1/2 right-4 -translate-y-1/2 z-40 flex flex-col items-center gap-y-4 md:gap-y-6 pointer-events-auto text-white">

                {/* Like Action Item */}
                 <div className="flex flex-col items-center group">
                    <button className="p-0 bg-transparent border-none text-white hover:scale-110 transition-transform" onClick={onLike}>
                      <Heart className={cn("h-6 w-6 drop-shadow-md", hasLiked && "fill-red-500 text-red-500")} strokeWidth={1.5} />
                    </button>
                    <span className="text-xs font-bold text-white drop-shadow-md mt-1.5">{likes?.length || 0}</span>
                </div>

                {/* Comment Action Item */}
                <div className="flex flex-col items-center group">
                    <button className="p-0 bg-transparent border-none text-white hover:scale-110 transition-transform" onClick={() => setIsChatVisible(!isChatVisible)}>
                       <MessageSquareMore className="h-6 w-6 drop-shadow-md" strokeWidth={1.5} />
                    </button>
                    <span className="text-xs font-bold text-white drop-shadow-md mt-1.5">{comments?.length || 0}</span>
                </div>
                
                {/* Games/Dares Action Item */}
                <Link href="/cards" className="flex flex-col items-center group pointer-events-auto">
                    <button className="p-0 bg-transparent border-none text-white hover:scale-110 transition-transform">
                       <Dice6 className="h-6 w-6 drop-shadow-md" strokeWidth={1.5} />
                    </button>
                    <span className="text-xs font-bold text-white drop-shadow-md mt-1.5">Games</span>
                </Link>

                 {/* AI Search Action Item */}
                <AIChat userAvatar={currentUserAvatar} broadcastContext={broadcastContext}>
                    <div className="flex flex-col items-center group">
                        <button className="p-0 bg-transparent border-none text-white hover:scale-110 transition-transform">
                           <Search className="h-6 w-6 drop-shadow-md" strokeWidth={1.5} />
                        </button>
                         <span className="text-xs font-bold text-white drop-shadow-md mt-1.5">AI</span>
                    </div>
                </AIChat>

                {/* Live Challenge Icon */}
                {broadcast.activeChallenge && (
                     <div className="flex flex-col items-center group">
                        <button className="p-0 bg-transparent border-none text-white hover:scale-110 transition-transform" onClick={() => setIsChallengeVisible(true)}>
                           <Swords className="h-6 w-6 drop-shadow-md text-yellow-400" strokeWidth={1.5} />
                        </button>
                        <span className="text-xs font-bold text-white drop-shadow-md mt-1.5">Challenge</span>
                    </div>
                )}
            </div>


            {/* Bottom Chat Area */}
            <div className="bg-gradient-to-t from-black/70 to-transparent -m-4 p-4 flex flex-col justify-end gap-4">
                <div className="w-full sm:max-w-sm md:max-w-md">
                    {isChatVisible && (
                        <ScrollArea className="h-48 w-full pr-4 pointer-events-auto">
                            <div className="flex flex-col gap-y-3">
                                {reversedComments.map((comment) => (
                                    <div key={comment.id} className="group flex items-start gap-2 text-sm bg-black/25 p-2 rounded-lg">
                                        <Link href={`/profile/${comment.userId}`} className="pointer-events-auto">
                                            <Avatar className="h-6 w-6 border-secondary">
                                                <AvatarImage src={comment.userAvatar} alt={comment.username} />
                                                <AvatarFallback>{comment.username.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        </Link>
                                        <div className="flex-1">
                                            <Link href={`/profile/${comment.userId}`} className="pointer-events-auto">
                                                <span className="font-bold font-headline text-primary mr-1.5 hover:underline">{comment.username}:</span>
                                            </Link>
                                            {comment.replyingTo && <Link href={`/profile/${comment.replyingTo}`} className="text-accent font-semibold mr-1.5 hover:underline pointer-events-auto">@{comment.replyingTo}</Link>}
                                            
                                            {comment.attachment?.type === 'giphy' ? (
                                                <Image src={comment.attachment.imageUrl} width={150} height={100} alt={comment.attachment.title || 'gif'} className="mt-1 rounded-md" />
                                            ) : (
                                                <span className="break-words">{comment.message.replace(/^@\w+\s/, '')}</span>
                                            )}
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 pointer-events-auto" onClick={() => handleReplyClick(comment.username)}>
                                            <CornerUpLeft className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>
                
                <form onSubmit={handleFormSubmit} className="relative flex w-full pointer-events-auto items-center gap-2">
                     <div className="relative flex-1">
                        <Textarea
                            ref={textareaRef}
                            placeholder="Add a comment..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="bg-black/50 border-white/20 placeholder:text-gray-400 w-full min-h-[40px] h-10 resize-none rounded-full py-2 pr-[80px] pl-4"
                        />
                        <div className="absolute top-1/2 -translate-y-1/2 right-1 flex items-center">
                            <Popover open={isGifPickerOpen} onOpenChange={setIsGifPickerOpen}>
                                <PopoverTrigger asChild>
                                    <Button size="icon" type="button" variant="ghost" className="rounded-full h-9 w-9 text-white">
                                        <b className="text-xs">GIF</b>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-screen sm:w-96 h-96 p-0 border-zinc-700 bg-zinc-900" side="top" align="end">
                                <GifPicker onSendGif={handleGifSelect} />
                                </PopoverContent>
                            </Popover>
                            <Button variant="ghost" size="icon" type="submit" className="text-white hover:bg-transparent hover:text-white h-9 w-9">
                                <ArrowUp className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}


interface BroadcastPreviewProps {
  broadcast: Broadcast;
  onVisible: () => void;
}


export function BroadcastPreview({ broadcast, onVisible }: BroadcastPreviewProps) {
    const { ref, inView } = useInView({ threshold: 0.7 });
    const { user } = useUser();
    const { userDocument } = useUserDocument();
    const firestore = useFirestore();
    const { toast } = useToast();

    // Access the stream store
    const { 
        activeBroadcastId, 
        setIsIntentionalConnect, 
        status, 
        isIntentionalConnect,
        disconnect,
    } = useStreamStore();
    
    useEffect(() => {
        if (inView) {
            onVisible();
        } else {
             // If this preview scrolls out of view and it was the one playing, disconnect.
            if (activeBroadcastId === broadcast.id && isIntentionalConnect) {
                disconnect();
            }
        }
    }, [inView, onVisible, activeBroadcastId, broadcast.id, isIntentionalConnect, disconnect]);

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
    
    // Real-time likes
    const likesCollectionRef = useMemoFirebase(() => {
        if (!broadcast.id || !firestore) return null;
        return collection(firestore, `broadcasts/${broadcast.id}/likes`);
    }, [broadcast.id, firestore]);
    const { data: likes } = useCollection(likesCollectionRef);

    // Follow status
    const currentUserFollowingRef = useMemoFirebase(() => {
        if (!user) return null;
        return collection(firestore, `users/${user.uid}/following`);
    }, [user, firestore]);
    const { data: currentUserFollowingList } = useCollection(currentUserFollowingRef);
    const isFollowing = useMemo(() => {
        if (!currentUserFollowingList) return false;
        return currentUserFollowingList.some(follow => follow.id === broadcast.hostId);
    }, [currentUserFollowingList, broadcast.hostId]);


    const hasLiked = useMemo(() => {
        if (!user || !likes) return false;
        return likes.some(like => like.id === user.uid);
    }, [user, likes]);
    
    const handleSendMessage = (message: string) => {
        if (!user || !userDocument) return;
        const messagesCollectionRef = collection(firestore, 'broadcasts', broadcast.id, 'messages');
        const newComment: Omit<ChatMessage, 'id'|'timestamp'> & {timestamp: any, replyingTo?: string} = {
            userId: user.uid,
            username: userDocument.username || "Anonymous",
            userAvatar: userDocument.profilePicture || '',
            message: message,
            timestamp: serverTimestamp(),
        };
        const mentionMatch = message.match(/^@(\w+)\s/);
        if (mentionMatch) {
            newComment.replyingTo = mentionMatch[1];
        }
        addDocumentNonBlocking(messagesCollectionRef, newComment);
    };

    const handleSendGif = (gif: GiphyResult) => {
        if (!user || !userDocument) return;
        const messagesCollectionRef = collection(firestore, 'broadcasts', broadcast.id, 'messages');
        const newComment = {
            userId: user.uid,
            username: userDocument.username || 'Anonymous',
            userAvatar: userDocument.profilePicture || '',
            message: gif.title || '',
            timestamp: serverTimestamp(),
            attachment: {
                type: 'giphy' as const,
                title: gif.title,
                imageUrl: gif.images.original.url,
                thumbUrl: gif.images.fixed_width.url,
            },
        };
        addDocumentNonBlocking(messagesCollectionRef, newComment);
    };

    const handleLike = () => {
        if (!broadcast.isLive) {
            toast({ title: 'Stream is offline', description: 'You can only like live streams.', variant: 'destructive' });
            return;
        }
        if (!user) {
            toast({ title: 'Login Required', description: 'You must be logged in to like a stream.', variant: 'destructive' });
            return;
        }
        if (!firestore || !broadcast.id) return;
        
        const likeDocRef = doc(firestore, 'broadcasts', broadcast.id, 'likes', user.uid);
        
        if (hasLiked) {
            deleteDocumentNonBlocking(likeDocRef);
        } else {
            setDocumentNonBlocking(likeDocRef, { userId: user.uid, timestamp: serverTimestamp() }, {});
        }
    };
    
    const handleFollowToggle = async () => {
        if (!user || !userDocument) {
          toast({ title: 'Please log in', description: 'You need to be logged in to follow users.', variant: 'destructive' });
          return;
        }
        if (user.uid === broadcast.hostId) return;

        const batch = writeBatch(firestore);
        const followingDocRef = doc(firestore, `users/${user.uid}/following`, broadcast.hostId);
        const followerDocRef = doc(firestore, `users/${broadcast.hostId}/followers`, user.uid);

        if (isFollowing) {
            batch.delete(followingDocRef);
            batch.delete(followerDocRef);
            toast({ title: `Unfollowed ${broadcast.hostName}` });
        } else {
            const followData = { userId: user.uid, timestamp: serverTimestamp() };
            batch.set(followingDocRef, followData);
            batch.set(followerDocRef, followData);
            
            const notificationsCollectionRef = collection(firestore, `users/${broadcast.hostId}/notifications`);
            const newNotifRef = doc(notificationsCollectionRef);
            batch.set(newNotifRef, {
                userId: broadcast.hostId,
                type: 'follow',
                actorId: user.uid,
                actorName: userDocument.username || 'Someone',
                actorAvatar: userDocument.profilePicture || '',
                isRead: false,
                timestamp: serverTimestamp(),
            });

            toast({ title: `Followed ${broadcast.hostName}` });
        }
        
        try {
            await batch.commit();
        } catch (error) {
            console.error("Follow/unfollow failed:", error);
            toast({ title: 'Error', description: 'Could not update follow status.', variant: 'destructive' });
        }
    };

    const handleReply = (username: string) => {
        // This is a placeholder now, the logic is inside the UI manager
    }

    const handlePlay = () => {
        setIsIntentionalConnect(true);
    };

    const isCurrentActiveStream = activeBroadcastId === broadcast.id;
    const isConnecting = isCurrentActiveStream && status === 'connecting';
    const isConnected = isCurrentActiveStream && status === 'connected' && isIntentionalConnect;


    return (
        <div ref={ref} className="h-full w-full snap-start relative bg-cover bg-center" style={{backgroundImage: `url(${broadcast.thumbnailUrl})`}}>
           <BroadcastPreviewUIManager
                broadcast={broadcast}
                comments={comments || []}
                likes={likes || []}
                hasLiked={hasLiked}
                isFollowing={isFollowing}
                onLike={handleLike}
                onFollow={handleFollowToggle}
                onSendMessage={handleSendMessage}
                onSendGif={handleSendGif}
                onReply={handleReply}
                currentUserAvatar={userDocument?.profilePicture}
                onPlay={handlePlay}
                isCurrentActiveStream={isCurrentActiveStream}
                isConnecting={isConnecting}
                isConnected={isConnected}
            />
        </div>
    );
};
