'use client';

import type { Broadcast } from '@/lib/data';
import {
  useCallStateHooks,
  ParticipantView,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface VideoPlayerProps {
  broadcast: Broadcast;
  isHost: boolean;
  isMuted?: boolean;
}


export default function VideoPlayer({ 
    broadcast, 
    isHost,
    isMuted
}: VideoPlayerProps) {
    const { useCallCallingState, useParticipants } = useCallStateHooks();
    const callingState = useCallCallingState();
    const participants = useParticipants(); 

    // For the host, the participant to display is the first one in the list (themselves).
    // For viewers, it's the participant whose ID matches the host's ID from the broadcast data.
    const participantToDisplay = isHost
      ? participants[0]
      : participants.find((p) => p.userId === broadcast.user.id);
      
    useEffect(() => {
        const videoElement = document.querySelector(`[data-broadcast-id='${broadcast.id}'] video`);
        if (videoElement instanceof HTMLVideoElement) {
          videoElement.muted = !!isMuted;
        }
    }, [isMuted, broadcast.id]);
    
    if (callingState !== 'joined') {
        return <div className="absolute inset-0 flex items-center justify-center bg-black/50"><p className="text-white text-lg">Connecting to Stream...</p></div>;
    }
    
    if (!participantToDisplay) {
         return <div className="absolute inset-0 flex items-center justify-center bg-black/50"><p className="text-white text-lg">{isHost ? "Ready to stream" : "Waiting for host..."}</p></div>;
    }

    return (
      <div className={cn(
        "absolute inset-0 w-full h-full bg-black"
      )}>
        <ParticipantView 
          participant={participantToDisplay} 
          ParticipantViewUI={null}
          className="w-full h-full"
        />
    </div>
  );
}
