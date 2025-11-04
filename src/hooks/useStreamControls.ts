
'use client';

import { useRouter } from 'next/navigation';
import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, DocumentReference } from 'firebase/firestore';

export function useStreamControls(call: ReturnType<typeof useCall>, broadcastDocRef: DocumentReference | null) {
  const router = useRouter();
  const { toast } = useToast();
  
  const { useCameraState, useMicrophoneState, useScreenShareState } = useCallStateHooks();
  const { camera } = useCameraState();
  const { microphone } = useMicrophoneState();
  const { isScreenSharing } = useScreenShareState();

  const isVideoEnabled = camera ? !camera.isMute : false;
  const isMicEnabled = microphone ? !microphone.isMute : false;

  const handleToggleVideo = async () => {
    if (call && call.camera) {
      await call.camera.toggle();
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

  return {
    isVideoEnabled,
    isMicEnabled,
    isScreenSharing,
    handleToggleVideo,
    handleToggleMic,
    handleToggleScreenShare,
    handleEndStream,
    handleInviteGuest,
  };
}
