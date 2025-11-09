

'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useChatContext } from '@/components/chat/ChatProvider';
import { useUser, useUserDocument } from '@/firebase';
import { Loader2, ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Message, UserResponse } from 'stream-chat';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChannelHeader from '@/components/inbox/ChannelHeader';
import CustomMessage from '@/components/inbox/CustomMessage';
import CustomMessageInput from '@/components/inbox/CustomMessageInput';


function InboxPageComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { client, setActiveChannel, channel: activeChannel } = useChatContext();
  const { user } = useUser();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const [isLoadingChannel, setIsLoadingChannel] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<UserResponse[]>([]);
  const [firstUnreadId, setFirstUnreadId] = useState<string | null>(null);
  const currentChannelId = useRef<string | null>(null);
  
  const withUserId = searchParams.get('with');

  useEffect(() => {
    if (activeChannel && user) {
        const allMessages = activeChannel.state.messages;
        setMessages(allMessages);
        
        // Find and set the first unread message
        const unreadCount = activeChannel.countUnread();
        if (unreadCount > 0) {
            const lastReadTime = activeChannel.state.read[user.uid]?.last_read;
            if (lastReadTime) {
                const firstUnread = allMessages.find(m => new Date(m.created_at) > lastReadTime);
                setFirstUnreadId(firstUnread?.id || null);
            }
        } else {
            setFirstUnreadId(null);
        }

        const handleNewMessage = (event: any) => {
            if (event.message?.id === editingMessage?.id) {
                setEditingMessage(null);
            }
            setMessages(prevMessages => [...prevMessages, event.message]);
        };
        const handleReaction = (event: any) => {
            setMessages(prev => prev.map(m => m.id === event.message.id ? event.message : m));
        }
        const handleMessageUpdated = (event: any) => {
             if (event.message?.id === editingMessage?.id) {
                setEditingMessage(null);
            }
            setMessages(prev => prev.map(m => m.id === event.message.id ? event.message : m));
        }
        const handleMessageDeleted = (event: any) => {
            setMessages(prev => prev.map(m => m.id === event.message.id ? event.message : m));
        }
        const handleMessageRead = (event: any) => {
            // A message was read, so we might need to remove the unread separator
            if (activeChannel.countUnread() === 0) {
                setFirstUnreadId(null);
            }
            setMessages(prev => [...prev]); // Trigger re-render for read receipts
        }
        const handleTypingStart = (event: any) => {
            if (event.user?.id === user?.uid) return;
            setTypingUsers((prev) => [...prev, event.user]);
        };

        const handleTypingStop = (event: any) => {
            if (event.user?.id === user?.uid) return;
            setTypingUsers((prev) => prev.filter((u) => u.id !== event.user?.id));
        };

        activeChannel.on('message.new', handleNewMessage);
        activeChannel.on('reaction.new', handleReaction);
        activeChannel.on('reaction.deleted', handleReaction);
        activeChannel.on('message.updated', handleMessageUpdated);
        activeChannel.on('message.deleted', handleMessageDeleted);
        activeChannel.on('message.read', handleMessageRead);
        activeChannel.on('typing.start', handleTypingStart);
        activeChannel.on('typing.stop', handleTypingStop);

        return () => {
            activeChannel.off('message.new', handleNewMessage);
            activeChannel.off('reaction.new', handleReaction);
            activeChannel.off('reaction.deleted', handleReaction);
            activeChannel.off('message.updated', handleMessageUpdated);
            activeChannel.off('message.deleted', handleMessageDeleted);
            activeChannel.off('message.read', handleMessageRead);
            activeChannel.off('typing.start', handleTypingStart);
            activeChannel.off('typing.stop', handleTypingStop);
        };
    }
  }, [activeChannel, editingMessage, user]);

  useEffect(() => {
    // Auto-scroll to the bottom when new messages are added
    if (scrollAreaRef.current && !editingMessage) { // Don't scroll while editing
      const viewport = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, editingMessage]);

  useEffect(() => {
    if (withUserId && client && user) {
        const channelId = `messaging:${user.uid}-${withUserId}`;

        if (currentChannelId.current === channelId && activeChannel) {
            return;
        }

        currentChannelId.current = channelId;
        setIsLoadingChannel(true);
        setActiveChannel(null); 
        setEditingMessage(null); // Reset editing state when channel changes
        setTypingUsers([]);
        setFirstUnreadId(null); // Reset unread marker

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
            router.push('/feed');
        });

    }
  }, [withUserId, client, user, setActiveChannel, router, activeChannel]);

  const handleReply = (message: Message) => {
    setReplyToMessage(message);
  };

  const handleCancelReply = () => {
    setReplyToMessage(null);
  };
  
  const handleStartEdit = (message: Message) => {
      setEditingMessage(message);
  }
  
  const handleCancelEdit = () => {
      setEditingMessage(null);
  }
  
  const handleSaveEdit = async (messageId: string, newText: string) => {
      if (!activeChannel) return;
      await activeChannel.updateMessage({
          id: messageId,
          text: newText,
      });
      setEditingMessage(null);
  }

  const handleDelete = async (messageId: string) => {
      if (!activeChannel) return;
      await activeChannel.deleteMessage(messageId);
  }

  const typingUserNames = typingUsers.map(u => u.name || 'Someone').join(', ');

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
                <Link href="/feed">
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
                <div key={msg.id}>
                    {msg.id === firstUnreadId && (
                       <div className="flex justify-center my-4">
                            <div className="bg-zinc-700 text-zinc-300 text-xs font-semibold px-3 py-1 rounded-full">
                                New Messages
                            </div>
                        </div>
                    )}
                    <CustomMessage 
                        message={msg} 
                        onReply={handleReply} 
                        isEditing={editingMessage?.id === msg.id}
                        onStartEdit={handleStartEdit}
                        onCancelEdit={handleCancelEdit}
                        onSaveEdit={handleSaveEdit}
                        onDelete={handleDelete}
                    />
                </div>
             ))}
        </ScrollArea>
        <div className="p-4 pt-2 border-t border-zinc-800">
            <div className="h-5 text-xs text-zinc-400 italic px-2">
                {typingUsers.length > 0 && `${typingUserNames} is typing...`}
            </div>
            <CustomMessageInput 
                replyToMessage={replyToMessage}
                onCancelReply={handleCancelReply}
            />
        </div>
    </div>
  );
}


function InboxPageLayout() {
    return (
        <main className="h-[calc(100vh-4rem)] w-full">
            <InboxPageComponent />
        </main>
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
