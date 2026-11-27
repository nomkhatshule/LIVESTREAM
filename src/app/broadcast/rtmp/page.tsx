
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, Check, ArrowLeft } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { BroadcastData } from '@/lib/types';
import Link from 'next/link';
import { StreamVideoClient } from '@stream-io/video-react-sdk';
import { fetchStreamToken } from '@/lib/stream-token';

function RtmpDetailsPageComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const broadcastId = searchParams.get('id');
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [streamToken, setStreamToken] = useState<string | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [isCreatingCall, setIsCreatingCall] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  
  const broadcastDocRef = useMemoFirebase(() => {
    if (!broadcastId || !firestore) return undefined;
    return doc(firestore, 'broadcasts', broadcastId);
  }, [broadcastId, firestore]);
  
  const { data: broadcastData, isLoading: isBroadcastLoading } = useDoc<BroadcastData>(broadcastDocRef);

  useEffect(() => {
    if (isUserLoading || !user || !broadcastId) return;
    
    const initRtmpCall = async () => {
      setIsLoadingToken(true);
      try {
        // 1. Fetch the stream token
        const token = await fetchStreamToken(user);
        setStreamToken(token);

        // 2. Create the call on Stream's servers so it's ready for ingestion
        setIsCreatingCall(true);
        const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || '';
        const videoClient = new StreamVideoClient({
            apiKey,
            user: { id: user.uid },
            token,
        });

        const call = videoClient.call('livestream', broadcastId);
        await call.getOrCreate();
        
        // Mark as live in Firebase since we are ready to receive the stream
        if (broadcastDocRef) {
          await setDoc(broadcastDocRef, { 
            isLive: true,
            streamStartedAt: serverTimestamp() 
          }, { merge: true });
        }

        // Cleanup client connection
        await videoClient.disconnectUser();
        
      } catch (error: any) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Setup Error',
          description: error.message || 'Could not prepare your stream. Please try again.',
        });
        router.push('/broadcast/create');
      } finally {
        setIsLoadingToken(false);
        setIsCreatingCall(false);
      }
    };

    initRtmpCall();
  }, [user, isUserLoading, broadcastId, broadcastDocRef, router, toast]);

  // Security check: ensure the current user is the host
  useEffect(() => {
    if (!isBroadcastLoading && broadcastData && user && broadcastData.hostId !== user.uid) {
        toast({ variant: 'destructive', title: 'Access Denied', description: 'You are not the host of this broadcast.' });
        router.push('/');
    }
  }, [broadcastData, isBroadcastLoading, user, router, toast]);

  const handleCopy = (text: string, type: 'key' | 'url') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
    toast({ title: 'Copied to clipboard!' });
  };
  
  const isLoading = isUserLoading || isBroadcastLoading || isLoadingToken || isCreatingCall;
  const rtmpUrl = 'rtmps://global.v2.stream-io-video.com:443/live';
  
  // FIXED: The stream key MUST follow this format for GetStream Video
  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || '';
  const streamKey = streamToken ? `livestream:${broadcastId}?key=${apiKey}&token=${streamToken}` : '';

  if (isLoading) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
            <h2 className="text-xl font-semibold">Preparing Your Stream...</h2>
            <p className="text-muted-foreground mt-2">Initializing the broadcast channel on our servers.</p>
        </div>
      )
  }

  return (
    <div className="container mx-auto max-w-2xl py-12">
        <Button variant="ghost" asChild className="mb-8">
            <Link href="/broadcast/create"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Setup</Link>
        </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">GoPro / External Stream Setup</CardTitle>
          <CardDescription>
            Use these credentials in your GoPro Quik app or OBS to go live.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="space-y-2">
            <Label htmlFor="rtmp-url">Server URL</Label>
            <div className="relative">
              <Input id="rtmp-url" value={rtmpUrl} readOnly />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => handleCopy(rtmpUrl, 'url')}
              >
                {copiedUrl ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="stream-key">Stream Key</Label>
            <div className="relative">
              <Input id="stream-key" type="password" value={streamKey} readOnly />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => handleCopy(streamKey, 'key')}
              >
                {copiedKey ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Warning: Do not share your stream key with anyone.
            </p>
          </div>
          <div className="text-center pt-4">
            <p className="text-lg font-semibold">Waiting for connection...</p>
            <p className="text-muted-foreground">Once you start streaming from your GoPro, your broadcast will go live automatically.</p>
            <Loader2 className="mx-auto mt-4 h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RtmpPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        }>
            <RtmpDetailsPageComponent />
        </Suspense>
    )
}
