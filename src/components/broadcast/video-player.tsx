
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


const PlayerContent = ({ broadcast, isHost, isAudioEnabled, isVideoEnabled, isScreenSharing, call }: { 
    broadcast: Broadcast; 
    isHost: boolean;
    isAudioEnabled?: boolean;
    isVideoEnabled?: boolean;
    isScreenSharing?: boolean;
    call: Call;
}) => {
    const { useCallCallingState, useParticipants, useScreenShareState } = useCallStateHooks();
    const callingState = useCallCallingState();
    const participants = useParticipants();
    const { screenShareState } = useScreenShareState();

    const hostParticipant = participants.find(p => p.userId === broadcast.user.id);
    const participantToDisplay = isHost ? participants.find(p => p.isLocal) : hostParticipant;

    // Effects for toggling media
    useEffect(() => {
        if (call && call.microphone) {
          if (isAudioEnabled) {
            call.microphone.enable();
          } else {
            call.microphone.disable();
          }
        }
    }, [call, isAudioEnabled]);

    useEffect(() => {
        if (call && call.camera) {
          if (isVideoEnabled) {
            call.camera.enable();
          } else {
            call.camera.disable();
          }
        }
    }, [call, isVideoEnabled]);
    
    useEffect(() => {
        if (call) {
            if(isScreenSharing) {
                call.startScreenShare().catch(err => console.error("Failed to publish screen share", err));
            } else {
                // Check if screen sharing is active before trying to stop
                if (screenShareState.isPublishing) {
                    call.stopPublish('screenshare').catch(err => console.error("Failed to stop screen share", err));
                }
            }
        }
    }, [call, isScreenSharing, screenShareState]);


    if (callingState !== CallingState.JOINED) {
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
  // The dependency array should not include `call` itself to avoid re-running on call state changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [broadcast.id, isHost, currentUser?.uid, isUserLoading, toast]);

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
                <PlayerContent 
                    broadcast={broadcast} 
                    isHost={isHost}
                    isAudioEnabled={isAudioEnabled}
                    isVideoEnabled={isVideoEnabled}
                    isScreenSharing={isScreenSharing}
                    call={call}
                />
            </div>
        </StreamCall>
    </StreamVideo>
  );
}
