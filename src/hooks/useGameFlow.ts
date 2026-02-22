
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, serverTimestamp, DocumentReference, collection, getDocs } from 'firebase/firestore';
import type { BroadcastData, StagedChallenge } from '@/lib/types';
import { useUser, useUserDocument } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export function useGameFlow(broadcastDocRef: DocumentReference | null, broadcastData: BroadcastData | null) {
    const { toast } = useToast();
    const { user } = useUser();
    const { userDocument } = useUserDocument();
    const [stagedChallenge, setStagedChallenge] = useState<StagedChallenge | null>(null);
    const [showChallengeCoverCard, setShowChallengeCoverCard] = useState(false);
    const [isChallengeVisible, setIsChallengeVisible] = useState(true);
    const [isTimerFinished, setIsTimerFinished] = useState(false);

    useEffect(() => {
        if (broadcastData?.activeChallenge) {
            setIsChallengeVisible(true);
        }
    }, [broadcastData?.activeChallenge]);

    useEffect(() => {
        setIsTimerFinished(false);

        if (broadcastData?.challengeStartTime && broadcastData?.challengeDurationSeconds) {
            const checkTimer = () => {
                const now = new Date();
                const start = broadcastData.challengeStartTime!.toDate();
                const elapsedSeconds = Math.floor((now.getTime() - start.getTime()) / 1000);
                if (elapsedSeconds >= broadcastData.challengeDurationSeconds!) {
                    setIsTimerFinished(true);
                    return true;
                }
                return false;
            };

            if (!checkTimer()) {
                const interval = setInterval(() => {
                    if (checkTimer()) clearInterval(interval);
                }, 1000);
                return () => clearInterval(interval);
            }
        } else if (broadcastData?.activeChallenge) {
            setIsTimerFinished(true);
        }
    }, [broadcastData?.challengeStartTime, broadcastData?.challengeDurationSeconds, broadcastData?.activeChallenge]);

    const handleChallengeSelect = (challenge: string, type: 'truth' | 'dare' | 'challenge', duration: number) => {
        setStagedChallenge({ text: challenge, type, duration });
        setShowChallengeCoverCard(true);
    };

    const handleStartStagedChallenge = async () => {
        if (broadcastDocRef && stagedChallenge) {
            await setDoc(broadcastDocRef, { 
                activeChallenge: stagedChallenge.text, 
                activeChallengeType: stagedChallenge.type,
                challengeDurationSeconds: stagedChallenge.duration,
                challengeStartTime: serverTimestamp(),
            }, { merge: true });
            toast({ title: 'New Challenge Started!', description: stagedChallenge.text });
            setStagedChallenge(null);
            setShowChallengeCoverCard(false);
        }
    };

    const handleCancelStagedChallenge = () => {
        setShowChallengeCoverCard(false);
        setStagedChallenge(null);
    };

    const handleCompleteChallenge = async () => {
        if (!broadcastDocRef || !broadcastData || !user || !userDocument) return;
        
        const likesCollectionRef = collection(broadcastDocRef.firestore, broadcastDocRef.path, 'likes');
        const likesSnapshot = await getDocs(likesCollectionRef);
        const currentLikes = likesSnapshot.size;
        
        // This is a simplification; a real app would get viewer count from a different source
        const currentViews = broadcastData.viewerCount || 0; 


        // Send notification to the sender
        if (broadcastData.challengeSenderId && broadcastData.challengeSenderId !== user.uid) {
            const senderNotificationsRef = collection(broadcastDocRef.firestore, `users/${broadcastData.challengeSenderId}/notifications`);
            addDocumentNonBlocking(senderNotificationsRef, {
                userId: broadcastData.challengeSenderId,
                type: 'comment', // Reusing for icon similarity
                actorId: user.uid,
                actorName: userDocument.username || 'Someone',
                actorAvatar: userDocument.profilePicture || '',
                entityInfo: `✅ completed your challenge: "${broadcastData.activeChallenge}"`,
                isRead: false,
                timestamp: serverTimestamp(),
            });
        }
        
        // Also update the original challenge document if it exists.
        if (broadcastData.challengeSenderId) {
             // In a real app, we'd store the challengeId on the broadcast document
             // and use it to update the original challenge.
             // For now, we update the broadcast and send a notification.
        }

        // Clear the challenge from the broadcast
        await setDoc(broadcastDocRef, {
            activeChallenge: null,
            activeChallengeType: null,
            challengeStartTime: null,
            challengeDurationSeconds: null,
            challengeSenderId: null,
            challengeSenderName: null,
            challengeSenderAvatar: null,
        }, { merge: true });

        toast({ title: 'Challenge Completed!' });
        setIsChallengeVisible(false);
    };
    
    return {
        stagedChallenge,
        showChallengeCoverCard,
        isChallengeVisible,
        isTimerFinished,
        handleChallengeSelect,
        handleStartStagedChallenge,
        handleCancelStagedChallenge,
        handleCompleteChallenge,
        setIsChallengeVisible,
    };
}
