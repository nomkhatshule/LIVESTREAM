'use client';

import type { Broadcast } from '@/lib/data';
import {
  StreamTheme,
  useCallStateHooks,
  ParticipantView,
  useParticipantViewContext,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  broadcast: Broadcast;
  isHost: boolean;
  isMuted?: boolean;
}

// A new component that takes direct control of rendering the video element.
const CustomParticipantViewUI = () => {
  const { videoElement } = useParticipantViewContext();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container && videoElement) {
      // Clear any previous video elements
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      // Style the video element directly
      videoElement.className = 'w-full h-full object-cover';
      container.appendChild(videoElement);
    }
  }, [videoElement]);

  return <div ref={containerRef} className="w-full h-full" />;
};


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
        <StreamTheme as="main" className="w-full h-full">
            <ParticipantView 
              participant={participantToDisplay} 
              ParticipantViewUI={CustomParticipantViewUI}
            />
        </StreamTheme>
    </div>
  );
}
