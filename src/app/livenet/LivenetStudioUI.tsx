'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useDoc, useFirestore, useMemoFirebase, useUserDocument, useStorage } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, query, orderBy, limit, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useCollection } from '@/firebase';
import {
  useCall,
  useCallStateHooks,
  CallingState,
} from '@stream-io/video-react-sdk';
import VideoPlayer from '@/components/broadcast/video-player';
import StreamHeader from '@/components/livenet/StreamHeader';
import FloatingReactions from '@/components/livenet/FloatingReactions';
import StreamControls from '@/components/livenet/StreamControls';
import type { Reaction, BroadcastData, Comment, GiphyResult } from '@/lib/types';
import { useGameFlow } from '@/hooks/useGameFlow';
import { useChallengeCard } from '@/hooks/useChallengeCard';
import GameFlowManager from '@/components/livenet/GameFlowManager';
import ChallengeCardManager from '@/components/livenet/ChallengeCardManager';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import ChatPanel from '@/components/livenet/ChatPanel';
import StreamTimer from './StreamTimer';


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
  const [isFlippingCamera, setIsFlippingCamera] = useState(false);

  // Stream SDK Hooks
  const { useParticipants, useCallCallingState, useCameraState, useMicrophoneState } = useCallStateHooks();
  const participants = useParticipants();
  const callingState = useCallCallingState();
  const { camera } = useCameraState();
  const { microphone } = useMicrophoneState();
  
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
  
  // Effect to update the viewer count in Firestore whenever it changes
  useEffect(() => {
    if (broadcastDocRef && isCallJoined) {
        // We only update if the new viewerCount is different from what's in Firestore
        // to avoid unnecessary writes.
        if (broadcastData?.viewerCount !== viewerCount) {
             updateDoc(broadcastDocRef, { viewerCount: viewerCount });
        }
    }
  }, [viewerCount, broadcastDocRef, isCallJoined, broadcastData?.viewerCount]);

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
    if (isFlippingCamera || !call || !call.camera) return;
    setIsFlippingCamera(true);
    try {
        await call.camera.flip();
    } catch (error: any) {
        console.error("Error flipping camera:", error);
        toast({
            variant: "destructive",
            title: "Camera Flip Failed",
            description: error.message || "Could not switch cameras. Please try again."
        });
    } finally {
        setIsFlippingCamera(false);
    }
  };

  const handleToggleMic = async () => {
    if (call && call.microphone) {
      await call.microphone.toggle();
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

  // Custom Hooks for managing complex logic
  const { showChallengeCoverCard, isChallengeVisible, isTimerFinished, handleStartStagedChallenge, handleCancelStagedChallenge, handleCompleteChallenge, setIsChallengeVisible } = useGameFlow(broadcastDocRef, broadcastData);
  const { cardPosition, cardSize, handleDrag, handleDragStop, handleResizeStop, setCardSize } = useChallengeCard(broadcastDocRef, broadcastData?.challengeCardPosition, broadcastData?.challengeCardSize);
  
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
        
        const newComment: any = {
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
        >
            {broadcastData.streamStartedAt && (
                <StreamTimer 
                    startTime={broadcastData.streamStartedAt}
                    durationSeconds={300} // 5 minutes
                    onTimerEnd={handleEndStream}
                />
            )}
        </StreamHeader>
        
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
            onDrag={handleDrag}
            onDragStop={handleDragStop}
            onResizeStop={onResizeStop}
            onSetCardSize={setCardSize}
            onCompleteChallenge={handleCompleteChallenge}
            broadcastDocRef={broadcastDocRef}
        />

        <StreamControls 
            onToggleVideo={handleToggleVideo}
            onToggleMic={handleToggleMic}
            onFlipCamera={handleFlipCamera}
            onToggleChallengeVisibility={() => setIsChallengeVisible(prev => !prev)}
            isChallengeActive={!!broadcastData.activeChallenge}
            isVideoEnabled={isVideoEnabled}
            isMicEnabled={isMicEnabled}
            isCallJoined={isCallJoined}
            viewerCount={viewerCount}
            participants={participants}
            isFlippingCamera={isFlippingCamera}
        />

        <ChatPanel 
            comments={comments}
            isVisible={true}
            onSendMessage={handleSendMessage}
            onReaction={handleReaction}
        />
    </div>
  );
}

export default LivenetStudioUI;
