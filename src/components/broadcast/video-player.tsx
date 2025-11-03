
'use client';

import MuxPlayer from '@mux/mux-player-react';
import type { Broadcast } from '@/lib/data';

interface VideoPlayerProps {
  broadcast: Broadcast;
  isHost?: boolean;
}

export default function VideoPlayer({ broadcast, isHost = false }: VideoPlayerProps) {
  if (!broadcast.playbackId) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <p className="text-white">Stream is not available.</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full bg-black">
      <MuxPlayer
        playbackId={broadcast.playbackId}
        streamType="live"
        autoPlay
        muted={isHost}
        className="w-full h-full"
      />
    </div>
  );
}
