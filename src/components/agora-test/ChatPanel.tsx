
'use client';

import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Comment, GiphyResult } from '@/lib/types';
import { CornerUpLeft, X, ArrowUp, Smile, Heart, ThumbsUp } from 'lucide-react';
import Image from 'next/image';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import GifPicker from '../inbox/GifPicker';

interface ChatPanelProps {
    comments: Comment[] | null;
    isVisible: boolean;
    onSendMessage: (message: string, attachment: GiphyResult | null) => void;
    onReaction: (emoji: React.ReactNode) => void;
}

export default function ChatPanel({ 
    comments,
    isVisible,
    onSendMessage,
    onReaction
}: ChatPanelProps) {
    const chatInputRef = useRef<HTMLInputElement>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
    const [selectedGif, setSelectedGif] = useState<GiphyResult | null>(null);

    const onReply = (username: string) => {
        setNewMessage(`@${username} `);
        chatInputRef.current?.focus();
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSendMessage(newMessage, selectedGif);
        setNewMessage('');
        setSelectedGif(null);
    };

    const handleGifSelect = (gif: GiphyResult) => {
        setSelectedGif(gif);
        setIsGifPickerOpen(false);
    };

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
                    <div className="flex flex-col">
                        {comments && comments.map((comment: Comment) => (
                            <div key={comment.id} className="group flex items-start gap-3 text-sm text-white p-2 rounded-lg pb-1">
                                <Avatar className="h-6 w-6 border-2 border-secondary">
                                    <AvatarImage src={comment.userAvatar} alt={comment.username} />
                                    <AvatarFallback>{comment.username.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
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
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => onReply(comment.username)}>
                                    <CornerUpLeft className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
             <div className="pt-2 pointer-events-auto">
                {selectedGif && (
                    <div className="relative w-32 h-24 mb-2 ml-2">
                        <Image src={selectedGif.images.fixed_width.url} alt={selectedGif.title} fill className="object-cover rounded-md" />
                        <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => setSelectedGif(null)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                <form onSubmit={handleFormSubmit} className="relative mt-2 flex items-center gap-2">
                    <div className="relative flex-1">
                        <Input
                            ref={chatInputRef}
                            placeholder="Add a comment..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="bg-black/50 border-white/20 text-white placeholder:text-gray-400 pr-28 rounded-full"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" type="button" className="text-white rounded-full h-9 w-9">
                                        <Smile className="h-5 w-5" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto bg-black/50 border-white/20 p-1" side="top" align="end">
                                    <div className="flex gap-1">
                                        {reactions.map(r => (
                                            <Button key={r.id} variant="ghost" size="icon" className="text-white text-xl" onClick={() => onReaction(r.emoji)}>
                                                {r.emoji}
                                            </Button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <Popover open={isGifPickerOpen} onOpenChange={setIsGifPickerOpen}>
                                <PopoverTrigger asChild>
                                    <Button size="icon" type="button" variant="ghost" className="rounded-full h-9 w-9 text-white">
                                        <b className="text-xs">GIF</b>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-screen sm:w-96 h-96 p-0 border-zinc-700 bg-zinc-900" side="top" align="end">
                                <GifPicker onSendGif={handleGifSelect} />
                                </PopoverContent>
                            </Popover>
                            <Button variant="ghost" size="icon" type="submit" className="text-white">
                                <ArrowUp className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </form>
             </div>
        </div>
    );
};
