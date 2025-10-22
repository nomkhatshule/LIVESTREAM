'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import type { Broadcast, User as AppUser, ChatMessage } from '@/lib/data';
import { useUser, useFirestore, useMemoFirebase, useUserDocument } from '@/firebase';
import { collection, query, orderBy, limit, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MoreVertical, PlusCircle, Users, ArrowUp, MessageSquare, Share2, Clapperboard, User as UserIcon, CornerUpLeft } from 'lucide-react';
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
import { useInView } from 'react-intersection-observer';

interface BroadcastPreviewProps {
  broadcast: any; // Using any to match Firestore data structure
  onVisible: () => void;
}

interface BroadcastPreviewUIManagerProps {
    broadcast: Broadcast;
    comments: ChatMessage[];
    likes: any[];
    hasLiked: boolean;
    onLike: () => void;
    onSendMessage: (message: string) => void;
    onReply: (username: string) => void;
}

function BroadcastPreviewUIManager({ broadcast, comments, likes, hasLiked, onLike, onSendMessage, onReply }: BroadcastPreviewUIManagerProps) {
    const [newMessage, setNewMessage] = useState('');
    const [isChatVisible, setIsChatVisible] = useState(true);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

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

    return (
        <div className="absolute inset-0 flex flex-col justify-between p-4 text-white z-30 pointer-events-none">
            {/* Top Info */}
            <div className="bg-gradient-to-b from-black/50 to-transparent -m-4 p-4">
                <div className="flex items-start gap-3">
                    <Link href={`/profile/${broadcast.user.id}`} className="pointer-events-auto">
                        <Avatar className="h-12 w-12 border-2 border-primary">
                            <AvatarImage src={broadcast.user.avatarUrl} alt={broadcast.user.name} />
                            <AvatarFallback>{broadcast.user.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </Link>
                    <div>
                        <Link href={`/profile/${broadcast.user.id}`} className="pointer-events-auto">
                            <p className="font-bold text-base md:text-lg hover:underline">{broadcast.user.name}</p>
                        </Link>
                         <div className="flex items-center gap-2 text-xs mt-1">
                             <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 animate-pulse">
                                LIVE
                            </span>
                            <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>{broadcast.viewerCount?.toLocaleString() || 0}</span>
                            </div>
                        </div>
                        <p className="text-sm md:text-base font-semibold mt-1">{broadcast.title}</p>
                    </div>
                </div>
            </div>
            
            {/* Right Side Vertical Action Bar */}
            <div className="absolute top-1/2 right-0 -translate-y-1/2 z-40 flex flex-col items-center space-y-5 p-4 pointer-events-auto">
                <Button variant="ghost" size="icon" className="h-14 w-14 rounded-full text-white flex-col justify-center items-center drop-shadow-lg hover:bg-transparent hover:text-white">
                    <PlusCircle className="h-10 w-10"/>
                </Button>
                <Button variant="ghost" size="icon" className="h-14 w-14 rounded-full text-white flex-col drop-shadow-lg hover:bg-transparent hover:text-white" onClick={onLike}>
                  <Heart className={cn("h-10 w-10", hasLiked && "fill-red-500 text-red-500")} />
                  <span className="text-xs mt-1">{likes?.length || 0}</span>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsChatVisible(!isChatVisible)} className="h-14 w-14 rounded-full text-white flex-col justify-center items-center drop-shadow-lg hover:bg-transparent hover:text-white">
                   <MessageSquare className="h-10 w-10" />
                   <span className="text-xs mt-1">{comments?.length || 0}</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-14 w-14 rounded-full text-white flex-col justify-center items-center drop-shadow-lg hover:bg-transparent hover:text-white">
                     <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="currentColor"><path d="m608-368 46-166-142-98-46 166 142 98ZM160-207l-33-16q-31-13-42-44.5t3-62.5l72-156v279Zm160 87q-33 0-56.5-24T240-201v-239l107 294q3 7 5 13.5t7 12.5h-39Zm206-5q-31 11-62-3t-42-45L245-662q-11-31 3-61.5t45-41.5l301-110q31-11 61.5 3t41.5 45l178 489q11 31-3 61.5T827-235L526-125Zm-28-75 302-110-179-490-301 110 178 490Zm62-300Z"/></svg>
                </Button>
            </div>

            {/* Bottom Chat Area */}
            <div className="bg-gradient-to-t from-black/70 to-transparent -m-4 p-4 flex flex-col justify-end gap-4">
                <div className="w-full max-w-sm">
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
                                                <span className="font-bold text-red-700 mr-1.5 hover:underline">{comment.username}:</span>
                                            </Link>
                                            {comment.replyingTo && <Link href={`/profile/${comment.replyingTo}`} className="text-accent font-semibold mr-1.5 hover:underline pointer-events-auto">@{comment.replyingTo}</Link>}
                                            <span className="break-words">{comment.message.replace(/^@\w+\s/, '')}</span>
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
                
                <form onSubmit={handleFormSubmit} className="relative w-full pointer-events-auto">
                    <Textarea
                        ref={textareaRef}
                        placeholder="Add a comment..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="bg-black/50 border-white/20 placeholder:text-gray-400 pr-10 w-full min-h-[40px] h-10 resize-none rounded-full"
                    />
                    <Button variant="ghost" size="icon" type="submit" className="absolute top-1/2 -translate-y-1/2 right-1 text-white">
                        <ArrowUp className="h-5 w-5" />
                    </Button>
                </form>
            </div>
        </div>
    );
}


export function BroadcastPreview({ broadcast: rawBroadcast, onVisible }: BroadcastPreviewProps) {
    const { ref, inView } = useInView({ threshold: 0.7 });
    const { user } = useUser();
    const { userDocument } = useUserDocument();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    useEffect(() => {
        if (inView) {
            onVisible();
        }
    }, [inView, onVisible]);

    const broadcast: Broadcast = useMemo(() => {
        const hostUser: AppUser = {
            id: rawBroadcast.hostId,
            name: rawBroadcast.hostName,
            avatarUrl: rawBroadcast.hostAvatar,
            avatarHint: 'person portrait',
            bio: '',
            interests: [],
            watchHistory: [],
        };
        return { ...rawBroadcast, user: hostUser }
    }, [rawBroadcast]);


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
    
    const handleReply = (username: string) => {
        // This is a placeholder now, the logic is inside the UI manager
    }

    return (
        <div ref={ref} className="h-full w-full snap-start relative">
           <BroadcastPreviewUIManager
                broadcast={broadcast}
                comments={comments || []}
                likes={likes || []}
                hasLiked={hasLiked}
                onLike={handleLike}
                onSendMessage={handleSendMessage}
                onReply={handleReply}
            />
        </div>
    );
};
