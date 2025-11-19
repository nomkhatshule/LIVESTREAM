
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import GifPicker, { type GiphyResult } from '@/components/inbox/GifPicker';
import { ArrowUp, Paperclip, Smile, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

interface ChatInputFormProps {
    onSubmit: (message: string, attachment: GiphyResult | { file: File, url: string } | null) => Promise<void> | void;
    inputRef?: React.RefObject<HTMLTextAreaElement>;
    quickReactions?: { id: string, emoji: React.ReactNode }[];
    onReaction?: (emoji: React.ReactNode) => void;
    replyingTo?: string | null;
    onCancelReply?: () => void;
    attachmentIconType?: 'paperclip' | 'image';
}

export default function ChatInputForm({ onSubmit, inputRef, quickReactions, onReaction, replyingTo, onCancelReply, attachmentIconType = 'paperclip' }: ChatInputFormProps) {
    const [newMessage, setNewMessage] = useState('');
    const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
    const [selectedGif, setSelectedGif] = useState<GiphyResult | null>(null);
    const [imageAttachment, setImageAttachment] = useState<{ file: File, url: string } | null>(null);
    const [isSending, setIsSending] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedGif && !imageAttachment) || isSending) return;
        
        setIsSending(true);
        await onSubmit(newMessage, imageAttachment || selectedGif);
        setIsSending(false);
        setNewMessage('');
        setSelectedGif(null);
        setImageAttachment(null);
    };

    const handleGifSelect = (gif: GiphyResult) => {
        setSelectedGif(gif);
        setIsGifPickerOpen(false);
        setImageAttachment(null);
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                toast({ title: "File too large", description: "Please select an image under 2MB.", variant: "destructive" });
                return;
            }
            if (!file.type.startsWith('image/')) {
                toast({ title: "Invalid file type", description: "Please select an image file.", variant: "destructive" });
                return;
            }
            setImageAttachment({ file, url: URL.createObjectURL(file) });
            setSelectedGif(null);
        }
    };
    
    const cancelAttachment = () => {
        setSelectedGif(null);
        setImageAttachment(null);
    }
    
    const AttachmentIcon = attachmentIconType === 'image' ? ImageIcon : Paperclip;

    return (
         <form onSubmit={handleFormSubmit} className="relative flex w-full items-center gap-2">
            <div className="relative flex-1 bg-transparent border border-white/50 rounded-2xl overflow-hidden flex flex-col">
                {(selectedGif || imageAttachment) && (
                    <div className='p-2'>
                        <div className="relative w-32 h-24">
                            <Image src={imageAttachment?.url || selectedGif?.images.fixed_width.url || ''} alt={imageAttachment?.file.name || selectedGif?.title || ''} fill className="object-cover rounded-md" />
                            <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={cancelAttachment}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <Separator className='my-2 bg-white/20'/>
                    </div>
                )}
                 {replyingTo && onCancelReply && (
                     <div className="p-2 text-xs text-zinc-400 flex justify-between items-center">
                         <span>Replying to <span className="font-bold text-primary">@{replyingTo}</span></span>
                         <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancelReply}><X className="h-4 w-4" /></Button>
                     </div>
                 )}
                <div className="relative flex items-center">
                    <Textarea
                        ref={inputRef}
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
                            "bg-transparent border-none placeholder:text-white w-full min-h-[40px] h-10 resize-none py-2 pr-24 pl-4 focus-visible:ring-0",
                             (selectedGif || imageAttachment || replyingTo) ? "rounded-b-2xl rounded-t-none" : "rounded-2xl"
                        )}
                        disabled={isSending}
                    />
                    <div className="absolute bottom-1 right-1 flex items-center">
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/png, image/jpeg, image/gif" />
                        
                        {onReaction && quickReactions && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button size="icon" type="button" variant="ghost" className="rounded-full h-9 w-9 text-white" disabled={isSending}>
                                        <Smile className="h-5 w-5" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto bg-black/50 border-white/20 p-1" side="top" align="end">
                                    <div className="flex gap-1">
                                        {quickReactions.map(r => (
                                            <Button key={r.id} variant="ghost" size="icon" className="text-white text-xl" onClick={() => onReaction(r.emoji)}>
                                                {r.emoji}
                                            </Button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        )}
                         <Button size="icon" type="button" variant="ghost" className="rounded-full h-9 w-9 text-white" onClick={() => fileInputRef.current?.click()} disabled={isSending}>
                            <AttachmentIcon className="h-5 w-5" />
                        </Button>
                        <Popover open={isGifPickerOpen} onOpenChange={setIsGifPickerOpen}>
                            <PopoverTrigger asChild>
                                <Button size="icon" type="button" variant="ghost" className="rounded-full h-9 w-9 text-white" disabled={isSending}>
                                    <b className="text-xs">GIF</b>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-screen sm:w-96 h-96 p-0 border-zinc-700 bg-zinc-900" side="top" align="end">
                            <GifPicker onSendGif={handleGifSelect} />
                            </PopoverContent>
                        </Popover>
                        <Button variant="ghost" size="icon" type="submit" className="text-white hover:bg-transparent hover:text-white h-9 w-9" disabled={isSending || (!newMessage.trim() && !selectedGif && !imageAttachment)}>
                            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
}
