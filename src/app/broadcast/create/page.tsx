'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { categories } from '@/lib/data';
import { useUser, useFirestore, useUserDocument } from '@/firebase';
import { serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Video, Loader, CameraOff } from 'lucide-react';

export default function CreateBroadcastPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { userDocument, isDocLoading } = useUserDocument();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (hasCameraPermission !== null) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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
    if (!title || !category) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide a title and category for your broadcast.',
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
    
    if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
    }

    const broadcastsCollection = collection(firestore, 'broadcasts');
    const broadcastData = {
      title: title,
      category: category,
      hostId: user.uid,
      hostName: userDocument.username || user.displayName || 'Anonymous',
      hostAvatar: userDocument.profilePicture || user.photoURL || '',
      isLive: true,
      viewers: 0,
      createdAt: serverTimestamp(),
      tags: ['New', 'Live'],
      streamDetails: {
        isScreenSharing: false,
      },
    };

    try {
        const newBroadcastDoc = await addDoc(broadcastsCollection, broadcastData);
        // Redirect to the agora-test page with the new broadcast ID
        await router.push(`/agora-test?id=${newBroadcastDoc.id}`);
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
                />
            </div>
            <div className="grid w-full items-center gap-1.5">
                <Label className="text-foreground">Category</Label>
                <Select onValueChange={setCategory} value={category}>
                <SelectTrigger className="w-full bg-background/80">
                    <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                    {categories.map((cat) => (
                    <SelectItem key={cat.name} value={cat.name}>
                        {cat.name}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
            </div>
            <Button
            size="lg"
            onClick={handleGoLive}
            disabled={isSubmitting || !title || !category || isLoading || hasCameraPermission === false}
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
