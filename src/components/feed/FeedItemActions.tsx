
'use client';

import { useMemo } from 'react';
import { useUser, useUserDocument, useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { cn } from '@/lib/utils';
import { Heart } from 'lucide-react';
import type { Broadcast } from '@/lib/data';

interface FeedItemActionsProps {
    broadcast: Broadcast;
    broadcastContext: string;
    isChatVisible: boolean;
    setIsChatVisible: (visible: boolean) => void;
    commentsCount: number;
}

export default function FeedItemActions({ broadcast, broadcastContext, isChatVisible, setIsChatVisible, commentsCount }: FeedItemActionsProps) {
    const { user } = useUser();
    const { userDocument } = useUserDocument();
    const firestore = useFirestore();
    const { toast } = useToast();

    const likesCollectionRef = useMemoFirebase(() => {
        if (!broadcast.id || !firestore) return null;
        return collection(firestore, 'broadcasts', broadcast.id, 'likes');
    }, [broadcast.id, firestore]);
    const { data: likes } = useCollection(likesCollectionRef);

    const hasLiked = useMemo(() => {
        if (!user || !likes) return false;
        return likes.some(like => like.id === user.uid);
    }, [user, likes]);

    const handleLike = () => {
        if (!broadcast.isLive) {
            toast({ title: 'Stream is offline', description: 'You can only like live streams.', variant: 'destructive' });
            return;
        }
        if (!user || !userDocument) {
            toast({ title: 'Login Required', description: 'You must be logged in to like a stream.', variant: 'destructive' });
            return;
        }
        
        const likeDocRef = doc(firestore, 'broadcasts', broadcast.id, 'likes', user.uid);
        
        if (hasLiked) {
            deleteDocumentNonBlocking(likeDocRef);
        } else {
            setDocumentNonBlocking(likeDocRef, { userId: user.uid, timestamp: serverTimestamp() }, {});
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

    return (
        <>
            <div className="absolute top-1/2 right-0 -translate-y-1/2 z-40 flex flex-col items-center gap-y-4 md:gap-y-6 pointer-events-auto text-white p-2 md:p-4">
                {/* 1. Like Button */}
                <div className="flex flex-col items-center group">
                    <button className="p-0 bg-transparent border-none text-white hover:scale-110 transition-transform" onClick={handleLike}>
                        <Heart className={cn("h-7 w-7 drop-shadow-md", hasLiked ? "fill-red-500 text-red-500" : "text-white")} strokeWidth={1.5} />
                    </button>
                    <span className="text-xs font-bold text-white drop-shadow-md mt-1.5">{likes?.length || 0}</span>
                </div>

                {/* 2. Comment Button */}
                <div className="flex flex-col items-center group">
                    <button className="p-0 bg-transparent border-none text-white hover:scale-110 transition-transform" onClick={() => setIsChatVisible(!isChatVisible)}>
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-7 w-7 drop-shadow-md">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                        </svg>
                    </button>
                    <span className="text-xs font-bold text-white drop-shadow-md mt-1.5">{commentsCount}</span>
                </div>
            </div>
        </>
    );
}
