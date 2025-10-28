
'use client';

import { useMemo, useState, useEffect }from 'react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { Loader2, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useChatContext } from '../chat/ChatProvider';
import type { Channel, ChannelMemberResponse } from 'stream-chat';


const InboxChannelPreview = ({ channel, currentUser, setActiveChannel }: { channel: Channel, currentUser: any, setActiveChannel: (channel: Channel) => void }) => {

    const otherUserMember = Object.values(channel.state.members).find(
        (member) => member.user?.id !== currentUser?.uid
    );

    if (!otherUserMember || !otherUserMember.user) {
        return null;
    }

    const otherUser = otherUserMember.user;
    const lastMessage = channel.state.messages[channel.state.messages.length - 1];
    
    // Corrected unread logic: only count if the last message is not from the current user.
    const unreadCount = channel.countUnread();
    const isUnread = unreadCount > 0 && lastMessage?.user?.id !== currentUser.uid;
    const lastMessageSenderIsCurrentUser = lastMessage?.user?.id === currentUser.uid;
    
    const href = `/inbox-page?with=${otherUser.id}`;

    return (
        <div className="border-b border-zinc-800">
            <Link href={href} passHref>
                <div 
                    className="flex items-center gap-3 p-3 cursor-pointer bg-black hover:bg-zinc-900"
                    onClick={() => setActiveChannel(channel)}
                >
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={otherUser.image as string} alt={otherUser.name} />
                        <AvatarFallback>{otherUser.name?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
                    </Avatar>
                    <div className="text-sm flex-1 overflow-hidden">
                        <div className="flex justify-between items-center">
                            <p className="font-semibold truncate text-white">{otherUser.name || 'Anonymous'}</p>
                            {lastMessage?.created_at && (
                            <p className="text-xs text-zinc-400 flex-shrink-0 ml-2">
                                    {formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true })}
                                </p>
                            )}
                        </div>
                        <div className="flex justify-between items-start mt-1">
                            <p className={cn("truncate text-zinc-400", isUnread && "font-bold text-primary")}>
                                {lastMessage ? (
                                    <>
                                        {lastMessageSenderIsCurrentUser && 'You: '}
                                        {lastMessage.text || 'Sent an attachment'}
                                    </>
                                ) : 'No messages yet'}
                            </p>
                            {isUnread && (
                                <span className="ml-2 flex-shrink-0 bg-primary text-primary-foreground text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    )
}

export default function InboxPanel() {
    const { user } = useUser();
    const { client, setActiveChannel } = useChatContext();
    const [channels, setChannels] = useState<Channel[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!client || !user) return;

        const fetchChannels = async () => {
            setIsLoading(true);
            try {
                const filters = { type: 'messaging' as const, members: { $in: [user.uid] } };
                const sort = [{ last_message_at: -1 }];
                const userChannels = await client.queryChannels(filters, sort);
                setChannels(userChannels);
            } catch (error) {
                console.error("Failed to fetch channels:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchChannels();
    }, [client, user]);

    if (isLoading) {
        return <div className="flex items-center justify-center h-full bg-black"><Loader2 className="h-6 w-6 animate-spin text-white" /></div>
    }

    if (channels.length === 0) {
        return (
             <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-500 bg-black h-full">
                <MessageSquare className="h-12 w-12 mb-4"/>
                <h2 className="text-xl font-bold text-white">No Messages Yet</h2>
                <p>Start a conversation from a user's profile.</p>
            </div>
        )
    }

    return (
        <div className="h-full overflow-y-auto bg-black">
            {channels.map(channel => (
                <InboxChannelPreview 
                    key={channel.cid} 
                    channel={channel} 
                    currentUser={user}
                    setActiveChannel={setActiveChannel}
                />
            ))}
        </div>
    )
}
