
'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { UserPlus, Heart, MessageSquare } from 'lucide-react';
import type { Notification } from '@/lib/data';
import { formatDistanceToNow } from 'date-fns';

const iconMap = {
    follow: {
        Icon: UserPlus,
        bgColor: 'bg-blue-500',
    },
    like: {
        Icon: Heart,
        bgColor: 'bg-red-500',
    },
    comment: {
        Icon: MessageSquare,
        bgColor: 'bg-green-500',
    },
};

export default function NotificationItem({ notification }: { notification: Notification }) {
    const { Icon, bgColor } = iconMap[notification.type];
    const timestamp = notification.timestamp ? formatDistanceToNow(notification.timestamp.toDate(), { addSuffix: true }) : 'just now';

    const getActionText = () => {
        switch (notification.type) {
            case 'follow':
                return 'followed you.';
            case 'like':
                return 'liked your stream:';
            case 'comment':
                return 'commented:';
            default:
                return '';
        }
    };
    
    // Extract the quoted comment from the entityInfo
    const commentMatch = notification.entityInfo?.match(/commented: "([^"]*)"/);
    const commentText = commentMatch ? commentMatch[1] : '';
    const entityText = notification.type === 'like' ? notification.entityInfo?.replace('liked your stream: ', '') : null;


    return (
        <div className="flex items-start gap-3 p-3 transition-colors hover:bg-zinc-900/50 rounded-lg">
            <div className="relative flex-shrink-0">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={notification.actorAvatar} alt={notification.actorName} />
                    <AvatarFallback>{notification.actorName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className={cn("absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-white", bgColor)}>
                    <Icon className="h-3 w-3" />
                </div>
            </div>
            <div className="flex-1 text-sm">
                <p className="text-zinc-300">
                    <Link href={`/profile/${notification.actorId}`} className="font-bold text-white hover:underline">
                        {notification.actorName}
                    </Link>
                    {' '}{getActionText()}{' '}
                    {entityText && (
                        <span className="font-semibold text-zinc-400 italic">{entityText}</span>
                    )}
                </p>
                {notification.type === 'comment' && commentText && (
                    <blockquote className="mt-1 border-l-2 border-zinc-700 pl-2 text-zinc-400 italic">
                        "{commentText}"
                    </blockquote>
                )}
                <p className="mt-1 text-xs text-zinc-500">{timestamp}</p>
            </div>
        </div>
    );
}

    