'use client';

import { useEffect } from 'react';
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

const PlayerUI = ({ 
    broadcast, 
    isHost
}: { 
    broadcast: Broadcast; 
    isHost: boolean;
}) => {
    const { useCallCallingState, useParticipants } = useCallStateHooks();
    const callingState = useCallCallingState();
    const participants = useParticipants();

    // For the host, find the local participant. For viewers, find the host by their ID.
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
        <StreamTheme as="main" className="w-full h-full">
            <ParticipantView participant={participantToDisplay} />
        </StreamTheme>
    );
};


export default function VideoPlayer({ 
    broadcast, 
    isHost,
}: VideoPlayerProps) {
    const { useCameraState, useMicrophoneState } = useCallStateHooks();
    const { camera, isMute: isCameraMute } = useCameraState();
    const { microphone, isMute: isMicrophoneMute } = useMicrophoneState();

    useEffect(() => {
        if(isHost) {
            if (isCameraMute) camera.enable();
            if (isMicrophoneMute) microphone.enable();
        }
    }, [isHost, camera, microphone, isCameraMute, isMicrophoneMute]);

  return (
    <div className="absolute inset-0 w-full h-full bg-black">
        <PlayerUI 
            broadcast={broadcast} 
            isHost={isHost}
        />
    </div>
  );
}
