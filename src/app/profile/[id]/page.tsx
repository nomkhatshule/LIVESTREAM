
'use client';
import { useUserDocumentById } from '@/firebase/firestore/use-user-document';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { doc, writeBatch, serverTimestamp, where, query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useMemo } from 'react';
import { collection } from 'firebase/firestore';
import { UserPlus, UserCheck, MessageSquare, Heart } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import Image from 'next/image';

// Mock data for recent activity - in a real app this would be a Firestore query
const mockActivity = [
    { id: 1, broadcastTitle: "Final Boss Takedown!", message: "Let's gooooo! You got this! 🚀", timestamp: "2 hours ago", broadcastId: "broadcast-1" },
    { id:2, broadcastTitle: "Live DJ Set - Deep House", message: "This track is fire! 🔥", timestamp: "1 day ago", broadcastId: "broadcast-2" },
    { id:3, broadcastTitle: "Making Ramen from Scratch", message: "What kind of broth is that? Looks delicious!", timestamp: "3 days ago", broadcastId: "broadcast-3" },
]

export default function UserProfilePage() {
  const params = useParams();
  const profileUserId = params.id as string;
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const { userDocument, isDocLoading } = useUserDocumentById(profileUserId);

  // --- Follower/Following Logic ---
  const currentUserFollowingRef = useMemoFirebase(() => currentUser ? collection(firestore, `users/${currentUser.uid}/following`) : null, [currentUser, firestore]);
  const { data: currentUserFollowingList, isLoading: isCurrentUserFollowingLoading } = useCollection(currentUserFollowingRef);
  
  const profileFollowersRef = useMemoFirebase(() => collection(firestore, `users/${profileUserId}/followers`), [profileUserId, firestore]);
  const { data: followersList, isLoading: isFollowersLoading } = useCollection(profileFollowersRef);
  
  const profileFollowingRef = useMemoFirebase(() => collection(firestore, `users/${profileUserId}/following`), [profileUserId, firestore]);
  const { data: followingList, isLoading: isFollowingLoading } = useCollection(profileFollowingRef);

  // --- Likes Logic ---
  const userBroadcastsQuery = useMemoFirebase(() => {
    if (!profileUserId) return null;
    return query(collection(firestore, 'broadcasts'), where('hostId', '==', profileUserId));
  }, [profileUserId, firestore]);
  const { data: userBroadcasts, isLoading: areBroadcastsLoading } = useCollection(userBroadcastsQuery);
  
  const totalLikes = useMemo(() => {
    if (!userBroadcasts) return 0;
    // In a real, large-scale app, this aggregation would be done on the backend.
    // For this prototype, we're assuming the number of broadcasts per user is small.
    // The `likes` subcollection count isn't directly available, so we rely on the `viewers` field as a proxy for engagement.
    // A more accurate client-side way would be to fetch all likes for all broadcasts, which is very inefficient.
    // Let's use `viewers` as a rough estimate for "likes" for now. A better solution needs backend aggregation.
    return userBroadcasts.reduce((acc, broadcast) => acc + (broadcast.viewers || 0), 0);
  }, [userBroadcasts]);

  const isFollowing = useMemo(() => {
    return currentUserFollowingList?.some(follow => follow.id === profileUserId) || false;
  }, [currentUserFollowingList, profileUserId]);

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
  const isLoading = isDocLoading || isCurrentUserFollowingLoading || isFollowersLoading || isFollowingLoading || areBroadcastsLoading;

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
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Profile Header Card */}
      <Card className="overflow-hidden mb-8">
        <div className="relative h-32 w-full">
           <Image 
                src="https://picsum.photos/seed/cover-1/1000/200"
                alt="Cover photo"
                fill
                className="object-cover"
                data-ai-hint="abstract landscape"
           />
        </div>
        <div className="flex flex-col items-center p-6 -mt-16">
          <Avatar className="w-28 h-28 border-4 border-background ring-4 ring-primary">
            <AvatarImage src={userDocument.profilePicture || "https://picsum.photos/seed/profile-placeholder/200"} alt={userDocument.username || ''} />
            <AvatarFallback className="text-4xl">{userDocument.username?.charAt(0)}</AvatarFallback>
          </Avatar>
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
            <div className="mt-6">
              <Button onClick={handleFollowToggle} variant={isFollowing ? 'secondary' : 'default'} size="lg">
                {isFollowing ? <UserCheck className="mr-2" /> : <UserPlus className="mr-2" />}
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Activity Tabs */}
      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto">
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="about" disabled>About</TabsTrigger>
        </TabsList>
        <TabsContent value="activity">
          <Card>
            <CardContent className="p-6 space-y-6">
              {mockActivity.map(activity => (
                <div key={activity.id} className="flex items-start gap-4">
                  <div className="bg-secondary p-3 rounded-full flex-shrink-0">
                    <MessageSquare className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Commented on <Link href={`/broadcast/${activity.broadcastId}`} className="font-semibold text-foreground hover:underline">{activity.broadcastTitle}</Link>
                    </p>
                    <p className="p-3 bg-muted/50 rounded-lg mt-1 italic">"{activity.message}"</p>
                     <p className="text-xs text-muted-foreground mt-1.5">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
              {mockActivity.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No recent activity.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="about">
          {/* Future "About" content will go here */}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <Card className="overflow-hidden mb-8">
        <Skeleton className="h-32 w-full" />
        <div className="flex flex-col items-center p-6 -mt-16">
          <Skeleton className="w-28 h-28 rounded-full border-4 border-background ring-4 ring-primary" />
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
          <Skeleton className="h-12 w-32 mt-6" />
        </div>
      </Card>
       <Tabs defaultValue="activity" className="w-full">
        <Skeleton className="h-10 w-full max-w-sm mx-auto" />
        <TabsContent value="activity">
            <Card>
                <CardContent className="p-6 space-y-6">
                   {[...Array(2)].map((_, i) => (
                     <div key={i} className="flex items-start gap-4">
                       <Skeleton className="w-11 h-11 rounded-full" />
                       <div className="flex-1 space-y-2">
                         <Skeleton className="h-4 w-3/4" />
                         <Skeleton className="h-10 w-full" />
                         <Skeleton className="h-3 w-1/4" />
                       </div>
                     </div>
                   ))}
                </CardContent>
            </Card>
        </TabsContent>
       </Tabs>
    </div>
  );
}
