
'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where } from 'firebase/firestore';
import type { Broadcast } from '@/lib/data';
import { Clapperboard, Loader2, MoreVertical, Share2, User as UserIcon, UserSearch } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BroadcastPlayer from '@/components/broadcast/broadcast-player';
import { useStreamStore } from '@/lib/stream-store';
import { BroadcastPreview } from '@/components/broadcast/broadcast-preview';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';

function FeedPageContent() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const setActiveBroadcastId = useStreamStore((state) => state.setActiveBroadcastId);
    const disconnect = useStreamStore((state) => state.disconnect);

    const liveBroadcastsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'broadcasts'), where('isLive', '==', true));
    }, [firestore]);

    const { data: liveBroadcasts, isLoading: areBroadcastsLoading } = useCollection<Broadcast>(liveBroadcastsQuery);

    // This effect ensures we disconnect when the user navigates away from the feed.
    useEffect(() => {
        return () => {
            disconnect();
        }
    }, [disconnect]);

    if (isUserLoading || areBroadcastsLoading) {
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
        <div className="h-[calc(100vh-4rem)] relative bg-black">
            {/* The single, centralized player */}
            <BroadcastPlayer user={user} />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="absolute top-4 right-4 z-40 text-white transition-transform hover:bg-transparent hover:scale-110 pointer-events-auto focus-visible:ring-0">
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
    );
}

export default function FeedTestPage() {
    return (
        <Suspense fallback={
             <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <FeedPageContent />
        </Suspense>
    )
}
