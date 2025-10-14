'use client';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useUserDocument, updateDocumentNonBlocking, addDocumentNonBlocking, useCollection } from '@/firebase';
import { doc, collection, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { useEffect, useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, ScreenShare, ScreenShareOff, X, Users, MessageCircle, Send, Smile, FlipHorizontal, MessageCircleOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import VideoPlayer from '@/components/broadcast/video-player';
import type { Broadcast, ChatMessage } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMemoFirebase } from '@/firebase';


function LiveStudio() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const broadcastId = searchParams.get('id');
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const { userDocument: hostUserDocument, isDocLoading: isHostDocLoading } = useUserDocument();
    const { toast } = useToast();
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // State for controls
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    // Chat state
    const [newMessage, setNewMessage] = useState('');
    const [isChatVisible, setIsChatVisible] = useState(true);
    
    // Memoize the doc reference
    const broadcastDocRef = useMemoFirebase(() => {
        if (!broadcastId) return undefined;
        return doc(firestore, 'broadcasts', broadcastId);
    }, [broadcastId, firestore]);

    // Memoize the chat collection query
    const messagesQuery = useMemoFirebase(() => {
        if (!broadcastId) return undefined;
        return query(
            collection(firestore, `broadcasts/${broadcastId}/messages`),
            orderBy('timestamp', 'asc'),
            limit(100) // Limit to the last 100 messages
        );
    }, [broadcastId, firestore]);

    const { data: broadcastData, isLoading: isBroadcastLoading } = useDoc<any>(broadcastDocRef);
    const { data: messages, isLoading: areMessagesLoading } = useCollection<ChatMessage>(messagesQuery);


    // Mock broadcast object for the VideoPlayer
    const liveBroadcast: Broadcast = useMemo(() => {
        const hostInfo = {
            id: user?.uid || 'host',
            name: hostUserDocument?.username || user?.displayName || 'Host',
            avatarUrl: hostUserDocument?.profilePicture || user?.photoURL || '',
            avatarHint: 'person portrait',
            bio: hostUserDocument?.bio || '',
            interests: [],
            watchHistory: []
        };
        
        return {
            id: broadcastId || 'live-broadcast',
            title: broadcastData?.title || 'Live Stream',
            user: hostInfo,
            thumbnailUrl: '',
            thumbnailHint: '',
            viewers: broadcastData?.viewers || 0,
            category: broadcastData?.category || '',
            isLive: broadcastData?.isLive ?? true,
            tags: broadcastData?.tags || ['Live'],
        };
    }, [broadcastId, broadcastData, user, hostUserDocument]);

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

    // Redirect if broadcast is no longer live
    useEffect(() => {
      if (!isBroadcastLoading && broadcastData && !broadcastData.isLive) {
          toast({
              title: "Broadcast Ended",
              description: "This broadcast has ended.",
          });
          if(broadcastDocRef) {
            updateDocumentNonBlocking(broadcastDocRef, { isLive: false });
          }
          router.push('/');
      }
    }, [broadcastData, isBroadcastLoading, router, toast, broadcastDocRef]);

    useEffect(() => {
        // Auto-scroll to the bottom of the chat
        if (scrollAreaRef.current) {
            const scrollableView = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
            if (scrollableView) {
                scrollableView.scrollTop = scrollableView.scrollHeight;
            }
        }
    }, [messages]);


    const handleEndBroadcast = async () => {
        if (broadcastDocRef) {
            updateDocumentNonBlocking(broadcastDocRef, { isLive: false });
        }
        router.push('/');
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !user || !hostUserDocument || !broadcastId) return;

        const messagesCollectionRef = collection(firestore, 'broadcasts', broadcastId, 'messages');
        
        const messagePayload: Omit<ChatMessage, 'id' | 'timestamp'> & { timestamp: any } = {
          userId: user.uid,
          username: hostUserDocument.username || user.displayName || 'Anonymous',
          userAvatar: hostUserDocument.profilePicture || user.photoURL || '',
          message: newMessage,
          timestamp: serverTimestamp(),
        };

        addDocumentNonBlocking(messagesCollectionRef, messagePayload);
        setNewMessage('');
    };

    if (isUserLoading || isBroadcastLoading || isHostDocLoading) {
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
                    broadcast={liveBroadcast}
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
                        {liveBroadcast.viewers}
                    </span>
                </div>
                 <Button variant="destructive" size="sm" onClick={handleEndBroadcast}>
                    <X className="h-4 w-4 mr-1.5"/> End
                </Button>
            </div>

            {/* Layer 3: Interaction Zone */}
            <div className="absolute bottom-0 left-0 right-0 z-10 p-4 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent h-2/5">
                {isChatVisible && (
                    <ScrollArea className="h-full max-h-[250px] pr-4" ref={scrollAreaRef}>
                        <div className="flex flex-col gap-3">
                            {messages && messages.map((msg) => (
                                <div key={msg.id} className="flex items-start gap-3 text-sm text-white bg-black/20 p-2 rounded-lg max-w-xs sm:max-w-sm">
                                    <Avatar className="h-6 w-6 border-2 border-primary">
                                        <AvatarImage src={msg.userAvatar} alt={msg.username} />
                                        <AvatarFallback>{msg.username.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <span className="font-bold text-primary mr-1.5">{msg.username}:</span>
                                        <p className="break-words inline">{msg.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
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
                    <Button variant="ghost" size="icon" onClick={() => setIsChatVisible(prev => !prev)} className="text-white bg-black/50 rounded-full h-10 w-10">
                        {isChatVisible ? <MessageCircleOff className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
                    </Button>
                </div>
            </div>
            
            {/* Layer 4: Core Stream Controls */}
             <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-4 p-2 bg-black/40 rounded-full backdrop-blur-sm">
                <Button variant={isAudioEnabled ? "secondary" : "destructive"} size="icon" className="rounded-full h-12 w-12" onClick={() => setIsAudioEnabled(prev => !prev)}>
                    {isAudioEnabled ? <Mic className="h-6 w-6"/> : <MicOff className="h-6 w-6"/>}
                </Button>
                 <Button variant={isVideoEnabled ? "secondary" : "destructive"} size="icon" className="rounded-full h-12 w-12" onClick={() => setIsVideoEnabled(prev => !prev)}>
                    {isVideoEnabled ? <Video className="h-6 w-6"/> : <VideoOff className="h-6 w-6"/>}
                </Button>
                 <Button variant={isScreenSharing ? "primary" : "secondary"} size="icon" className="rounded-full h-12 w-12" onClick={() => setIsScreenSharing(prev => !prev)}>
                    {isScreenSharing ? <ScreenShareOff className="h-6 w-6"/> : <ScreenShare className="h-6 w-6"/>}
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

    