
'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChatContext, Channel, Window, MessageList, MessageInput, Thread, LoadingIndicator, useChannelStateContext } from 'stream-chat-react';
import { useUser, useUserDocumentById } from '@/firebase';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

/**
 * CustomEmptyState is the "digital handshake" shown when a conversation is empty.
 * It displays the other user's profile information.
 */
function CustomEmptyState() {
    const { user } = useUser();
    const { channel } = useChannelStateContext();

    // Find the other member of the chat
    const otherMember = useMemo(() => {
        if (!user || !channel.state.members) return null;
        const memberArray = Object.values(channel.state.members);
        return memberArray.find(member => member.user?.id !== user.uid);
    }, [channel, user]);
    
    const { userDocument, isDocLoading } = useUserDocumentById(otherMember?.user?.id);

    if (isDocLoading || !userDocument) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-4">
             <Avatar className="w-24 h-24 text-4xl">
                <AvatarImage src={userDocument.profilePicture} alt={userDocument.username} />
                <AvatarFallback>{userDocument.username?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-center">
                <h2 className="text-xl font-bold font-headline">{userDocument.username}</h2>
                <p className="text-sm text-muted-foreground">User on AgoraLive</p>
                <p className="text-sm text-muted-foreground max-w-xs mt-1">{userDocument.bio}</p>
            </div>
            <Button variant="secondary" asChild>
                <Link href={`/profile/${otherMember?.user?.id}`}>View Profile</Link>
            </Button>
        </div>
    );
}


function InboxPageComponent() {
  const searchParams = useSearchParams();
  const { client, setActiveChannel, channel: activeChannel } = useChatContext();
  const { user } = useUser();
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  
  const withUserId = searchParams.get('with');

  useEffect(() => {
    if (withUserId && client && user) {
        setIsCreatingChannel(true);
        const channel = client.channel('messaging', {
            members: [user.uid, withUserId],
        });
        channel.watch().then(() => {
            setActiveChannel(channel);
            setIsCreatingChannel(false);
        }).catch(err => {
            console.error("Failed to watch channel:", err);
            setIsCreatingChannel(false);
        })
    }
  }, [withUserId, client, user, setActiveChannel]);

  if (!client || !user) {
    return (
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-2">Initializing Chat...</p>
        </div>
    );
  }
  
  if (isCreatingChannel) {
    return (
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-2">Starting conversation...</p>
        </div>
    );
  }

  if (!activeChannel) {
      return (
           <div className="flex h-screen w-full items-center justify-center text-muted-foreground">
                <p>No conversation selected.</p>
            </div>
      )
  }

  return (
    <div className="h-screen">
        <Channel channel={activeChannel} EmptyStateIndicator={CustomEmptyState}>
            <div className="flex flex-col h-full">
                {/* Custom Header */}
                <div className="flex items-center gap-3 p-2 border-b">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/feed-test">
                           <ArrowLeft />
                        </Link>
                    </Button>
                    {/* In a real implementation, we'd get the other user's info here */}
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="https://picsum.photos/seed/preview-user/40" />
                        <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <p className="font-bold font-headline">Username</p>
                </div>

                {/* Message Area */}
                <div className="flex-1">
                    <Window>
                        <MessageList />
                    </Window>
                </div>
                
                {/* Input Area */}
                <div className="p-2 border-t bg-background">
                    <MessageInput />
                </div>

                {/* This is only for threads, not part of our main design but required by the library */}
                <Thread />
            </div>
        </Channel>
    </div>
  );
}

// Wrap the component in Suspense because it uses useSearchParams
export default function InboxPage() {
    return (
        <Suspense fallback={
             <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        }>
            <InboxPageComponent />
        </Suspense>
    )
}
