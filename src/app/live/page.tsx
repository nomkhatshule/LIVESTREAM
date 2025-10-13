'use client';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, ScreenShare, ScreenShareOff, X, Users, MessageCircle, Send, Smile, FlipHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import ChatMessageItem from '@/components/broadcast/chat-message';
import VideoPlayer from '@/components/broadcast/video-player';
import type { Broadcast } from '@/lib/data';
import { users, chatMessages as initialMessages } from '@/lib/data';
import type { ChatMessage } from '@/lib/data';

function LiveStudio() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const broadcastId = searchParams.get('id');
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();

    // State for controls
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    // Chat state
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [newMessage, setNewMessage] = useState('');


    // Memoize the doc reference
    const broadcastDocRef = useMemo(() => {
        if (!broadcastId) return undefined;
        return doc(firestore, 'broadcasts', broadcastId);
    }, [broadcastId, firestore]);

    const { data: broadcastData, isLoading: isBroadcastLoading } = useDoc<any>(broadcastDocRef);

    // Mock broadcast object for the VideoPlayer
    const mockBroadcast: Broadcast = useMemo(() => {
        const hostUser = users.find(u => u.id === broadcastData?.hostId) || users[0];
        return {
            id: broadcastId || 'live-broadcast',
            title: broadcastData?.title || 'Live Stream',
            user: hostUser,
            thumbnailUrl: '',
            thumbnailHint: '',
            viewers: broadcastData?.viewers || 0,
            category: broadcastData?.category || '',
            isLive: true,
            tags: broadcastData?.tags || ['Live'],
        };
    }, [broadcastId, broadcastData]);

    useEffect(() => {
        if (!isUserLoading && !user) {
            toast({
                title: "Authentication required",
                description: "You must be logged in to host a stream.",
                variant: "destructive",
            });
            router.push('/login');
        }
    }, [user, isUserLoading, router, toast]);


    const handleEndBroadcast = async () => {
        // Here you would add logic to update the broadcast document in Firestore
        // and properly leave the Agora channel.
        router.push('/');
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;

        const currentUser = users[0]; // Simulate current user
        const message: ChatMessage = {
            id: `msg-${Date.now()}`,
            user: {
                name: currentUser.name,
                avatarUrl: currentUser.avatarUrl,
                avatarHint: currentUser.avatarHint,
            },
            message: newMessage,
            timestamp: 'Just now',
        };

        setMessages((prev) => [...prev, message]);
        setNewMessage('');
    };

    if (isUserLoading || isBroadcastLoading) {
        return <div className="h-screen w-full flex items-center justify-center bg-black text-white">Loading Studio...</div>;
    }
    
    if (!broadcastId) {
        return <div className="h-screen w-full flex items-center justify-center bg-black text-white">Broadcast ID not found.</div>;
    }


    return (
        <div className="h-screen w-full bg-black text-white flex flex-col relative">
            {/* Layer 1: Video Feed */}
            <div className="absolute inset-0 z-0">
                <VideoPlayer
                    broadcast={mockBroadcast}
                    isHost={true}
                    isAudioEnabled={isAudioEnabled}
                    isVideoEnabled={isVideoEnabled}
                    isScreenSharing={isScreenSharing}
                />
            </div>
            
            {/* Layer 2: Status Bar */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
                <div className="flex items-center gap-4">
                     <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-600 text-white animate-pulse">
                        <span className="w-2 h-2 mr-2 bg-white rounded-full"></span>
                        LIVE
                    </span>
                    <span className="inline-flex items-center text-sm font-medium gap-1.5">
                        <Users className="h-4 w-4" />
                        {mockBroadcast.viewers}
                    </span>
                </div>
                 <Button variant="destructive" size="sm" onClick={handleEndBroadcast}>
                    <X className="h-4 w-4 mr-1.5"/> End
                </Button>
            </div>

            {/* Layer 3: Interaction Zone */}
            <div className="absolute bottom-0 left-0 right-0 z-10 p-4 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent h-2/5">
                <ScrollArea className="h-full max-h-[250px] pr-4">
                    <div className="flex flex-col gap-3">
                         {messages.map((msg) => (
                            <div key={msg.id} className="flex items-start gap-2 text-sm text-white bg-black/20 p-2 rounded-lg max-w-xs sm:max-w-sm">
                                <span className="font-bold text-primary">{msg.user.name}:</span>
                                <p className="break-words">{msg.message}</p>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <div className="mt-4 flex items-center gap-2">
                     <form onSubmit={handleSendMessage} className="relative flex-1">
                        <Input
                            placeholder="Add a comment..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="bg-black/50 border-white/20 text-white placeholder:text-gray-400 pr-10"
                        />
                        <Button variant="ghost" size="icon" type="submit" className="absolute inset-y-0 right-0 text-white">
                            <Send className="h-5 w-5"/>
                        </Button>
                    </form>

                     <Button variant="ghost" size="icon" className="text-white bg-black/50 rounded-full h-10 w-10">
                        <Smile className="h-5 w-5" />
                    </Button>
                </div>
            </div>
            
            {/* Layer 4: Core Stream Controls */}
            <div className="absolute bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 p-2 bg-black/40 rounded-full backdrop-blur-sm">
                <Button variant={isAudioEnabled ? "secondary" : "destructive"} size="icon" onClick={() => setIsAudioEnabled(!isAudioEnabled)} className="rounded-full h-12 w-12">
                    {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
                </Button>
                <Button variant={isVideoEnabled && !isScreenSharing ? "secondary" : "destructive"} size="icon" onClick={() => setIsVideoEnabled(!isVideoEnabled)} disabled={isScreenSharing} className="rounded-full h-12 w-12">
                    {isVideoEnabled && !isScreenSharing ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
                </Button>
                <Button variant={isScreenSharing ? "primary" : "secondary"} size="icon" onClick={() => setIsScreenSharing(!isScreenSharing)} className="rounded-full h-12 w-12">
                    {isScreenSharing ? <ScreenShareOff className="h-6 w-6" /> : <ScreenShare className="h-6 w-6" />}
                </Button>
                 <Button variant="secondary" size="icon" className="rounded-full h-12 w-12">
                    <FlipHorizontal className="h-6 w-6" />
                </Button>
            </div>
        </div>
    );
}


export default function LivePage() {
    return (
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-black text-white">Loading Studio...</div>}>
            <LiveStudio />
        </Suspense>
    )
}
