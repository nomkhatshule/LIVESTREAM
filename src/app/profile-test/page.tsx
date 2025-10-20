'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser, useStorage } from '@/firebase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRef, useState, useEffect } from 'react';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Camera, Loader2 } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

export default function ProfileTestPage() {
  const { user } = useUser();
  const storage = useStorage();
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("https://picsum.photos/seed/test-avatar/200");

  useEffect(() => {
    // In a real app, you'd fetch the user's current avatar URL from their profile
    if (user?.photoURL) {
      setAvatarUrl(user.photoURL);
    }
  }, [user]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !storage || !firestore) {
      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Not Logged In',
          description: 'You must be logged in to upload an avatar.',
        });
      }
      return;
    }

    setIsUploading(true);

    try {
      const storageRef = ref(storage, `avatars/${user.uid}/profile.png`);
      const uploadTask = await uploadBytes(storageRef, file, { contentType: file.type });
      const downloadURL = await getDownloadURL(uploadTask.ref);

      // Update the user's profile in Firestore
      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(userDocRef, { profilePicture: downloadURL }, { merge: true });
      
      setAvatarUrl(downloadURL); // Update local state to show new avatar

      toast({
        title: 'Avatar Updated!',
        description: 'Your new avatar has been saved.',
      });

    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Could not upload your new avatar. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };


  return (
    <div className="container mx-auto py-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Profile Test Page</h1>
      <p className="text-muted-foreground mb-8">This is a functional avatar uploader.</p>

      <div className="relative w-32 h-32">
        <Avatar className="w-32 h-32 text-4xl">
          <AvatarImage src={avatarUrl} alt="User Avatar" key={avatarUrl} />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <Button 
          size="icon" 
          variant="secondary" 
          className="absolute bottom-0 right-0 rounded-full h-10 w-10" 
          onClick={handleAvatarClick}
          disabled={isUploading}>
           {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
        </Button>
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/png, image/jpeg, image/gif"
        />
      </div>
    </div>
  );
}
