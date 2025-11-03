
'use client';

import { useState, useEffect, ReactNode, createContext, useContext } from 'react';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Dummy types to avoid breaking the build. Replace with Mux-equivalent if any.
type StreamChat = any;
type StreamChannel = any;

interface ChatContextValue {
  client: StreamChat | null;
  setActiveChannel: (channel: StreamChannel | null) => void;
  channel: StreamChannel | null;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const { user, isUserLoading } = useUser();
  
  // Since Mux does not have a built-in chat component, we will provide a dummy context.
  // The components that use this will need to be refactored or replaced.
  const [dummyClient] = useState({});
  const [activeChannel, setActiveChannel] = useState<StreamChannel | null>(null);

  if (isUserLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Loading...</p>
      </div>
    );
  }

  // Provide a dummy context so the app doesn't crash.
  // Chat functionality will be broken until it's rebuilt using a new service.
  return (
    <ChatContext.Provider value={{ client: dummyClient, channel: activeChannel, setActiveChannel }}>
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
