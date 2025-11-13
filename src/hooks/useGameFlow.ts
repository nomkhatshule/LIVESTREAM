
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, serverTimestamp, DocumentReference } from 'firebase/firestore';
import { generateGamePrompts } from '@/ai/flows/generate-game-prompts';
import type { BroadcastData, StagedChallenge } from '@/lib/types';

export function useGameFlow(broadcastDocRef: DocumentReference | null, broadcastData: BroadcastData | null) {
    const { toast } = useToast();
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
            await updateDoc(broadcastDocRef, { 
                activeChallenge: stagedChallenge.text, 
                activeChallengeType: stagedChallenge.type,
                challengeDurationSeconds: stagedChallenge.duration,
                challengeStartTime: serverTimestamp(),
            });
            toast({ title: 'New Challenge Started!', description: stagedChallenge.text });
            setStagedChallenge(null);
            setShowChallengeCoverCard(false);
        }
    };

    const handleCancelStagedChallenge = () => {
        setShowChallengeCoverCard(false);
        setStagedChallenge(null);
    };

    const handleGenerateNextChallenge = async (gameType: 'truth' | 'dare' | 'challenge') => {
        if (!broadcastDocRef) return;
        try {
            const result = await generateGamePrompts({
                gameType: gameType,
                category: 'Live Stream Audience',
                count: 1,
            });

            if (result.prompts && result.prompts.length > 0) {
                await updateDoc(broadcastDocRef, {
                    activeChallenge: result.prompts[0],
                    activeChallengeType: gameType,
                    challengeDurationSeconds: result.durationsInSeconds[0] || 120,
                    challengeStartTime: serverTimestamp(),
                });
            } else {
                throw new Error('AI could not generate a challenge.');
            }
        } catch(e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not generate next challenge.' });
        }
    };
    
    return {
        stagedChallenge,
        showChallengeCoverCard,
        isChallengeVisible,
        isTimerFinished,
        handleChallengeSelect,
        handleStartStagedChallenge,
        handleCancelStagedChallenge,
        handleGenerateNextChallenge,
        setIsChallengeVisible,
    };
}

    