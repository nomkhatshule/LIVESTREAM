
'use client';

import type { Broadcast } from '@/lib/data';
import {
  StreamTheme,
  ParticipantView,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  broadcast: Broadcast;
  isHost: boolean;
  isMuted?: boolean;
}

// This is now a simplified, "presentational" component.
// Its only job is to display the video for the correct participant.
export default function VideoPlayer({ 
    broadcast, 
    isHost,
    isMuted
}: VideoPlayerProps) {
    const { useCallCallingState, useParticipants } = useCallStateHooks();
    const callingState = useCallCallingState();
    const participants = useParticipants();
    const videoRef = useRef<HTMLVideoElement>(null);

    // Logic to find the correct participant is still needed here, but it's simpler.
    const participantToDisplay = isHost
      ? participants.find((p) => p.isLocal)
      : participants.find((p) => p.userId === broadcast.user.id);
      
    useEffect(() => {
        const videoElement = document.querySelector(`[data-broadcast-id='${broadcast.id}'] video`);
        if (videoElement instanceof HTMLVideoElement) {
          videoElement.muted = !!isMuted;
        }
    }, [isMuted, broadcast.id]);
    
    // This loading state is still relevant, as it waits for the SDK to connect.
    if (callingState !== 'joined') {
        return <div className="absolute inset-0 flex items-center justify-center bg-black/50"><p className="text-white text-lg">Connecting to Stream...</p></div>;
    }
    
    // This fallback is now more reliable. It will show if the host hasn't enabled their camera yet,
    // or if the viewer is waiting for the host to start.
    if (!participantToDisplay) {
         return <div className="absolute inset-0 flex items-center justify-center bg-black/50"><p className="text-white text-lg">{isHost ? "Ready to stream" : "Waiting for host..."}</p></div>;
    }

    return (
      // The container will be hidden until the video is ready to play, preventing a flash of the fallback text.
      <div className={cn(
        "absolute inset-0 w-full h-full bg-black"
      )}>
        {/* StreamTheme can be removed from here if it's applied at a higher level, but it's fine to keep. */}
        <StreamTheme as="main" className="w-full h-full">
            <ParticipantView 
              participant={participantToDisplay} 
              mirrored={isHost} // Host sees a mirror, viewers see the real orientation
            />
        </StreamTheme>
    </div>
  );
}
