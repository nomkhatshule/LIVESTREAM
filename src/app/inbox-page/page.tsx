
'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useChatContext } from '@/components/chat/ChatProvider';
import { useUser, useUserDocument, useUserDocumentById } from '@/firebase';
import { Loader2, ArrowLeft, ArrowUp, MessageSquare, CornerUpLeft, Smile, GitCommit, X, MoreHorizontal, Pencil, Trash2, Check, CheckCheck } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/firebase/firestore/use-user-document';
import type { Message, Reaction as StreamReaction, UserResponse } from 'stream-chat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


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
                <Link href="/feed-test">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
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

function CustomMessage({ message, onReply, isEditing, onStartEdit, onCancelEdit, onSaveEdit, onDelete }: { 
    message: Message, 
    onReply: (message: Message) => void;
    isEditing: boolean;
    onStartEdit: (message: Message) => void;
    onCancelEdit: () => void;
    onSaveEdit: (messageId: string, newText: string) => void;
    onDelete: (messageId: string) => void;
}) {
    const { user: currentUser } = useUser();
    const { channel: activeChannel } = useChatContext();
    const { userDocument: currentUserDocument } = useUserDocument();
    const isCurrentUser = message.user?.id === currentUser?.uid;
    const [editText, setEditText] = useState(message.text || '');
    
    const { userDocument: otherUserDocument } = useUserDocumentById(isCurrentUser ? undefined : message.user?.id);

    const streamUser = message.user;
    const avatarUrl = isCurrentUser ? currentUserDocument?.profilePicture : otherUserDocument?.profilePicture;
    
    let fallback = 'U';
    if (streamUser?.name) {
        fallback = streamUser.name.charAt(0).toUpperCase();
    }


    if (!streamUser) return null;
    
    if (message.deleted_at) {
        return (
             <div className={cn("flex items-center gap-2 my-2 text-xs text-zinc-500", isCurrentUser ? "justify-end" : "justify-start ml-10")}>
                <em>This message was deleted.</em>
            </div>
        )
    }

    const latestReactions = message.latest_reactions || [];
    const hasLiked = latestReactions.some(r => r.type === 'like' && r.user_id === currentUser?.uid);
    const likeCount = latestReactions.filter(r => r.type === 'like').length;

    const quotedMessage = message.quoted_message;
    const attachment = message.attachments?.[0];
    
    const handleSave = () => {
        onSaveEdit(message.id, editText);
    }
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            onCancelEdit();
        }
    };
    
    const otherUser = Object.values(activeChannel?.state.members || {}).find(member => member.user_id !== currentUser?.uid);
    const isRead = isCurrentUser && otherUser && (message.readBy || []).some(read => read.id === otherUser.user_id);
    const ReadReceipt = isRead ? CheckCheck : Check;

    return (
        <div className={cn("flex items-end gap-2 my-2 group", isCurrentUser ? "justify-end" : "justify-start")}>
             {isCurrentUser && (
                 <div className="flex-col items-center gap-2 hidden group-hover:flex">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => onStartEdit(message)}>
                                <Pencil className="mr-2 h-4 w-4"/>
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onDelete(message.id)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4"/>
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full"
                        onClick={() => onReply(message)}
                    >
                        <CornerUpLeft className="h-4 w-4" />
                    </Button>
                 </div>
            )}
            {!isCurrentUser && (
                <Avatar className="h-8 w-8 self-end">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback>{fallback}</AvatarFallback>
                </Avatar>
            )}
            <div className="flex flex-col">
                <div className={cn(
                    "max-w-xs md:max-w-md rounded-lg text-sm relative", 
                    isEditing ? 'p-0' : (attachment?.type === 'giphy' ? 'bg-transparent' : (isCurrentUser ? "bg-primary text-primary-foreground p-3" : "bg-zinc-200 text-black p-3"))
                )}>
                    {isEditing ? (
                        <div className="space-y-2">
                           <Input 
                             value={editText} 
                             onChange={(e) => setEditText(e.target.value)}
                             onKeyDown={handleKeyDown}
                             className="bg-zinc-700 border-zinc-600 focus-visible:ring-primary"
                             autoFocus
                           />
                           <div className="text-xs">
                             esc to <Button variant="link" size="sm" className="p-0 h-auto text-primary" onClick={onCancelEdit}>cancel</Button> • enter to <Button variant="link" size="sm" className="p-0 h-auto text-primary" onClick={handleSave}>save</Button>
                           </div>
                        </div>
                    ) : (
                         <>
                            {quotedMessage && (
                                <div className="border-l-2 border-white/50 pl-2 mb-2 text-xs opacity-80">
                                    <p className="font-bold">{quotedMessage.user?.name || 'User'}</p>
                                    <p className="truncate">{quotedMessage.text}</p>
                                </div>
                            )}
                            {attachment?.type === 'giphy' ? (
                                <img src={attachment.image_url || attachment.thumb_url} alt={attachment.title} className="rounded-md" />
                            ) : (
                                <p>{message.text}</p>
                            )}
                            
                            {likeCount > 0 && (
                                <div className="absolute -bottom-3 right-2 bg-zinc-700 text-white rounded-full px-2 py-0.5 text-xs flex items-center">
                                    👍 {likeCount}
                                </div>
                            )}
                        </>
                    )}
                </div>
                 {message.created_at && (
                    <div className={cn("text-xs text-zinc-500 mt-1 flex items-center gap-1", isCurrentUser ? "text-right flex-row-reverse" : "text-left")}>
                         <p>{format(new Date(message.created_at), 'p')}</p>
                         {message.updated_at && message.created_at !== message.updated_at && <p>(edited)</p>}
                         {isCurrentUser && <ReadReceipt className={cn("h-4 w-4", isRead ? "text-blue-400" : "text-zinc-500")} />}
                    </div>
                )}
            </div>
             {isCurrentUser && (
                <Avatar className="h-8 w-8 self-end">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback>{fallback}</AvatarFallback>
                </Avatar>
            )}
             {!isCurrentUser && (
                 <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full bg-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onReply(message)}
                >
                    <CornerUpLeft className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}

