
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser, useFirestore, useUserDocument } from '@/firebase';
import { serverTimestamp, collection, addDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Video, Loader, CameraOff } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';


function CreateBroadcastPageComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { userDocument, isDocLoading } = useUserDocument();
  const { toast } = useToast();

  const challengeParam = searchParams.get('challenge');
  const challengeTypeParam = searchParams.get('type') as 'truth' | 'dare' | 'challenge' | null;
  const durationParam = searchParams.get('duration');

  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

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
  }, [hasCameraPermission, toast]);

  const handleGoLive = async () => {
    if (!hasCameraPermission) {
        toast({
            variant: 'destructive',
            title: 'Camera Required',
            description: 'Camera access is required to start a broadcast.',
        });
        return;
    }
    if (!title) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide a title for your broadcast.',
      });
      return;
    }
    if (!user || !userDocument) {
      toast({
        variant: 'destructive',
        title: 'Not Logged In',
        description: 'You must be logged in with a complete profile to start a broadcast.',
      });
      if (!user) router.push('/login');
      else if (!userDocument) router.push('/profile');
      return;
    }
    setIsSubmitting(true);
    
    // Stop camera tracks before navigating
    if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
    }

    try {
        // 1. Generate a unique ID for the broadcast (which will also be the Stream call ID)
        const broadcastId = uuidv4();
        
        // 2. Create the broadcast document in Firestore with the generated ID
        const broadcastDocRef = doc(firestore, 'broadcasts', broadcastId);
        const broadcastData: any = {
          title: title,
          category: challengeParam ? 'Games' : 'General',
          challenge: challengeParam || null,
          activeChallenge: challengeParam || null,
          activeChallengeType: challengeTypeParam || null,
          challengeStartTime: challengeParam ? serverTimestamp() : null,
          challengeDurationSeconds: durationParam ? parseInt(durationParam, 10) : null,
          hostId: user.uid,
          hostName: userDocument.username || user.displayName || 'Anonymous',
          hostAvatar: userDocument.profilePicture || user.photoURL || '',
          isLive: true,
          viewers: 0,
          createdAt: serverTimestamp(),
          tags: challengeParam ? ['Challenge', 'Games', 'Live'] : ['New', 'Live'],
        };
        await setDoc(broadcastDocRef, broadcastData);
        
        // 3. Redirect to the live studio, which will create/join the Stream call
        await router.push(`/agora-test?id=${broadcastId}`);
        
    } catch (error) {
        console.error("Error starting broadcast:", error);
        toast({
            variant: 'destructive',
            title: 'Error Starting Stream',
            description: 'An unexpected error occurred. Please try again.',
        });
        setIsSubmitting(false);
    }
  };
  
  const isLoading = isUserLoading || isDocLoading;

  if (isLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader className="h-8 w-8 animate-spin text-primary" />
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
                    AgoraLive needs camera access to start a broadcast. Please update your browser settings to allow access.
                </p>
            </div>
        )}

        <div className="relative z-10 w-full max-w-md space-y-6 rounded-2xl bg-card/80 backdrop-blur-lg p-8 shadow-2xl">
            <div className="text-center">
            <h1 className="text-3xl font-bold font-headline text-foreground">Go Live</h1>
            <p className="text-muted-foreground">
                {challengeParam ? "You're about to tackle a challenge!" : "Set up the details for your new broadcast."}
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
                className="bg-background/80"
                />
            </div>
            </div>
            <Button
            size="lg"
            onClick={handleGoLive}
            disabled={isSubmitting || !title || isLoading || hasCameraPermission === false}
            className="w-full"
            >
            {isSubmitting ? (
                <Loader className="mr-2 h-5 w-5 animate-spin" />
            ) : (
                <Video className="mr-2 h-5 w-5" />
            )}
            Go Live Now
            </Button>
        </div>
    </div>
  );
}


export default function CreateBroadcastPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading Setup...</p>
            </div>
        }>
            <CreateBroadcastPageComponent />
        </Suspense>
    )
}
