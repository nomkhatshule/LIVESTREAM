
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Comment, GiphyResult } from '@/lib/types';
import { ArrowUp, MessageCircle, MessageCircleOff, Smile, X, Heart, ThumbsUp } from 'lucide-react';
import Image from 'next/image';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import GifPicker from '../inbox/GifPicker';

interface ChatPanelProps {
    isVisible: boolean;
    comments: Comment[] | null;
    newMessage: string;
    onNewMessageChange: (message: string) => void;
    onSendMessage: (e: React.FormEvent, attachment?: any) => void;
    onReaction: (emoji: React.ReactNode) => void;
    onToggleVisibility: () => void;
    isGifPickerOpen: boolean;
    onGifPickerOpenChange: (open: boolean) => void;
    onGifSelect: (gif: GiphyResult) => void;
    selectedGif: GiphyResult | null;
    onClearSelectedGif: () => void;
}

export default function ChatPanel({ 
    isVisible, 
    comments, 
    newMessage, 
    onNewMessageChange, 
    onSendMessage, 
    onReaction, 
    onToggleVisibility,
    isGifPickerOpen,
    onGifPickerOpenChange,
    onGifSelect,
    selectedGif,
    onClearSelectedGif
}: ChatPanelProps) {

    const reactions = [
        { id: 'heart', emoji: <Heart key="heart" className="text-red-500 fill-red-500" /> },
        { id: 'thumb', emoji: <ThumbsUp key="thumbsup" className="text-yellow-400 fill-yellow-400" /> },
        { id: 'laugh', emoji: '😂' },
        { id: 'fire', emoji: '🔥' },
        { id: 'party', emoji: '🎉' },
    ];

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
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/40 to-transparent h-[50%] pointer-events-none">
            <div className="h-full relative">
                <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-transparent to-black/0 via-black/0 z-10 pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 100%)' }} />
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
             </div>
             {selectedGif && (
                <div className="relative w-32 h-24 mt-2 pointer-events-auto">
                    <Image src={selectedGif.images.fixed_width.url} alt={selectedGif.title} fill className="object-cover rounded-md" />
                     <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={onClearSelectedGif}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
            <form onSubmit={onSendMessage} className="relative mt-2 flex items-center gap-2 pointer-events-auto">
                <div className="relative flex-1">
                    <Input
                        placeholder="Add a comment..."
                        value={newMessage}
                        onChange={(e) => onNewMessageChange(e.target.value)}
                        className="bg-black/50 border-white/20 text-white placeholder:text-gray-400 pr-28"
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
                        <Popover open={isGifPickerOpen} onOpenChange={onGifPickerOpenChange}>
                            <PopoverTrigger asChild>
                                <Button size="icon" type="button" variant="ghost" className="rounded-full h-9 w-9 text-white">
                                    <b className="text-xs">GIF</b>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-screen sm:w-96 h-96 p-0 border-zinc-700 bg-zinc-900" side="top" align="end">
                               <GifPicker onSendGif={onGifSelect} />
                            </PopoverContent>
                        </Popover>
                        <Button variant="ghost" size="icon" type="submit" className="text-white">
                            <ArrowUp className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onToggleVisibility} className="text-white bg-black/50 rounded-full h-10 w-10">
                    <MessageCircleOff className="h-5 w-5" />
                </Button>
            </form>
        </div>
    );
};
