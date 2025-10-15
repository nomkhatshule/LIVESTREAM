'use client';

import { useEffect, useState } from 'react';
import type { Broadcast } from '@/lib/data';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import {
  Call,
  CallControls,
  CallParticipantsList,
  CallingState,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  ParticipantView,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';

interface VideoPlayerProps {
  broadcast: Broadcast;
  isHost: boolean;
  isAudioEnabled?: boolean;
  isVideoEnabled?: boolean;
  isScreenSharing?: boolean;
}

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || '';

async function fetchToken(userId: string): Promise<string> {
  const response = await fetch('/api/stream/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(errorBody.error || 'Failed to fetch Stream token');
  }
  const { token } = await response.json();
  return token;
}


const BroadcastContent = ({ broadcast, isHost }: { broadcast: Broadcast; isHost: boolean }) => {
    const { useCallCallingState } = useCallStateHooks();
    const callingState = useCallCallingState();

    if (callingState !== CallingState.JOINED) {
        return <div className="absolute inset-0 flex items-center justify-center bg-black/50"><p className="text-white text-lg">Connecting to Stream...</p></div>;
    }
    
    return (
        <StreamTheme as="main" className="w-full h-full">
            <ParticipantView participant={isHost ? 'local' : broadcast.user.id} />
        </StreamTheme>
    );
};


export default function VideoPlayer({ 
    broadcast, 
    isHost,
    isAudioEnabled = true,
    isVideoEnabled = true,
    isScreenSharing = false,
}: VideoPlayerProps) {
  const { user: currentUser, isUserLoading } = useUser();
  const { toast } = useToast();
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);

  useEffect(() => {
    if (isUserLoading || !currentUser || !broadcast.id) {
        return;
    }

    let videoClient: StreamVideoClient;

    const initStream = async () => {
        if (!apiKey) {
            toast({ variant: 'destructive', title: 'Stream API Key is missing.' });
            return;
        }

        try {
            const token = await fetchToken(currentUser.uid);
            
            videoClient = new StreamVideoClient({
                apiKey,
                user: {
                    id: currentUser.uid,
                    name: currentUser.displayName || 'Anonymous',
                    image: currentUser.photoURL || undefined,
                },
                token,
            });

            setClient(videoClient);

            const callInstance = videoClient.call('livestream', broadcast.id);
            
            // Join the call. For hosts, this creates it. For viewers, it joins.
            await callInstance.join({ create: isHost });
            
            setCall(callInstance);

        } catch (error: any) {
            console.error("Stream initialization failed:", error);
            toast({ variant: 'destructive', title: 'Connection Failed', description: error.message || 'Could not connect to the broadcast.'});
        }
    };
    
    initStream();

    return () => {
        // Cleanup on component unmount
        if (call) {
            call.leave().catch(err => console.error("Failed to leave call on cleanup", err));
        }
        if (videoClient) {
            videoClient.disconnectUser().catch(err => console.error("Failed to disconnect user on cleanup", err));
        }
    };
  }, [broadcast.id, isHost, currentUser?.uid, isUserLoading, toast, call]);

  // Effects for toggling media
  useEffect(() => {
    if (call && call.microphone) {
      call.microphone.setEnabled(isAudioEnabled);
    }
  }, [call, isAudioEnabled]);

  useEffect(() => {
    if (call && call.camera) {
      call.camera.setEnabled(isVideoEnabled);
    }
  }, [call, isVideoEnabled]);
  
  useEffect(() => {
    if (call) {
        if(isScreenSharing) {
            call.publishScreenShare();
        } else {
            call.stopScreenShare();
        }
    }
  }, [call, isScreenSharing])


  if (!client || !call) {
    return (
        <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center">
            <p className="text-white text-lg">Setting up stream...</p>
        </div>
    );
  }

  return (
    <StreamVideo client={client}>
        <StreamCall call={call}>
            <div className="absolute inset-0 w-full h-full bg-black">
                <BroadcastContent broadcast={broadcast} isHost={isHost} />
                {isHost && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                         <CallControls onLeave={() => call.leave()} />
                    </div>
                )}
            </div>
        </StreamCall>
    </StreamVideo>
  );
}
