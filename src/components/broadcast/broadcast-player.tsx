
'use client';

import { useStreamStore } from '@/lib/stream-store';

export default function BroadcastPlayer() {
    // Read the playbackId directly from the store
    const { playbackId } = useStreamStore();
    const videoSrc = playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : '';

    if (!playbackId) {
        // This component will now only render if there's a valid playbackId,
        // but this check provides an extra layer of safety.
        return null;
    }
    
    return (
        <div className="absolute inset-0 z-10">
            <video
                src={videoSrc}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
            />
        </div>
    )
}

    