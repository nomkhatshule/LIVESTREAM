

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
import ChatPanel from '@/components/livenet/ChatPanel';
import type { Reaction, BroadcastData, Comment, GiphyResult } from '@/lib/types';
import { useGameFlow } from '@/hooks/useGameFlow';
import { useChallengeCard } from '@/hooks/useChallengeCard';
import GameFlowManager from './GameFlowManager';
import ChallengeCardManager from './ChallengeCardManager';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';


function LivenetPageUI() {
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
    if (call) {
        await call.leave();
    }
    if (broadcastDocRef) {
        await updateDoc(broadcastDocRef, { isLive: false, activeChallenge: null, activeChallengeType: null });
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

// --- Wrapper Component for Initialization and Auth ---
function LivenetWrapper() {
    const searchParams = useSearchParams();
    const broadcastId = searchParams.get('id');
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const [client, setClient] = useState<StreamVideoClient | null>(null);
    const [call, setCall] = useState<Call | null>(null);
    
    // Auth check
    useEffect(() => {
        if (!isUserLoading && !user) {
            toast({
                title: 'Authentication Required',
                description: "You must be logged in to access the live studio.",
                variant: 'destructive',
            });
            router.push('/login');
        }
    }, [user, isUserLoading, router, toast]);

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
                // The broadcast document should have been created by the /broadcast/create page.
                // Now, we connect to it.
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
                
                // Join the call. The `create` flag is a fallback.
                await callInstance.join({ create: true });

                // Once successfully joined, mark the broadcast as 'isLive' in Firestore.
                // This makes it appear on the feed for other users.
                const broadcastDocRef = doc(firestore, 'broadcasts', broadcastId);
                await updateDoc(broadcastDocRef, { isLive: true });
                
                setCall(callInstance);

            } catch (error: any) {
                console.error("Stream initialization failed:", error);
                toast({ variant: 'destructive', title: 'Connection Failed', description: error.message || 'Could not connect to the broadcast.'});
                // If connection fails, maybe route back home
                router.push('/');
            }
        };
        
        initStream();

        return () => {
            // Cleanup logic when the component unmounts
            if (call) {
                call.leave().catch(err => console.error("Failed to leave call on cleanup", err));
            }
            if (client) {
                client.disconnectUser().catch(err => console.error("Failed to disconnect user on cleanup", err));
            }
        };
    // Corrected dependency array
    }, [broadcastId, user, firestore, toast, router]);

    if (isUserLoading || !broadcastId) {
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
                <LivenetPageUI />
            </StreamCall>
        </StreamVideo>
    )
}

// --- Default Export with Suspense ---
export default function LivenetPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <LivenetWrapper />
        </Suspense>
    )
}
