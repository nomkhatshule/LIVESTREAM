
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { Loader2, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useChatContext } from '../chat/ChatProvider';
import { ChannelList, ChannelListController, useChannelListContext, ChannelPreviewProps } from 'stream-chat-react';

const InboxChannelPreview = (props: ChannelPreviewProps) => {
    const { channel } = props;
    const { user: currentUser } = useUser();
    const { setActiveChannel } = useChatContext();

    const otherUserMember = Object.values(channel.state.members).find(
        (member) => member.user?.id !== currentUser?.uid
    );

    if (!otherUserMember || !otherUserMember.user) {
        return null; // Or some fallback UI
    }

    const otherUser = otherUserMember.user;
    const lastMessage = channel.state.messages[channel.state.messages.length - 1];

    const unreadCount = channel.countUnread();
    
    // Construct the direct link to the conversation
    const href = `/inbox-page?with=${otherUser.id}`;

    return (
        <Link href={href} passHref>
             <div 
                className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer"
                onClick={() => setActiveChannel(channel)}
            >
                <Avatar className="h-12 w-12">
                    <AvatarImage src={otherUser.image as string} />
                    <AvatarFallback>{otherUser.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="text-sm flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                        <p className="font-semibold truncate">{otherUser.name}</p>
                        {lastMessage?.created_at && (
                           <p className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                                {formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true })}
                            </p>
                        )}
                    </div>
                    <div className="flex justify-between items-start">
                        <p className={cn("truncate text-muted-foreground", unreadCount > 0 && "font-bold text-primary")}>
                            {lastMessage?.text || 'No messages yet'}
                        </p>
                        {unreadCount > 0 && (
                            <span className="ml-2 flex-shrink-0 bg-primary text-primary-foreground text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    )
}

export default function InboxPanel() {
    const { user } = useUser();
    const { client } = useChatContext();

    if (!client || !user) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>
    }

    const filters = { type: 'messaging' as const, members: { $in: [user.uid] } };

    return (
        <ChannelList
            filters={filters}
            sort={{ last_message_at: -1 }}
            Preview={InboxChannelPreview}
            EmptyStateIndicator={() => (
                 <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground bg-background h-full">
                    <MessageSquare className="h-12 w-12 mb-4"/>
                    <h2 className="text-xl font-bold text-foreground">No Messages Yet</h2>
                    <p>Start a conversation from a user's profile.</p>
                </div>
            )}
        />
    )
}
