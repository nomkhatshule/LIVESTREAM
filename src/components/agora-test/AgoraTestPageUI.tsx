
'use client';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
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
import { useGameFlow } from '@/hooks/useGameFlow';
import { useChallengeCard } from '@/hooks/useChallengeCard';
import { useStreamControls } from '@/hooks/useStreamControls';


export default function AgoraTestPageUI() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const broadcastId = searchParams.get('id');
  const firestore = useFirestore();
  const call = useCall();
  
  const { user } = useUser();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [isGamePanelOpen, setIsGamePanelOpen] = useState(false);

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

  // Custom Hooks for managing complex logic
  const { isVideoEnabled, isMicEnabled, isScreenSharing, handleToggleVideo, handleToggleMic, handleToggleScreenShare, handleEndStream, handleInviteGuest } = useStreamControls(call, broadcastDocRef);
  const { showChallengeCoverCard, isChallengeVisible, isTimerFinished, handleChallengeSelect, handleStartStagedChallenge, handleCancelStagedChallenge, handleGenerateNextChallenge, setIsChallengeVisible } = useGameFlow(broadcastDocRef, broadcastData);
  const { cardPosition, cardSize, isDragging, handleMouseDown, handleTouchStart, handleTouchMove, handleTouchEnd, handleResizeStop, setCardSize } = useChallengeCard(broadcastDocRef, broadcastData?.challengeCardPosition, broadcastData?.challengeCardSize);


  // This effect automatically enables the camera once the call is joined with high-quality settings.
  useEffect(() => {
    if (isCallJoined && call && call.camera && !call.camera.isMute) {
      const highQualityConstraints = {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 },
      };
      call.camera.enable(highQualityConstraints);
    }
  }, [isCallJoined, call]);
  
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
        
        {showChallengeCoverCard && (
             <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center p-4 pointer-events-auto">
                 <div className="relative h-[550px] w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center text-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-10 w-10 text-muted-foreground rounded-full hover:bg-black/10"
                        onClick={handleCancelStagedChallenge}
                    >
                        <X className="h-6 w-6" />
                    </Button>
                    <h2 className="text-3xl font-bold text-black font-headline mb-8">Ready for a Challenge?</h2>
                    <Button size="lg" className="w-full" onClick={handleStartStagedChallenge}>
                      Start
                    </Button>
                </div>
            </div>
        )}

        {isChallengeVisible && broadcastData.activeChallenge && broadcastData.activeChallengeType && (
            <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
                style={{
                  transform: `translate(calc(-50% + ${cardPosition.x}px), calc(-50% + ${cardPosition.y}px))`,
                }}
            >
                <Resizable
                    size={cardSize}
                    onResizeStop={handleResizeStop}
                    onResize={(e, direction, ref, d) => {
                        if (typeof cardSize.width === 'number' && typeof cardSize.height === 'number') {
                          setCardSize({
                              width: cardSize.width + d.width,
                              height: cardSize.height + d.height,
                          });
                        }
                    }}
                    minWidth={300}
                    minHeight={400}
                    lockAspectRatio
                    className="relative"
                >
                    <div 
                      className={cn("pointer-events-auto h-full w-full", isDragging ? 'cursor-grabbing' : 'cursor-grab')}
                      onMouseDown={handleMouseDown}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                        <ChallengeDisplayCard 
                            text={broadcastData.activeChallenge}
                            type={broadcastData.activeChallengeType}
                            onClose={() => setIsChallengeVisible(false)}
                            timer={broadcastData.challengeStartTime && broadcastData.challengeDurationSeconds ? (
                                <CountdownTimer 
                                    startTime={broadcastData.challengeStartTime} 
                                    durationSeconds={broadcastData.challengeDurationSeconds} 
                                />
                            ) : null}
                        >
                           <div className="flex w-full gap-2">
                                <Button 
                                    size="lg" 
                                    variant="outline" 
                                    className="w-full bg-black/80 text-white" 
                                    onClick={() => handleGenerateNextChallenge(broadcastData.activeChallengeType!)}
                                >
                                    Skip
                                </Button>
                                {isTimerFinished && (
                                   <Button 
                                        size="lg" 
                                        className="w-full"
                                        onClick={() => handleGenerateNextChallenge(broadcastData.activeChallengeType!)}
                                    >
                                        Continue
                                    </Button>
                                )}
                            </div>
                        </ChallengeDisplayCard>
                    </div>
                </Resizable>
            </div>
        )}

        <StreamControls 
            onToggleVideo={handleToggleVideo}
            onToggleMic={handleToggleMic}
            onToggleScreenShare={handleToggleScreenShare}
            onInviteGuest={handleInviteGuest}
            onToggleChallengeVisibility={() => setIsChallengeVisible(prev => !prev)}
            isChallengeActive={!!broadcastData.activeChallenge}
            isVideoEnabled={isVideoEnabled}
            isMicEnabled={isMicEnabled}
            isScreenSharing={isScreenSharing}
            isCallJoined={isCallJoined}
            onOpenGames={() => setIsGamePanelOpen(true)}
            viewerCount={viewerCount}
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
