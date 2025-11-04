
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser, useUserDocument } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Video, Loader2, CameraOff } from 'lucide-react';

function CreateBroadcastPageComponent() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { isDocLoading } = useUserDocument();
  const { toast } = useToast();

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

  const handleGoLive = () => {
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
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not Logged In',
        description: 'You must be logged in to start a broadcast.',
      });
      router.push('/login');
      return;
    }
    
    setIsSubmitting(true);
    
    // Stop camera stream before navigating
    if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
    }

    // Redirect to livenet with the title to initiate stream creation there
    router.push(`/livenet?title=${encodeURIComponent(title)}`);
  };
  
  const isLoading = isUserLoading || isDocLoading;

  if (isLoading) {
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
                    AgoraLive needs camera access to start a broadcast. Please update your browser settings to allow access.
                </p>
            </div>
        )}

        <div className="relative z-10 w-full max-w-md space-y-6 rounded-2xl bg-card/80 backdrop-blur-lg p-8 shadow-2xl">
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
                className="bg-background/80"
                disabled={isSubmitting}
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
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
                <Video className="mr-2 h-5 w-5" />
            )}
            {isSubmitting ? 'Proceeding to Studio...' : 'Go Live Now'}
            </Button>
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

    