
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useUser, useUserDocument, useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { cn } from '@/lib/utils';
import AIChat from '@/components/broadcast/ai-chat';
import { Heart, MessageSquareMore, Search, Send, Swords } from 'lucide-react';
import type { Broadcast } from '@/lib/data';
import ChallengeDisplayCard from '../broadcast/ChallengeDisplayCard';
import CountdownTimer from '../broadcast/CountdownTimer';

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
    const [isChallengeVisible, setIsChallengeVisible] = useState(true);

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

    const cardPosition = broadcast.challengeCardPosition || { x: 0, y: 0 };
    const cardSize = broadcast.challengeCardSize || { width: 320, height: 460 };
    
    return (
        <>
            {broadcast.activeChallenge && broadcast.activeChallengeType && isChallengeVisible && (
                <div
                    className="absolute top-1/2 left-1/2 pointer-events-none z-20"
                    style={{
                        transform: `translate(calc(-50% + ${cardPosition.x}px), calc(-50% + ${cardPosition.y}px)) scale(0.6)`,
                        width: `${cardSize.width}px`,
                        height: `${cardSize.height}px`,
                    }}
                >
                    <ChallengeDisplayCard 
                        text={broadcast.activeChallenge}
                        type={broadcast.activeChallengeType}
                        timer={broadcast.challengeStartTime && broadcast.challengeDurationSeconds ? (
                            <CountdownTimer 
                                startTime={broadcast.challengeStartTime} 
                                durationSeconds={broadcast.challengeDurationSeconds} 
                            />
                        ) : null}
                    />
                </div>
            )}
            <div className="absolute top-1/2 right-0 -translate-y-1/2 z-40 flex flex-col items-center gap-y-4 md:gap-y-6 pointer-events-auto text-white p-2 md:p-4">
                {/* 1. Like Button */}
                <div className="flex flex-col items-center group">
                    <button className="p-0 bg-transparent border-none text-white hover:scale-110 transition-transform" onClick={handleLike}>
                        <Heart className={cn("h-7 w-7 drop-shadow-md", hasLiked && "fill-red-500 text-red-500")} strokeWidth={1.5} />
                    </button>
                    <span className="text-xs font-bold text-white drop-shadow-md mt-1.5">{likes?.length || 0}</span>
                </div>

                {/* 2. Comment Button */}
                <div className="flex flex-col items-center group">
                    <button className="p-0 bg-transparent border-none text-white hover:scale-110 transition-transform" onClick={() => setIsChatVisible(!isChatVisible)}>
                       <MessageSquareMore className="h-7 w-7 drop-shadow-md" strokeWidth={1.5} />
                    </button>
                    <span className="text-xs font-bold text-white drop-shadow-md mt-1.5">{commentsCount}</span>
                </div>

                {/* 3. Challenge Actions */}
                {broadcast.activeChallenge ? (
                    <div className="flex flex-col items-center group">
                        <button className="p-0 bg-transparent border-none text-white hover:scale-110 transition-transform" onClick={() => setIsChallengeVisible(prev => !prev)}>
                            <Swords className="h-7 w-7 drop-shadow-md" strokeWidth={1.5} />
                        </button>
                        <span className="text-xs font-bold text-white drop-shadow-md mt-1.5">Challenge</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center group pointer-events-auto">
                        <Link href="/cards" className="p-0 bg-transparent border-none text-white hover:scale-110 transition-transform flex flex-col items-center">
                            <Send className="h-7 w-7 drop-shadow-md" strokeWidth={1.5} />
                            <span className="text-xs font-bold text-white drop-shadow-md mt-1.5">Challenge</span>
                        </Link>
                    </div>
                )}
                
                {/* 4. AI Button */}
                <AIChat userAvatar={userDocument?.profilePicture} broadcastContext={broadcastContext}>
                    <div className="flex flex-col items-center group">
                        <button className="p-0 bg-transparent border-none text-white hover:scale-110 transition-transform">
                            <Search className="h-7 w-7 drop-shadow-md" strokeWidth={1.5} />
                        </button>
                            <span className="text-xs font-bold text-white drop-shadow-md mt-1.5">AI</span>
                    </div>
                </AIChat>
            </div>
        </>
    );
}
