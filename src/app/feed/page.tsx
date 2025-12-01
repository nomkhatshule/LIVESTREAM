

'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useUser, useFirestore, useMemoFirebase, useUserDocument, useAuth } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, writeBatch, doc, orderBy, getDocs } from 'firebase/firestore';
import type { Broadcast, ChatMessage } from '@/lib/data';
import { Clapperboard, Loader2, Mail, ChevronDownCircle, MessageCircleHeart, Film, RefreshCw, LogOut } from 'lucide-react';
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
import ActivityPanel from '@/components/feed/ActivityPanel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInView } from 'react-intersection-observer';
import { useToast } from '@/hooks/use-toast';
import { useStreamPrefetch } from '@/hooks/useStreamPrefetch';
import FeedItemHeader from '@/components/feed/FeedItemHeader';
import FeedItemActions from '@/components/feed/FeedItemActions';
import FeedItemChat from '@/components/feed/FeedItemChat';
import VideoPlayer from '@/components/broadcast/video-player';
import Image from 'next/image';
import { signOut } from 'firebase/auth';

function BroadcastFeedItem({ broadcast, onVisible, isActive }: { broadcast: Broadcast, onVisible: () => void, isActive: boolean }) {
    const { ref, inView } = useInView({ threshold: 0.7 });
    const { user } = useUser();
    const firestore = useFirestore();
    const [isChatVisible, setIsChatVisible] = useState(true);
    const [participantCount, setParticipantCount] = useState(broadcast.viewers || 0);
    
    // PREFETCH HOOK - This will start fetching the stream token when the item is active
    const { prefetchedClient, prefetchedToken } = useStreamPrefetch(isActive ? user : null, broadcast);

    const messagesQuery = useMemoFirebase(() => {
        if (!broadcast.id || !firestore) return null;
        return query(
            collection(firestore, `broadcasts/${broadcast.id}/messages`)
        );
    }, [broadcast.id, firestore]);
    const { data: comments } = useCollection<ChatMessage>(messagesQuery);

    useEffect(() => {
        if (inView) {
            onVisible();
        }
    }, [inView, onVisible]);

    const broadcastContext = `The streamer is ${broadcast.hostName}. The stream is titled "${broadcast.title}" under the category "${broadcast.category}".`;
    
    return (
        <div ref={ref} className="h-full w-full snap-start relative bg-black">
            
            <div className="absolute inset-0 z-0 bg-black">
              {isActive ? (
                    <VideoPlayer 
                        broadcast={broadcast} 
                        isHost={false}
                        prefetchedClient={prefetchedClient}
                        prefetchedToken={prefetchedToken}
                        onParticipantCountChange={setParticipantCount}
                    />
                ) : (
                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                        {broadcast.thumbnailUrl && (
                           <Image src={broadcast.thumbnailUrl} alt={broadcast.title} layout="fill" className="object-contain" />
                        )}
                         <div className="text-center text-white absolute">
                            <Loader2 className="h-16 w-16 mx-auto text-white/80 animate-spin" />
                            <p className="mt-2 text-lg font-semibold">Connecting...</p>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="absolute inset-0 flex flex-col justify-between p-3 md:p-4 text-white z-40 pointer-events-none">
                <FeedItemHeader broadcast={broadcast} viewerCount={participantCount} />
                <FeedItemActions 
                    broadcast={broadcast} 
                    broadcastContext={broadcastContext}
                    isChatVisible={isChatVisible}
                    setIsChatVisible={setIsChatVisible}
                    commentsCount={comments?.length || 0}
                />
                <FeedItemChat broadcast={broadcast} isChatVisible={isChatVisible} />
            </div>
        </div>
    );
}


function HomePageContent() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const auth = useAuth();
    const { userDocument, isDocLoading: isUserDocLoading } = useUserDocument();
    const firestore = useFirestore();
    const { activeBroadcast, setActiveBroadcast } = useStreamStore();
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [isMessagesOpen, setIsMessagesOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const { toast } = useToast();
    const [isCleaning, setIsCleaning] = useState(false);

    
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
    
    const handleLogout = () => {
        signOut(auth).then(() => {
          router.push('/landing');
        });
    };

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [isUserLoading, user, router]);

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

    const handleCleanup = async () => {
        setIsCleaning(true);
        try {
          const q = query(collection(firestore, 'broadcasts'), where('isLive', '==', true));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            toast({ title: 'No active streams found', description: 'Your feed is already clean!' });
            setIsCleaning(false);
            return;
          }
    
          const batch = writeBatch(firestore);
          let count = 0;
          querySnapshot.forEach((doc) => {
            batch.update(doc.ref, { isLive: false });
            count++;
          });
    
          await batch.commit();
    
          toast({
            title: 'Feed Refreshed!',
            description: `Successfully marked ${count} ghost stream(s) as offline.`,
          });
    
        } catch (error) {
          console.error('Error cleaning up feed:', error);
          toast({
            variant: 'destructive',
            title: 'Refresh Failed',
            description: 'Could not refresh the feed. Please check the console for errors.',
          });
        } finally {
          setIsCleaning(false);
        }
    };
    
    const isLoading = isUserLoading || areBroadcastsLoading || areNotificationsLoading || isUserDocLoading;

    if (isLoading || !user) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading Feed...</p>
            </div>
        );
    }

    return (
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <div className="h-screen relative bg-black">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon" className="absolute top-8 right-4 z-50 text-white transition-transform hover:bg-black/20 hover:scale-110 pointer-events-auto focus-visible:ring-0 rounded-full h-10 w-10 bg-black/20">
                            <ChevronDownCircle className="h-7 w-7" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 p-0" align="end">
                        <UserSearch>
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
                                        <span>Activity</span>
                                        {unreadCount > 0 && <span className="ml-auto bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>}
                                    </DropdownMenuItem>
                                </SheetTrigger>
                                <SheetContent className="w-full sm:max-w-md">
                                    <ActivityPanel notifications={notifications || []} isLoading={areNotificationsLoading} />
                                </SheetContent>
                            </Sheet>
                            <DropdownMenuSeparator />
                             <DropdownMenuItem onSelect={handleCleanup} disabled={isCleaning}>
                                {isCleaning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                <span>Refresh</span>
                            </DropdownMenuItem>
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
                             <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log Out</span>
                            </DropdownMenuItem>
                        </UserSearch>
                    </DropdownMenuContent>
                </DropdownMenu>
                
                <div className="h-full overflow-y-scroll snap-y snap-mandatory">
                    {liveBroadcasts && liveBroadcasts.length > 0 ? liveBroadcasts.map(broadcast => (
                        <BroadcastFeedItem
                            key={broadcast.id}
                            broadcast={broadcast}
                            onVisible={() => setActiveBroadcast(broadcast)}
                            isActive={activeBroadcast?.id === broadcast.id}
                        />
                    )) : (
                        <div className="h-full w-full flex items-center justify-center text-white snap-start">
                             <div className="text-center">
                                <p className="text-lg font-semibold">No live broadcasts right now.</p>
                                <p className="text-sm text-stone-200">Check back later or be the first to go live!</p>
                                <Button asChild className="mt-4">
                                    <Link href="/broadcast/create">
                                        <Clapperboard className="mr-2 h-4 w-4" />
                                        Go Live
                                    </Link>
                                </Button>
                            </div>
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
        <Suspense fallback={null}>
            <HomePageContent />
        </Suspense>
    )
}
