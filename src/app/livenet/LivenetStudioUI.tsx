'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useDoc, useFirestore, useMemoFirebase, useUserDocument, useStorage, updateDocumentNonBlocking } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, query, orderBy, limit, collection, serverTimestamp } from 'firebase/firestore';
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
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import ChatPanel from '@/components/livenet/ChatPanel';


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
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [isFlippingCamera, setIsFlippingCamera] = useState(false);

  // Stream SDK Hooks
  const { useParticipants, useCallCallingState, useCameraState, useMicrophoneState, useScreenShareState } = useCallStateHooks();
  const participants = useParticipants();
  const callingState = useCallCallingState();
  // `isMute` is the live on/off state from the Stream SDK (true = off).
  const { isMute: isCameraMuted } = useCameraState();
  const { isMute: isMicMuted } = useMicrophoneState();
  const { isMute: isScreenShareOff } = useScreenShareState();
  const isScreenSharing = !isScreenShareOff;

  const viewerCount = Math.max(0, participants.length -1); // Exclude the host
  const isCallJoined = callingState === CallingState.JOINED;
  const isVideoEnabled = !isCameraMuted;
  const isMicEnabled = !isMicMuted;

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
             updateDocumentNonBlocking(broadcastDocRef, { viewerCount: viewerCount });
        }
    }
  }, [viewerCount, broadcastDocRef, isCallJoined, broadcastData?.viewerCount]);

  // Real-time chat messages
   const messagesQuery = useMemoFirebase(() => {
    if (!broadcastId || !firestore) return null;
    return query(
        collection(firestore, `broadcasts/${broadcastId}/messages`),
        orderBy('timestamp', 'desc'), // newest 100 (with 'asc' the host stopped
        limit(100)                    // seeing new comments after message 100)
    );
  }, [broadcastId, firestore]);
  const { data: latestComments } = useCollection<Comment>(messagesQuery);
  // Show oldest-to-newest in the chat panel.
  const comments = useMemo(() => (latestComments ? [...latestComments].reverse() : null), [latestComments]);

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

  const handleToggleScreenShare = async () => {
    if (!call || !call.screenShare) return;
    const nextIsScreenSharing = !isScreenSharing;
    try {
        await call.screenShare.toggle();
        if (broadcastDocRef) {
            updateDocumentNonBlocking(broadcastDocRef, { 'streamDetails.isScreenSharing': nextIsScreenSharing });
        }
    } catch (error) {
        console.error('Error toggling screen share:', error);
        toast({
            variant: 'destructive',
            title: 'Screen Share Failed',
            description: 'Could not change screen sharing state.',
        });
        if (broadcastDocRef) {
            updateDocumentNonBlocking(broadcastDocRef, { 'streamDetails.isScreenSharing': isScreenSharing }); // Revert on error
        }
    }
  };

  const handleEndStream = () => {
    // Client-side attempt to end the stream. The webhook is the source of truth.
    if (broadcastDocRef) {
        // This now happens in the background without blocking navigation
        updateDocumentNonBlocking(broadcastDocRef, { isLive: false });
    }
    // We navigate away, and the unmount of the LivenetWrapper component will handle leaving the call.
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

  const handleSendMessage = async (message: string, attachment: GiphyResult | { file: File, url: string } | null) => {
    if ((message.trim() === '' && !attachment) || !user || !broadcastId || !userDocument) return;

    let messageAttachment: Comment['attachment'] | null = null;
    
    try {
        if (attachment) {
            if ('file' in attachment) { // Image attachment
                const imageFile = attachment.file;
                const filePath = `chat_images/${broadcastId}/${user.uid}/${Date.now()}-${imageFile.name}`;
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
        </StreamHeader>

        <StreamControls 
            onToggleVideo={handleToggleVideo}
            onToggleMic={handleToggleMic}
            onFlipCamera={handleFlipCamera}
            isVideoEnabled={isVideoEnabled}
            isMicEnabled={isMicEnabled}
            isCallJoined={isCallJoined}
            viewerCount={viewerCount}
            participants={participants}
            isFlippingCamera={isFlippingCamera}
        />

        <div className="absolute bottom-0 left-0 p-4 pb-4 md:pb-2 w-full md:w-96 flex flex-col justify-end max-h-[50%] pointer-events-none">

          <ChatPanel 
              comments={comments}
              isVisible={isChatVisible}
              onSendMessage={handleSendMessage}
              onReaction={handleReaction}
          />
        </div>
    </div>
  );
}

export default LivenetStudioUI;
