
'use client';

import { Button } from "@/components/ui/button";
import { Dice6, Mic, MicOff, Minus, MonitorUp, ScreenShare, UserPlus, Video, VideoOff, MessageCircle, MessageCircleOff, ArrowUp, Smile, Heart, ThumbsUp, CornerUpLeft, X } from "lucide-react";
import ParticipantsPanel from "./ParticipantsPanel";
import { useState, useRef } from "react";
import { useUser, useUserDocument } from "@/firebase";
import { useFirestore } from "@/firebase";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { collection, serverTimestamp } from "firebase/firestore";
import { Input } from "../ui/input";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import GifPicker, { type GiphyResult } from "../inbox/GifPicker";

interface StreamControlsProps {
    onToggleVideo: () => void;
    onToggleMic: () => void;
    onToggleScreenShare: () => void;
    onInviteGuest: () => void;
    onToggleChallengeVisibility: () => void;
    onOpenGames: () => void;
    onToggleChat: () => void;
    isVideoEnabled: boolean;
    isMicEnabled: boolean;
    isScreenSharing: boolean;
    isChallengeActive: boolean;
    isChatVisible: boolean;
    viewerCount: number;
    isCallJoined: boolean;
    broadcastId: string | null;
    onReaction: (emoji: React.ReactNode) => void;
}

export default function StreamControls({ 
    onToggleVideo, 
    onToggleMic, 
    onToggleScreenShare, 
    onInviteGuest, 
    isVideoEnabled, 
    isMicEnabled, 
    isScreenSharing, 
    onToggleChallengeVisibility, 
    isChallengeActive, 
    onOpenGames,
    viewerCount,
    isCallJoined,
    isChatVisible,
    onToggleChat,
    broadcastId,
    onReaction,
}: StreamControlsProps) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { userDocument } = useUserDocument();
    const chatInputRef = useRef<HTMLInputElement>(null);
    
    const [newMessage, setNewMessage] = useState('');
    const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
    const [selectedGif, setSelectedGif] = useState<GiphyResult | null>(null);

    const reactions = [
        { id: 'heart', emoji: <Heart key="heart" className="text-red-500 fill-red-500" /> },
        { id: 'thumb', emoji: <ThumbsUp key="thumbsup" className="text-yellow-400 fill-yellow-400" /> },
        { id: 'laugh', emoji: '😂' },
        { id: 'fire', emoji: '🔥' },
        { id: 'party', emoji: '🎉' },
    ];
    
    const onSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if ((newMessage.trim() === '' && !selectedGif) || !user || !broadcastId || !userDocument) return;

        let newComment: any = {
            userId: user.uid,
            username: userDocument.username || 'Anonymous',
            userAvatar: userDocument.profilePicture || '',
            message: newMessage,
            timestamp: serverTimestamp(),
        };

        if (selectedGif) {
            newComment.attachment = {
                type: 'giphy',
                title: selectedGif.title,
                imageUrl: selectedGif.images.original.url,
                thumbUrl: selectedGif.images.fixed_width.url,
            };
        }
        
        const mentionMatch = newMessage.match(/^@(\w+)\s/);
        if (mentionMatch) {
          newComment.replyingTo = mentionMatch[1];
        }

        const messagesCollectionRef = collection(firestore, 'broadcasts', broadcastId, 'messages');
        addDocumentNonBlocking(messagesCollectionRef, newComment);
        setNewMessage('');
        setSelectedGif(null);
    };

    const handleGifSelect = (gif: GiphyResult) => {
        setSelectedGif(gif);
        setIsGifPickerOpen(false);
    };
    
    if (!isCallJoined) {
        return null;
    }
    
    return (
        <div className="absolute top-1/2 right-4 -translate-y-1/2 z-30 flex flex-col items-center gap-4 p-2 bg-black/40 rounded-full backdrop-blur-sm pointer-events-auto">
            <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onToggleVideo}>
                {isVideoEnabled ? <Video className="h-5 w-5 md:h-6 md:w-6"/> : <VideoOff className="h-5 w-5 md:h-6 md:w-6 text-red-500"/>}
            </Button>
            <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onToggleMic}>
                {isMicEnabled ? <Mic className="h-5 w-5 md:h-6 md:w-6"/> : <MicOff className="h-5 w-5 md:h-6 md:w-6 text-red-500"/>}
            </Button>
            <Button variant={isScreenSharing ? "primary" : "secondary"} size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onToggleScreenShare}>
                {isScreenSharing ? <MonitorUp className="h-5 w-5 md:h-6 md:w-6"/> : <ScreenShare className="h-5 w-5 md:h-6 md:w-6"/>}
            </Button>
            <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onInviteGuest}>
                <UserPlus className="h-5 w-5 md:h-6 md:w-6"/>
            </Button>
            {isChallengeActive && (
              <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onToggleChallengeVisibility}>
                  <Minus className="h-5 w-5 md:h-6 md:w-6"/>
              </Button>
            )}
            <ParticipantsPanel viewerCount={viewerCount} />
            <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onOpenGames}>
                <Dice6 className="h-5 w-5 md:h-6 md:w-6"/>
            </Button>
             <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onToggleChat}>
                {isChatVisible ? <MessageCircleOff className="h-5 w-5 md:h-6 md:w-6"/> : <MessageCircle className="h-5 w-5 md:h-6 md:w-6"/>}
            </Button>
            {isChatVisible && (
                 <div className="absolute right-full bottom-0 w-80 mr-4">
                     {selectedGif && (
                        <div className="relative w-32 h-24 mb-2 ml-2 pointer-events-auto">
                            <Image src={selectedGif.images.fixed_width.url} alt={selectedGif.title} fill className="object-cover rounded-md" />
                            <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => setSelectedGif(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    <form onSubmit={onSendMessage} className="relative mt-2 flex items-center gap-2 pointer-events-auto">
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
            )}
        </div>
    );
};
