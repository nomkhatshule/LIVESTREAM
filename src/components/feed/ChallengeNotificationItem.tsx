
'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Swords, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ChallengeReceivedCard from '../challenges/ChallengeReceivedCard';

export default function ChallengeNotificationItem({ challenge }: { challenge: any }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const timestamp = challenge.createdAt ? formatDistanceToNow(challenge.createdAt.toDate(), { addSuffix: true }) : 'just now';

    const statusIndicator = () => {
        switch (challenge.status) {
            case 'accepted':
                return <div className="flex items-center gap-1 text-xs text-green-400"><Check className="h-3 w-3" /> Accepted</div>;
            case 'rejected':
                return <div className="flex items-center gap-1 text-xs text-red-400"><X className="h-3 w-3" /> Declined</div>;
            case 'completed':
                 return <div className="flex items-center gap-1 text-xs text-blue-400"><Check className="h-3 w-3" /> Completed</div>;
            default: // pending
                return null;
        }
    };
    
    const isPending = challenge.status === 'pending';

    return (
        <>
            <ChallengeReceivedCard
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                challenge={challenge}
            />
            <div className={cn(
                "w-full text-left p-4 rounded-lg border transition-colors",
                isPending ? "bg-zinc-800/50 border-primary/50 cursor-pointer hover:bg-zinc-800" : "bg-zinc-900/50 border-zinc-800 opacity-70"
            )}
             onClick={() => isPending && setIsModalOpen(true)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                         <div className="relative flex-shrink-0">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={challenge.fromUserAvatar} alt={challenge.fromUsername} />
                                <AvatarFallback>{challenge.fromUsername.charAt(0)}</AvatarFallback>
                            </Avatar>
                             <div className={cn("absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-white bg-primary")}>
                                <Swords className="h-3 w-3" />
                            </div>
                        </div>
                        <div className="text-sm">
                            <p className="text-zinc-300">
                                <span className="font-bold text-white">@{challenge.fromUsername}</span>
                                {' '}challenged you!
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">{timestamp}</p>
                        </div>
                    </div>
                     {statusIndicator() || (
                        <Button size="sm" variant="outline" className="bg-transparent border-zinc-700 hover:bg-zinc-800 hover:text-white">View</Button>
                    )}
                </div>
            </div>
        </>
    );
}
