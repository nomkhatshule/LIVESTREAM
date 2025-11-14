
'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Swords, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ChallengeReceivedCard from '../challenges/ChallengeReceivedCard';
import Link from 'next/link';

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

    const challengeText = challenge.status === 'pending'
    ? 'challenged you!'
    : `challenge was ${challenge.status}.`

    return (
        <>
            <ChallengeReceivedCard
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                challenge={challenge}
            />
             <div className="flex items-start gap-3 p-3 transition-colors hover:bg-zinc-900/50 rounded-lg">
                <div 
                    className="relative flex-shrink-0"
                    onClick={() => isPending && setIsModalOpen(true)}
                >
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={challenge.fromUserAvatar} alt={challenge.fromUsername} />
                        <AvatarFallback>{challenge.fromUsername.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className={cn("absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-black bg-primary")}>
                        <Swords className="h-3 w-3" />
                    </div>
                </div>
                <div className="flex-1 text-sm">
                    <p className="text-zinc-300">
                        <Link href={`/profile/${challenge.fromUserId}`} className="font-bold text-white hover:underline">
                            @{challenge.fromUsername}
                        </Link>
                        {' '}{challengeText}
                    </p>
                     <blockquote 
                        className={cn(
                            "mt-1 border-l-2 pl-2 text-zinc-400 italic",
                            isPending ? "cursor-pointer hover:border-primary" : "border-zinc-700"
                         )}
                         onClick={() => isPending && setIsModalOpen(true)}
                     >
                        "{challenge.text}"
                    </blockquote>
                    <p className="mt-1 text-xs text-zinc-500">{timestamp}</p>
                </div>
                {!isPending && statusIndicator()}
             </div>
        </>
    );
}
