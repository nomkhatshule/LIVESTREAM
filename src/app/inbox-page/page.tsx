
'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useChatContext } from '@/components/chat/ChatProvider';
import { useUser, useUserDocumentById } from '@/firebase';
import { Loader2, ArrowLeft, ArrowUp, MessageSquare } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/firebase/firestore/use-user-document';
import InboxPanel from '@/components/feed/InboxPanel';
import type { Message, UserResponse } from 'stream-chat';
import { ScrollArea } from '@/components/ui/scroll-area';

function ChannelHeader() {
    const { channel: activeChannel } = useChatContext();
    const { user: currentUser } = useUser();

    const otherUserMember = Object.values(activeChannel?.state.members || {}).find(
        (member) => member.user?.id !== currentUser?.uid
    );

    const { userDocument: otherUser, isDocLoading } = useUserDocumentById(otherUserMember?.user?.id);

    if (isDocLoading || !otherUser) {
        return (
             <div className="border-b p-3 flex items-center gap-3 bg-black border-zinc-800">
                <div className="h-10 w-10 bg-zinc-800 rounded-full animate-pulse" />
                <div className="h-5 w-32 bg-zinc-800 rounded-md animate-pulse" />
            </div>
        );
    }
    
    return (
        <div className="border-b p-3 flex items-center gap-3 bg-black border-zinc-800">
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

function CustomMessage({ message, user }: { message: Message, user: UserResponse | undefined }) {
    const { user: currentUser } = useUser();
    const isCurrentUser = message.user?.id === currentUser?.uid;

    if (!message.user) return null;

    return (
        <div className={cn("flex items-end gap-2 my-4", isCurrentUser ? "justify-end" : "justify-start")}>
            {!isCurrentUser && (
                <Avatar className="h-8 w-8">
                    <AvatarImage src={message.user.image as string | undefined} />
                    <AvatarFallback>{message.user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
            )}
            <div className={cn("max-w-[70%] p-3 rounded-lg text-sm", isCurrentUser ? "bg-primary text-primary-foreground" : "bg-zinc-800 text-white")}>
                <p>{message.text}</p>
            </div>
             {isCurrentUser && (
                <Avatar className="h-8 w-8">
                    <AvatarImage src={message.user.image as string | undefined} />
                    <AvatarFallback>{message.user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
            )}
        </div>
    );
}


function InboxPageComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { client, setActiveChannel, channel: activeChannel } = useChatContext();
  const { user } = useUser();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const [isLoadingChannel, setIsLoadingChannel] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const currentChannelId = useRef<string | null>(null);
  
  const withUserId = searchParams.get('with');

  useEffect(() => {
    if (activeChannel) {
        setMessages(activeChannel.state.messages);

        const handleNewMessage = (event: any) => {
            setMessages(prevMessages => [...prevMessages, event.message]);
        };
        activeChannel.on('message.new', handleNewMessage);

        return () => {
            activeChannel.off('message.new', handleNewMessage);
        };
    }
  }, [activeChannel]);

  useEffect(() => {
    // Auto-scroll to the bottom when new messages are added
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    if (withUserId && client && user) {
        const channelId = `messaging:${user.uid}-${withUserId}`;

        if (currentChannelId.current === channelId && activeChannel) {
            return;
        }

        currentChannelId.current = channelId;
        setIsLoadingChannel(true);
        setActiveChannel(null); 

        const createAndWatchChannel = async () => {
            const channel = client.channel('messaging', {
                members: [user.uid, withUserId],
            });
            await channel.watch();
            setActiveChannel(channel);
            setIsLoadingChannel(false);
        };

        createAndWatchChannel().catch(err => {
            console.error("Failed to create or watch channel:", err);
            setIsLoadingChannel(false);
            router.push('/feed-test');
        });

    }
  }, [withUserId, client, user, setActiveChannel, router, activeChannel]);

  if (!client || !user) {
    return (
        <div className="flex h-full items-center justify-center bg-black text-white">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-2">Initializing Chat...</p>
        </div>
    );
  }
  
  if (isLoadingChannel) {
    return (
        <div className="flex h-full items-center justify-center bg-black text-white">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-2">Opening conversation...</p>
        </div>
    );
  }

  if (!withUserId || !activeChannel) {
      return (
           <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-400 bg-black h-full">
             <MessageSquare className="h-12 w-12 mb-4"/>
             <h2 className="text-xl font-bold text-white">Your Messages</h2>
             <p>Select a conversation from your inbox to start chatting.</p>
             <Button variant="outline" asChild className="mt-4 bg-transparent border-zinc-700 hover:bg-zinc-900 hover:text-white">
                <Link href="/feed-test">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Feed
                </Link>
             </Button>
           </div>
      )
  }

  return (
    <div className="h-full w-full flex flex-col bg-black text-white">
        <ChannelHeader />
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
             {messages.map((msg) => (
                <CustomMessage key={msg.id} message={msg} user={msg.user} />
             ))}
        </ScrollArea>
        <div className="p-4 border-t border-zinc-800">
            <CustomMessageInput />
        </div>
    </div>
  );
}

const CustomMessageInput = () => {
    const { channel: activeChannel } = useChatContext();
    const [text, setText] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim() && activeChannel) {
            await activeChannel.sendMessage({ text });
            setText('');
        }
    }
    return (
         <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Send a message..."
                className="w-full bg-zinc-800 border-none text-white rounded-full px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button size="icon" type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-8 w-8">
                <ArrowUp className="h-5 w-5" />
            </Button>
        </form>
    )
}

function InboxPageLayout() {
    return (
         <div className="h-[calc(100vh-4rem)] w-full flex">
            <main className="flex-1">
                <InboxPageComponent />
            </main>
        </div>
    )
}


// Wrap the component in Suspense because it uses useSearchParams
export default function InboxPage() {
    return (
        <Suspense fallback={
             <div className="flex h-screen items-center justify-center bg-black text-white">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        }>
            <InboxPageLayout />
        </Suspense>
    )
}
