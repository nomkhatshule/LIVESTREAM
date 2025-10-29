'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { UserPlus, Heart, MessageSquare } from 'lucide-react';

export type Activity = {
    type: 'follow' | 'like' | 'comment';
    actorName: string;
    actorAvatar: string;
    entityInfo?: string;
    commentText?: string;
    timestamp: string;
    actorId: string;
};

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

export default function ActivityItem({ activity }: { activity: Activity }) {
    const { Icon, bgColor } = iconMap[activity.type];

    const getActionText = () => {
        switch (activity.type) {
            case 'follow':
                return 'followed you.';
            case 'like':
                return 'liked your stream:';
            case 'comment':
                return 'commented on your stream:';
            default:
                return '';
        }
    };

    return (
        <div className="flex items-start gap-3 p-3 transition-colors hover:bg-zinc-900/50 rounded-lg">
            <div className="relative flex-shrink-0">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={activity.actorAvatar} alt={activity.actorName} />
                    <AvatarFallback>{activity.actorName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className={cn("absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-white", bgColor)}>
                    <Icon className="h-3 w-3" />
                </div>
            </div>
            <div className="flex-1 text-sm">
                <p className="text-zinc-300">
                    <Link href={`/profile/${activity.actorId}`} className="font-bold text-white hover:underline">
                        {activity.actorName}
                    </Link>
                    {' '}{getActionText()}{' '}
                    {activity.entityInfo && (
                        <span className="font-semibold text-zinc-400 italic">"{activity.entityInfo}"</span>
                    )}
                </p>
                {activity.type === 'comment' && activity.commentText && (
                    <blockquote className="mt-1 border-l-2 border-zinc-700 pl-2 text-zinc-400">
                        {activity.commentText}
                    </blockquote>
                )}
                <p className="mt-1 text-xs text-zinc-500">{activity.timestamp}</p>
            </div>
        </div>
    );
}
