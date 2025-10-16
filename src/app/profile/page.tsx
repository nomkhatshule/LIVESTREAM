'use client';
import { useUser, useUserDocument, useFirestore, setDocumentNonBlocking, useStorage } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { revalidateProfilePaths } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useRef, useState } from 'react';
import { doc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Camera, Loader2 } from 'lucide-react';


const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be less than 20 characters'),
  bio: z.string().max(160, 'Bio must be less than 160 characters').optional(),
  profilePicture: z.string().url().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const { userDocument, isDocLoading } = useUserDocument();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);


  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      bio: '',
      profilePicture: '',
    },
  });

  useEffect(() => {
    if (userDocument) {
      form.reset({
        username: userDocument.username || '',
        bio: userDocument.bio || '',
        profilePicture: userDocument.profilePicture || user?.photoURL || '',
      });
    }
  }, [userDocument, user, form]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !user) {
      return;
    }
    const file = event.target.files[0];
    const storageRef = ref(storage, `avatars/${user.uid}/${file.name}`);

    setIsUploading(true);

    try {
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const userDocRef = doc(firestore, 'users', user.uid);
      setDocumentNonBlocking(userDocRef, { profilePicture: downloadURL }, { merge: true });
      
      form.setValue('profilePicture', downloadURL);

      await revalidateProfilePaths();

      toast({
        title: 'Avatar Updated',
        description: 'Your new avatar has been saved and is now visible.',
      });

    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Could not upload your new avatar. Please check the file type and size, and ensure you have permission.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    
    const userDocRef = doc(firestore, 'users', user.uid);
    const { profilePicture, ...profileData } = data; // Don't save profilePicture via this form
    
    setDocumentNonBlocking(userDocRef, profileData, { merge: true });

    await revalidateProfilePaths();
    
    toast({
      title: 'Profile Update Saving',
      description: 'Your changes are being saved.',
    });
  };
  
  if (isUserLoading || isDocLoading) {
    return <ProfileSkeleton />;
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }
  
  const avatarSrc = form.watch('profilePicture');


  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
      <Card>
        <CardHeader className="text-center">
           <div className="relative w-24 h-24 mx-auto">
              <Avatar className="w-24 h-24 border-4 border-primary">
                <AvatarImage src={avatarSrc} />
                <AvatarFallback className="text-3xl">{form.getValues('username')?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
              </Avatar>
              <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 rounded-full h-8 w-8" onClick={handleAvatarClick} disabled={isUploading}>
                 {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </Button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                className="hidden" 
                accept="image/png, image/jpeg, image/gif"
              />
            </div>
          <CardTitle className="mt-4 text-3xl font-headline">{form.watch('username') || user.displayName || 'Anonymous'}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Your cool new username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell us a little about yourself" className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting || isUploading}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
      <Card>
        <CardHeader className="text-center">
          <Skeleton className="w-24 h-24 rounded-full mx-auto" />
          <Skeleton className="h-8 w-48 mt-4 mx-auto" />
          <Skeleton className="h-4 w-64 mt-2 mx-auto" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-20 w-full" />
          </div>
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    </div>
  );
}
