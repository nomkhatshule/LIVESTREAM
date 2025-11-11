

'use client';

import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useDoc, useFirestore, useMemoFirebase, useUserDocument, useStorage } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, query, orderBy, limit, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useCollection } from '@/firebase';
import {
  Call,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  useCall,
  useCallStateHooks,
  CallingState,
  StreamVideoParticipant,
} from '@stream-io/video-react-sdk';
import VideoPlayer from '@/components/broadcast/video-player';
import StreamHeader from '@/components/livenet/StreamHeader';
import FloatingReactions from '@/components/livenet/FloatingReactions';
import InStreamGamesPanel from '@/components/livenet/InStreamGamesPanel';
import StreamControls from '@/components/livenet/StreamControls';
import type { Reaction, BroadcastData, Comment, GiphyResult } from '@/lib/types';
import { useGameFlow } from '@/hooks/useGameFlow';
import { useChallengeCard } from '@/hooks/useChallengeCard';
import GameFlowManager from './GameFlowManager';
import ChallengeCardManager from './ChallengeCardManager';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import ChatPanel from './ChatPanel';


function LivenetStudioUI() {
  const searchParams = useSearchParams();
  const broadcastId = searchParams.get('id');
  const firestore = useFirestore();
  const storage = useStorage();
  const call = useCall();
  const router = useRouter();
  const { user } = useUser();
  const { userDocument } = useUserDocument();
  const { toast } = useToast();
  
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [isGamePanelOpen, setIsGamePanelOpen] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(true);

  // Stream SDK Hooks
  const { useParticipants, useCallCallingState, useCameraState, useMicrophoneState, useScreenShareState } = useCallStateHooks();
  const participants = useParticipants();
  const callingState = useCallCallingState();
  const { camera } = useCameraState();
  const { microphone } = useMicrophoneState();
  const { isScreenSharing } = useScreenShareState();
  
  const viewerCount = Math.max(0, participants.length -1); // Exclude the host
  const isCallJoined = callingState === CallingState.JOINED;
  const isVideoEnabled = camera ? !camera.isMute : false;
  const isMicEnabled = microphone ? !microphone.isMute : false;

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

  const handleToggleVideo = async () => {
    if (call && call.camera) {
      await call.camera.toggle();
    }
  };

  const handleFlipCamera = async () => {
    if (call && call.camera) {
      try {
        await call.camera.flip();
      } catch (error) {
        console.error('Failed to flip camera:', error);
        toast({
          title: 'Camera flip failed',
          description: 'Could not switch between front and back cameras.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleToggleMic = async () => {
    if (call && call.microphone) {
      await call.microphone.toggle();
    }
  };

  const handleToggleScreenShare = async () => {
    if (!call || !call.screenShare) return;
    const nextIsScreenSharing = !isScreenSharing;
    try {
        await call.screenShare.toggle();
        if (broadcastDocRef) {
            updateDoc(broadcastDocRef, { 'streamDetails.isScreenSharing': nextIsScreenSharing });
        }
    } catch (error) {
        console.error('Error toggling screen share:', error);
        toast({
            variant: 'destructive',
            title: 'Screen Share Failed',
            description: 'Could not change screen sharing state.',
        });
        if (broadcastDocRef) {
            updateDoc(broadcastDocRef, { 'streamDetails.isScreenSharing': isScreenSharing }); // Revert on error
        }
    }
  };

  const handleEndStream = async () => {
    // Client-side attempt to end the stream. The webhook is the source of truth.
    if (broadcastDocRef) {
        await updateDoc(broadcastDocRef, { isLive: false });
    }
    if (call) {
        await call.leave();
    }
    router.push('/');
  };

  const handleInviteGuest = () => {
    toast({
        title: "Guest Link Copied!",
        description: "A unique invite link has been copied to your clipboard.",
    });
  };

  // Custom Hooks for managing complex logic
  const { showChallengeCoverCard, isChallengeVisible, isTimerFinished, handleChallengeSelect, handleStartStagedChallenge, handleCancelStagedChallenge, handleGenerateNextChallenge, setIsChallengeVisible } = useGameFlow(broadcastDocRef, broadcastData);
  const { cardPosition, cardSize, isDragging, handleMouseDown, handleTouchStart, handleTouchMove, handleTouchEnd, handleResizeStop, setCardSize } = useChallengeCard(broadcastDocRef, broadcastData?.challengeCardPosition, broadcastData?.challengeCardSize);
  
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

  const handleSendMessage = async (message: string, attachment: GiphyResult | { file: File, url: string } | null) => {
    if ((message.trim() === '' && !attachment) || !user || !broadcastId || !userDocument) return;

    let messageAttachment: Comment['attachment'] | null = null;
    
    try {
        if (attachment) {
            if ('file' in attachment) { // Image attachment
                const imageFile = attachment.file;
                const filePath = `chat_images/${broadcastId}/${Date.now()}-${imageFile.name}`;
                const fileRef = storageRef(storage, filePath);
                await uploadBytes(fileRef, imageFile);
                const downloadURL = await getDownloadURL(fileRef);
                messageAttachment = {
                    type: 'image',
                    imageUrl: downloadURL,
                };
            } else { // Giphy attachment
                messageAttachment = {
                    type: 'giphy',
                    title: attachment.title,
                    imageUrl: attachment.images.original.url,
                    thumbUrl: attachment.images.fixed_width.url,
                };
            }
        }
        
        let newComment: any = {
          userId: user.uid,
          username: userDocument.username || 'Anonymous',
          userAvatar: userDocument.profilePicture || '',
          message: message,
          timestamp: serverTimestamp(),
        };

        if (messageAttachment) {
            newComment.attachment = messageAttachment;
        }
        
        const mentionMatch = message.match(/^@(\w+)\s/);
        if (mentionMatch) {
          newComment.replyingTo = mentionMatch[1];
        }

        const messagesCollectionRef = collection(firestore, 'broadcasts', broadcastId, 'messages');
        addDocumentNonBlocking(messagesCollectionRef, newComment);

    } catch (error) {
        console.error("Error sending message:", error);
        toast({ title: "Error", description: "Could not send message.", variant: "destructive" });
    }
  };


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
            viewerCount={viewerCount}
            onToggleChat={() => setIsChatVisible(prev => !prev)}
            isChatVisible={isChatVisible}
            participants={participants}
        />
        
        <InStreamGamesPanel 
            onSelectChallenge={handleChallengeSelect} 
            open={isGamePanelOpen} 
            onOpenChange={setIsGamePanelOpen} 
        />

        <ChatPanel 
            comments={comments}
            isVisible={isChatVisible}
            onSendMessage={handleSendMessage}
            onReaction={handleReaction}
        />
    </div>
  );
}

export default LivenetStudioUI;
