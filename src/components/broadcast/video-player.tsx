
'use client';

import type { Broadcast } from '@/lib/data';
import {
  StreamTheme,
  useCallStateHooks,
  Video,
  Audio,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { Participant } from '@stream-io/video-client';

interface VideoPlayerProps {
  broadcast: Broadcast;
  isHost: boolean;
  isMuted?: boolean;
}

/**
 * A custom view using component composition to have full control
 * over the rendered video, without default SDK overlays.
 */
function CustomParticipantView({ participant, isHost }: { participant: Participant, isHost: boolean }) {
    return (
        <>
            <Audio participant={participant} />
            <Video 
                participant={participant}
                mirrored={isHost}
                className="w-full h-full object-cover"
            />
        </>
    )
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
    
    // **SOLUTION IMPLEMENTED HERE**
    // Render a waiting message if the participant we want to display isn't available
    // OR if their camera track hasn't been published yet.
    if (!participantToDisplay || !participantToDisplay.isCameraEnabled) {
         return <div className="absolute inset-0 flex items-center justify-center bg-black/50"><p className="text-white text-lg">{isHost ? "Ready to stream" : "Waiting for host..."}</p></div>;
    }

    return (
      <div className={cn(
        "absolute inset-0 w-full h-full bg-black"
      )}>
        <StreamTheme as="main" className="w-full h-full">
            <CustomParticipantView participant={participantToDisplay} isHost={isHost} />
        </StreamTheme>
    </div>
  );
}
