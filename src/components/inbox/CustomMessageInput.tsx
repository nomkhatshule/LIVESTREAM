
'use client';

import { useState, useEffect } from 'react';
import { useChatContext } from '@/components/chat/ChatProvider';
import type { Message } from 'stream-chat';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowUp, Smile, X, Heart } from 'lucide-react';
import GifPicker, { type TenorResult } from './GifPicker';


interface CustomMessageInputProps {
    replyToMessage: Message | null;
    onCancelReply: () => void;
}

export default function CustomMessageInput({ replyToMessage, onCancelReply }: CustomMessageInputProps) {
    const { channel: activeChannel } = useChatContext();
    const [text, setText] = useState('');
    const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);

    useEffect(() => {
        if (replyToMessage) {
            // You might want to focus the input here
        }
    }, [replyToMessage]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim() && activeChannel) {
            await activeChannel.sendMessage({ 
                text,
                parent_id: replyToMessage?.id
            });
            setText('');
            onCancelReply();
        }
    }

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setText(e.target.value);
        if (activeChannel) {
            activeChannel.keystroke();
        }
    }

    const handleHeartReaction = async () => {
        if (activeChannel) {
            const lastMessage = activeChannel.state.messages[activeChannel.state.messages.length - 1];
            if (lastMessage) {
                // Check if user already liked it
                const existingReaction = lastMessage.latest_reactions?.find(r => r.type === '❤️' && r.user_id === activeChannel.client.userID);
                if (existingReaction) {
                    await activeChannel.deleteReaction(lastMessage.id, existingReaction.type);
                } else {
                    await activeChannel.sendReaction(lastMessage.id, { type: '❤️' });
                }
            }
        }
    };

    const handleSendGif = async (gif: TenorResult) => {
        if (activeChannel) {
            await activeChannel.sendMessage({
                text: gif.content_description,
                attachments: [
                    {
                        type: 'giphy', // Stream's generic 'image' or 'video' type is also an option
                        title: gif.content_description,
                        image_url: gif.media_formats.gif.url,
                        thumb_url: gif.media_formats.tinygif.url,
                    },
                ],
            });
            setIsGifPickerOpen(false);
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
            <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
                <input
                    value={text}
                    onChange={handleTextChange}
                    placeholder="Send a message..."
                    className="w-full bg-zinc-800 border-none text-white rounded-full px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                 <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                     <Button size="icon" type="button" variant="ghost" className="rounded-full h-9 w-9 text-zinc-400" onClick={handleHeartReaction}>
                        <Heart className="h-5 w-5" />
                    </Button>
                    <Popover open={isGifPickerOpen} onOpenChange={setIsGifPickerOpen}>
                        <PopoverTrigger asChild>
                            <Button size="icon" type="button" variant="ghost" className="rounded-full h-9 w-9 text-zinc-400">
                                <b className="text-xs">GIF</b>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 h-96 p-0 border-zinc-700 bg-zinc-900" side="top" align="end">
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

    