
'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc } from 'firebase/firestore';

import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { useGameFlow } from '@/hooks/useGameFlow';
import { useChallengeCard } from '@/hooks/useChallengeCard';

import type { Reaction, BroadcastData } from '@/lib/types';
import { Loader2, Video, Mic, ScreenShare, MicOff, VideoOff, MonitorUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import FloatingReactions from '@/components/agora-test/FloatingReactions';
import StreamHeader from '@/components/agora-test/StreamHeader';
import GameFlowManager from '@/components/agora-test/GameFlowManager';
import ChallengeCardManager from '@/components/agora-test/ChallengeCardManager';
import StreamControls from '@/components/agora-test/StreamControls';
import ChatPanel from '@/components/agora-test/ChatPanel';
import InStreamGamesPanel from '@/components/agora-test/InStreamGamesPanel';
import { useCollection } from '@/firebase';
import { query, collection, orderBy, limit, updateDoc } from 'firebase/firestore';
import type { Comment } from '@/lib/types';

// --- Main UI Component ---
function AgoraTestPageUI() {
  const searchParams = useSearchParams();
  const broadcastId = searchParams.get('id');
  const firestore = useFirestore();

  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [isGamePanelOpen, setIsGamePanelOpen] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(true);

  // --- New state for local media ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  // Real-time broadcast document
  const broadcastDocRef = useMemoFirebase(() => {
    if (!broadcastId || !firestore) return null;
    return doc(firestore, 'broadcasts', broadcastId);
  }, [broadcastId, firestore]);
  
  const { data: broadcastData, isLoading: isBroadcastLoading } = useDoc<BroadcastData>(broadcastDocRef);
  
  // Custom Hooks for Logic
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
  
  // --- Start camera and mic ---
  useEffect(() => {
    async function setupMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setMediaStream(stream);
      } catch (err) {
        console.error("Error accessing media devices.", err);
      }
    }
    setupMedia();

    // Cleanup: stop tracks when component unmounts
    return () => {
        mediaStream?.getTracks().forEach(track => track.stop());
    }
  }, []); // Run only once

  const handleToggleVideo = () => {
    mediaStream?.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsVideoEnabled(track.enabled);
    });
  };

  const handleToggleMic = () => {
      mediaStream?.getAudioTracks().forEach(track => {
          track.enabled = !track.enabled;
          setIsMicEnabled(track.enabled);
      });
  };

  const handleEndStream = async () => {
    mediaStream?.getTracks().forEach(track => track.stop());
    if (broadcastDocRef) {
      await updateDoc(broadcastDocRef, { isLive: false });
    }
    router.push('/');
  };

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

  // Placeholder for router - in a real app this would come from next/navigation
  const router = { push: (path: string) => console.log(`Navigating to ${path}`) };


  if (isBroadcastLoading || !broadcastData) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-gray-900">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      )
  }

  return (
    <div className="relative h-screen w-full bg-black text-white overflow-hidden">
        {/* Local Video Preview */}
        <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />

        <FloatingReactions reactions={reactions} />

        <StreamHeader
            broadcastData={broadcastData}
            viewerCount={0} // Viewer count would come from a different source now
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
            onTouchMove={onTouchMove}
            onTouchEnd={handleTouchEnd}
            onResizeStop={handleResizeStop}
            onSetCardSize={setCardSize}
            onGenerateNextChallenge={handleGenerateNextChallenge}
            broadcastDocRef={broadcastDocRef}
        />

        <div className="absolute right-0 top-0 h-full w-auto md:w-96 flex flex-col items-end justify-end p-2 md:p-4 z-20 pointer-events-none">
            <div className="hidden md:block flex-grow" />
            <div className="flex-grow flex flex-col justify-end w-full max-w-sm pointer-events-auto">
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

        <div className="absolute bottom-4 left-4 right-4 z-20 flex items-end gap-2 md:hidden">
            <div className="w-full">
                <ChatPanel 
                    broadcastId={broadcastId}
                    isVisible={isChatVisible}
                    comments={comments || []}
                    onReaction={handleReaction}
                    onToggleVisibility={() => setIsChatVisible(prev => !prev)}
                />
            </div>
        </div>

        <div className="absolute right-4 top-1/3 -translate-y-1/3 z-20 flex">
             <StreamControls 
                onToggleVideo={handleToggleVideo}
                onToggleMic={handleToggleMic}
                onFlipCamera={() => {}} // Flipping camera needs more complex logic with MediaDevices
                onToggleScreenShare={() => {}} // Screenshare to be implemented
                onInviteGuest={() => {}}
                onToggleChallengeVisibility={() => setIsChallengeVisible(prev => !prev)}
                isChallengeActive={!!broadcastData.activeChallenge}
                isVideoEnabled={isVideoEnabled}
                isMicEnabled={isMicEnabled}
                isScreenSharing={false} // Placeholder
                isCallJoined={!!mediaStream} // Consider stream as "joined"
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
    const streamKey = searchParams.get('streamKey');
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();
    const router = useRouter();

    const firestore = useFirestore();
    const broadcastDocRef = useMemoFirebase(() => {
        if (!broadcastId || !firestore) return null;
        return doc(firestore, 'broadcasts', broadcastId);
    }, [broadcastId, firestore]);
    const { data: broadcastData, isLoading: isBroadcastLoading } = useDoc<BroadcastData>(broadcastDocRef);

    useEffect(() => {
        if (isUserLoading || isBroadcastLoading) return;
        
        if (!user) {
            router.push('/login');
            return;
        }

        if (!streamKey) {
            toast({
                title: 'Missing Stream Key',
                description: "Cannot start the broadcast without a stream key.",
                variant: 'destructive',
            });
            router.push('/');
        }

        if (broadcastData && broadcastData.hostId !== user.uid) {
            toast({
                title: 'Unauthorized',
                description: "You are not the host of this stream.",
                variant: 'destructive',
            });
            router.push('/');
        }

    }, [user, isUserLoading, broadcastData, isBroadcastLoading, router, toast, streamKey]);


    if (isUserLoading || isBroadcastLoading || !broadcastId) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading your studio...</p>
            </div>
        );
    }
    
    return <AgoraTestPageUI />;
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
