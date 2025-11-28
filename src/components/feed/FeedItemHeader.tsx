
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useUser, useUserDocument, useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Broadcast } from '@/lib/data';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

interface FeedItemHeaderProps {
    broadcast: Broadcast;
    viewerCount: number;
}

export default function FeedItemHeader({ broadcast, viewerCount }: FeedItemHeaderProps) {
    const { user } = useUser();
    const { userDocument } = useUserDocument();
    const firestore = useFirestore();
    const { toast } = useToast();

    const currentUserFollowingRef = useMemoFirebase(() => {
        if (!user) return null;
        return collection(firestore, `users/${user.uid}/following`);
    }, [user, firestore]);
    const { data: currentUserFollowingList } = useCollection(currentUserFollowingRef);
    
    const isFollowing = useMemo(() => {
        if (!currentUserFollowingList) return false;
        return currentUserFollowingList.some(follow => follow.id === broadcast.hostId);
    }, [currentUserFollowingList, broadcast.hostId]);

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

    return (
        <div className="bg-gradient-to-b from-black/50 to-transparent -m-3 md:-m-4 p-3 md:p-4 pt-8">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                    <Link href={`/profile/${broadcast.hostId}`} className="pointer-events-auto">
                        <Avatar className={cn("h-10 w-10 md:h-12 md:w-12 border-4 border-primary", broadcast.isLive && "animate-breathing-prominent")}>
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
                                <Button 
                                    size="sm" 
                                    className="h-7 rounded-full px-4 text-xs pointer-events-auto bg-transparent border-white text-white hover:bg-white hover:text-black" 
                                    onClick={handleFollowToggle} 
                                    variant='outline'
                                >
                                    Follow
                                </Button>
                            )}
                        </div>
                        <p className="text-sm md:text-base font-normal mt-1">{broadcast.title}</p>
                        <div className="flex items-center gap-2 text-xs mt-1">
                            <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>{viewerCount.toLocaleString() || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

    