// --- Tenor GIF Picker ---
interface TenorResult {
    id: string;
    media_formats: {
        gif: { url: string };
        tinygif: { url: string; dims: number[] };
    };
    content_description: string;
}

const GifPicker = ({ onSendGif }: { onSendGif: (gif: TenorResult) => void }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<TenorResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const tenorApiKey = process.env.NEXT_PUBLIC_TENOR_API_KEY;

    const searchGifs = async (query: string) => {
        if (!tenorApiKey) {
            console.error("Tenor API key is missing.");
            return;
        }
        setIsLoading(true);
        const clientKey = "agorlive-chat";
        const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${tenorApiKey}&client_key=${clientKey}&limit=20`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            setResults(data.results || []);
        } catch (error) {
            console.error("Failed to fetch GIFs from Tenor:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (searchTerm.trim().length > 2) {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            searchTimeoutRef.current = setTimeout(() => {
                searchGifs(searchTerm);
            }, 500); // Debounce for 500ms
        } else {
            setResults([]);
        }

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchTerm]);

    return (
        <div className="w-full h-full flex flex-col p-2 bg-zinc-900">
            <Input
                placeholder="Search for GIFs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-zinc-800 border-none text-white focus:ring-primary"
            />
            <ScrollArea className="flex-1 mt-2">
                {isLoading && <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>}
                <div className="grid grid-cols-2 gap-1">
                    {results.map((gif) => (
                        <button key={gif.id} onClick={() => onSendGif(gif)} className="aspect-square bg-zinc-800 rounded-md overflow-hidden">
                            <img src={gif.media_formats.tinygif.url} alt={gif.content_description} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};


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
  const currentChannelId = useRef<string | null>(null);
  
  const withUserId = searchParams.get('with');

  useEffect(() => {
    if (activeChannel) {
        setMessages(activeChannel.state.messages);

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
        const handleMessageRead = (event: any) => {
            setMessages(prev => [...prev]); // Trigger re-render
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
        activeChannel.on('message.read', handleMessageRead);
        activeChannel.on('typing.start', handleTypingStart);
        activeChannel.on('typing.stop', handleTypingStop);

        return () => {
            activeChannel.off('message.new', handleNewMessage);
            activeChannel.off('reaction.new', handleReaction);
            activeChannel.off('reaction.deleted', handleReaction);
            activeChannel.off('message.updated', handleMessageUpdated);
            activeChannel.off('message.read', handleMessageRead);
            activeChannel.off('typing.start', handleTypingStart);
            activeChannel.off('typing.stop', handleTypingStop);
        };
    }
  }, [activeChannel, editingMessage, user?.uid]);

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
                <CustomMessage 
                    key={msg.id} 
                    message={msg} 
                    onReply={handleReply} 
                    isEditing={editingMessage?.id === msg.id}
                    onStartEdit={handleStartEdit}
                    onCancelEdit={handleCancelEdit}
                    onSaveEdit={handleSaveEdit}
                    onDelete={handleDelete}
                />
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

const CustomMessageInput = ({ replyToMessage, onCancelReply }: { replyToMessage: Message | null; onCancelReply: () => void; }) => {
    const { channel: activeChannel } = useChatContext();
    const [text, setText] = useState('');
    const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);

    useEffect(() => {
        if (replyToMessage) {
            // You might want to focus the input here
        }
    }, [replyToMessage]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim() && activeChannel) {
            await activeChannel.sendMessage({ 
                text,
                parent_id: replyToMessage?.id
            });
            setText('');
            onCancelReply();
        }
    }

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setText(e.target.value);
        if (activeChannel) {
            activeChannel.keystroke();
        }
    }

    const handleReaction = async () => {
        if (activeChannel) {
            const lastMessage = activeChannel.state.messages[activeChannel.state.messages.length - 1];
            if (lastMessage) {
                // Check if user already liked it
                const existingReaction = lastMessage.latest_reactions?.find(r => r.type === 'like' && r.user_id === activeChannel.client.userID);
                if (existingReaction) {
                    await activeChannel.deleteReaction(lastMessage.id, existingReaction.type);
                } else {
                    await activeChannel.sendReaction(lastMessage.id, { type: 'like' });
                }
            }
        }
    };

    const handleSendGif = async (gif: TenorResult) => {
        if (activeChannel) {
            await activeChannel.sendMessage({
                text: gif.content_description,
                attachments: [
                    {
                        type: 'giphy', // Stream's generic 'image' or 'video' type is also an option
                        title: gif.content_description,
                        image_url: gif.media_formats.gif.url,
                        thumb_url: gif.media_formats.tinygif.url,
                    },
                ],
            });
            setIsGifPickerOpen(false);
        }
    };
    
    return (
        <div className="space-y-2">
            {replyToMessage && (
                <div className="bg-zinc-800 p-2 rounded-md text-sm flex justify-between items-center">
                    <div className="overflow-hidden">
                        <p className="font-bold text-primary">Replying to {replyToMessage.user?.name}</p>
                        <p className="text-zinc-400 truncate">{replyToMessage.text}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancelReply}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
            <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
                <input
                    value={text}
                    onChange={handleTextChange}
                    placeholder="Send a message..."
                    className="w-full bg-zinc-800 border-none text-white rounded-full px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                 <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                     <Button size="icon" type="button" variant="ghost" className="rounded-full h-9 w-9 text-zinc-400" onClick={handleReaction}>
                        <Smile className="h-5 w-5" />
                    </Button>
                    <Popover open={isGifPickerOpen} onOpenChange={setIsGifPickerOpen}>
                        <PopoverTrigger asChild>
                            <Button size="icon" type="button" variant="ghost" className="rounded-full h-9 w-9 text-zinc-400">
                                <b className="text-xs">GIF</b>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 h-96 p-0 border-zinc-700 bg-zinc-900" side="top" align="end">
                           <GifPicker onSendGif={handleSendGif} />
                        </PopoverContent>
                    </Popover>
                    <Button size="icon" type="submit" className="rounded-full h-8 w-8 bg-primary">
                        <ArrowUp className="h-5 w-5" />
                    </Button>
                 </div>
            </form>
        </div>
    )
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

