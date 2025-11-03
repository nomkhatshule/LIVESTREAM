
'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useMemoFirebase, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, limit } from 'firebase/firestore';
import {
  Call,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  useCall,
  useCallStateHooks,
  CallingState,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import VideoPlayer from '@/components/broadcast/video-player';
import { Loader2 } from 'lucide-react';
import type { Reaction, BroadcastData, Comment } from '@/lib/types';
import StreamHeader from '@/components/agora-test/StreamHeader';
import FloatingReactions from '@/components/agora-test/FloatingReactions';
import StreamControls from '@/components/agora-test/StreamControls';
import ChatPanel from '@/components/agora-test/ChatPanel';
import InStreamGamesPanel from '@/components/agora-test/InStreamGamesPanel';
import GameFlowManager from '@/components/agora-test/GameFlowManager';
import ChallengeCardManager from '@/components/agora-test/ChallengeCardManager';
import { useStreamControls } from '@/hooks/useStreamControls';
import { useGameFlow } from '@/hooks/useGameFlow';
import { useChallengeCard } from '@/hooks/useChallengeCard';


// --- Main UI Component ---
function AgoraTestPageUI() {
  const searchParams = useSearchParams();
  const broadcastId = searchParams.get('id');
  const firestore = useFirestore();
  const call = useCall();
  
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [isGamePanelOpen, setIsGamePanelOpen] = useState(false);
  
  // Stream SDK Hooks
  const { useParticipants, useCallCallingState } = useCallStateHooks();
  const participants = useParticipants();
  const callingState = useCallCallingState();
  const isCallJoined = callingState === CallingState.JOINED;
  const viewerCount = Math.max(0, participants.length - 1);

  // Real-time broadcast document
  const broadcastDocRef = useMemoFirebase(() => {
    if (!broadcastId || !firestore) return null;
    return doc(firestore, 'broadcasts', broadcastId);
  }, [broadcastId, firestore]);
  
  const { data: broadcastData } = useDoc<BroadcastData>(broadcastDocRef);

  // Real-time chat messages
   const messagesQuery = useMemoFirebase(() => {
    if (!broadcastId || !firestore) return null;
    return query(
        collection(firestore, `broadcasts/${broadcastId}/messages`),
        orderBy('timestamp', 'asc'),
        limit(100)
    );
  }, [broadcastId, firestore]);
  const { data: comments } = useCollection<Comment>(messagesQuery);

  // --- Custom Hooks for Logic Encapsulation ---
  const { 
    isVideoEnabled, isMicEnabled, isScreenSharing, handleToggleVideo, 
    handleToggleMic, handleFlipCamera, handleToggleScreenShare, handleEndStream, handleInviteGuest 
  } = useStreamControls(call, broadcastDocRef);

  const {
    stagedChallenge, showChallengeCoverCard, isChallengeVisible, isTimerFinished,
    handleChallengeSelect, handleStartStagedChallenge, handleCancelStagedChallenge,
    handleGenerateNextChallenge, setIsChallengeVisible
  } = useGameFlow(broadcastDocRef, broadcastData);

  const {
    cardPosition, cardSize, isDragging, handleMouseDown, handleTouchStart, 
    handleTouchMove, handleTouchEnd, handleResizeStop, setCardSize
  } = useChallengeCard(broadcastDocRef, broadcastData?.challengeCardPosition, broadcastData?.challengeCardSize);

  // This effect automatically enables the camera once the call is joined with high-quality settings.
  useEffect(() => {
    if (callingState === CallingState.JOINED && call && call.camera) {
      const highQualityConstraints = {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 },
      };
      call.camera.enable(highQualityConstraints);
    }
  }, [callingState, call]);

  const handleReaction = (emoji: React.ReactNode) => {
    const newReaction: Reaction = {
        id: Date.now() + Math.random(),
        emoji: emoji,
        x: Math.random() * 80 + 10,
    };
    setReactions(prev => [...prev, newReaction]);
    setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== newReaction.id));
    }, 5000);
  };
  
  if (!broadcastData) {
     return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-900">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
  }

  return (
    <div className="relative h-screen w-full bg-black text-white overflow-hidden">
        
        <VideoPlayer 
            broadcast={broadcastData} 
            isHost={true} 
        />

        <FloatingReactions reactions={reactions} />

        <StreamHeader
            broadcastData={broadcastData}
            viewerCount={viewerCount}
            onEndStream={handleEndStream}
        />
        
        <GameFlowManager
            showCoverCard={showChallengeCoverCard}
            onStart={handleStartStagedChallenge}
            onCancel={handleCancelStagedChallenge}
        />
        
        <ChallengeCardManager
            isVisible={isChallengeVisible}
            broadcastData={broadcastData}
            isTimerFinished={isTimerFinished}
            cardPosition={cardPosition}
            cardSize={cardSize}
            isDragging={isDragging}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onResizeStop={onResizeStop}
            onSetCardSize={setCardSize}
            onGenerateNextChallenge={handleGenerateNextChallenge}
            broadcastDocRef={broadcastDocRef}
        />

        <StreamControls 
            onToggleVideo={handleToggleVideo}
            onToggleMic={handleToggleMic}
            onFlipCamera={handleFlipCamera}
            onToggleScreenShare={handleToggleScreenShare}
            onInviteGuest={handleInviteGuest}
            onToggleChallengeVisibility={() => setIsChallengeVisible(prev => !prev)}
            isChallengeActive={!!broadcastData.activeChallenge}
            isVideoEnabled={isVideoEnabled}
            isMicEnabled={isMicEnabled}
            isScreenSharing={isScreenSharing}
            onOpenGames={() => setIsGamePanelOpen(true)}
        />
        
        <InStreamGamesPanel 
            onSelectChallenge={handleChallengeSelect} 
            open={isGamePanelOpen} 
            onOpenChange={setIsGamePanelOpen} 
        />

        <ChatPanel 
            broadcastId={broadcastId}
            comments={comments}
            onReaction={handleReaction}
        />
    </div>
  );
}

