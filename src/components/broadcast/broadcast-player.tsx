
'use client';

import MuxPlayer from '@mux/mux-player-react';
import { useStreamStore } from '@/lib/stream-store';

export default function BroadcastPlayer() {
    // Read the playbackId directly from the store
    const { playbackId } = useStreamStore();

    if (!playbackId) {
        // This component will now only render if there's a valid playbackId,
        // but this check provides an extra layer of safety.
        return null;
    }
    
    return (
        <div className="absolute inset-0 z-10">
            <MuxPlayer
                playbackId={playbackId}
                streamType="live"
                autoPlay
                muted
                className="w-full h-full"
            />
        </div>
    )
}
