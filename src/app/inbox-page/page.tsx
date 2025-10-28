
'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { notFound, useSearchParams } from 'next/navigation';
import { useChatContext, Channel, Window, MessageList, MessageInput, Thread, LoadingIndicator, useChannelStateContext, CustomStyles } from 'stream-chat-react';
import { useUser, useUserDocumentById } from '@/firebase';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { UserProfile } from '@/firebase/firestore/use-user-document';


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
          // This view is for when no chat is selected.
           <div className="flex-1 flex flex-col" />
      )
  }

  return (
    <div className="h-screen w-full flex flex-col bg-black text-white">
        <Channel channel={activeChannel} EmptyStateIndicator={() => null}>
            <div className="flex-1 flex flex-col">
                <div className="flex-1 min-h-0">
                    <Window>
                        <MessageList />
                    </Window>
                </div>
                <div className="p-4 border-t border-zinc-800">
                    <MessageInput />
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
