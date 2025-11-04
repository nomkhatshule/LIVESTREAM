
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser, useFirestore, useUserDocument } from '@/firebase';
import { serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { StreamVideoClient } from '@stream-io/video-react-sdk';
import { Loader2 } from 'lucide-react';

function LivenetSetupComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { userDocument, isDocLoading } = useUserDocument();
  const { toast } = useToast();
  const [statusMessage, setStatusMessage] = useState('Initializing...');

  const title = searchParams.get('title');

  useEffect(() => {
    // This effect will run once when the component mounts.
    const setupBroadcast = async () => {
      if (isUserLoading || isDocLoading) {
        // Wait until user and document are loaded
        return;
      }
      
      if (!title) {
        toast({ variant: 'destructive', title: 'Error', description: 'No broadcast title provided.' });
        router.push('/broadcast/create');
        return;
      }

      if (!user || !userDocument) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to start a stream.' });
        router.push('/login');
        return;
      }

      setStatusMessage('Creating your broadcast session...');

      try {
        const broadcastId = uuidv4();
        const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
        if (!apiKey) throw new Error('Stream API Key is missing.');

        setStatusMessage('Requesting stream token...');
        const tokenResponse = await fetch('/api/stream/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid }),
        });
        if (!tokenResponse.ok) throw new Error('Failed to fetch stream token');
        const { token } = await tokenResponse.json();

        setStatusMessage('Initializing stream client...');
        const tempClient = new StreamVideoClient({
          apiKey,
          user: { id: user.uid, name: userDocument.username || user.displayName || 'Host' },
          token,
        });

        setStatusMessage('Creating live call object...');
        const call = tempClient.call('livestream', broadcastId);
        await call.getOrCreate({
          data: {
            custom: {
              title: title,
              hostId: user.uid,
            },
          },
        });

        setStatusMessage('Registering broadcast in database...');
        const broadcastDocRef = doc(firestore, 'broadcasts', broadcastId);
        const broadcastData = {
          title: title,
          category: 'General',
          challenge: null,
          activeChallenge: null,
          activeChallengeType: null,
          challengeStartTime: null,
          challengeDurationSeconds: null,
          hostId: user.uid,
          hostName: userDocument.username || user.displayName || 'Anonymous',
          hostAvatar: userDocument.profilePicture || user.photoURL || '',
          isLive: false, // Will be set to true when host joins the studio
          viewers: 0,
          createdAt: serverTimestamp(),
          tags: ['New', 'Live'],
        };
        await setDoc(broadcastDocRef, broadcastData);

        // Disconnect the temporary client, the studio page will establish its own connection.
        await tempClient.disconnectUser();

        setStatusMessage('Redirecting to your live studio...');
        router.push(`/agora-test?id=${broadcastId}`);

      } catch (error: any) {
        console.error('Error setting up broadcast:', error);
        toast({
          variant: 'destructive',
          title: 'Error Starting Stream',
          description: error.message || 'An unexpected error occurred. Please try again.',
        });
        // Send user back to the create page on failure
        router.push('/broadcast/create');
      }
    };

    setupBroadcast();
  }, [user, isUserLoading, userDocument, isDocLoading, title, firestore, router, toast]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="ml-4 text-lg">{statusMessage}</p>
    </div>
  );
}

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
