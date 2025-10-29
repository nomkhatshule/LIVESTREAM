
'use client';
import { useUserDocumentById, UserProfile } from '@/firebase/firestore/use-user-document';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, useUserDocument } from '@/firebase';
import { Button } from '@/components/ui/button';
import { doc, writeBatch, serverTimestamp, where, query, orderBy, limit, collection, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useMemo, useState } from 'react';
import { UserPlus, UserCheck, MessageSquare, Heart, Eye, Gem, Gift, Video, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import Image from 'next/image';
import { mockGifts, type Highlight } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import SettingsModal from '@/components/profile/SettingsModal';
import EditProfileModal from '@/components/profile/EditProfileModal';
import AccountModal from '@/components/profile/AccountModal';


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
  const { userDocument: currentUserDocument } = useUserDocument();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  
  const { userDocument, isDocLoading } = useUserDocumentById(profileUserId);

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
  
  const totalLikes = useMemo(() => {
    if (!userBroadcasts) return 0;
    // This is a rough estimate. A better solution needs backend aggregation.
    return userBroadcasts.reduce((acc, broadcast) => acc + (broadcast.viewers || 0), 0);
  }, [userBroadcasts]);

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
      
      // Create a notification for the user being followed
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
      // We can't use `addDoc` in a batch, so we create a new doc ref and set it.
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
  
  const isOwnProfile = currentUser?.uid === profileUserId;
  const isLoading = isDocLoading || isCurrentUserFollowingLoading || isFollowersLoading || isFollowingLoading || areBroadcastsLoading || areHighlightsLoading;

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

      <div className="container mx-auto max-w-4xl py-8 px-4">
        <Tabs defaultValue="highlights" className="w-full">
          {/* Profile Header Card */}
          <Card className="overflow-hidden mb-2">
              <div className="relative h-48 w-full bg-muted">
                {userDocument.coverUrl && userDocument.coverType === 'video' ? (
                      <video
                          src={userDocument.coverUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="object-cover w-full h-full"
                      />
                  ) : userDocument.coverUrl && userDocument.coverType === 'image' ? (
                      <Image 
                          src={userDocument.coverUrl}
                          alt="Cover photo"
                          fill
                          className="object-cover"
                      />
                  ) : (
                      <div className="h-full w-full bg-muted" />
                  )}
                {isOwnProfile && (
                  <Button size="icon" variant="secondary" className="absolute top-3 right-3" onClick={() => setIsSettingsModalOpen(true)}>
                      <Settings className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex flex-col items-center p-6 pt-0 -mt-24">
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
                  <div className="mt-6 flex items-center gap-2">
                    <Button onClick={handleFollowToggle} variant={isFollowing ? 'secondary' : 'default'} size="lg">
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
            <TabsList className="grid w-full grid-cols-3 rounded-none border-t">
              <TabsTrigger value="highlights">Highlights</TabsTrigger>
              <TabsTrigger value="gifts">Gifts</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
          </Card>

          {/* Activity Tabs Content */}
          <TabsContent value="highlights">
            {areHighlightsLoading ? (
               <div className="grid grid-cols-3 gap-1">
                  {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-[9/16]"/>)}
              </div>
            ) : highlights && highlights.length > 0 ? (
              <div className="grid grid-cols-3 gap-1">
                {highlights.map((highlight) => (
                    <div key={highlight.id} className="relative group aspect-[9/16] overflow-hidden rounded-md bg-muted">
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
            ) : (
               <div className="text-center py-16 text-muted-foreground bg-card rounded-b-lg">
                    <Video className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">No Highlights Yet</h3>
                    {isOwnProfile ? (
                      <p>Upload your first highlight from the feed!</p>
                    ) : (
                      <p>This user hasn't shared any highlights.</p>
                    )}
                  </div>
            )}
          </TabsContent>
           <TabsContent value="gifts">
            <Card>
              <CardContent className="p-6">
                  {mockGifts.length > 0 ? (
                      <div className="space-y-8">
                          <div>
                              <h3 className="text-lg font-semibold font-headline flex items-center mb-4"><Gem className="mr-2 h-5 w-5 text-primary"/> Legendary Gifts</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {mockGifts.filter(g => g.rarity === 'Legendary').map(gift => (
                                       <div key={gift.id} className="bg-muted/50 rounded-lg p-4 flex items-center gap-4">
                                           <Image src={gift.imageUrl} alt={gift.name} width={80} height={80} className="drop-shadow-lg" />
                                           <div className="flex-1">
                                               <h4 className="font-bold text-lg">{gift.name}</h4>
                                               <p className="text-sm text-muted-foreground">{gift.description}</p>
                                               <p className="text-xs text-muted-foreground mt-2">Top Gifter: <span className="font-semibold text-primary">{gift.topGifter}</span></p>
                                           </div>
                                           <Badge variant="destructive" className="self-start">x{gift.count}</Badge>
                                       </div>
                                  ))}
                              </div>
                          </div>
                           <div>
                              <h3 className="text-lg font-semibold font-headline flex items-center mb-4"><Gift className="mr-2 h-5 w-5 text-secondary-foreground"/> Epic & Rare Gifts</h3>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                  {mockGifts.filter(g => g.rarity !== 'Legendary').map(gift => (
                                       <div key={gift.id} className="bg-muted/50 rounded-lg p-3 flex flex-col items-center text-center">
                                           <Image src={gift.imageUrl} alt={gift.name} width={64} height={64} className="drop-shadow-md" />
                                           <h4 className="font-bold text-sm mt-2">{gift.name}</h4>
                                           <p className="text-xs text-muted-foreground">x{gift.count}</p>
                                       </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  ) : (
                      <div className="text-center py-12 text-muted-foreground">
                          <p>No gifts received yet.</p>
                          <p className="text-sm">Support this creator during their next live stream!</p>
                      </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>
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
        </Tabs>
      </div>
    </>
  );
}

function ProfileSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <Card className="overflow-hidden mb-8">
        <Skeleton className="h-48 w-full" />
        <div className="flex flex-col items-center p-6 -mt-24">
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
        <Skeleton className="h-10 w-full" />
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
