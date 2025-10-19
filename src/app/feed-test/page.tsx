
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where } from 'firebase/firestore';
import type { Broadcast } from '@/lib/data';
import { StreamVideoClient } from '@stream-io/video-react-sdk';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import FeedItem from '@/components/broadcast/feed-item';

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || '';

function FeedTestManager() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);

    const liveBroadcastsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'broadcasts'), where('isLive', '==', true));
    }, [firestore]);

    const { data: liveBroadcasts, isLoading: areBroadcastsLoading } = useCollection<Broadcast>(liveBroadcastsQuery);

    useEffect(() => {
        if (!user || videoClient || !apiKey) return;

        let client: StreamVideoClient;

        const initClient = async () => {
            try {
                const response = await fetch('/api/stream/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.uid }),
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch stream token');
                }
                
                const { token } = await response.json();

                client = new StreamVideoClient({
                    apiKey,
                    user: {
                        id: user.uid,
                        name: user.displayName || 'Anonymous',
                        image: user.photoURL || undefined,
                    },
                    token,
                });
                setVideoClient(client);

            } catch (error: any) {
                toast({
                    variant: 'destructive',
                    title: 'Stream Connection Error',
                    description: error.message || 'Could not connect to Stream.',
                });
            }
        };

        initClient();

        return () => {
            if (client) {
                client.disconnectUser().catch(err => console.error("Failed to disconnect user on cleanup", err));
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);


    if (isUserLoading || areBroadcastsLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading Feed...</p>
            </div>
        );
    }
    
    if (!user) {
        router.push('/login');
        return null;
    }

    if (!videoClient) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Connecting to Streaming Service...</p>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-4rem)] overflow-y-scroll snap-y snap-mandatory bg-black">
            {liveBroadcasts && liveBroadcasts.map(broadcast => (
                <FeedItem
                    key={broadcast.id}
                    client={videoClient}
                    broadcast={broadcast}
                />
            ))}
            {(!liveBroadcasts || liveBroadcasts.length === 0) && (
                 <div className="h-full w-full flex items-center justify-center text-white snap-start">
                    <p>No live broadcasts right now. Check back later!</p>
                </div>
            )}
        </div>
    );
}

function FeedTestPageComponent() {
    return (
        <Suspense fallback={
             <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <FeedTestManager />
        </Suspense>
    )
}

export default FeedTestPageComponent;
