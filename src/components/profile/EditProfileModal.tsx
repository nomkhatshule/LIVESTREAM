
'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUser, useUserDocument, useFirestore, useStorage } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2, Video, Image as ImageIcon } from 'lucide-react';
import { revalidateProfilePaths } from '@/app/actions';
import Image from 'next/image';

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters.').max(30, 'Username must be 30 characters or less.'),
  bio: z.string().max(160, 'Bio must be 160 characters or less.').optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function EditProfileModal({ open, onOpenChange }: EditProfileModalProps) {
  const { user } = useUser();
  const { userDocument } = useUserDocument();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const isSubmitting = isUploadingAvatar || isUploadingCover;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: userDocument?.username || '',
      bio: userDocument?.bio || '',
    },
  });

  const uploadFile = (file: File, path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        () => {}, // Progress
        (error) => {
          console.error('Upload failed:', error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setAvatarPreview(URL.createObjectURL(file));
    setIsUploadingAvatar(true);

    try {
      const path = `avatars/${user.uid}/${Date.now()}-${file.name}`;
      const downloadURL = await uploadFile(file, path);
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, { profilePicture: downloadURL });
      toast({ title: 'Avatar updated successfully!' });
      revalidateProfilePaths();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Avatar Upload Failed', description: 'Please try again.' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const fileType = file.type.startsWith('video') ? 'video' : 'image';
    setCoverPreview(URL.createObjectURL(file));
    setIsUploadingCover(true);

    try {
      const path = `covers/${user.uid}/${Date.now()}-${file.name}`;
      const downloadURL = await uploadFile(file, path);
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, { coverUrl: downloadURL, coverType: fileType });
      toast({ title: 'Cover updated successfully!' });
      revalidateProfilePaths();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Cover Upload Failed', description: 'Please try again.' });
    } finally {
      setIsUploadingCover(false);
    }
  };


  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;

    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        username: data.username,
        bio: data.bio,
      });
      toast({ title: 'Profile updated successfully!' });
      revalidateProfilePaths();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not save your profile changes. Please try again.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your public profile. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="relative h-32 w-full bg-muted rounded-lg group">
                <Image
                    src={coverPreview || userDocument?.coverUrl || 'https://picsum.photos/seed/cover-placeholder/800/200'}
                    alt="Cover image"
                    fill
                    className="object-cover rounded-lg"
                />
                <div 
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg cursor-pointer"
                    onClick={() => coverInputRef.current?.click()}
                >
                    {isUploadingCover ? (
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                    ) : (
                        <div className="text-center text-white">
                            <ImageIcon className="mx-auto h-8 w-8" />
                            <p className="text-xs font-semibold">Change Cover</p>
                        </div>
                    )}
                </div>
                 <input
                    type="file"
                    ref={coverInputRef}
                    onChange={handleCoverChange}
                    className="hidden"
                    accept="image/*,video/*"
                    disabled={isSubmitting}
                />
            </div>
            
            <div className='flex items-end -mt-12 ml-4'>
                <div className="relative w-24 h-24 group">
                    <Avatar className="w-24 h-24 border-4 border-background">
                    <AvatarImage src={avatarPreview || userDocument?.profilePicture} alt={userDocument?.username} />
                    <AvatarFallback className="text-3xl">{userDocument?.username?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div 
                        className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={() => avatarInputRef.current?.click()}
                    >
                        {isUploadingAvatar ? (
                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                        ) : (
                            <Camera className="h-6 w-6 text-white" />
                        )}
                    </div>
                     <input
                        type="file"
                        ref={avatarInputRef}
                        onChange={handleAvatarChange}
                        className="hidden"
                        accept="image/*"
                        disabled={isSubmitting}
                    />
                </div>
            </div>

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Your public display name" {...field} />
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
                    <Textarea placeholder="Tell us a little bit about yourself" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
