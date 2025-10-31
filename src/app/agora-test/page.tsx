
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, X, Send, Smile, MessageCircle, Video, Mic, UserPlus, ScreenShare, VideoOff, MicOff, ArrowUp, MessageCircleOff, MonitorUp, Heart, ThumbsUp, Loader2, Dice6, Trophy, Check, Minus, Swords, Undo2, SwitchCamera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Suspense, forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useDoc, useFirestore, useMemoFirebase, useUserDocument } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, updateDoc, collection, query, orderBy, limit, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useCollection } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import {
  Call,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  useCall,
  useCallStateHooks,
  CallingState,
  ParticipantView,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import VideoPlayer from '@/components/broadcast/video-player';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import ChallengeDisplayCard from '@/components/broadcast/ChallengeDisplayCard';
import CountdownTimer from '@/components/broadcast/CountdownTimer';
import StreamHeader from '@/components/agora-test/StreamHeader';
import FloatingReactions from '@/components/agora-test/FloatingReactions';
import InStreamGamesPanel from '@/components/agora-test/InStreamGamesPanel';
import StreamControls from '@/components/agora-test/StreamControls';
import ChatPanel from '@/components/agora-test/ChatPanel';
import type { Reaction, StagedChallenge, BroadcastData, Comment, GiphyResult } from '@/lib/types';
import { generateGamePrompts } from '@/ai/flows/generate-game-prompts';
import { Resizable } from 're-resizable';
import { useStreamControls } from '@/hooks/useStreamControls';
import { useGameFlow } from '@/hooks/useGameFlow';
import { useChallengeCard } from '@/hooks/useChallengeCard';
import GameFlowManager from '@/components/agora-test/GameFlowManager';
import ChallengeCardManager from '@/components/agora-test/ChallengeCardManager';


// --- Main UI Component ---
function AgoraTestPageUI() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const broadcastId = searchParams.get('id');
  const firestore = useFirestore();
  const call = useCall();

  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [isGamePanelOpen, setIsGamePanelOpen] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(true);

  // Stream SDK Hooks
  const { useParticipants, useCallCallingState } = useCallStateHooks();
  const participants = useParticipants();
  const callingState = useCallCallingState();
  
  const viewerCount = Math.max(0, participants.length -1); // Exclude the host
  const isCallJoined = callingState === CallingState.JOINED;

  // Real-time broadcast document
  const broadcastDocRef = useMemoFirebase(() => {
    if (!broadcastId || !firestore) return null;
    return doc(firestore, 'broadcasts', broadcastId);
  }, [broadcastId, firestore]);
  
  const { data: broadcastData, isLoading: isBroadcastLoading } = useDoc<BroadcastData>(broadcastDocRef);
  
  // Custom Hooks for Logic
  const { isVideoEnabled, isMicEnabled, isScreenSharing, handleToggleVideo, handleToggleMic, handleFlipCamera, handleToggleScreenShare, handleEndStream, handleInviteGuest } = useStreamControls(call, broadcastDocRef);
  const { showChallengeCoverCard, isChallengeVisible, isTimerFinished, handleChallengeSelect, handleStartStagedChallenge, handleCancelStagedChallenge, handleGenerateNextChallenge, setIsChallengeVisible } = useGameFlow(broadcastDocRef, broadcastData);
  const { cardPosition, cardSize, isDragging, handleMouseDown, handleTouchStart, handleTouchMove, handleTouchEnd, handleResizeStop, setCardSize } = useChallengeCard(broadcastDocRef, broadcastData?.challengeCardPosition, broadcastData?.challengeCardSize);

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
  }


  if (isBroadcastLoading || !broadcastData) {
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
            onResizeStop={handleResizeStop}
            onSetCardSize={setCardSize}
            onGenerateNextChallenge={handleGenerateNextChallenge}
            broadcastDocRef={broadcastDocRef}
        />

        {/* Right-side container for controls and chat */}
        <div className="absolute right-0 top-0 h-full w-auto md:w-96 flex flex-col items-end justify-between p-2 md:p-4 z-20 pointer-events-none">
            {/* Spacer for desktop */}
            <div className="hidden md:block flex-grow" />

             {/* Combined Controls and Chat for Mobile */}
            <div className="md:hidden flex flex-col items-center gap-2 pointer-events-auto">
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
                    isCallJoined={isCallJoined}
                    onOpenGames={() => setIsGamePanelOpen(true)}
                    isChatVisible={isChatVisible}
                    onToggleChatVisibility={() => setIsChatVisible(prev => !prev)}
                />
                 <div className="w-64">
                    <ChatPanel 
                        broadcastId={broadcastId}
                        isVisible={isChatVisible}
                        comments={comments || []}
                        onReaction={handleReaction}
                        onToggleVisibility={() => setIsChatVisible(prev => !prev)}
                    />
                </div>
            </div>

            <div className="flex-grow flex flex-col justify-end w-full max-w-sm pointer-events-auto">
                {/* Desktop Chat */}
                <div className="hidden md:block">
                     <ChatPanel 
                        broadcastId={broadcastId}
                        isVisible={isChatVisible}
                        comments={comments || []}
                        onReaction={handleReaction}
                        onToggleVisibility={() => setIsChatVisible(prev => !prev)}
                    />
                </div>
            </div>
        </div>

         {/* Desktop Controls */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex">
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
                isCallJoined={isCallJoined}
                onOpenGames={() => setIsGamePanelOpen(true)}
                isChatVisible={isChatVisible}
                onToggleChatVisibility={() => setIsChatVisible(prev => !prev)}
            />
        </div>
        
        <InStreamGamesPanel 
            onSelectChallenge={handleChallengeSelect} 
            open={isGamePanelOpen} 
            onOpenChange={setIsGamePanelOpen} 
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
    
    // Authorization check
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

    if (isUserLoading || isBroadcastLoading || !broadcastId) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading your studio...</p>
            </div>
        );
    }
    
    if (!client || !call) {
         return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Connecting to broadcast channel...</p>
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
