
'use client';

import { useState, useEffect, ReactNode, createContext, useContext } from 'react';
import { StreamChat, Channel } from 'stream-chat';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchStreamToken } from '@/lib/stream-token';

interface ChatContextValue {
  client: StreamChat | null;
  setActiveChannel: (channel: Channel | null) => void;
  channel: Channel | null;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const { user, isUserLoading } = useUser();
  const [client, setClient] = useState<StreamChat | null>(null);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!user || isUserLoading) return;

    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    if (!apiKey) {
      console.error('Stream API key is missing.');
      toast({ variant: 'destructive', title: 'Chat Error', description: 'Chat service is not configured.' });
      return;
    }

    const newClient = StreamChat.getInstance(apiKey);
    let cancelled = false;

    const connectUser = async () => {
      try {
        const token = await fetchStreamToken(user);

        await newClient.connectUser(
          {
            id: user.uid,
            name: user.displayName || 'Anonymous',
            image: user.photoURL || undefined,
          },
          token
        );
        if (!cancelled) setClient(newClient);
      } catch (error) {
        console.error('Error connecting to Stream Chat:', error);
        toast({ variant: 'destructive', title: 'Chat Connection Failed' });
      }
    };

    connectUser();

    // Disconnect when the user signs out or switches account.
    return () => {
      cancelled = true;
      setClient(null);
      newClient.disconnectUser().catch(() => {});
    };
  }, [user, isUserLoading, toast]);

  return (
    <ChatContext.Provider value={{ client, channel: activeChannel, setActiveChannel }}>
        {children}
    </ChatContext.Provider>
  );
}

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}
