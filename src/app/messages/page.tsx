
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChatContext, Channel, ChannelList, Window, MessageList, MessageInput, Thread, LoadingIndicator } from 'stream-chat-react';
import { useUser } from '@/firebase';
import type { Channel as StreamChannel } from 'stream-chat';
import { Loader2 } from 'lucide-react';

function MessagingPageComponent() {
  const searchParams = useSearchParams();
  const { client, setActiveChannel } = useChatContext();
  const { user } = useUser();
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);

  useEffect(() => {
    const withUserId = searchParams.get('with');
    
    if (withUserId && client && user && user.uid) {
      const createChannel = async () => {
        setIsCreatingChannel(true);
        // Prevent creating a channel with oneself
        if (withUserId === user.uid) {
          setIsCreatingChannel(false);
          return;
        }

        const channel = client.channel('messaging', {
          members: [user.uid, withUserId],
        });
        
        await channel.watch();
        setActiveChannel(channel);
        setIsCreatingChannel(false);
      };

      createChannel();
    }
  }, [searchParams, client, user, setActiveChannel]);

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

  return (
    <div className="h-[calc(100vh-4rem)]">
        <div className="flex h-full">
            <div className="w-full md:w-80 lg:w-96 border-r">
                <ChannelList
                    filters={{ type: 'messaging', members: { $in: [user.uid] } }}
                    sort={{ last_message_at: -1 }}
                />
            </div>
            <div className="hidden md:flex flex-1">
                 <Channel>
                    <Window>
                        <MessageList />
                        <MessageInput />
                    </Window>
                    <Thread />
                </Channel>
            </div>
        </div>
    </div>
  );
}

// Wrap the component in Suspense because it uses useSearchParams
export default function MessagesPage() {
    return (
        <Suspense fallback={
             <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        }>
            <MessagingPageComponent />
        </Suspense>
    )
}
