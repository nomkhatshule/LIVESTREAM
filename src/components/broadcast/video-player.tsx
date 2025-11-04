
'use client';

import {
  Call,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  useCall,
  useCallStateHooks,
  ParticipantView,
} from '@stream-io/video-react-sdk';
import { useUser } from '@/firebase';
import type { BroadcastData } from '@/lib/types';
import { useEffect, useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';

interface VideoPlayerProps {
  broadcast: BroadcastData;
  isHost?: boolean;
}

function HostVideoPlayer({ broadcast }: { broadcast: BroadcastData }) {
    const call = useCall();
    const { useParticipant, useScreenShareState, useCameraState } = useCallStateHooks();
    
    // Find the host participant from the call state
    const participant = call?.state.participants.find(p => p.userId === broadcast.hostId);
    
    // Get camera and screen share states for the host participant
    const { camera, isCameraEnabled } = useCameraState(participant);
    const { screenShareStream, isScreenSharing } = useScreenShareState(participant);

    // --- NEW LOGIC TO FIX BLANK SCREEN ---
    // Explicitly enable the camera when the component mounts and the camera is available.
    useEffect(() => {
        if (camera && !isCameraEnabled) {
            camera.enable();
        }
    }, [camera, isCameraEnabled]);
    // --- END OF NEW LOGIC ---

    if (!participant) {
        return (
            <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <p className="ml-2 text-white">Waiting for host to connect...</p>
            </div>
        );
    }
    
    return (
        <div className="absolute inset-0 w-full h-full bg-black">
            {/* 
              This is the fully custom component. 
              We pass the participant and override the default UI rendering `null`.
              The video is handled by the SDK through the parent ParticipantView.
            */}
            <ParticipantView participant={participant} ParticipantViewUI={null} />

             {/* Show an avatar as a fallback if the camera is off and not screen sharing */}
             {!isCameraEnabled && !isScreenSharing && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 gap-4">
                     <Avatar className="h-24 w-24">
                        <AvatarImage src={broadcast.hostAvatar} />
                        <AvatarFallback>{broadcast.hostName?.charAt(0) || 'H'}</AvatarFallback>
                    </Avatar>
                    <p className="text-white text-lg">Camera is off</p>
                </div>
            )}
        </div>
    )
}

function ViewerVideoPlayer({ broadcast }: { broadcast: BroadcastData }) {
  const { user } = useUser();
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !broadcast?.id || client) return;

    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    if (!apiKey) {
      console.error('Stream API key is missing.');
      return;
    }

    let videoClient: StreamVideoClient;

    const initClient = async () => {
      try {
        const response = await fetch('/api/stream/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid }),
        });
        if (!response.ok) throw new Error('Failed to get stream token');

        const { token } = await response.json();

        videoClient = new StreamVideoClient({
          apiKey,
          user: {
            id: user.uid,
            name: user.displayName || 'Viewer',
            image: user.photoURL || undefined,
          },
          token,
        });
        setClient(videoClient);
        
        const callInstance = videoClient.call('livestream', broadcast.id);
        
        await callInstance.join();

        setCall(callInstance);

      } catch (error) {
        console.error('Failed to init Stream client', error);
        toast({
          title: 'Connection Error',
          description: 'Could not connect to the video service.',
          variant: 'destructive',
        });
      }
    };

    initClient();

    return () => {
      if (call) {
        call.leave().catch(err => console.error("Failed to leave call on cleanup", err));
      }
      if (videoClient) {
        videoClient.disconnectUser().catch(err => console.error("Failed to disconnect user on cleanup", err));
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, broadcast?.id, toast]);

  if (!client || !call) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <ViewerStreamContent broadcast={broadcast} />
      </StreamCall>
    </StreamVideo>
  );
}


function ViewerStreamContent({ broadcast }: { broadcast: BroadcastData }) {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const hostParticipant = participants.find(p => p.userId === broadcast.hostId);

  if (!hostParticipant) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
        <p className="text-white text-lg">Waiting for host...</p>
      </div>
    );
  }
  
  const { isCameraEnabled } = useCallStateHooks().useCameraState(hostParticipant);

  return (
      <div className="w-full h-full relative">
          <ParticipantView participant={hostParticipant} ParticipantViewUI={null} />
          {!isCameraEnabled && (
             <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-zinc-900 gap-4">
                 <Avatar className="h-24 w-24">
                    <AvatarImage src={broadcast.hostAvatar} />
                    <AvatarFallback>{broadcast.hostName?.charAt(0) || 'H'}</AvatarFallback>
                </Avatar>
                <p className="text-white text-lg">Host's camera is off</p>
            </div>
          )}
      </div>
  )
}

export default function VideoPlayer({ broadcast, isHost = false }: VideoPlayerProps) {
    if (isHost) {
        return <HostVideoPlayer broadcast={broadcast} />;
    } else {
        return <ViewerVideoPlayer broadcast={broadcast} />;
    }
}
