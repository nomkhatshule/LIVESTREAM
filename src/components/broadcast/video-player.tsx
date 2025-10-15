'use client';

import { useEffect, useState } from 'react';
import type { Broadcast } from '@/lib/data';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import {
  Call,
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
  // isScreenSharing?: boolean;
}

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || '';

async function fetchToken(userId: string): Promise<string> {
  const response = await fetch('/api/stream/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    let errorBody: any;
    try {
        const textBody = await response.text();
        console.error("Proxy server error response text:", textBody);
        try {
          errorBody = JSON.parse(textBody);
        } catch {
          throw new Error(`Failed to fetch Stream token. Status: ${response.status} Body: ${textBody}`);
        }
    } catch(e) {
         throw new Error(`Failed to fetch Stream token. Status: ${response.status}`);
    }
    throw new Error(errorBody.details || errorBody.error || 'Failed to fetch Stream token');
  }
  const { token } = await response.json();
  return token;
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

    const hostParticipant = isHost 
      ? participants.find(p => p.isLocal) 
      : participants.find(p => p.userId === broadcast.user.id);

    if (callingState !== CallingState.JOINED) {
        return <div className="absolute inset-0 flex items-center justify-center bg-black/50"><p className="text-white text-lg">Connecting to Stream...</p></div>;
    }
    
    if (!hostParticipant) {
         return <div className="absolute inset-0 flex items-center justify-center bg-black/50"><p className="text-white text-lg">{isHost ? "Ready to stream" : "Waiting for host..."}</p></div>;
    }

    return (
        <StreamTheme as="main" className="w-full h-full">
            <ParticipantView participant={hostParticipant} />
        </StreamTheme>
    );
};


export default function VideoPlayer({ 
    broadcast, 
    isHost,
    isAudioEnabled = true,
    isVideoEnabled = true,
    // isScreenSharing = false,
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
            
            // **THE FIX**: For hosts, automatically enable camera and mic after joining.
            if (isHost) {
                await callInstance.camera.enable();
                await callInstance.microphone.enable();
            }

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
        if (client) { // use videoClient from closure
            client.disconnectUser().catch(err => console.error("Failed to disconnect user on cleanup", err));
        }
    };
  // The dependency array should not include `call` or `client` itself to avoid re-running on call state changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [broadcast.id, isHost, currentUser?.uid, isUserLoading, toast]);

  // Effects for toggling media based on props from LiveStudio
  useEffect(() => {
    if (!call || !isHost) return;
    if (isVideoEnabled) {
      call.camera.enable();
    } else {
      call.camera.disable();
    }
  }, [call, isVideoEnabled, isHost]);

  useEffect(() => {
    if (!call || !isHost) return;
    if (isAudioEnabled) {
      call.microphone.enable();
    } else {
      call.microphone.disable();
    }
  }, [call, isAudioEnabled, isHost]);

  // useEffect(() => {
  //   if (!call || !isHost) return;
  //   const { isPublishing } = call.screenShareState;
  //   if (isScreenSharing && !isPublishing) {
  //     call.startScreenShare();
  //   } else if (!isScreenSharing && isPublishing) {
  //     call.stopScreenShare();
  //   }
  // }, [call, isScreenSharing, isHost]);


  if (!currentUser || isUserLoading) {
     return <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center"><p className="text-white">Authenticating...</p></div>
  }


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
                <PlayerUI 
                    broadcast={broadcast} 
                    isHost={isHost}
                />
            </div>
        </StreamCall>
    </StreamVideo>
  );
}
