'use client';

import { useState, useRef, useEffect } from 'react';
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
import { useUser } from '@/firebase';
import { addDoc, collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Video, Loader, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CreateBroadcastPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (typeof window !== 'undefined' && navigator.mediaDevices) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setHasCameraPermission(true);
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera and microphone permissions to go live.',
          });
        }
      }
    };
    getCameraPermission();

    return () => {
        if(videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [toast]);

  const handleGoLive = async () => {
    if (!title || !category) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide a title and category for your broadcast.',
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
    try {
      // In a real app, we'd save this to a 'broadcasts' collection
      const newBroadcastId = `broadcast-${user.uid.slice(0, 5)}`;
      router.push(`/broadcast/${newBroadcastId}?host=true`);

    } catch (error) {
      console.error('Error creating broadcast:', error);
      toast({
        variant: 'destructive',
        title: 'Error Starting Stream',
        description: 'Could not create the broadcast. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isUserLoading || hasCameraPermission === null) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full items-center justify-center bg-black">
      <div className="absolute inset-0">
         <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
         <div className="absolute inset-0 bg-black/40" />
      </div>

      {!hasCameraPermission && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <Alert variant="destructive" className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Camera & Mic Access Required</AlertTitle>
                <AlertDescription>
                    To preview your stream, please allow camera and microphone access in your browser settings, then refresh the page.
                </AlertDescription>
            </Alert>
          </div>
      )}

      {hasCameraPermission && (
        <div className="relative z-10 w-full max-w-md space-y-6 rounded-2xl bg-background/80 p-8 shadow-2xl backdrop-blur-lg">
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
                className="bg-background/80 border-input"
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label className="text-foreground">Category</Label>
              <Select onValueChange={setCategory} value={category}>
                <SelectTrigger className="w-full bg-background/80 border-input">
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
            disabled={isSubmitting || !title || !category}
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
      )}
    </div>
  );
}
