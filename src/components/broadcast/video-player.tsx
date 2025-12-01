
'use client';

import {
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  useCallStateHooks,
  ParticipantView,
} from '@stream-io/video-react-sdk';
import type { BroadcastData } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';

interface VideoPlayerProps {
  broadcast: BroadcastData;
  isHost?: boolean;
  prefetchedClient?: StreamVideoClient | null;
  prefetchedToken?: string | null;
  onParticipantCountChange?: (count: number) => void;
}

// --- HOST-SPECIFIC PLAYER ---
// This component is only used inside the /livenet studio.
// It assumes it's running inside an existing StreamCall context.
function HostVideoPlayer({ broadcast }: { broadcast: BroadcastData }) {
    const { useParticipants, useCameraState } = useCallStateHooks();
    const participants = useParticipants();
    const hostParticipant = participants.find(p => p.isLocalParticipant);

    // Get camera state to determine if we should mirror the video
    const { camera } = useCameraState();
    const isMirrored = camera?.facingMode === 'user';
    
    if (!hostParticipant) {
        return (
            <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <p className="ml-2 text-white">Connecting to your camera...</p>
            </div>
        );
    }
    
    return (
        <div className="absolute inset-0 w-full h-full bg-black">
            <ParticipantView 
                participant={hostParticipant} 
                ParticipantViewUI={null} 
                className="w-full h-full"
                // The style is now dynamically applied based on camera state
                style={{ transform: isMirrored ? 'scaleX(-1)' : 'scaleX(1)' }}
            />
            { !hostParticipant.isCameraEnabled && !hostParticipant.isScreenSharing && (
                 <div 
                  className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 gap-4"
                  style={{ transform: isMirrored ? 'scaleX(-1)' : 'scaleX(1)' }}
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


// --- VIEWER-SPECIFIC PLAYER ---
// This component is self-contained and used on the /feed page.
// It manages its own StreamVideoClient and StreamCall.
function ViewerVideoPlayer({ broadcast, prefetchedClient, onParticipantCountChange }: VideoPlayerProps) {
  const [call, setCall] = useState<Call | null>(null);

  useEffect(() => {
    if (!prefetchedClient || !broadcast?.id) {
        setCall(null);
        return;
    };

    const callInstance = prefetchedClient.call('livestream', broadcast.id);
    
    callInstance.join()
      .then(() => {
        setCall(callInstance);
      })
      .catch(err => {
        console.error(`Failed to join call ${broadcast.id}`, err);
        setCall(null);
      });

  }, [prefetchedClient, broadcast?.id]);


  if (!prefetchedClient || !call) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <StreamVideo client={prefetchedClient} key={prefetchedClient.userID}>
      <StreamCall call={call}>
        <ViewerStreamContent broadcast={broadcast} onParticipantCountChange={onParticipantCountChange} />
      </StreamCall>
    </StreamVideo>
  );
}

// Helper component for Viewer player UI
function ViewerStreamContent({ broadcast, onParticipantCountChange }: { broadcast: BroadcastData; onParticipantCountChange?: (count: number) => void; }) {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const hostParticipant = participants.find(p => p.userId === broadcast.hostId);
  
  useEffect(() => {
    // The viewer count is the number of participants minus the host.
    // This will update whenever someone joins or leaves.
    const viewerCount = Math.max(0, participants.length - (hostParticipant ? 1 : 0));
    onParticipantCountChange?.(viewerCount);
  }, [participants, hostParticipant, onParticipantCountChange]);

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
            muted={false} // Viewers should hear audio
            className="w-full h-full object-cover"
          />
           { !hostParticipant.isCameraEnabled && !hostParticipant.isScreenSharing && (
                 <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 gap-4">
                     <Avatar className="h-24 w-24">
                        <AvatarImage src={broadcast.hostAvatar} />
                        <AvatarFallback>{broadcast.hostName?.charAt(0) || 'H'}</AvatarFallback>
                    </Avatar>
                    <p className="text-white text-lg">Stream Paused</p>
                </div>
            )}
      </div>
  )
}

// --- Main Exported Component ---
// This now acts as a router, deciding which player to render based on the isHost prop.
export default function VideoPlayer({ broadcast, isHost = false, prefetchedClient, prefetchedToken, onParticipantCountChange }: VideoPlayerProps) {
    if (isHost) {
        // The host player is simple because it expects to be inside a provider already
        return <HostVideoPlayer broadcast={broadcast} />;
    } else {
        // The viewer player is more complex as it manages its own providers
        return <ViewerVideoPlayer broadcast={broadcast} prefetchedClient={prefetchedClient} onParticipantCountChange={onParticipantCountChange}/>;
    }
}
