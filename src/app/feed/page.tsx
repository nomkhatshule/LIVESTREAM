

'use client';

import { Suspense, useEffect, useState, useMemo, useRef } from 'react';
import { useUser, useFirestore, useMemoFirebase, useUserDocument } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, writeBatch, doc, orderBy, serverTimestamp } from 'firebase/firestore';
import type { Broadcast, ChatMessage } from '@/lib/data';
import { Clapperboard, Loader2, Mail, ChevronDownCircle, MessageCircleHeart, Film, Heart, MessageSquareMore, Gift, Search, Swords, Users, CornerUpLeft, ArrowUp, Play, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useStreamStore } from '@/lib/stream-store';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { UserSearch } from '@/components/search/user-search';
import UploadHighlightForm from '@/components/feed/UploadHighlightForm';
import InboxPanel from '@/components/feed/InboxPanel';
import NotificationsPanel from '@/components/feed/NotificationsPanel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import AIChat from '@/components/broadcast/ai-chat';
import ChallengeCard from '@/components/broadcast/ChallengeCard';
import { GiphyResult } from '@/lib/types';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import GifPicker from '@/components/inbox/GifPicker';
import Image from 'next/image';
import VideoPlayer from '@/components/broadcast/video-player';

function BroadcastFeedItem({ broadcast, onVisible, isActive }: { broadcast: Broadcast, onVisible: () => void, isActive: boolean }) {
    const { ref, inView } = useInView({ threshold: 0.7 });
    const { user } = useUser();
    const { userDocument } = useUserDocument();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (inView) {
            onVisible();
        }
        // If the item is no longer active (scrolled away), stop playing.
        if (!isActive) {
            setIsPlaying(false);
        }
    }, [inView, onVisible, isActive]);

    const [newMessage, setNewMessage] = useState('');
    const [isChatVisible, setIsChatVisible] = useState(true);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isChallengeVisible, setIsChallengeVisible] = useState(false);
    const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
    const [selectedGif, setSelectedGif] = useState<GiphyResult | null>(null);

    const messagesQuery = useMemoFirebase(() => {
        if (!broadcast.id || !firestore) return null;
        return query(
            collection(firestore, `broadcasts/${broadcast.id}/messages`),
            orderBy('timestamp', 'asc'),
        );
    }, [broadcast.id, firestore]);
    const { data: comments } = useCollection<ChatMessage>(messagesQuery);
    const reversedComments = useMemo(() => (comments || []).slice().reverse(), [comments]);

    const likesCollectionRef = useMemoFirebase(() => {
        if (!broadcast.id || !firestore) return null;
        return collection(firestore, 'broadcasts', broadcast.id, 'likes');
    }, [broadcast.id, firestore]);
    const { data: likes } = useCollection(likesCollectionRef);

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

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedGif) || !user || !userDocument) return;

        const messagesCollectionRef = collection(firestore, 'broadcasts', broadcast.id, 'messages');
        
        let newComment: Omit<ChatMessage, 'id' | 'timestamp'> & { timestamp: any } = {
            userId: user.uid,
            username: userDocument.username || "Anonymous",
            userAvatar: userDocument.profilePicture || '',
            message: newMessage,
            timestamp: serverTimestamp(),
        };

        if (selectedGif) {
            (newComment as ChatMessage).attachment = {
                type: 'giphy',
                title: selectedGif.title,
                imageUrl: selectedGif.images.original.url,
                thumbUrl: selectedGif.images.fixed_width.url,
            };
        }
        
        const mentionMatch = newMessage.match(/^@(\w+)\s/);
        if (mentionMatch && mentionMatch[1]) {
            (newComment as ChatMessage).replyingTo = mentionMatch[1];
        }

        addDocumentNonBlocking(messagesCollectionRef, newComment);
        setNewMessage('');
        setSelectedGif(null);
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

    const handleReplyClick = (username: string) => {
        setNewMessage(`@${username} `);
        textareaRef.current?.focus();
    }
    
    const handleGifSelect = (gif: GiphyResult) => {
        setSelectedGif(gif);
        setIsGifPickerOpen(false);
    }
    
    const handleGiftClick = () => {
        toast({
            title: "Coming Soon!",
            description: "Gifting is not yet available, but we're working on it!",
        });
    }

    const broadcastContext = `The streamer is ${broadcast.hostName}. The stream is titled "${broadcast.title}" under the category "${broadcast.category}".`;
    
    return (
        <div ref={ref} className="h-full w-full snap-start relative bg-black">
            
            <div className="absolute inset-0 z-0 bg-black">
              {isPlaying && isActive ? (
                    <VideoPlayer broadcast={broadcast} isHost={false} />
                ) : (
                    <div
                        className="absolute inset-0 z-10 flex items-center justify-center group cursor-pointer"
                        onClick={() => setIsPlaying(true)}
                    >
                        {broadcast.thumbnailUrl && (
                           <Image src={broadcast.thumbnailUrl} alt={broadcast.title} layout="fill" className="object-cover opacity-50 -z-10" />
                        )}
                         <div className="text-center text-white transition-transform group-hover:scale-110 z-20">
                            <Play className="h-20 w-20 mx-auto text-white/80" />
                            <p className="mt-2 text-lg font-semibold">Join Stream</p>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="absolute inset-0 flex flex-col justify-between p-3 md:p-4 text-white z-40 pointer-events-none">
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
                <div className="bg-gradient-to-b from-black/50 to-transparent -m-3 md:-m-4 p-3 md:p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                            <Link href={`/profile/${broadcast.hostId}`} className="pointer-events-auto">
                                <Avatar className={cn("h-10 w-10 md:h-12 md:w-12 border-4 border-destructive", broadcast.isLive && "animate-breathing-prominent")}>
                                    <AvatarImage src={broadcast.hostAvatar || 'https://picsum.photos/seed/placeholder-avatar/200'} alt={broadcast.hostName} />
                                    <AvatarFallback>{broadcast.hostName?.charAt(0) || 'A'}</AvatarFallback>
                                </Avatar>
                            </Link>
                            <div>
                                <div className="flex items-center gap-2">
                                    <Link href={`/profile/${broadcast.hostId}`} className="pointer-events-auto">
                                        <p className="font-bold font-headline text-base md:text-lg hover:underline">{broadcast.hostName}</p>
                                    </Link>
                                    {user && user.uid !== broadcast.hostId && !isFollowing && (
                                        <Button size="sm" className="h-7 rounded-full px-4 text-xs pointer-events-auto" onClick={handleFollowToggle} variant='default'>
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
                 <div className="absolute top-1/2 right-0 -translate-y-1/2 z-40 flex flex-col items-center gap-y-4 md:gap-y-6 pointer-events-auto text-white p-2 md:p-4">
                    <div className="flex flex-col items-center group">
                        <button className="p-0 bg-transparent border-none text-white hover:scale-110 transition-transform" onClick={handleLike}>
                          <Heart className={cn("h-7 w-7 drop-shadow-md", hasLiked && "fill-red-500 text-red-500")} strokeWidth={1.5} />
                        </button>
                        <span className="text-xs font-bold text-white drop-shadow-md mt-1.5">{likes?.length || 0}</span>
                    </div>
                    <div className="flex flex-col items-center group">
                        <button className="p-0 bg-transparent border-none text-white hover:scale-110 transition-transform" onClick={() => setIsChatVisible(!isChatVisible)}>
                           <MessageSquareMore className="h-7 w-7 drop-shadow-md" strokeWidth={1.5} />
                        </button>
                        <span className="text-xs font-bold text-white drop-shadow-md mt-1.5">{comments?.length || 0}</span>
                    </div>
                    <div className="flex flex-col items-center group pointer-events-auto">
                        <button onClick={handleGiftClick} className="p-0 bg-transparent border-none text-white hover:scale-110 transition-transform">
                           <Gift className="h-7 w-7 drop-shadow-md" strokeWidth={1.5} />
                        </button>
                        <span className="text-xs font-bold text-white drop-shadow-md mt-1.5">Gifts</span>
                    </div>
                    <AIChat userAvatar={userDocument?.profilePicture} broadcastContext={broadcastContext}>
                        <div className="flex flex-col items-center group">
                            <button className="p-0 bg-transparent border-none text-white hover:scale-110 transition-transform">
                               <Search className="h-7 w-7 drop-shadow-md" strokeWidth={1.5} />
                            </button>
                             <span className="text-xs font-bold text-white drop-shadow-md mt-1.5">AI</span>
                        </div>
                    </AIChat>
                    {broadcast.activeChallenge && (
                         <div className="flex flex-col items-center group">
                            <button className="p-0 bg-transparent border-none text-white hover:scale-110 transition-transform" onClick={() => setIsChallengeVisible(true)}>
                               <Swords className="h-7 w-7 drop-shadow-md text-yellow-400" strokeWidth={1.5} />
                            </button>
                            <span className="text-xs font-bold text-white drop-shadow-md mt-1.5">Challenge</span>
                        </div>
                    )}
                </div>

                {/* Bottom Chat Area */}
                 {isChatVisible && (
                    <div className="p-3 md:p-4 flex flex-col justify-end">
                        <div className="w-full sm:max-w-sm md:max-w-md self-start flex-grow flex flex-col justify-end">
                            <div className="h-80 w-full pointer-events-auto">
                                <ScrollArea className="h-full pr-2">
                                    <div className="flex flex-col-reverse gap-3">
                                        {reversedComments.map((comment) => (
                                            <div key={comment.id} className="group flex items-start gap-2 text-sm text-white">
                                                <Link href={`/profile/${comment.userId}`} className="pointer-events-auto flex-shrink-0">
                                                    <Avatar className="h-6 w-6 border-2 border-secondary">
                                                        <AvatarImage src={comment.userAvatar} alt={comment.username} />
                                                        <AvatarFallback>{comment.username.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                </Link>
                                                <div className="flex-1 bg-black/20 p-2 rounded-lg">
                                                    <Link href={`/profile/${comment.userId}`} className="pointer-events-auto">
                                                        <span className="font-bold font-headline text-primary mr-1.5 hover:underline text-xs">{comment.username}</span>
                                                    </Link>
                                                    {comment.replyingTo && <Link href={`/profile/${comment.replyingTo}`} className="text-accent font-semibold mr-1.5 hover:underline pointer-events-auto text-xs">@{comment.replyingTo}</Link>}
                                                    
                                                    {comment.attachment?.type === 'giphy' ? (
                                                        <div className='mt-1'>
                                                            <Image src={comment.attachment.imageUrl} width={150} height={100} alt={comment.attachment.title || 'gif'} className="rounded-md" />
                                                            {comment.message && <p className="break-words mt-1 text-sm">{comment.message.replace(/^@\w+\s/, '')}</p>}
                                                        </div>
                                                    ) : (
                                                        <span className="break-words text-sm">{comment.message.replace(/^@\w+\s/, '')}</span>
                                                    )}
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 pointer-events-auto" onClick={() => handleReplyClick(comment.username)}>
                                                    <CornerUpLeft className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                            <div className="pb-4">
                                <form onSubmit={handleSendMessage} className="relative flex w-full pointer-events-auto items-center gap-2 mt-2">
                                    <div className="relative flex-1 bg-black/50 border border-white/20 rounded-2xl overflow-hidden">
                                        {selectedGif && (
                                            <div className="relative w-full p-2">
                                                <div className="relative w-32 h-24">
                                                    <Image src={selectedGif.images.fixed_width.url} alt={selectedGif.title} fill className="object-cover rounded-md" />
                                                    <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => setSelectedGif(null)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
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
                                            className="bg-transparent border-none placeholder:text-gray-400 w-full min-h-[40px] h-10 resize-none rounded-full py-2 pr-20 pl-4 focus-visible:ring-0"
                                        />
                                        <div className="absolute bottom-1 right-1 flex items-center">
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
                    </div>
                )}
            </div>
        </div>
    );
}


function HomePageContent() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const { userDocument, isDocLoading: isUserDocLoading } = useUserDocument();
    const firestore = useFirestore();
    const { activeBroadcast, setActiveBroadcast } = useStreamStore();
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [isMessagesOpen, setIsMessagesOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    
    const liveBroadcastsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'broadcasts'), where('isLive', '==', true));
    }, [firestore]);
    const { data: liveBroadcasts, isLoading: areBroadcastsLoading } = useCollection<Broadcast>(liveBroadcastsQuery);
    
    const notificationsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, `users/${user.uid}/notifications`), orderBy('timestamp', 'desc'));
    }, [user, firestore]);
    const { data: notifications, isLoading: areNotificationsLoading } = useCollection(notificationsQuery);

    const unreadCount = useMemo(() => {
        if (!notifications) return 0;
        return notifications.filter(n => !n.isRead).length;
    }, [notifications]);

    useEffect(() => {
        // Set the initial active broadcast if it's not already set
        if (!activeBroadcast && liveBroadcasts && liveBroadcasts.length > 0) {
            setActiveBroadcast(liveBroadcasts[0]);
        }
    }, [liveBroadcasts, activeBroadcast, setActiveBroadcast]);


    const handleOpenNotifications = async () => {
        if (!user || !firestore || !notifications || unreadCount === 0) return;

        const batch = writeBatch(firestore);
        notifications.forEach(notif => {
            if (!notif.isRead) {
                const notifRef = doc(firestore, `users/${user.uid}/notifications`, notif.id);
                batch.update(notifRef, { isRead: true });
            }
        });
        await batch.commit().catch(err => console.error("Failed to mark notifications as read:", err));
    };
    
    const isLoading = isUserLoading || areBroadcastsLoading || areNotificationsLoading || isUserDocLoading;

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading Feed...</p>
            </div>
        );
    }
    
    if (!user) {
        router.push('/login');
        return null;
    }

    return (
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <div className="h-screen relative bg-black">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon" className="absolute top-4 right-4 z-50 text-white transition-transform hover:bg-black/20 hover:scale-110 pointer-events-auto focus-visible:ring-0 rounded-full h-10 w-10 bg-black/20">
                            <ChevronDownCircle className="h-7 w-7" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 p-0" align="end">
                        <UserSearch>
                            <DropdownMenuSeparator />
                             <Sheet open={isMessagesOpen} onOpenChange={setIsMessagesOpen}>
                                <SheetTrigger asChild>
                                    <DropdownMenuItem onSelect={e => e.preventDefault()}>
                                        <Mail className="mr-2 h-4 w-4" />
                                        <span>Messages</span>
                                    </DropdownMenuItem>
                                </SheetTrigger>
                                <SheetContent className="w-full sm:max-w-md">
                                    <SheetHeader>
                                        <SheetTitle>Messages</SheetTitle>
                                        <SheetDescription>
                                            Recent direct messages.
                                        </SheetDescription>
                                    </SheetHeader>
                                    <div className="h-[calc(100%-4rem)] py-4">
                                        <InboxPanel />
                                    </div>
                                </SheetContent>
                            </Sheet>
                            <DropdownMenuSeparator />
                             <Sheet open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
                                <SheetTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleOpenNotifications(); }}>
                                        <MessageCircleHeart className="mr-2 h-4 w-4" />
                                        <span>Notifications</span>
                                        {unreadCount > 0 && <span className="ml-auto bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>}
                                    </DropdownMenuItem>
                                </SheetTrigger>
                                <SheetContent className="w-full sm:max-w-md">
                                    <NotificationsPanel notifications={notifications || []} isLoading={areNotificationsLoading} />
                                </SheetContent>
                            </Sheet>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/broadcast/create">
                                    <Clapperboard className="mr-2 h-4 w-4" />
                                    <span>Go Stream</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DialogTrigger asChild>
                                <DropdownMenuItem>
                                    <Film className="mr-2 h-4 w-4" />
                                    <span>Upload Highlight</span>
                                </DropdownMenuItem>
                            </DialogTrigger>
                             <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={`/profile/${user.uid}`}>
                                    <Avatar className="h-4 w-4 mr-2">
                                        <AvatarImage src={userDocument?.profilePicture} />
                                        <AvatarFallback className="text-xs">
                                            {userDocument?.username?.charAt(0) || user.displayName?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span>My Profile</span>
                                </Link>
                            </DropdownMenuItem>
                        </UserSearch>
                    </DropdownMenuContent>
                </DropdownMenu>
                
                <div className="h-full overflow-y-scroll snap-y snap-mandatory">
                    {liveBroadcasts && liveBroadcasts.map(broadcast => (
                        <BroadcastFeedItem
                            key={broadcast.id}
                            broadcast={broadcast}
                            onVisible={() => setActiveBroadcast(broadcast)}
                            isActive={activeBroadcast?.id === broadcast.id}
                        />
                    ))}
                    {(!liveBroadcasts || liveBroadcasts.length === 0) && (
                        <div className="h-full w-full flex items-center justify-center text-white snap-start">
                            <p>No live broadcasts right now. Check back later!</p>
                        </div>
                    )}
                </div>
            </div>
            <DialogContent className="w-[90vw] max-w-lg">
                <DialogHeader>
                    <DialogTitle>Upload a New Highlight</DialogTitle>
                    <DialogDescription>
                        Select a video clip from your device to share with your followers.
                    </DialogDescription>
                </DialogHeader>
                <UploadHighlightForm setOpen={setIsUploadDialogOpen} />
            </DialogContent>
        </Dialog>
    );
}

export default function HomePage() {
    return (
        <Suspense fallback={
             <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <HomePageContent />
        </Suspense>
    )
}
