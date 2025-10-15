'use client';

import { useState } from 'react';
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
import { Video, Loader, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CreateBroadcastPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { userDocument, isDocLoading } = useUserDocument();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoLive = async () => {
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
      tags: ['New', 'Live'], // Default tags
    };

    try {
        // CRITICAL FIX: Await the creation of the document to get its ID
        const newBroadcastDoc = await addDoc(broadcastsCollection, broadcastData);
        
        // Only redirect AFTER we have the ID.
        if (newBroadcastDoc.id) {
          router.push(`/live?id=${newBroadcastDoc.id}`);
        } else {
           throw new Error("Failed to create broadcast document.");
        }
        
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
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-card p-8 shadow-2xl">
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
              className="bg-background"
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label className="text-foreground">Category</Label>
            <Select onValueChange={setCategory} value={category}>
              <SelectTrigger className="w-full bg-background">
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
          disabled={isSubmitting || !title || !category || isLoading}
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
