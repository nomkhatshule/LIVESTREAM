
'use client';
import { useUserDocumentById } from '@/firebase/firestore/use-user-document';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { doc, writeBatch, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useMemo } from 'react';
import { collection } from 'firebase/firestore';
import { UserPlus, UserCheck } from 'lucide-react';

export default function UserProfilePage() {
  const params = useParams();
  const profileUserId = params.id as string;
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const { userDocument, isDocLoading } = useUserDocumentById(profileUserId);

  // --- Follower/Following Logic ---
  const followingRef = useMemoFirebase(() => currentUser ? collection(firestore, `users/${currentUser.uid}/following`) : null, [currentUser, firestore]);
  const followersRef = useMemoFirebase(() => collection(firestore, `users/${profileUserId}/followers`), [profileUserId, firestore]);
  const { data: followingList } = useCollection(followingRef);
  const { data: followersList } = useCollection(followersRef);
  
  const isFollowing = useMemo(() => {
    return followingList?.some(follow => follow.id === profileUserId) || false;
  }, [followingList, profileUserId]);

  const handleFollowToggle = async () => {
    if (!currentUser) {
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
      // --- Unfollow Logic ---
      batch.delete(followingDocRef);
      batch.delete(followerDocRef);
      toast({ title: `Unfollowed ${userDocument?.username}` });
    } else {
      // --- Follow Logic ---
      const followData = { userId: currentUser.uid, timestamp: serverTimestamp() };
      batch.set(followingDocRef, followData);
      batch.set(followerDocRef, followData);
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
  
  const isOwnProfile = currentUser?.uid === profileUserId;

  if (isDocLoading) {
    return <ProfileSkeleton />;
  }

  if (!userDocument) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>User profile not found.</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
      <Card>
        <CardHeader>
           <div className="flex flex-col items-center text-center">
              <Avatar className="w-24 h-24 border-4 border-primary mb-4">
                <AvatarImage src={userDocument.profilePicture} />
                <AvatarFallback className="text-3xl">{userDocument.username?.charAt(0)}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-3xl font-headline">{userDocument.username || 'Anonymous'}</CardTitle>
              <CardDescription>{userDocument.bio}</CardDescription>
           </div>
           <div className="flex justify-center gap-6 text-center mt-6">
              <div>
                <p className="text-2xl font-bold">{followersList?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Followers</p>
              </div>
              <div>
                 <p className="text-2xl font-bold">{followingList?.length || 0}</p>
                 <p className="text-sm text-muted-foreground">Following</p>
              </div>
           </div>
           {!isOwnProfile && currentUser && (
             <div className="flex justify-center mt-6">
                <Button onClick={handleFollowToggle} variant={isFollowing ? 'secondary' : 'default'}>
                  {isFollowing ? <UserCheck className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
             </div>
           )}
        </CardHeader>
        <CardContent>
            <p className="text-center text-muted-foreground">More user content coming soon!</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
      <Card>
        <CardHeader className="text-center items-center">
          <Skeleton className="w-24 h-24 rounded-full" />
          <Skeleton className="h-8 w-48 mt-4" />
          <Skeleton className="h-4 w-64 mt-2" />
           <div className="flex justify-center gap-6 text-center mt-6">
              <div>
                <Skeleton className="h-7 w-12 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div>
                 <Skeleton className="h-7 w-12 mb-1" />
                 <Skeleton className="h-4 w-20" />
              </div>
           </div>
           <Skeleton className="h-10 w-28 mt-6" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
