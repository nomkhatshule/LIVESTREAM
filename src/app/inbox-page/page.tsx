
'use client';

import { Suspense, useEffect, useState } from 'react';
import { notFound, useSearchParams } from 'next/navigation';
import { useChatContext, Channel, Window, MessageList, MessageInput, Thread, LoadingIndicator, useChannelStateContext } from 'stream-chat-react';
import { useUser, useUserDocumentById } from '@/firebase';
import { Loader2, ArrowLeft, ArrowUp, MessageSquare } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { UserProfile } from '@/firebase/firestore/use-user-document';

function ChannelHeader() {
    const { channel } = useChannelStateContext();
    const { user: currentUser } = useUser();

    const otherUserMember = Object.values(channel.state.members).find(
        (member) => member.user?.id !== currentUser?.uid
    );

    const { userDocument: otherUser, isDocLoading } = useUserDocumentById(otherUserMember?.user?.id);

    if (isDocLoading || !otherUser) {
        return (
             <div className="border-b border-zinc-800 p-3 flex items-center gap-3">
                <div className="h-10 w-10 bg-zinc-800 rounded-full animate-pulse" />
                <div className="h-5 w-32 bg-zinc-800 rounded-md animate-pulse" />
            </div>
        );
    }
    
    return (
        <div className="border-b border-zinc-800 p-3 flex items-center gap-3">
             <Link href="/feed-test">
                <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            </Link>
            <Avatar>
                <AvatarImage src={otherUser.profilePicture} />
                <AvatarFallback>{otherUser.username?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="font-bold">{otherUser.username}</span>
        </div>
    )
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
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-black text-white">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-2">Initializing Chat...</p>
        </div>
    );
  }
  
  if (isCreatingChannel) {
    return (
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-black text-white">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-2">Opening conversation...</p>
        </div>
    );
  }

  if (!activeChannel) {
      return (
           <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground bg-zinc-900">
             <MessageSquare className="h-12 w-12 mb-4"/>
             <h2 className="text-xl font-bold text-foreground">Your Messages</h2>
             <p>Select a conversation to start chatting.</p>
           </div>
      )
  }

  return (
    <div className="h-screen w-full flex flex-col bg-black text-white">
        <Channel channel={activeChannel} EmptyStateIndicator={() => null}>
            <div className="flex-1 flex flex-col">
                 <ChannelHeader />
                <div className="flex-1 min-h-0">
                    <Window>
                        <MessageList />
                    </Window>
                </div>
                <div className="relative p-4 border-t border-zinc-800">
                    <MessageInput />
                    <Button size="icon" className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full">
                        <ArrowUp className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </Channel>
    </div>
  );
}

// Wrap the component in Suspense because it uses useSearchParams
export default function InboxPage() {
    return (
        <Suspense fallback={
             <div className="flex h-screen items-center justify-center bg-black text-white">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        }>
            <InboxPageComponent />
        </Suspense>
    )
}
