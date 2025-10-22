'use client';

import { useMemo, useState, useRef, forwardRef } from 'react';
import type { Broadcast, User as AppUser, ChatMessage } from '@/lib/data';
import { useUser, useFirestore, useMemoFirebase, useUserDocument } from '@/firebase';
import { collection, query, orderBy, limit, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MoreVertical, PlusCircle, Users, ArrowUp, MessageSquare, Share2, Clapperboard, User as UserIcon, CornerUpLeft, Volume2, VolumeX } from 'lucide-react';
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
import { useStreamStore } from '@/lib/stream-store';

interface BroadcastPreviewProps {
  broadcast: any; // Using any to match Firestore data structure
}

export const BroadcastPreview = forwardRef<HTMLTextAreaElement, BroadcastPreviewProps>(({ broadcast }, textareaRef) => {
    const { user } = useUser();
    const { userDocument } = useUserDocument();
    const firestore = useFirestore();
    const { toast } = useToast();
    const status = useStreamStore(state => state.status);
    
    const [newMessage, setNewMessage] = useState('');
    const [isChatVisible, setIsChatVisible] = useState(true);
    const [isMuted, setIsMuted] = useState(true);

    const fullBroadcast: Broadcast = useMemo(() => {
        const hostUser: AppUser = {
            id: broadcast.hostId,
            name: broadcast.hostName,
            avatarUrl: broadcast.hostAvatar,
            avatarHint: 'person portrait',
            bio: '',
            interests: [],
            watchHistory: [],
        };

        return {
            ...broadcast,
            user: hostUser,
            thumbnailUrl: '', 
            thumbnailHint: '',
        }
    }, [broadcast]);


    // Real-time chat messages
    const messagesQuery = useMemoFirebase(() => {
        if (!fullBroadcast.id || !firestore) return null;
        return query(
            collection(firestore, `broadcasts/${fullBroadcast.id}/messages`),
            orderBy('timestamp', 'desc'),
            limit(50)
        );
    }, [fullBroadcast.id, firestore]);
    const { data: comments } = useCollection<ChatMessage>(messagesQuery);
    const reversedComments = useMemo(() => comments ? [...comments].reverse() : [], [comments]);
    
    // Real-time likes
    const likesCollectionRef = useMemoFirebase(() => {
        if (!fullBroadcast.id || !firestore) return null;
        return collection(firestore, `broadcasts/${fullBroadcast.id}/likes`);
    }, [fullBroadcast.id, firestore]);
    const { data: likes } = useCollection(likesCollectionRef);
    const hasLiked = useMemo(() => {
        if (!user || !likes) return false;
        return likes.some(like => like.id === user.uid);
    }, [user, likes]);
    
    const handleSendMessage = () => {
        if (newMessage.trim() === '' || !user || !userDocument) return;
        const messagesCollectionRef = collection(firestore, 'broadcasts', fullBroadcast.id, 'messages');
        const newComment: Omit<ChatMessage, 'id'|'timestamp'> & {timestamp: any, replyingTo?: string} = {
            userId: user.uid,
            username: userDocument.username || "Anonymous",
            userAvatar: userDocument.profilePicture || '',
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

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSendMessage();
    };

    const handleLike = () => {
        if (!fullBroadcast.isLive) {
            toast({ title: 'Stream is offline', description: 'You can only like live streams.', variant: 'destructive' });
            return;
        }
        if (!user) {
            toast({ title: 'Login Required', description: 'You must be logged in to like a stream.', variant: 'destructive' });
            return;
        }
        if (!firestore || !fullBroadcast.id) return;
        
        const likeDocRef = doc(firestore, 'broadcasts', fullBroadcast.id, 'likes', user.uid);
        
        if (hasLiked) {
            deleteDocumentNonBlocking(likeDocRef);
        } else {
            setDocumentNonBlocking(likeDocRef, { userId: user.uid, timestamp: serverTimestamp() }, {});
        }
    };
    
    const handleReply = (username: string) => {
        setNewMessage(`@${username} `);
        if (textareaRef && 'current' in textareaRef && textareaRef.current) {
            textareaRef.current.focus();
        }
    }

    const toggleMute = () => {
        // This is a dummy toggle now, as the actual video element is managed elsewhere.
        // We can use this to update UI if needed, but it won't control the audio.
        // The real audio control should be on the BroadcastPlayer itself if we add that feature.
        setIsMuted(prev => !prev);
    }

    return (
        <div className="absolute inset-0 flex flex-col justify-between p-4 text-white z-30 pointer-events-none">
            {/* Top Info */}
            <div className="bg-gradient-to-b from-black/50 to-transparent -m-4 p-4">
                <div className="flex items-start gap-3">
                    <Link href={`/profile/${fullBroadcast.user.id}`} className="pointer-events-auto">
                        <Avatar className="h-10 w-10 md:h-14 md:w-14 border-2 border-primary">
                            <AvatarImage src={fullBroadcast.user.avatarUrl} alt={fullBroadcast.user.name} />
                            <AvatarFallback>{fullBroadcast.user.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <Link href={`/profile/${fullBroadcast.user.id}`} className="pointer-events-auto">
                                <p className="font-bold text-base md:text-lg hover:underline">{fullBroadcast.user.name}</p>
                            </Link>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 animate-pulse">
                                LIVE
                            </span>
                        </div>
                        <p className="text-sm md:text-base font-semibold mt-1">{fullBroadcast.title}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs">
                            <Users className="h-3 w-3" />
                            <span>{broadcast.viewerCount?.toLocaleString() || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Actions and Chat */}
            <div className="bg-gradient-to-t from-black/70 to-transparent -m-4 p-4 flex items-end gap-4">
                <div className="flex-1 w-full">
                    {isChatVisible && (
                        <div className="w-full max-w-sm">
                            <ScrollArea className="h-48 w-full pr-4 pointer-events-auto">
                                <div className="flex flex-col gap-2">
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
                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 pointer-events-auto" onClick={() => handleReply(comment.username)}>
                                                <CornerUpLeft className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                             <div className="flex items-center gap-2">
                                <form onSubmit={handleFormSubmit} className="relative w-full mt-2 flex-1 pointer-events-auto">
                                    <Textarea
                                        ref={textareaRef}
                                        placeholder="Add a comment..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        className="bg-black/50 border-white/20 placeholder:text-gray-400 pr-10 w-full min-h-[40px] h-10 resize-none"
                                    />
                                    <Button variant="ghost" size="icon" type="submit" className="absolute top-1/2 -translate-y-1/2 right-1 text-white">
                                        <ArrowUp className="h-5 w-5" />
                                    </Button>
                                </form>
                                <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white bg-black/50 rounded-full h-10 w-10 mt-2 pointer-events-auto">
                                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex flex-col-reverse items-center gap-y-4 pointer-events-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-full text-white hover:bg-white/20">
                                <MoreVertical className="h-6 w-6 md:h-8 md:w-8" />
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
                    <Button variant="ghost" size="icon" onClick={() => setIsChatVisible(!isChatVisible)} className="h-10 w-10 md:h-12 md:w-12 rounded-full text-white flex-col hover:bg-white/20">
                        <MessageSquare className="h-6 w-6 md:h-8 md:w-8" />
                        <span className="text-xs mt-1">{comments?.length || 0}</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-full text-white flex-col hover:bg-white/20" onClick={handleLike} disabled={!fullBroadcast.isLive}>
                        <Heart className={cn("h-6 w-6 md:h-8 md:w-8", hasLiked && "fill-red-500 text-red-500")} />
                        <span className="text-xs mt-1 tabular-nums">{likes?.length || 0}</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-full text-white flex-col hover:bg-white/20">
                        <PlusCircle className="h-6 w-6 md:h-8 md:w-8" />
                    </Button>
                </div>
            </div>
        </div>
    );
});
BroadcastPreview.displayName = "BroadcastPreview";
