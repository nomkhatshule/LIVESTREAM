
'use client';
import { useUser, useAuth, useUserDocument, useFirestore, setDocumentNonBlocking, useStorage } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { LogOut, Mail, Camera, Loader2, Pencil } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { revalidateProfilePaths } from '@/app/actions';
import { useEffect, useRef, useState } from 'react';
import { doc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import Image from 'next/image';

const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be less than 20 characters'),
  bio: z.string().max(160, 'Bio must be less than 160 characters').optional(),
  profilePicture: z.string().url().optional(),
  coverUrl: z.string().url().optional(),
  coverType: z.enum(['image', 'video']).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;


interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { user } = useUser();
  const { userDocument } = useUserDocument();
  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const router = useRouter();
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
      coverUrl: '',
      coverType: 'image',
    },
  });
  
  useEffect(() => {
    if (userDocument && open) {
      form.reset({
        username: userDocument.username || '',
        bio: userDocument.bio || '',
        profilePicture: userDocument.profilePicture || user?.photoURL || '',
        coverUrl: userDocument.coverUrl || '',
        coverType: userDocument.coverType || 'image',
      });
    }
  }, [userDocument, user, form, open]);

  const handleUpload = async (file: File, type: 'avatar' | 'cover') => {
    if (!user || !storage) return;

    if (type === 'cover' && file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = async () => {
            window.URL.revokeObjectURL(video.src);
            if (video.duration > 8) {
                toast({
                    variant: 'destructive',
                    title: 'Upload Failed',
                    description: 'Video duration cannot exceed 8 seconds.',
                });
            } else {
                await uploadFile(file, type);
            }
        }
        video.src = URL.createObjectURL(file);
    } else {
        await uploadFile(file, type);
    }
  };
  
  const uploadFile = async (file: File, type: 'avatar' | 'cover') => {
    if (!user || !storage) return;
    setIsUploading(type);
    
    try {
        const filePath = type === 'avatar' 
            ? `avatars/${user.uid}/profile.${file.name.split('.').pop()}` 
            : `covers/${user.uid}/cover.${file.name.split('.').pop()}`;
        const storageRef = ref(storage, filePath);
        const uploadTask = await uploadBytes(storageRef, file, { contentType: file.type });
        const downloadURL = await getDownloadURL(uploadTask.ref);

        const userDocRef = doc(firestore, 'users', user.uid);

        if (type === 'cover') {
            const coverType = file.type.startsWith('video/') ? 'video' : 'image';
            form.setValue('coverUrl', downloadURL);
            form.setValue('coverType', coverType);
            setDocumentNonBlocking(userDocRef, { coverUrl: downloadURL, coverType: coverType }, { merge: true });
        } else {
            form.setValue('profilePicture', downloadURL);
            setDocumentNonBlocking(userDocRef, { profilePicture: downloadURL }, { merge: true });
        }

        await revalidateProfilePaths();
        toast({
            title: `${type.charAt(0).toUpperCase() + type.slice(1)} updated!`,
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
  }


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = event.target.files?.[0];
    if (file) {
      handleUpload(file, type);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    
    const userDocRef = doc(firestore, 'users', user.uid);
    const { profilePicture, coverUrl, coverType, ...restOfData } = data;
    
    setDocumentNonBlocking(userDocRef, restOfData, { merge: true });

    await revalidateProfilePaths();
    
    toast({
      title: 'Profile Update Saving',
      description: 'Your changes are being saved.',
    });
    onOpenChange(false);
  };
  
  const handleLogout = () => {
    signOut(auth).then(() => {
      router.push('/landing');
    });
  };
  
  const avatarSrc = form.watch('profilePicture');
  const coverSrc = form.watch('coverUrl');
  const coverType = form.watch('coverType');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your public profile and account settings.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
                 <div className="relative h-36 w-full bg-muted mt-4 rounded-md">
                    {coverSrc && coverType === 'video' ? (
                        <video
                            src={coverSrc}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="object-cover w-full h-full rounded-md"
                        />
                    ) : coverSrc && coverType === 'image' ? (
                        <Image
                            src={coverSrc}
                            alt="Cover photo"
                            fill
                            className="object-cover rounded-md"
                        />
                    ) : (
                       <div className="h-full w-full bg-muted rounded-md" />
                    )}
                    <Button 
                        size="sm" 
                        className="absolute top-2 right-2"
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
                        accept="image/png, image/jpeg, image/gif, video/mp4, video/quicktime"
                    />
                </div>
            
                <div className="flex flex-col items-center -mt-16">
                    <div className="relative w-24 h-24">
                        <Avatar className="w-24 h-24 border-4 border-background ring-4 ring-primary">
                            <AvatarImage src={avatarSrc} />
                            <AvatarFallback className="text-3xl">{form.getValues('username')?.charAt(0) || user?.email?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 rounded-full h-8 w-8" onClick={() => avatarInputRef.current?.click()} disabled={isUploading === 'avatar'}>
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
                </div>

                <div className="pt-6">
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
                        <div className="flex justify-end">
                            <Button type="submit" disabled={form.formState.isSubmitting || !!isUploading}>
                                {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                        </form>
                    </Form>
                </div>
            </TabsContent>
            <TabsContent value="account">
                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">
                            Email
                        </span>
                        <span className="text-base font-semibold">{user?.email}</span>
                        </div>
                    </div>
                     <Button
                        variant="destructive"
                        onClick={handleLogout}
                        className="w-full"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log Out
                    </Button>
                </div>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
