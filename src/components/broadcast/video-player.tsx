
'use client';

import {
  Call,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  ParticipantView,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { useUser } from '@/firebase';
import type { BroadcastData } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  broadcast: BroadcastData;
  isHost?: boolean;
}

function HostVideoPlayer({ broadcast }: { broadcast: BroadcastData }) {
    const call = useCall();
    const { useCameraState, useScreenShareState } = useCallStateHooks();
    
    // Correctly get the participant from the call state
    const participant = call?.state.participants.find(p => p.userId === broadcast.hostId);
    
    // Correctly use the hooks by getting the state values from useCallStateHooks
    const { isSpeaking } = useCallStateHooks(call, participant);
    const isCameraOn = participant?.isCameraEnabled;

    const { isScreenSharing } = useScreenShareState();

    if (isScreenSharing) {
        return (
            <div className="absolute inset-0 w-full h-full bg-black">
                <ParticipantView participant={broadcast.hostId} trackType='screenShareTrack' />
            </div>
        );
    }

    return (
        <div className="absolute inset-0 w-full h-full bg-black">
            <ParticipantView 
                participant={broadcast.hostId} 
                className={cn(isSpeaking && 'ring-4 ring-primary rounded-lg', !isCameraOn && 'hidden')}
            />
             {!isCameraOn && (
                <div className="w-full h-full flex items-center justify-center bg-zinc-900">
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
         <div className="absolute inset-0 w-full h-full bg-black">
            <ParticipantView participant={broadcast.hostId} />
         </div>
      </StreamCall>
    </StreamVideo>
  );
}


export default function VideoPlayer({ broadcast, isHost = false }: VideoPlayerProps) {
    if (isHost) {
        return <HostVideoPlayer broadcast={broadcast} />;
    } else {
        return <ViewerVideoPlayer broadcast={broadcast} />;
    }
}
