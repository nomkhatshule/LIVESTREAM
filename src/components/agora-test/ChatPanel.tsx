
'use client';

import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Comment, GiphyResult } from '@/lib/types';
import { CornerUpLeft, X, ArrowUp, Smile, Heart, ThumbsUp, Paperclip } from 'lucide-react';
import Image from 'next/image';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import GifPicker from '../inbox/GifPicker';
import { Textarea } from '../ui/textarea';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';

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
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
    const [selectedGif, setSelectedGif] = useState<GiphyResult | null>(null);
    const [imageAttachment, setImageAttachment] = useState<{ file: File, url: string } | null>(null);

    const onReply = (username: string) => {
        setNewMessage(`@${username} `);
        textareaRef.current?.focus();
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' && !imageAttachment && !selectedGif) return;
        onSendMessage(newMessage, imageAttachment || selectedGif);
        setNewMessage('');
        setSelectedGif(null);
        setImageAttachment(null);
    };

    const handleGifSelect = (gif: GiphyResult) => {
        setSelectedGif(gif);
        setIsGifPickerOpen(false);
        setImageAttachment(null);
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Add validation if needed (size, type)
            setImageAttachment({ file, url: URL.createObjectURL(file) });
            setSelectedGif(null);
        }
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
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => onReply(comment.username)}>
                                    <CornerUpLeft className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
             <div className="pt-2 pb-4 pointer-events-auto">
                <form onSubmit={handleFormSubmit} className="relative flex w-full items-center gap-2">
                    <div className="relative flex-1 bg-black/50 border border-white/20 rounded-2xl overflow-hidden flex flex-col">
                        {(selectedGif || imageAttachment) && (
                            <div className='p-2'>
                                <div className="relative w-32 h-24">
                                    <Image src={imageAttachment?.url || selectedGif?.images.fixed_width.url || ''} alt={imageAttachment?.file.name || selectedGif?.title || ''} fill className="object-cover rounded-md" />
                                    <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => { setSelectedGif(null); setImageAttachment(null); }}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Separator className='my-2 bg-white/20'/>
                            </div>
                        )}
                        <div className="relative flex items-center">
                            <Textarea
                                ref={textareaRef}
                                placeholder="Add a comment..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleFormSubmit(e);
                                    }
                                }}
                                className={cn(
                                    "bg-transparent border-none placeholder:text-gray-400 text-white w-full min-h-[40px] h-10 resize-none py-2 pr-36 pl-4 focus-visible:ring-0 shadow-none",
                                )}
                            />
                            <div className="absolute inset-y-0 right-1 flex items-center">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="image/png, image/jpeg, image/gif"
                                />
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
                                <Button variant="ghost" size="icon" type="button" className="text-white rounded-full h-9 w-9" onClick={() => fileInputRef.current?.click()}>
                                    <Paperclip className="h-5 w-5" />
                                </Button>
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
                                <Button variant="ghost" size="icon" type="submit" className="text-white h-9 w-9">
                                    <ArrowUp className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
             </div>
        </div>
    );
};
