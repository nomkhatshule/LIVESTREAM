
'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { UserSearch } from '@/components/search/user-search';
import { useUser, useUserDocument, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { Hit as AlgoliaHit } from 'instantsearch.js';
import { Loader2 } from 'lucide-react';

interface SendChallengeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challengeText: string;
  onSend: () => void;
}

type UserHit = AlgoliaHit<{
  objectID: string;
  username: string;
}>;

export default function SendChallengeSheet({
  open,
  onOpenChange,
  challengeText,
  onSend,
}: SendChallengeSheetProps) {
  const { user: currentUser } = useUser();
  const { userDocument: currentUserDocument } = useUserDocument();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

  const handleSelectUser = async (selectedUser: UserHit) => {
    if (!currentUser || !currentUserDocument || !firestore) {
      toast({ variant: 'destructive', title: 'You must be logged in to send challenges.' });
      return;
    }
    
    if (currentUser.uid === selectedUser.objectID) {
      toast({ variant: 'destructive', title: 'You cannot challenge yourself.' });
      return;
    }

    setIsSending(true);

    try {
      // The collection where we store challenges sent TO the selected user
      const challengesCollectionRef = collection(firestore, `users/${selectedUser.objectID}/challenges`);

      await addDocumentNonBlocking(challengesCollectionRef, {
        text: challengeText,
        fromUserId: currentUser.uid,
        fromUsername: currentUserDocument.username || 'Anonymous',
        fromUserAvatar: currentUserDocument.profilePicture || '',
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      
      toast({
        title: 'Challenge Sent!',
        description: `Your challenge has been sent to @${selectedUser.username}.`,
      });

      onSend();
      onOpenChange(false);

    } catch (error) {
      console.error("Error sending challenge:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not send the challenge.' });
    } finally {
      setIsSending(false);
    }
  };

  const handlePostToPublic = () => {
    toast({ title: 'Coming Soon!', description: 'Posting to the public board will be available soon.' });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] bg-black text-white border-zinc-700">
        <SheetHeader>
          <SheetTitle>Send Challenge To...</SheetTitle>
          <SheetDescription className="text-stone-200">
            Select a friend to send this challenge to, or post it publicly.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4 h-[70vh] flex flex-col">
            {isSending ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Sending challenge...</p>
                </div>
            ) : (
                 <div className="flex-1 flex flex-col min-h-0">
                    <UserSearch
                        onSelectUser={handleSelectUser}
                        showSeparator={false}
                        searchBoxPlaceholder='Search for a friend...'
                    />
                    <div className="mt-auto pt-4 border-t border-zinc-700">
                        <Button className="w-full bg-white text-black hover:bg-zinc-200" onClick={handlePostToPublic}>
                            Post to Public Challenge Board
                        </Button>
                    </div>
                </div>
            )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
