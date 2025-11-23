
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser, useUserDocument, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Video, Loader2, CameraOff, DoorOpen } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Separator } from '@/components/ui/separator';

function CreateBroadcastPageComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isUserLoading } = useUser();
  const { userDocument, isDocLoading } = useUserDocument();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingRtmp, setIsSubmittingRtmp] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  // Pre-fill title from URL if available, for the cards flow
  useEffect(() => {
    const challengeTitle = searchParams.get('challenge');
    if (challengeTitle) {
      setTitle(challengeTitle);
    }
  }, [searchParams]);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (hasCameraPermission !== null) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to go live.',
        });
      }
    };
    getCameraPermission();
    
    return () => {
       if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  }, [hasCameraPermission, toast]);

  const createBroadcastDocument = async () => {
     if (!title.trim()) {
      toast({ variant: 'destructive', title: 'Missing Title', description: 'Please enter a title for your broadcast.' });
      return null;
    }
    if (!user || !userDocument) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to start a stream.' });
      return null;
    }

    const broadcastId = uuidv4();
    const challengeType = searchParams.get('type') as 'truth' | 'dare' | 'challenge' | null;
    const challengeDuration = searchParams.get('duration');

    setStatusMessage('Registering broadcast in database...');
    const broadcastDocRef = doc(firestore, 'broadcasts', broadcastId);
    const broadcastPayload: any = {
      title: title,
      hostId: user.uid,
      hostName: userDocument.username,
      hostAvatar: userDocument.profilePicture || '',
      isLive: false,
      createdAt: serverTimestamp(),
      viewerCount: 0,
      streamDetails: { isScreenSharing: false },
    };

    if (challengeType) {
        broadcastPayload.activeChallenge = title;
        broadcastPayload.activeChallengeType = challengeType;
        broadcastPayload.challengeSenderId = user.uid;
        broadcastPayload.challengeSenderName = userDocument.username;
        broadcastPayload.challengeSenderAvatar = userDocument.profilePicture;
        
        if (challengeDuration) {
            broadcastPayload.challengeDurationSeconds = parseInt(challengeDuration, 10);
        }
        broadcastPayload.challengeStartTime = serverTimestamp();
    }

    await setDoc(broadcastDocRef, broadcastPayload);
    return broadcastId;
  }

  const handleGoLive = async () => {
     if (!hasCameraPermission) {
      toast({ variant: 'destructive', title: 'Camera Required', description: 'Camera access is required to start a broadcast.' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const broadcastId = await createBroadcastDocument();
      if (!broadcastId) {
        setIsSubmitting(false);
        return;
      }
      
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      
      setStatusMessage('Redirecting to studio...');
      router.push(`/livenet?id=${broadcastId}`);

    } catch (error: any) {
      console.error('Go Live setup failed:', error);
      toast({
        variant: 'destructive',
        title: 'Stream Setup Failed',
        description: error.message || 'An unknown error occurred. Please try again.',
      });
      setIsSubmitting(false);
      setStatusMessage('');
    }
  };
  
  const handleSetUpRtmpStream = async () => {
    setIsSubmittingRtmp(true);
    try {
      const broadcastId = await createBroadcastDocument();
      if (!broadcastId) {
          setIsSubmittingRtmp(false);
          return;
      }
      setStatusMessage('Generating stream key...');
      router.push(`/broadcast/rtmp?id=${broadcastId}`);
    } catch (error: any) {
        console.error('RTMP setup failed:', error);
        toast({
            variant: 'destructive',
            title: 'Stream Setup Failed',
            description: error.message || 'An unknown error occurred while setting up your RTMP stream.',
        });
        setIsSubmittingRtmp(false);
        setStatusMessage('');
    }
  };
  
  const isLoading = isUserLoading || isDocLoading;
  const isAnySubmitting = isSubmitting || isSubmittingRtmp;

  if (isLoading && !isAnySubmitting) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading...</p>
        </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden flex items-center justify-center">
        <video ref={videoRef} autoPlay muted playsInline className="absolute top-0 left-0 w-full h-full object-cover -z-10 bg-black" />
        <div className="absolute inset-0 bg-black/50" />
        
        {hasCameraPermission === false && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white z-0">
                <CameraOff className="h-16 w-16 mb-4" />
                <h2 className="text-2xl font-bold">Camera Access Required</h2>
                <p className="text-muted-foreground max-w-sm text-center mt-2">
                    LIVENET needs camera access to start a broadcast. Please update your browser settings to allow access.
                </p>
            </div>
        )}

        <div className="relative z-10 w-full max-w-md space-y-6 rounded-2xl bg-card/80 backdrop-blur-lg p-8 shadow-2xl">
           {isAnySubmitting ? (
              <div className="flex flex-col items-center justify-center text-center h-48">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <h1 className="text-2xl font-bold font-headline text-foreground">Setting Up Your Stream...</h1>
                  <p className="text-muted-foreground mt-2">{statusMessage}</p>
              </div>
           ) : (
            <>
              <div className="text-center">
                <h1 className="text-3xl font-bold font-headline text-foreground">Go Live</h1>
                <p className="text-muted-foreground">
                    Set up the details for your new broadcast.
                </p>
              </div>
              <div className="space-y-4">
                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="title" className="text-foreground">Broadcast Title</Label>
                    <Input
                    id="title"
                    type="text"
                    placeholder="e.g., My Awesome Live Stream"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-background/80 focus-visible:ring-white"
                    disabled={isAnySubmitting}
                    />
                </div>
              </div>
              <div className='space-y-4'>
                <Button
                    size="lg"
                    onClick={handleGoLive}
                    disabled={isAnySubmitting || !title || isLoading || hasCameraPermission === false}
                    className="w-full bg-white text-black hover:bg-gray-200"
                >
                    {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    <Video className="mr-2 h-5 w-5" />
                    Go Live Now
                </Button>
                <div className="flex items-center gap-4">
                    <Separator className="flex-1 bg-zinc-500/50" />
                    <span className="text-xs text-muted-foreground">OR</span>
                    <Separator className="flex-1 bg-zinc-500/50" />
                </div>
                 <Button
                    size="lg"
                    onClick={handleSetUpRtmpStream}
                    disabled={isAnySubmitting || !title || isLoading}
                    variant="outline"
                    className="w-full"
                >
                    {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    <DoorOpen className="mr-2 h-5 w-5" />
                    Stream with OBS/External Software
                </Button>
              </div>
             </>
           )}
        </div>
    </div>
  );
}


export default function CreateBroadcastPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading Setup...</p>
            </div>
        }>
            <CreateBroadcastPageComponent />
        </Suspense>
    )
}
