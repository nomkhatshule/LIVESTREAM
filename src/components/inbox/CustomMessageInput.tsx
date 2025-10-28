
'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatContext } from '@/components/chat/ChatProvider';
import type { Message } from 'stream-chat';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowUp, Paperclip, X } from 'lucide-react';
import GifPicker, { type GiphyResult } from './GifPicker';
import Image from 'next/image';


interface CustomMessageInputProps {
    replyToMessage: Message | null;
    onCancelReply: () => void;
}

export default function CustomMessageInput({ replyToMessage, onCancelReply }: CustomMessageInputProps) {
    const { channel: activeChannel } = useChatContext();
    const [text, setText] = useState('');
    const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<{ file: File, url: string } | null>(null);


    useEffect(() => {
        if (replyToMessage) {
            // You might want to focus the input here
        }
    }, [replyToMessage]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeChannel) return;

        const shouldSendMessage = text.trim() || imagePreview;

        if (shouldSendMessage) {
            await activeChannel.sendMessage({ 
                text: text,
                quoted_message_id: replyToMessage?.id,
                attachments: imagePreview ? [{ file: imagePreview.file }] : [],
            });
            setText('');
            setImagePreview(null);
            onCancelReply();
        }
    }

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setText(e.target.value);
        if (activeChannel) {
            activeChannel.keystroke();
        }
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && activeChannel) {
             setImagePreview({ file, url: URL.createObjectURL(file) });
        }
        // Reset file input
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSendGif = async (gif: GiphyResult) => {
        if (activeChannel) {
            await activeChannel.sendMessage({
                text: gif.title,
                attachments: [
                    {
                        type: 'giphy',
                        title: gif.title,
                        image_url: gif.images.original.url,
                        thumb_url: gif.images.fixed_width.url,
                    },
                ],
                quoted_message_id: replyToMessage?.id,
            });
            setIsGifPickerOpen(false);
            onCancelReply();
        }
    };
    
    return (
        <div className="space-y-2">
            {replyToMessage && (
                <div className="bg-zinc-800 p-2 rounded-md text-sm flex justify-between items-center">
                    <div className="overflow-hidden">
                        <p className="font-bold text-primary">Replying to {replyToMessage.user?.name}</p>
                        <p className="text-zinc-400 truncate">{replyToMessage.text}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancelReply}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
             {imagePreview && (
                <div className="bg-zinc-800 p-2 rounded-md relative w-24 h-24">
                    <Image src={imagePreview.url} alt="Image preview" fill className="object-cover rounded-md" />
                    <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => setImagePreview(null)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
            <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
                 <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
                <input
                    value={text}
                    onChange={handleTextChange}
                    placeholder="Send a message..."
                    className="w-full bg-zinc-800 border-none text-white rounded-full px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                 <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                     <Button size="icon" type="button" variant="ghost" className="rounded-full h-9 w-9 text-zinc-400" onClick={() => fileInputRef.current?.click()}>
                        <Paperclip className="h-5 w-5" />
                    </Button>
                    <Popover open={isGifPickerOpen} onOpenChange={setIsGifPickerOpen}>
                        <PopoverTrigger asChild>
                            <Button size="icon" type="button" variant="ghost" className="rounded-full h-9 w-9 text-zinc-400">
                                <b className="text-xs">GIF</b>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-screen sm:w-96 h-96 p-0 border-zinc-700 bg-zinc-900" side="top" align="end">
                           <GifPicker onSendGif={handleSendGif} />
                        </PopoverContent>
                    </Popover>
                    <Button size="icon" type="submit" className="rounded-full h-8 w-8 bg-primary">
                        <ArrowUp className="h-5 w-5" />
                    </Button>
                 </div>
            </form>
        </div>
    )
}
