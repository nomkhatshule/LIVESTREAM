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
import { getDownloadURL, ref, uploadBytes, StorageReference, UploadResult } from 'firebase/storage';
import { Camera, Loader2, Pencil } from 'lucide-react';
import Image from 'next/image';

const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be less than 20 characters'),
  bio: z.string().max(160, 'Bio must be less than 160 characters').optional(),
  profilePicture: z.string().url().optional(),
  coverPhoto: z.string().url().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const { userDocument, isDocLoading } = useUserDocument();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState<'avatar' | 'cover' | false>(false);


  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      bio: '',
      profilePicture: '',
      coverPhoto: '',
    },
  });

  useEffect(() => {
    if (userDocument) {
      form.reset({
        username: userDocument.username || '',
        bio: userDocument.bio || '',
        profilePicture: userDocument.profilePicture || user?.photoURL || '',
        coverPhoto: userDocument.coverPhoto || '',
      });
    }
  }, [userDocument, user, form]);

  const handleUpload = async (file: File, type: 'avatar' | 'cover') => {
    if (!user || !storage) return;

    setIsUploading(type);

    try {
      const filePath = type === 'avatar' ? `avatars/${user.uid}/profile.png` : `covers/${user.uid}/cover.png`;
      const storageRef = ref(storage, filePath);
      const uploadTask = await uploadBytes(storageRef, file, { contentType: file.type });
      const downloadURL = await getDownloadURL(uploadTask.ref);

      const fieldToUpdate = type === 'avatar' ? 'profilePicture' : 'coverPhoto';
      form.setValue(fieldToUpdate, downloadURL);
      
      const userDocRef = doc(firestore, 'users', user.uid);
      setDocumentNonBlocking(userDocRef, { [fieldToUpdate]: downloadURL }, { merge: true });

      await revalidateProfilePaths();
      toast({
        title: `${type === 'avatar' ? 'Avatar' : 'Cover photo'} updated!`,
      });
    } catch (error: any) {
      console.error(`Error uploading ${type}:`, error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: `Could not upload your ${type}. ${error.message}`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = event.target.files?.[0];
    if (file) {
      handleUpload(file, type);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    
    const userDocRef = doc(firestore, 'users', user.uid);
    const { profilePicture, coverPhoto, ...restOfData } = data; // Don't save image URLs on this submit
    
    setDocumentNonBlocking(userDocRef, restOfData, { merge: true });

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
  const coverSrc = form.watch('coverPhoto');

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
      <Card>
         <CardHeader className="p-0">
            <div className="relative h-48 w-full bg-muted">
                {coverSrc && (
                    <Image
                        src={coverSrc}
                        alt="Cover photo"
                        fill
                        className="object-cover"
                    />
                )}
                <Button 
                    size="sm" 
                    className="absolute top-3 right-3"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={isUploading === 'cover'}
                >
                    {isUploading === 'cover' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pencil className="mr-2 h-4 w-4" />}
                    Edit Cover
                </Button>
                <input
                    type="file"
                    ref={coverInputRef}
                    onChange={(e) => handleFileChange(e, 'cover')}
                    className="hidden"
                    accept="image/png, image/jpeg, image/gif"
                />
            </div>
            <div className="flex flex-col items-center p-6 -mt-24">
                <div className="relative w-28 h-28">
                    <Avatar className="w-28 h-28 border-4 border-background ring-4 ring-primary">
                        <AvatarImage src={avatarSrc} />
                        <AvatarFallback className="text-3xl">{form.getValues('username')?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Button size="icon" variant="secondary" className="absolute bottom-1 right-1 rounded-full h-8 w-8" onClick={() => avatarInputRef.current?.click()} disabled={isUploading === 'avatar'}>
                        {isUploading === 'avatar' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    </Button>
                    <input
                        type="file"
                        ref={avatarInputRef}
                        onChange={(e) => handleFileChange(e, 'avatar')}
                        className="hidden"
                        accept="image/png, image/jpeg, image/gif"
                    />
                </div>
                <CardTitle className="mt-4 text-3xl font-headline">{form.watch('username') || user.displayName || 'Anonymous'}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
            </div>
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
              <Button type="submit" disabled={form.formState.isSubmitting || !!isUploading}>
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
        <CardHeader className="p-0">
          <Skeleton className="h-48 w-full" />
           <div className="flex flex-col items-center p-6 -mt-24">
              <Skeleton className="w-28 h-28 rounded-full" />
              <Skeleton className="h-8 w-48 mt-4" />
              <Skeleton className="h-4 w-64 mt-2" />
           </div>
        </CardHeader>
        <CardContent className="space-y-6 mt-6">
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
