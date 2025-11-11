
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
import { useStreamPrefetch } from '@/hooks/useStreamPrefetch';

interface VideoPlayerProps {
  broadcast: BroadcastData;
  isHost?: boolean;
  prefetchedClient?: StreamVideoClient | null;
  prefetchedToken?: string | null;
}

function HostVideoPlayer({ broadcast }: { broadcast: BroadcastData }) {
    const call = useCall();
    
    // Find the host participant from the call state
    const participant = call?.state.participants.find(p => p.userId === broadcast.hostId);
    
    // Get camera and screen share states for the host participant
    const { useCameraState, useScreenShareState } = useCallStateHooks();
    const { camera, isCameraEnabled } = useCameraState(participant);
    const { screenShareStream, isScreenSharing } = useScreenShareState(participant);

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
            <ParticipantView 
              participant={participant} 
              ParticipantViewUI={null} 
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />

             {!isCameraEnabled && !isScreenSharing && (
                <div 
                  className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 gap-4"
                  style={{ transform: 'scaleX(-1)' }} // Mirror the fallback UI as well
                >
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

function ViewerVideoPlayer({ broadcast, prefetchedClient, prefetchedToken }: VideoPlayerProps) {
  const { user } = useUser();
  const [client, setClient] = useState<StreamVideoClient | null>(prefetchedClient || null);
  const [call, setCall] = useState<Call | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // If the client is already prefetched, don't re-initialize
    if (client) return;
    if (!user || !broadcast?.id) return;

    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    if (!apiKey) {
      console.error('Stream API key is missing.');
      return;
    }

    let videoClient: StreamVideoClient;

    const initClient = async () => {
      const maxRetries = 5;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const token = prefetchedToken || await (async () => {
              const response = await fetch('/api/stream/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid }),
              });
              if (!response.ok) throw new Error('Failed to get stream token');
              return (await response.json()).token;
          })();

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
          return; // Success, exit the loop
        } catch (error) {
          console.error(`Failed to init Stream client on attempt ${attempt}:`, error);
          if (attempt === maxRetries) {
            toast({
              title: 'Connection Error',
              description: 'Could not connect to the video service after multiple attempts.',
              variant: 'destructive',
            });
          } else {
             // Wait before retrying
             await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
    };

    initClient();

    return () => {
      if (call) {
        call.leave().catch(err => console.error("Failed to leave call on cleanup", err));
      }
      if (videoClient && !prefetchedClient) { // Only disconnect if not prefetched
        videoClient.disconnectUser().catch(err => console.error("Failed to disconnect user on cleanup", err));
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, broadcast?.id, toast, client, prefetchedClient, prefetchedToken]);

  // Use prefetched client for the initial connection
  useEffect(() => {
    if (prefetchedClient && !call) {
      const callInstance = prefetchedClient.call('livestream', broadcast.id);
      callInstance.join().then(() => setCall(callInstance));
    }
  }, [prefetchedClient, broadcast, call]);


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
  
  return (
      <div className="w-full h-full relative">
          <ParticipantView 
            participant={hostParticipant} 
            ParticipantViewUI={null}
            muted={false}
            className="w-full h-full object-cover"
          />
      </div>
  )
}

export default function VideoPlayer({ broadcast, isHost = false, prefetchedClient, prefetchedToken }: VideoPlayerProps) {
    if (isHost) {
        return <HostVideoPlayer broadcast={broadcast} />;
    } else {
        return <ViewerVideoPlayer broadcast={broadcast} prefetchedClient={prefetchedClient} prefetchedToken={prefetchedToken}/>;
    }
}
