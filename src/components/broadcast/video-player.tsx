'use client';

import {
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  useCallStateHooks,
  ParticipantView,
  Call,
} from '@stream-io/video-react-sdk';
import type { BroadcastData } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  broadcast: BroadcastData;
  isHost?: boolean;
  prefetchedClient?: StreamVideoClient | null;
  prefetchedToken?: string | null;
  onParticipantCountChange?: (count: number) => void;
}

/** Shown by the Stream SDK in place of the video whenever the host's camera is off. */
function CameraOffPlaceholder({ broadcast, label }: { broadcast: BroadcastData; label: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-900">
      <Avatar className="h-24 w-24">
        <AvatarImage src={broadcast.hostAvatar} />
        <AvatarFallback>{broadcast.hostName?.charAt(0) || 'H'}</AvatarFallback>
      </Avatar>
      <p className="text-lg text-white">{label}</p>
    </div>
  );
}

// --- HOST PLAYER ---
// Used inside the /livenet studio. Expects to be inside an existing StreamCall.
function HostVideoPlayer({ broadcast }: { broadcast: BroadcastData }) {
  const { useParticipants, useCameraState } = useCallStateHooks();
  const participants = useParticipants();
  const hostParticipant = participants.find((p) => p.isLocalParticipant);
  const { direction } = useCameraState();
  const [rotation, setRotation] = useState(0);

  // Compensate when a phone is held upside down.
  useEffect(() => {
    const handleOrientation = () => setRotation(screen.orientation?.angle ?? 0);
    handleOrientation();
    screen.orientation?.addEventListener('change', handleOrientation);
    return () => screen.orientation?.removeEventListener('change', handleOrientation);
  }, []);

  // Mirror the front camera (like a selfie preview), never the back camera.
  const isMirrored = direction !== 'back';

  if (!hostParticipant) {
    return (
      <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
        <p className="ml-2 text-white">Connecting to your camera...</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'host-video-container absolute inset-0 h-full w-full bg-black',
        isMirrored && '[&_video]:-scale-x-100',
      )}
      style={rotation === 180 ? { transform: 'rotate(180deg)' } : undefined}
    >
      <ParticipantView
        participant={hostParticipant}
        ParticipantViewUI={null}
        className="h-full w-full"
        VideoPlaceholder={() => <CameraOffPlaceholder broadcast={broadcast} label="Camera is off" />}
      />
    </div>
  );
}

// --- VIEWER PLAYER ---
// Used on the feed and watch pages. Joins the stream while visible and
// leaves it when the viewer scrolls away or closes the page.
function ViewerVideoPlayer({ broadcast, prefetchedClient, onParticipantCountChange }: VideoPlayerProps) {
  const [call, setCall] = useState<Call | null>(null);

  useEffect(() => {
    if (!prefetchedClient || !broadcast?.id) {
      setCall(null);
      return;
    }

    let cancelled = false;
    const callInstance = prefetchedClient.call('livestream', broadcast.id);

    callInstance
      .join()
      .then(() => {
        if (!cancelled) setCall(callInstance);
      })
      .catch((err) => {
        console.error(`Failed to join stream ${broadcast.id}`, err);
        if (!cancelled) setCall(null);
      });

    return () => {
      cancelled = true;
      setCall(null);
      // Leave so we stop downloading video and stop counting as a viewer.
      callInstance.leave().catch(() => {});
    };
  }, [prefetchedClient, broadcast?.id]);

  if (!prefetchedClient || !call) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <StreamVideo client={prefetchedClient}>
      <StreamCall call={call}>
        <ViewerStreamContent broadcast={broadcast} onParticipantCountChange={onParticipantCountChange} />
      </StreamCall>
    </StreamVideo>
  );
}

function ViewerStreamContent({
  broadcast,
  onParticipantCountChange,
}: {
  broadcast: BroadcastData;
  onParticipantCountChange?: (count: number) => void;
}) {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const hostParticipant = participants.find((p) => p.userId === broadcast.hostId);

  useEffect(() => {
    // Viewers = everyone in the call except the host.
    onParticipantCountChange?.(Math.max(0, participants.length - (hostParticipant ? 1 : 0)));
  }, [participants, hostParticipant, onParticipantCountChange]);

  if (!hostParticipant) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-zinc-900">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
        <p className="text-lg text-white">Waiting for host...</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full [&_video]:object-cover">
      <ParticipantView
        participant={hostParticipant}
        ParticipantViewUI={null}
        className="h-full w-full"
        VideoPlaceholder={() => <CameraOffPlaceholder broadcast={broadcast} label="Stream paused" />}
      />
    </div>
  );
}

// --- Main export: picks the host or viewer player. ---
export default function VideoPlayer({ broadcast, isHost = false, prefetchedClient, onParticipantCountChange }: VideoPlayerProps) {
  if (isHost) {
    return <HostVideoPlayer broadcast={broadcast} />;
  }
  return (
    <ViewerVideoPlayer
      broadcast={broadcast}
      prefetchedClient={prefetchedClient}
      onParticipantCountChange={onParticipantCountChange}
    />
  );
}
