'use client';

import { useEffect } from 'react';
import { useStreamStore } from '@/lib/stream-store';
import { StreamVideo, StreamCall } from '@stream-io/video-react-sdk';
import VideoPlayer from './video-player';
import { Loader2 } from 'lucide-react';
import type { User } from 'firebase/auth';

interface BroadcastPlayerProps {
    user: User;
}

export default function BroadcastPlayer({ user }: BroadcastPlayerProps) {
    const { 
        client, 
        call, 
        status, 
        activeBroadcastId, 
        connect 
    } = useStreamStore();

    useEffect(() => {
        if (activeBroadcastId && user) {
            connect(user, activeBroadcastId);
        }
    }, [activeBroadcastId, user, connect]);

    if (status === 'connecting' || status === 'idle') {
        return (
            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center text-white z-20">
                <Loader2 className="h-12 w-12 animate-spin mb-4" />
                <p>Connecting to Stream...</p>
            </div>
        )
    }

    if (!client || !call || status !== 'connected') {
        return null; // Don't render anything if not connected
    }

    // Since we can't pass the full broadcast object easily, we construct a minimal one.
    // The UI part (BroadcastPreview) will display the rich data. This is just for the player.
    const minimalBroadcast = {
        id: call.id,
        isLive: true,
        user: {
            id: call.state.createdBy?.id || '',
            // other user properties can be added if available from `call` object
        },
    };
    
    return (
        <div className="absolute inset-0 z-10">
            <StreamVideo client={client}>
                <StreamCall call={call}>
                    {/* @ts-ignore */}
                    <VideoPlayer broadcast={minimalBroadcast} isHost={false} isMuted={false} />
                </StreamCall>
            </StreamVideo>
        </div>
    )
}
