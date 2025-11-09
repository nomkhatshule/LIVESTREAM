
'use client';

import { useChatContext } from '@/components/chat/ChatProvider';
import { useUser, useUserDocumentById } from '@/firebase';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';


export default function ChannelHeader() {
    const { channel: activeChannel } = useChatContext();
    const { user: currentUser } = useUser();

    const otherUserMember = Object.values(activeChannel?.state.members || {}).find(
        (member) => member.user?.id !== currentUser?.uid
    );

    const { userDocument: otherUser, isDocLoading } = useUserDocumentById(otherUserMember?.user?.id);

    if (isDocLoading || !otherUser) {
        return (
             <div className="border-b p-3 flex items-center gap-3 bg-black border-zinc-700">
                <Link href="/feed">
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
        <div className="border-b p-3 flex items-center gap-3 bg-black border-zinc-700">
             <Link href="/feed">
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
