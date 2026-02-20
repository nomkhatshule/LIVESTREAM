'use client';
import { useUserDocumentById } from '@/firebase/firestore/use-user-document';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, useUserDocument, useStorage } from '@/firebase';
import { Button } from '@/components/ui/button';
import { doc, writeBatch, serverTimestamp, where, query, orderBy, limit, collection, getCountFromServer, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useMemo, useState, useEffect, useRef } from 'react';
import { UserPlus, UserCheck, MessageSquare, Heart, Eye, Gift, Video, Settings, Clapperboard, ArrowRight, Camera, ImageIcon, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import Image from 'next/image';
import { type Highlight, type CompletedChallenge } from '@/lib/data';
import SettingsModal from '@/components/profile/SettingsModal';
import EditProfileModal from '@/components/profile/EditProfileModal';
import AccountModal from '@/components/profile/AccountModal';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { formatDistanceToNow } from 'date-fns';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { revalidateProfilePaths } from '@/app/actions';


export default function UserProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const profileUserId = params.id as string;
  const { user: currentUser } = useUser();
  const { userDocument: currentUserDocument } = useUserDocument();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
  const [totalLikes, setTotalLikes] = useState(0);
  
  const { userDocument, isDocLoading } = useUserDocumentById(profileUserId);
  const isNewUser = searchParams.get('new_user') === 'true';

  // --- States and Refs for file uploads ---
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverPreviewType, setCoverPreviewType] = useState<'image' | 'video' | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // --- Follower/Following Logic ---
  const currentUserFollowingRef = useMemoFirebase(() => currentUser ? collection(firestore, `users/${currentUser.uid}/following`) : null, [currentUser, firestore]);
  const { data: currentUserFollowingList, isLoading: isCurrentUserFollowingLoading } = useCollection(currentUserFollowingRef);
  
  const profileFollowersRef = useMemoFirebase(() => collection(firestore, `users/${profileUserId}/followers`), [profileUserId, firestore]);
  const { data: followersList, isLoading: isFollowersLoading } = useCollection(profileFollowersRef);
  
  const profileFollowingRef = useMemoFirebase(() => collection(firestore, `users/${profileUserId}/following`), [profileUserId, firestore]);
  const { data: followingList, isLoading: isFollowingLoading } = useCollection(profileFollowingRef);

  // --- Highlights Logic ---
    const highlightsQuery = useMemoFirebase(() => {
        if (!profileUserId) return null;
        return query(
            collection(firestore, `users/${profileUserId}/highlights`),
            orderBy('createdAt', 'desc'),
            limit(12)
        );
    }, [profileUserId, firestore]);
    const { data: highlights, isLoading: areHighlightsLoading } = useCollection<Highlight>(highlightsQuery);

  // --- Likes Logic ---
  const userBroadcastsQuery = useMemoFirebase(() => {
    if (!profileUserId) return null;
    return query(collection(firestore, 'broadcasts'), where('hostId', '==', profileUserId));
  }, [profileUserId, firestore]);
  const { data: userBroadcasts, isLoading: areBroadcastsLoading } = useCollection(userBroadcastsQuery);
  
  const isOwnProfile = currentUser?.uid === profileUserId;
  const isSubmitting = isUploadingAvatar || isUploadingCover;


  useEffect(() => {
    if (!userBroadcasts || !firestore) {
      setTotalLikes(0);
      return;
    }

    let isMounted = true;
    
    // A more accurate and stable one-time fetch for total likes.
    const fetchAllLikes = async () => {
        if (userBroadcasts.length === 0) {
            if (isMounted) setTotalLikes(0);
            return;
        }

        const counts = await Promise.all(userBroadcasts.map(async broadcast => {
            const likesColRef = collection(firestore, 'broadcasts', broadcast.id, 'likes');
            const snapshot = await getCountFromServer(likesColRef);
            return snapshot.data().count;
        }));

        if (isMounted) {
            const total = counts.reduce((sum, count) => sum + count, 0);
            setTotalLikes(total);
        }
    };
    
    fetchAllLikes();

    return () => {
      isMounted = false;
    };
  }, [userBroadcasts, firestore]);

  const isFollowing = useMemo(() => {
    return currentUserFollowingList?.some(follow => follow.id === profileUserId) || false;
  }, [currentUserFollowingList, profileUserId]);

  const handleFollowToggle = async () => {
    if (!currentUser || !currentUserDocument) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to follow users.',
        variant: 'destructive',
      });
      return;
    }

    const batch = writeBatch(firestore);
    const followingDocRef = doc(firestore, `users/${currentUser.uid}/following`, profileUserId);
    const followerDocRef = doc(firestore, `users/${profileUserId}/followers`, currentUser.uid);

    if (isFollowing) {
      batch.delete(followingDocRef);
      batch.delete(followerDocRef);
      toast({ title: `Unfollowed ${userDocument?.username}` });
    } else {
      const followData = { userId: currentUser.uid, timestamp: serverTimestamp() };
      batch.set(followingDocRef, followData);
      batch.set(followerDocRef, followData);
      
      const notificationsCollectionRef = collection(firestore, `users/${profileUserId}/notifications`);
      const notificationData = {
          userId: profileUserId,
          type: 'follow',
          actorId: currentUser.uid,
          actorName: currentUserDocument.username || 'Someone',
          actorAvatar: currentUserDocument.profilePicture || '',
          isRead: false,
          timestamp: serverTimestamp(),
      };
      const newNotifRef = doc(notificationsCollectionRef);
      batch.set(newNotifRef, notificationData);

      toast({ title: `Followed ${userDocument?.username}` });
    }

    try {
      await batch.commit();
    } catch (error: any) {
      console.error("Failed to follow/unfollow:", error);
      toast({
        title: 'Something went wrong',
        description: error.message || 'Could not update follow status.',
        variant: 'destructive',
      });
    }
  };

  const uploadFile = (file: File, path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!storage) {
        reject(new Error("Firebase Storage is not available."));
        return;
      }
      const fileRef = storageRef(storage, path);
      const uploadTask = uploadBytesResumable(fileRef, file);

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
    if (!file || !currentUser) return;

    setAvatarPreview(URL.createObjectURL(file));
    setIsUploadingAvatar(true);

    try {
      const path = `avatars/${currentUser.uid}/${Date.now()}-${file.name}`;
      const downloadURL = await uploadFile(file, path);
      const userDocRef = doc(firestore, 'users', currentUser.uid);
      await setDoc(userDocRef, { profilePicture: downloadURL }, { merge: true });
      toast({ title: 'Avatar updated successfully!' });
      revalidateProfilePaths();
      setAvatarPreview(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Avatar Upload Failed', description: 'Please try again.' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    const fileType = file.type.startsWith('video') ? 'video' : 'image';
    const objectUrl = URL.createObjectURL(file);
    setCoverPreviewType(fileType);

    if (fileType === 'video') {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = async () => {
            window.URL.revokeObjectURL(video.src);
            if (video.duration > 30) {
                toast({
                    variant: 'destructive',
                    title: 'Video Too Long',
                    description: 'Cover videos must be 30 seconds or less.',
                });
                setCoverPreview(null);
                setCoverPreviewType(null);
                return;
            }
            await uploadCover(file, fileType, objectUrl);
        };
        video.src = objectUrl;
    } else {
        await uploadCover(file, fileType, objectUrl);
    }
  };

  const uploadCover = async (file: File, fileType: 'image' | 'video', previewUrl: string) => {
    if (!currentUser) return;
    setCoverPreview(previewUrl);
    setIsUploadingCover(true);
    try {
        const path = `covers/${currentUser.uid}/${Date.now()}-${file.name}`;
        const downloadURL = await uploadFile(file, path);
        const userDocRef = doc(firestore, 'users', currentUser.uid);
        await setDoc(userDocRef, { coverUrl: downloadURL, coverType: fileType }, { merge: true });
        toast({ title: 'Cover updated successfully!' });
        revalidateProfilePaths();
        setCoverPreview(null);
        setCoverPreviewType(null);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Cover Upload Failed', description: 'Please try again.' });
    } finally {
        setIsUploadingCover(false);
    }
  };
  
  const isLoading = isDocLoading || isCurrentUserFollowingLoading || isFollowersLoading || isFollowingLoading || areBroadcastsLoading || areHighlightsLoading;
  const currentCoverUrl = coverPreview || userDocument?.coverUrl;
  const currentCoverType = coverPreviewType || userDocument?.coverType;

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!userDocument) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h2 className="text-2xl font-bold">User Not Found</h2>
        <p className="text-muted-foreground">This profile could not be located.</p>
      </div>
    );
  }
  
  return (
    <>
      <SettingsModal 
        open={isSettingsModalOpen} 
        onOpenChange={setIsSettingsModalOpen}
        onEditProfileClick={() => {
            setIsSettingsModalOpen(false);
            setIsEditProfileModalOpen(true);
        }}
        onAccountClick={() => {
            setIsSettingsModalOpen(false);
            setIsAccountModalOpen(true);
        }}
       />
      <EditProfileModal open={isEditProfileModalOpen} onOpenChange={setIsEditProfileModalOpen} />
      <AccountModal open={isAccountModalOpen} onOpenChange={setIsAccountModalOpen} />
      
      <Dialog open={!!selectedHighlight} onOpenChange={(open) => !open && setSelectedHighlight(null)}>
        <DialogContent className="bg-black border-none shadow-none p-0 max-w-full h-full sm:h-auto sm:max-w-3xl">
            {selectedHighlight && (
                <>
                  <VisuallyHidden>
                    <DialogTitle>{`Highlight video: ${selectedHighlight.title}`}</DialogTitle>
                    <DialogDescription>A full-screen video player for the highlight titled "{selectedHighlight.title}".</DialogDescription>
                  </VisuallyHidden>
                  <div className="relative w-full h-full flex items-center justify-center">
                      <video
                          src={selectedHighlight.videoUrl}
                          controls
                          autoPlay
                          loop
                          playsInline
                          className="max-w-full max-h-full object-contain"
                      />
                  </div>
                </>
            )}
        </DialogContent>
      </Dialog>


      <div className="container mx-auto max-w-4xl pb-8 sm:px-0 md:px-4 relative">
        <Tabs defaultValue="highlights" className="w-full">
          <Card className="overflow-hidden mb-2 rounded-b-lg sm:rounded-t-lg">
              <div className="relative h-48 w-full bg-muted group">
                {currentCoverType === 'video' && currentCoverUrl ? (
                      <video
                          key={currentCoverUrl}
                          src={currentCoverUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="object-cover w-full h-full"
                      />
                  ) : currentCoverUrl && currentCoverType === 'image' ? (
                      <Image 
                          src={currentCoverUrl}
                          alt="Cover photo"
                          fill
                          className="object-cover"
                      />
                  ) : (
                      <div className="h-full w-full bg-muted" />
                  )}
                  {isOwnProfile && (
                    <>
                      <div 
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={() => !isSubmitting && coverInputRef.current?.click()}
                      >
                        {isUploadingCover ? (
                          <Loader2 className="h-8 w-8 text-white animate-spin" />
                        ) : (
                          <div className="text-center text-white pb-4">
                            <ImageIcon className="mx-auto h-8 w-8" />
                            <p className="text-xs font-semibold mt-1">Change Cover</p>
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
                    </>
                  )}
                {isOwnProfile && (
                  <Button size="icon" variant="secondary" className="absolute top-3 right-3" onClick={() => setIsSettingsModalOpen(true)}>
                      <Settings className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex flex-col items-center p-6 pt-0 -mt-24">
                <div className="relative group">
                    <Avatar className="w-28 h-28">
                        <AvatarImage src={avatarPreview || userDocument.profilePicture || "https://picsum.photos/seed/profile-placeholder/200"} alt={userDocument.username || ''} />
                        <AvatarFallback className="text-4xl">{userDocument.username?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {isOwnProfile && (
                        <>
                            <div 
                                className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                onClick={() => !isSubmitting && avatarInputRef.current?.click()}
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
                        </>
                    )}
                </div>
                <h1 className="text-3xl font-bold font-headline mt-4">{userDocument.username || 'Anonymous'}</h1>
                <p className="text-center text-muted-foreground max-w-lg mt-2">{userDocument.bio}</p>
                
                <div className="flex items-center gap-6 mt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{followersList?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Followers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{followingList?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Following</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{totalLikes.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Likes</p>
                  </div>
                </div>

                {!isOwnProfile && currentUser && (
                  <div className="mt-6 flex items-center gap-2">
                    <Button
                      onClick={handleFollowToggle}
                      variant={isFollowing ? 'secondary' : 'outline'}
                      size="lg"
                      className={!isFollowing ? "bg-transparent border-white text-white hover:bg-white hover:text-black" : ""}
                    >
                      {isFollowing ? <UserCheck className="mr-2" /> : <UserPlus className="mr-2" />}
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                     <Button asChild variant="outline" size="lg">
                        <Link href={`/inbox-page?with=${profileUserId}`}>
                          <MessageSquare className="mr-2" />
                          Message
                        </Link>
                     </Button>
                  </div>
                )}
              </div>
            <TabsList className="grid w-full grid-cols-2 rounded-none border-t">
              <TabsTrigger value="highlights" className="text-white data-[state=active]:font-bold">Highlights</TabsTrigger>
              <TabsTrigger value="gifts" className="text-white data-[state=active]:font-bold">Gifts</TabsTrigger>
            </TabsList>
          </Card>

          <TabsContent value="highlights" className="sm:rounded-lg">
            {areHighlightsLoading ? (
               <div className="grid grid-cols-3 gap-1">
                  {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-[9/16]"/>)}
              </div>
            ) : highlights && highlights.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1">
                {highlights.map((highlight) => (
                    <div 
                        key={highlight.id} 
                        className="relative group aspect-[9/16] overflow-hidden sm:rounded-md bg-muted cursor-pointer"
                        onClick={() => setSelectedHighlight(highlight)}
                    >
                        <video
                            src={highlight.videoUrl}
                            loop
                            muted
                            playsInline
                            className="object-cover w-full h-full transition-transform group-hover:scale-105"
                            onMouseOver={e => e.currentTarget.play()}
                            onMouseOut={e => e.currentTarget.pause()}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute bottom-2 left-2 text-white">
                          <p className="text-xs font-bold truncate">{highlight.title}</p>
                        </div>
                    </div>
                ))}
              </div>
            ) : isNewUser && isOwnProfile ? (
                <div className="text-center py-16 text-muted-foreground bg-card rounded-b-lg">
                    <h3 className="text-lg font-semibold text-white">Welcome to LIVENET!</h3>
                    <p className="mt-4">Your profile is ready. Customize it or jump right into the action.</p>
                    <Button asChild size="lg" className="mt-6">
                        <Link href="/feed">
                            Explore the Feed
                            <ArrowRight className="ml-2" />
                        </Link>
                    </Button>
                </div>
            ) : (
                <div className="text-center py-16 text-muted-foreground bg-card rounded-b-lg">
                    <Video className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">No Highlights Yet</h3>
                    {isOwnProfile ? (
                       <div className="mt-4 space-y-2">
                            <p>Your profile is your stage. Upload your first highlight!</p>
                        </div>
                    ) : (
                        <p>This user hasn't shared any highlights.</p>
                    )}
                </div>
            )}
          </TabsContent>
           <TabsContent value="gifts">
            <Card className="sm:rounded-lg">
                <CardContent className="p-6">
                    <div className="text-center py-16 text-white">
                        <Gift className="h-12 w-12 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white">Coming Soon!</h3>
                        <p className="text-sm text-zinc-400">This feature is under construction. Check back later to see all the gifts this creator has received.</p>
                    </div>
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function ProfileSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl py-8 sm:px-0 md:px-4">
      <Tabs defaultValue="highlights" className="w-full">
        <Card className="overflow-hidden mb-2 sm:rounded-lg">
          <Skeleton className="h-48 w-full" />
          <div className="flex flex-col items-center p-6 pt-0 -mt-24">
            <Skeleton className="w-28 h-28 rounded-full border-4 border-background ring-4 ring-white" />
            <Skeleton className="h-9 w-48 mt-4" />
            <Skeleton className="h-5 w-80 mt-3" />
            
            <div className="flex items-center gap-6 mt-6">
              <div className="text-center">
                <Skeleton className="h-7 w-12 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="text-center">
                <Skeleton className="h-7 w-12 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
               <div className="text-center">
                <Skeleton className="h-7 w-12 mb-1" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2">
              <Skeleton className="h-12 w-32 rounded-md" />
              <Skeleton className="h-12 w-32 rounded-md" />
            </div>
          </div>
           <Skeleton className="h-10 w-full rounded-none" />
        </Card>
         <TabsContent value="highlights" className="mt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1">
                  {[...Array(8)].map((_, i) => <Skeleton key={i} className="aspect-[9/16] sm:rounded-md"/>)}
              </div>
          </TabsContent>
      </Tabs>
    </div>
  );
}
