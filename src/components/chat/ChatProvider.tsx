'use client';

import { useState, useEffect, ReactNode } from 'react';
import { StreamChat } from 'stream-chat';
import { Chat, OverlayProvider } from 'stream-chat-react';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatProviderProps {
  children: ReactNode;
}

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;

export function ChatProvider({ children }: ChatProviderProps) {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);

  useEffect(() => {
    if (!user || !apiKey) {
      if (chatClient) {
        chatClient.disconnectUser();
        setChatClient(null);
      }
      return;
    }

    let client = StreamChat.getInstance(apiKey);
    let didConnect = false;

    const connectUser = async () => {
      try {
        const response = await fetch('/api/stream/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid }),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch stream token for chat.');
        }

        const { token } = await response.json();

        await client.connectUser(
          {
            id: user.uid,
            name: user.displayName || 'Anonymous',
            image: user.photoURL || undefined,
          },
          token
        );
        didConnect = true;
        setChatClient(client);

      } catch (error) {
        console.error('Stream Chat connection error:', error);
        toast({
            variant: 'destructive',
            title: 'Chat Connection Failed',
            description: 'Could not connect to the messaging service.'
        })
      }
    };
    
    if (!client.user) {
        connectUser();
    }


    return () => {
      if (didConnect) {
        client.disconnectUser();
        setChatClient(null);
      }
    };
  }, [user, toast]);

  if (isUserLoading || (user && !chatClient)) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Connecting to messaging...</p>
      </div>
    );
  }

  if (!chatClient) {
    return <>{children}</>;
  }

  return (
    <OverlayProvider>
        <Chat client={chatClient}>{children}</Chat>
    </OverlayProvider>
  );
}
