
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  StreamVideoClient,
  StreamVideo,
  StreamCall,
  Call,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { Loader2 } from 'lucide-react';
import AgoraTestPageUI from '@/components/agora-test/AgoraTestPageUI';

// --- Wrapper Component for Initialization and Auth ---
function LivenetWrapper() {
    const searchParams = useSearchParams();
    const broadcastId = searchParams.get('id');
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const [client, setClient] = useState<StreamVideoClient | null>(null);
    const [call, setCall] = useState<Call | null>(null);
    
    // Auth check
    useEffect(() => {
        if (!isUserLoading && !user) {
            toast({
                title: 'Authentication Required',
                description: "You must be logged in to access the live studio.",
                variant: 'destructive',
            });
            router.push('/login');
        }
    }, [user, isUserLoading, router, toast]);

    // Stream Client initialization
    useEffect(() => {
        if (!user || !broadcastId || client) return;

        let videoClient: StreamVideoClient;
        const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || '';

        const initStream = async () => {
            if (!apiKey) {
                toast({ variant: 'destructive', title: 'Stream API Key is missing.' });
                return;
            }

            try {
                // The broadcast document should have been created by the /broadcast/create page.
                // Now, we connect to it.
                const response = await fetch('/api/stream/token', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: user.uid }),
                });
                if (!response.ok) throw new Error('Failed to fetch stream token');
                
                const { token } = await response.json();
                
                videoClient = new StreamVideoClient({
                    apiKey,
                    user: {
                        id: user.uid,
                        name: user.displayName || 'Anonymous',
                        image: user.photoURL || undefined,
                    },
                    token,
                });

                setClient(videoClient);
                const callInstance = videoClient.call('livestream', broadcastId);
                
                // Join the call. The `create` flag is a fallback.
                await callInstance.join({ create: true });

                // Once successfully joined, mark the broadcast as 'isLive' in Firestore.
                // This makes it appear on the feed for other users.
                const broadcastDocRef = doc(firestore, 'broadcasts', broadcastId);
                await updateDoc(broadcastDocRef, { isLive: true });
                
                setCall(callInstance);

            } catch (error: any) {
                console.error("Stream initialization failed:", error);
                toast({ variant: 'destructive', title: 'Connection Failed', description: error.message || 'Could not connect to the broadcast.'});
                // If connection fails, maybe route back home
                router.push('/');
            }
        };
        
        initStream();

        return () => {
            // Cleanup logic when the component unmounts
            if (call) {
                call.leave().catch(err => console.error("Failed to leave call on cleanup", err));
            }
            if (client) {
                client.disconnectUser().catch(err => console.error("Failed to disconnect user on cleanup", err));
            }
        };
    // Corrected dependency array
    }, [broadcastId, user, firestore, toast, router]);

    if (isUserLoading || !broadcastId) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading your studio...</p>
            </div>
        );
    }
    
    if (!client || !call) {
         return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Connecting to broadcast channel...</p>
            </div>
        );
    }

    return (
        <StreamVideo client={client}>
            <StreamCall call={call}>
                <AgoraTestPageUI />
            </StreamCall>
        </StreamVideo>
    )
}

// --- Default Export with Suspense ---
export default function LivenetPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <LivenetWrapper />
        </Suspense>
    )
}
