
'use client';

import { useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Comment } from '@/lib/types';
import { CornerUpLeft } from 'lucide-react';
import Image from 'next/image';

interface ChatPanelProps {
    comments: Comment[] | null;
    isVisible: boolean;
}

export default function ChatPanel({ 
    comments,
    isVisible,
}: ChatPanelProps) {
    const chatInputRef = useRef<HTMLInputElement>(null);
    
    const onReply = (username: string) => {
        // This functionality needs to be handled in the parent component now.
        // We could pass a prop `onReply` if needed.
        console.log(`Replying to ${username}`);
    };

    if (!isVisible) return null;

    return (
        <div className="absolute bottom-0 left-0 p-4 w-full md:w-96 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/40 to-transparent max-h-[50%] pointer-events-none">
            <div className="h-80 relative">
                <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-transparent to-black/0 via-black/0 z-10 pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 100%)' }} />
                <ScrollArea className="h-full pr-4 pointer-events-auto">
                    <div className="flex flex-col gap-3">
                        {comments && comments.map((comment: Comment) => (
                            <div key={comment.id} className="group flex items-start gap-3 text-sm text-white p-2 rounded-lg">
                                <Avatar className="h-6 w-6 border-2 border-secondary">
                                    <AvatarImage src={comment.userAvatar} alt={comment.username} />
                                    <AvatarFallback>{comment.username.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 bg-black/20 p-2 rounded-lg">
                                    <span className="font-bold font-headline text-primary mr-1.5">{comment.username}:</span>
                                    {comment.replyingTo && <span className="font-semibold text-accent mr-1.5">@{comment.replyingTo}</span>}
                                    {comment.attachment?.type === 'giphy' ? (
                                        <div className="mt-1">
                                            <Image src={comment.attachment.imageUrl} width={150} height={100} alt={comment.attachment.title || 'gif'} className="rounded-md" />
                                            {comment.message && <p className="break-words inline mt-1">{comment.message.replace(/^@\w+\s/, '')}</p>}
                                        </div>
                                    ) : (
                                        <p className="break-words inline">{comment.message.replace(/^@\w+\s/, '')}</p>
                                    )}
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 pointer-events-auto" onClick={() => onReply(comment.username)}>
                                    <CornerUpLeft className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
};
