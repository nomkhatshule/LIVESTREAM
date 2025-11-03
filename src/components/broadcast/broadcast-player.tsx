
'use client';

import MuxPlayer from '@mux/mux-player-react';
import { useStreamStore } from '@/lib/stream-store';

export default function BroadcastPlayer() {
    const { activeBroadcast } = useStreamStore();

    // This component now only renders if the status is 'connected' and playbackId is valid.
    // The parent component (`BroadcastFeedItem`) handles the loading/play button states.
    if (!activeBroadcast?.playbackId) {
        // This should theoretically not be reached if the parent component logic is correct,
        // but it's a safe fallback.
        return null;
    }
    
    return (
        <div className="absolute inset-0 z-10">
            <MuxPlayer
                playbackId={activeBroadcast.playbackId}
                streamType="live"
                autoPlay
                muted
                className="w-full h-full"
            />
        </div>
    )
}
