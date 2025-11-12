
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
    const { isScreenSharing } = useScreenShareState(participant);

    // Determine if the video should be mirrored. Front camera ('user') should be mirrored.
    const isMirrored = camera?.facingMode === 'user';

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
              style={{ transform: isMirrored ? 'scaleX(-1)' : 'scaleX(1)' }}
            />

             {!isCameraEnabled && !isScreenSharing && (
                <div 
                  className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 gap-4"
                  style={{ transform: isMirrored ? 'scaleX(-1)' : 'scaleX(1)' }} // Also apply to fallback
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
  const [call, setCall] = useState<Call | null>(null);

  // This effect's only job is to join the call when the prefetched client is ready.
  useEffect(() => {
    if (!prefetchedClient || !broadcast?.id) {
        setCall(null); // Clear call if client disappears
        return;
    };

    let callInstance = prefetchedClient.call('livestream', broadcast.id);
    
    // The `join` creates and activates the call.
    callInstance.join()
      .then(() => {
        setCall(callInstance);
      })
      .catch(err => {
        console.error(`Failed to join call ${broadcast.id}`, err);
        setCall(null);
      });

    // Unlike before, we don't return a cleanup function here.
    // The `useStreamPrefetch` hook is now solely responsible for disconnecting the client.
    // This prevents the race condition where the player disconnects the client
    // while the prefetch hook is still trying to use it.

  }, [prefetchedClient, broadcast?.id]);


  if (!prefetchedClient || !call) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // The StreamVideo component needs to be re-mounted when the client changes.
  // Using a key ensures that React treats it as a new component instance.
  return (
    <StreamVideo client={prefetchedClient} key={prefetchedClient.userID}>
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
