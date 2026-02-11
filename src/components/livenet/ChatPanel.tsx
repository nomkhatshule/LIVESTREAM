

'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Comment, GiphyResult } from '@/lib/types';
import { CornerUpLeft, Heart, ThumbsUp, X } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import ChatInputForm from '../chat/ChatInputForm';


interface ChatPanelProps {
    comments: Comment[] | null;
    isVisible: boolean;
    onSendMessage: (message: string, attachment: GiphyResult | { file: File, url: string } | null) => void;
    onReaction: (emoji: React.ReactNode) => void;
}

export default function ChatPanel({ 
    comments,
    isVisible,
    onSendMessage,
    onReaction
}: ChatPanelProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);

    const onReply = (username: string) => {
        setReplyingTo(username);
        textareaRef.current?.focus();
    };

    const handleSendMessage = (message: string, attachment: GiphyResult | { file: File, url: string } | null) => {
        let messageToSend = message;
        if (replyingTo) {
            messageToSend = `@${replyingTo} ${message}`;
        }
        onSendMessage(messageToSend, attachment);
        setReplyingTo(null);
    }

    const reactions = [
        { id: 'heart', emoji: <Heart key="heart" className="text-red-500 fill-red-500" /> },
        { id: 'thumb', emoji: <ThumbsUp key="thumbsup" className="text-yellow-400 fill-yellow-400" /> },
        { id: 'laugh', emoji: '😂' },
        { id: 'fire', emoji: '🔥' },
        { id: 'party', emoji: '🎉' },
    ];

    if (!isVisible) return null;

    return (
        <div className="absolute bottom-0 left-0 p-4 w-full md:w-96 flex flex-col justify-end max-h-[50%] pointer-events-none">
            <div className="h-80 relative pointer-events-auto">
                <ScrollArea className="h-full pr-4">
                    <div className="flex flex-col-reverse">
                        {comments && comments.map((comment: Comment) => (
                            <div key={comment.id} className="group flex items-start text-sm text-white pb-1">
                                <Avatar className="h-6 w-6 border-2 border-secondary flex-shrink-0 mt-1">
                                    <AvatarImage src={comment.userAvatar} alt={comment.username} />
                                    <AvatarFallback>{comment.username.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 ml-2">
                                    <div>
                                        <span className="font-bold font-headline text-primary mr-1.5">{comment.username}</span>
                                        {comment.replyingTo && <span className="font-semibold text-accent mr-1.5">@{comment.replyingTo}</span>}
                                    </div>
                                     {comment.attachment?.type === 'giphy' || comment.attachment?.type === 'image' ? (
                                        <div className="mt-1">
                                            <Image src={comment.attachment.imageUrl} width={150} height={100} alt={comment.attachment.title || 'attachment'} className="rounded-md" />
                                            {comment.message && <p className="break-words inline mt-1">{comment.message.replace(/^@\w+\s/, '')}</p>}
                                        </div>
                                    ) : (
                                        <p className="break-words inline">{comment.message.replace(/^@\w+\s/, '')}</p>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 inline-flex" onClick={() => onReply(comment.username)}>
                                        <CornerUpLeft className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
             <div className="pt-2 pb-10 md:pb-2 pointer-events-auto">
                 <ChatInputForm
                    onSubmit={handleSendMessage}
                    quickReactions={reactions}
                    onReaction={onReaction}
                    inputRef={textareaRef}
                    replyingTo={replyingTo}
                    onCancelReply={() => setReplyingTo(null)}
                    attachmentIconType="image"
                />
             </div>
        </div>
    );
};