// --- Wrapper Component for Initialization and Auth ---
function AgoraTestWrapper() {
    const searchParams = useSearchParams();
    const broadcastId = searchParams.get('id');
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();
    const router = useRouter();

    const [client, setClient] = useState<StreamVideoClient | null>(null);
    const [call, setCall] = useState<Call | null>(null);
    
    const firestore = useFirestore();
    const broadcastDocRef = useMemoFirebase(() => {
        if (!broadcastId || !firestore) return null;
        return doc(firestore, 'broadcasts', broadcastId);
    }, [broadcastId, firestore]);
    const { data: broadcastData, isLoading: isBroadcastLoading } = useDoc<BroadcastData>(broadcastDocRef);

    // Camera permission check
    useEffect(() => {
        const getCameraPermission = async () => {
          try {
            await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          } catch (error) {
            console.error('Error accessing media devices:', error);
            toast({
              variant: 'destructive',
              title: 'Media Access Denied',
              description: 'Please enable camera and microphone permissions in your browser settings to go live.',
            });
          }
        };
        getCameraPermission();
      }, [toast]);

    // Auth check
    useEffect(() => {
        if (isUserLoading || isBroadcastLoading) return;
        
        if (!user) {
            router.push('/login');
            return;
        }

        if (broadcastData && broadcastData.hostId !== user.uid) {
            toast({
                title: 'Unauthorized',
                description: "You are not the host of this stream.",
                variant: 'destructive',
            });
            router.push('/');
        }

    }, [user, isUserLoading, broadcastData, isBroadcastLoading, router, toast]);

    // Stream Client initialization
    useEffect(() => {
        if (!user || !broadcastId || client) return;

        let videoClient: StreamVideoClient;
        const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || '';

        const initStream = async () => {
            if (!apiKey) {
                toast({ variant: 'destructive', title: 'Stream API Key is missing.' });
                return;
            }

            try {
                const response = await fetch('/api/stream/token', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: user.uid }),
                });
                if (!response.ok) throw new Error('Failed to fetch stream token');
                
                const { token } = await response.json();
                
                videoClient = new StreamVideoClient({
                    apiKey,
                    user: {
                        id: user.uid,
                        name: user.displayName || 'Anonymous',
                        image: user.photoURL || undefined,
                    },
                    token,
                });

                setClient(videoClient);
                const callInstance = videoClient.call('livestream', broadcastId);
                await callInstance.join({ create: true });
                setCall(callInstance);

            } catch (error: any) {
                console.error("Stream initialization failed:", error);
                toast({ variant: 'destructive', title: 'Connection Failed', description: error.message || 'Could not connect to the broadcast.'});
            }
        };
        
        initStream();

        return () => {
            if (call) {
                call.leave().catch(err => console.error("Failed to leave call on cleanup", err));
            }
            if (client) {
                client.disconnectUser().catch(err => console.error("Failed to disconnect user on cleanup", err));
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [broadcastId, user, client]);

    // --- MASTER LOADING GATE ---
    // This gate ensures all necessary data is loaded before rendering the UI.
    if (isUserLoading || isBroadcastLoading || !broadcastData || !client || !call) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading Your Studio...</p>
            </div>
        );
    }

    return (
        <StreamVideo client={client}>
            <StreamCall call={call}>
                <AgoraTestPageUI />
            </StreamCall>
        </StreamVideo>
    )
}

// --- Default Export with Suspense ---
export default function AgoraTestPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <AgoraTestWrapper />
        </Suspense>
    )
}

    