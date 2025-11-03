
'use client';

import MuxPlayer from '@mux/mux-player-react';
import { Loader2, Play } from 'lucide-react';
import { useStreamStore } from '@/lib/stream-store';
import { useUser } from '@/firebase';

export default function BroadcastPlayer() {
    const { user } = useUser();
    const { activeBroadcast, status, connect } = useStreamStore();

    const handlePlay = () => {
        if (user && activeBroadcast) {
            connect(user, activeBroadcast);
        }
    };
    
    // Show a loading or play button if this is the active stream but we're not connected
    if (status !== 'connected' && activeBroadcast) {
        return (
            <div className="absolute inset-0 bg-black/40 z-20 flex items-center justify-center pointer-events-auto">
                <button
                    onClick={handlePlay}
                    disabled={status === 'connecting'}
                    className="group flex flex-col items-center justify-center text-white transition-transform hover:scale-110 disabled:opacity-50"
                >
                    {status === 'connecting' ? (
                         <>
                            <Loader2 className="h-20 w-20 md:h-24 md:w-24 animate-spin" />
                            <span className="mt-2 text-base md:text-lg font-semibold drop-shadow-lg">Connecting...</span>
                         </>
                    ) : (
                        <>
                            <Play className="h-20 w-20 md:h-24 md:w-24 fill-white/80 drop-shadow-2xl" />
                             <span className="mt-2 text-base md:text-lg font-semibold drop-shadow-lg">Watch Live</span>
                        </>
                    )}
                </button>
            </div>
        )
    }

    if (status !== 'connected' || !activeBroadcast?.playbackId) {
        return null; // Don't render anything if not connected or no playback ID
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
