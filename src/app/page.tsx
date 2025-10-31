
'use client';

import { Suspense, useEffect, useRef, useState, useMemo } from 'react';
import { useUser, useFirestore, useMemoFirebase, useStorage, useUserDocument } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, writeBatch, doc, orderBy } from 'firebase/firestore';
import type { Broadcast, Notification } from '@/lib/data';
import { Clapperboard, Loader2, Mail, ChevronDownCircle, MessageCircleHeart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BroadcastPlayer from '@/components/broadcast/broadcast-player';
import { useStreamStore } from '@/lib/stream-store';
import { BroadcastPreview } from '@/components/broadcast/broadcast-preview';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { UserSearch } from '@/components/search/user-search';
import UploadHighlightForm from '@/components/feed/UploadHighlightForm';
import InboxPanel from '@/components/feed/InboxPanel';
import { Film } from 'lucide-react';
import { cn } from '@/lib/utils';
import NotificationsPanel from '@/components/feed/NotificationsPanel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function HomePageContent() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const { userDocument, isDocLoading: isUserDocLoading } = useUserDocument();
    const firestore = useFirestore();
    const setActiveBroadcastId = useStreamStore((state) => state.setActiveBroadcastId);
    const disconnect = useStreamStore((state) => state.disconnect);
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [isMessagesOpen, setIsMessagesOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    
    // Live broadcasts query
    const liveBroadcastsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'broadcasts'), where('isLive', '==', true));
    }, [firestore]);
    const { data: liveBroadcasts, isLoading: areBroadcastsLoading } = useCollection<Broadcast>(liveBroadcastsQuery);
    
    // Notifications query
    const notificationsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, `users/${user.uid}/notifications`), orderBy('timestamp', 'desc'));
    }, [user, firestore]);
    const { data: notifications, isLoading: areNotificationsLoading } = useCollection<Notification>(notificationsQuery);

    const unreadCount = useMemo(() => {
        if (!notifications) return 0;
        return notifications.filter(n => !n.isRead).length;
    }, [notifications]);

    // This effect ensures we disconnect when the user navigates away from the feed.
    useEffect(() => {
        return () => {
            disconnect();
        }
    }, [disconnect]);

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
            <div className="h-[calc(100vh-4rem)] relative bg-black">
                {/* The single, centralized player */}
                <BroadcastPlayer user={user} />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon" className="absolute top-4 right-4 z-40 text-white transition-transform hover:bg-black/20 hover:scale-110 pointer-events-auto focus-visible:ring-0 rounded-full h-10 w-10 bg-black/20">
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
                                        {/* DM unread count will be managed by Stream SDK */}
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
                
                {/* The scrollable list of previews */}
                <div className="h-full overflow-y-scroll snap-y snap-mandatory">
                    {liveBroadcasts && liveBroadcasts.map(broadcast => (
                        <BroadcastPreview
                            key={broadcast.id}
                            broadcast={broadcast}
                            onVisible={() => setActiveBroadcastId(broadcast.id)}
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
