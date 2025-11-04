
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser, useFirestore, useUserDocument } from '@/firebase';
import { serverTimestamp, doc, setDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import {
  StreamVideoClient,
  StreamVideo,
  StreamCall,
  Call,
  ParticipantView,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { Loader2, VideoOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// The main UI for the live studio
function LiveStudio({ call, onEndStream }: { call: Call; onEndStream: () => void }) {
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);

  useEffect(() => {
    // Enable camera automatically when the studio loads
    call.camera.enable();
    const cameraUpdateListener = () => {
        setIsCameraEnabled(!call.camera.isMute);
    };
    call.camera.on('update', cameraUpdateListener);
    
    return () => {
        call.camera.off('update', cameraUpdateListener);
    }
  }, [call]);

  return (
    <div className="relative h-screen w-full bg-black text-white">
      <div className="absolute inset-0 z-0">
        <ParticipantView
          participant={call.user}
          className={cn(!isCameraEnabled && 'hidden')}
        />
        {!isCameraEnabled && (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900">
            <VideoOff className="h-16 w-16 text-zinc-500 mb-4" />
            <p className="text-zinc-400">Your camera is off</p>
          </div>
        )}
      </div>
      <div className="absolute top-4 right-4 z-10">
        <Button onClick={onEndStream} variant="destructive">
            <X className="mr-2 h-4 w-4" />
            End Stream
        </Button>
      </div>
    </div>
  );
}

// The wrapper component that handles all setup and state logic
function LivenetSetupComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isUserLoading } = useUser();
  const { userDocument, isDocLoading } = useUserDocument();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [status, setStatus] = useState<'initializing' | 'setting_up' | 'connecting' | 'live' | 'error'>('initializing');
  const [statusMessage, setStatusMessage] = useState('Preparing your studio...');
  const [call, setCall] = useState<Call | null>(null);
  const [client, setClient] = useState<StreamVideoClient | null>(null);

  const title = searchParams.get('title');

  useEffect(() => {
    if (status !== 'initializing' || isUserLoading || isDocLoading) {
      return;
    }

    if (!user || !userDocument) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      router.push('/login');
      return;
    }

    if (!title) {
        toast({ variant: 'destructive', title: 'Error', description: 'No broadcast title provided.' });
        router.push('/broadcast/create');
        return;
    }

    const setupAndJoinStream = async () => {
      setStatus('setting_up');
      setStatusMessage('Creating broadcast session...');

      const broadcastId = uuidv4();
      const broadcastDocRef = doc(firestore, 'broadcasts', broadcastId);

      try {
        // Step 1: Create the Stream call object on their servers
        const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
        if (!apiKey) throw new Error('Stream API Key is missing.');
        
        setStatusMessage('Requesting stream token...');
        const tokenResponse = await fetch('/api/stream/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.uid }),
        });
        if (!tokenResponse.ok) throw new Error('Failed to fetch stream token.');
        const { token } = await tokenResponse.json();
        
        setStatusMessage('Initializing video client...');
        const streamClient = new StreamVideoClient({
            apiKey,
            user: { id: user.uid, name: userDocument.username || 'Host' },
            token,
        });
        setClient(streamClient);

        setStatusMessage('Creating live call...');
        const streamCall = streamClient.call('livestream', broadcastId);
        await streamCall.getOrCreate({
          data: { custom: { title: title, hostId: user.uid } },
        });
        setCall(streamCall);

        // Step 2: Create the Firestore document
        setStatusMessage('Registering broadcast...');
        await setDoc(broadcastDocRef, {
            title: title,
            hostId: user.uid,
            hostName: userDocument.username,
            hostAvatar: userDocument.profilePicture || '',
            isLive: false, // Set to false initially
            createdAt: serverTimestamp(),
        });
        
        // Step 3: Join the call and update status to live
        setStatus('connecting');
        setStatusMessage('Joining channel...');
        await streamCall.join();
        await updateDoc(broadcastDocRef, { isLive: true });

        setStatus('live');
        
      } catch (error: any) {
        setStatus('error');
        setStatusMessage('Failed to start stream.');
        console.error('Error setting up stream:', error);
        toast({ variant: 'destructive', title: 'Stream Setup Failed', description: error.message });
        router.push('/broadcast/create');
      }
    };

    setupAndJoinStream();

    // Cleanup function
    return () => {
        if (call) {
            updateDoc(doc(firestore, 'broadcasts', call.id), { isLive: false, activeChallenge: null });
            call.leave();
        }
        if (client) {
            client.disconnectUser();
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isUserLoading, userDocument, isDocLoading, status]);

  const handleEndStream = async () => {
    if (call) {
        await updateDoc(doc(firestore, 'broadcasts', call.id), { isLive: false, activeChallenge: null });
        await call.leave();
    }
    if (client) {
        await client.disconnectUser();
    }
    router.push('/');
  }

  if (status !== 'live' || !client || !call) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">{statusMessage}</p>
      </div>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <LiveStudio call={call} onEndStream={handleEndStream} />
      </StreamCall>
    </StreamVideo>
  );
}


// This is the default export for the page, wrapped in Suspense
export default function LivenetPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <LivenetSetupComponent />
        </Suspense>
    );
}

    