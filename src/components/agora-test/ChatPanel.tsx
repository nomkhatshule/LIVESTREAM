
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Comment } from '@/lib/types';
import { ArrowUp, MessageCircle, MessageCircleOff, Smile } from 'lucide-react';
import Image from 'next/image';

interface ChatPanelProps {
    isVisible: boolean;
    comments: Comment[] | null;
    newMessage: string;
    onNewMessageChange: (message: string) => void;
    onSendMessage: (e: React.FormEvent) => void;
    onReaction: () => void;
    onToggleVisibility: () => void;
}

export default function ChatPanel({ isVisible, comments, newMessage, onNewMessageChange, onSendMessage, onReaction, onToggleVisibility }: ChatPanelProps) {
    if (!isVisible) {
        return (
            <div className="absolute bottom-4 right-4 z-10 pointer-events-auto">
                <Button variant="ghost" size="icon" onClick={onToggleVisibility} className="text-white bg-black/50 rounded-full h-10 w-10">
                    <MessageCircle className="h-5 w-5" />
                </Button>
            </div>
        );
    }

    return (
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/40 to-transparent h-[40%] pointer-events-none">
            <ScrollArea className="h-full pr-4 pointer-events-auto">
                <div className="flex flex-col gap-3">
                    {comments && comments.map((comment: Comment) => (
                        <div key={comment.id} className="flex items-start gap-3 text-sm text-white bg-black/20 p-2 rounded-lg max-w-xs sm:max-w-sm">
                            <Avatar className="h-6 w-6 border-2 border-secondary">
                                <AvatarImage src={comment.userAvatar} alt={comment.username} />
                                <AvatarFallback>{comment.username.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <span className="font-bold font-headline text-primary mr-1.5">{comment.username}:</span>
                                {comment.attachment?.type === 'giphy' ? (
                                    <div className="mt-1">
                                        <Image src={comment.attachment.imageUrl} width={150} height={100} alt={comment.attachment.title || 'gif'} className="rounded-md" />
                                        {comment.message && <p className="break-words inline mt-1">{comment.message}</p>}
                                    </div>
                                ) : (
                                    <p className="break-words inline">{comment.message}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
            <form onSubmit={onSendMessage} className="relative mt-4 flex items-center gap-2 pointer-events-auto">
                <div className="relative flex-1">
                    <Input
                        placeholder="Add a comment..."
                        value={newMessage}
                        onChange={(e) => onNewMessageChange(e.target.value)}
                        className="bg-black/50 border-white/20 text-white placeholder:text-gray-400 pr-10"
                    />
                    <Button variant="ghost" size="icon" type="submit" className="absolute inset-y-0 right-0 text-white">
                        <ArrowUp className="h-5 w-5" />
                    </Button>
                </div>
                <Button variant="ghost" size="icon" onClick={onReaction} className="text-white bg-black/50 rounded-full h-10 w-10">
                    <Smile className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onToggleVisibility} className="text-white bg-black/50 rounded-full h-10 w-10">
                    <MessageCircleOff className="h-5 w-5" />
                </Button>
            </form>
        </div>
    );
};
