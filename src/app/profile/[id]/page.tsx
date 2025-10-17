
'use client';
import { useUserDocumentById } from '@/firebase/firestore/use-user-document';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams } from 'next/navigation';

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  
  const { userDocument, isDocLoading } = useUserDocumentById(userId);

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
        <CardHeader className="text-center">
           <div className="relative w-24 h-24 mx-auto">
              <Avatar className="w-24 h-24 border-4 border-primary">
                <AvatarImage src={userDocument.profilePicture} />
                <AvatarFallback className="text-3xl">{userDocument.username?.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
          <CardTitle className="mt-4 text-3xl font-headline">{userDocument.username || 'Anonymous'}</CardTitle>
          <CardDescription>{userDocument.bio}</CardDescription>
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
        <CardHeader className="text-center">
          <Skeleton className="w-24 h-24 rounded-full mx-auto" />
          <Skeleton className="h-8 w-48 mt-4 mx-auto" />
          <Skeleton className="h-4 w-64 mt-2 mx-auto" />
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
