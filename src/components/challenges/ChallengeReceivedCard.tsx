
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc, serverTimestamp, collection } from 'firebase/firestore';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Swords, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { UserProfile } from '@/firebase';
import { useUserDocument } from '@/firebase';

interface ChallengeReceivedCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challenge: any; // Using any to avoid type issues with combined feed
}

export default function ChallengeReceivedCard({ open, onOpenChange, challenge }: ChallengeReceivedCardProps) {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { userDocument } = useUserDocument();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!challenge) return null;

  const handleResponse = async (accepted: boolean) => {
    if (!user || !challenge.id || !userDocument) return;
    setIsProcessing(true);

    const challengeRef = doc(firestore, `users/${user.uid}/challenges`, challenge.id);
    const notificationCollectionRef = collection(firestore, `users/${challenge.fromUserId}/notifications`);

    try {
      if (accepted) {
        await updateDoc(challengeRef, { status: 'accepted' });
        // Can't send notification in a batch, so sending it non-blockingly
        addDocumentNonBlocking(notificationCollectionRef, {
            userId: challenge.fromUserId,
            type: 'comment', // Using 'comment' type for icon similarity. Can be customized.
            actorId: user.uid,
            actorName: userDocument.username || 'Someone',
            actorAvatar: userDocument.profilePicture || '',
            entityInfo: `🚀 accepted your challenge and is going live!`,
            isRead: false,
            timestamp: serverTimestamp()
        });

        toast({ title: 'Challenge Accepted!', description: 'Redirecting you to the studio...' });
        // Redirect to create broadcast page with challenge pre-filled
        const challengeType = challenge.type || 'challenge';
        router.push(`/broadcast/create?challenge=${encodeURIComponent(challenge.text)}&type=${challengeType}`);
      } else {
        await updateDoc(challengeRef, { status: 'rejected' });
        addDocumentNonBlocking(notificationCollectionRef, {
            userId: challenge.fromUserId,
            type: 'comment',
            actorId: user.uid,
            actorName: userDocument.username || 'Someone',
            actorAvatar: userDocument.profilePicture || '',
            entityInfo: `😅 declined your challenge for now.`,
            isRead: false,
            timestamp: serverTimestamp()
        });
        toast({ title: 'Challenge Declined' });
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error responding to challenge:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not process your response.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-sm p-8 rounded-2xl shadow-2xl">
        <VisuallyHidden>
          <DialogTitle>Challenge Received</DialogTitle>
          <DialogDescription>A challenge from user {challenge.fromUsername}. The challenge is: "{challenge.text}". You can accept and go live, or decline.</DialogDescription>
        </VisuallyHidden>
        <div className="flex flex-col items-center text-center">
            <div className="p-4 bg-zinc-800 rounded-full mb-4 border-2 border-primary">
                <Swords className="h-8 w-8 text-primary" />
            </div>

          <h2 className="text-2xl font-bold font-headline mb-2">A Challenger Appears!</h2>
          
          <div className="flex items-center gap-2 mb-6">
            <Avatar className="h-6 w-6">
              <AvatarImage src={challenge.fromUserAvatar} />
              <AvatarFallback>{challenge.fromUsername?.charAt(0)}</AvatarFallback>
            </Avatar>
            <p className="text-sm text-zinc-400">
              From: <span className="font-semibold text-white">@{challenge.fromUsername}</span>
            </p>
          </div>

          <blockquote className="w-full bg-zinc-800 p-6 rounded-xl border border-zinc-700 text-lg font-semibold italic mb-8">
            "{challenge.text}"
          </blockquote>

          <div className="w-full space-y-3">
            <Button
              size="lg"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleResponse(true)}
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Accept & Go Live
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full bg-transparent border-zinc-700 hover:bg-zinc-800"
              onClick={() => handleResponse(false)}
              disabled={isProcessing}
            >
              Decline
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
