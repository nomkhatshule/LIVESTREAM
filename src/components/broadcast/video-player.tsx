'use client';

import type { Broadcast } from '@/lib/data';
import {
  StreamTheme,
  ParticipantView,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';

interface VideoPlayerProps {
  broadcast: Broadcast;
  isHost: boolean;
}

export default function VideoPlayer({ 
    broadcast, 
    isHost,
}: VideoPlayerProps) {
    const { useCallCallingState, useParticipants } = useCallStateHooks();
    const callingState = useCallCallingState();
    const participants = useParticipants();

    const participantToDisplay = isHost
      ? participants.find((p) => p.isLocal)
      : participants.find((p) => p.userId === broadcast.user.id);

    if (callingState !== 'joined') {
        return <div className="absolute inset-0 flex items-center justify-center bg-black/50"><p className="text-white text-lg">Connecting to Stream...</p></div>;
    }
    
    if (!participantToDisplay) {
         return <div className="absolute inset-0 flex items-center justify-center bg-black/50"><p className="text-white text-lg">{isHost ? "Ready to stream" : "Waiting for host..."}</p></div>;
    }

    return (
      <div className="absolute inset-0 w-full h-full bg-black">
        <StreamTheme as="main" className="w-full h-full">
            <ParticipantView participant={participantToDisplay} />
        </StreamTheme>
    </div>
  );
}
