'use client';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase, useUserDocument } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useEffect, useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, X, Users, MessageCircle, Send, Smile, MessageCircleOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import type { Broadcast, ChatMessage as ChatMessageType } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCollection } from '@/firebase';
import Image from 'next/image';
import {
  Call,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import VideoPlayer from '@/components/broadcast/video-player';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { serverTimestamp, collection, query, orderBy, limit, updateDoc } from 'firebase/firestore';


// This component contains all the UI and logic that depends on the call context.
// It is guaranteed to run inside <StreamCall>, so all hooks will work correctly.
function LiveStudio({ liveBroadcast }: { liveBroadcast: Broadcast }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { userDocument: hostUserDocument } = useUserDocument();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const [newMessage, setNewMessage] = useState('');
    const [isChatVisible, setIsChatVisible] = useState(true);

    // These hooks now work reliably because they are inside <StreamCall>
    const { useCameraState, useMicrophoneState, useCallCallingState } = useCallStateHooks();
    const callingState = useCallCallingState();
    const { camera, isMute: isCameraMute } = useCameraState();
    const { microphone, isMute: isMicrophoneMute } = useMicrophoneState();

    const messagesQuery = useMemoFirebase(() => {
        if (!liveBroadcast.id) return undefined;
        return query(
            collection(firestore, `broadcasts/${liveBroadcast.id}/messages`),
            orderBy('timestamp', 'asc'),
            limit(100)
        );
    }, [liveBroadcast.id, firestore]);
    const { data: messages } = useCollection<ChatMessageType>(messagesQuery);
    
    // Auto-enable camera and mic for the host once the call has been joined.
    // This ensures the "Ready to stream" UI shows first.
    useEffect(() => {
        if (callingState !== 'joined') return;

        const enableMedia = async () => {
          if (isCameraMute) await camera.enable();
          if (isMicrophoneMute) await microphone.enable();
        };
        enableMedia();
    }, [callingState, camera, microphone, isCameraMute, isMicrophoneMute]);

    useEffect(() => {
        // Auto-scroll chat
        if (scrollAreaRef.current) {
            const scrollableView = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
            if (scrollableView) {
                scrollableView.scrollTop = scrollableView.scrollHeight;
            }
        }
    }, [messages]);


    const handleEndBroadcast = async () => {
        if (liveBroadcast.id) {
            const broadcastDocRef = doc(firestore, 'broadcasts', liveBroadcast.id);
            await updateDoc(broadcastDocRef, { isLive: false });
            // The call will be left automatically on cleanup from the wrapper
            router.push('/');
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !user || !hostUserDocument || !liveBroadcast.id) return;

        const messagesCollectionRef = collection(firestore, 'broadcasts', liveBroadcast.id, 'messages');
        
        const messagePayload: Omit<ChatMessageType, 'id' | 'timestamp'> & { timestamp: any } = {
          userId: user.uid,
          username: hostUserDocument.username || user.displayName || 'Anonymous',
          userAvatar: hostUserDocument.profilePicture || user.photoURL || '',
          message: newMessage,
          timestamp: serverTimestamp(),
        };

        addDocumentNonBlocking(messagesCollectionRef, messagePayload);
        setNewMessage('');
    };

    const isVideoEnabled = !isCameraMute;
    const isAudioEnabled = !isMicrophoneMute;

    return (
        <div className="relative h-screen w-full">
            <div className="h-screen w-full bg-black text-white flex flex-col relative">
                
                {/* Background image for loading state */}
                <Image
                    src="https://picsum.photos/seed/livebg/1920/1080"
                    alt="Abstract background"
                    fill
                    className="object-cover -z-10"
                    data-ai-hint="abstract lights"
                />
                
                {/* VideoPlayer is now a simple presentational component */}
                <VideoPlayer broadcast={liveBroadcast} isHost={true} />
                
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
            </div>
            {callingState === 'joined' && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-4 p-2 bg-black/40 rounded-full backdrop-blur-sm">
                    <Button variant={isAudioEnabled ? "secondary" : "destructive"} size="icon" className="rounded-full h-12 w-12" onClick={() => microphone.toggle()}>
                        {isAudioEnabled ? <Mic className="h-6 w-6"/> : <MicOff className="h-6 w-6"/>}
                    </Button>
                    <Button variant={isVideoEnabled ? "secondary" : "destructive"} size="icon" className="rounded-full h-12 w-12" onClick={() => camera.toggle()}>
                        {isVideoEnabled ? <Video className="h-6 w-6"/> : <VideoOff className="h-6 w-6"/>}
                    </Button>
                </div>
            )}
        </div>
    );
}

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || '';

// This wrapper component handles all SDK initialization and context providers.
function LiveStudioWrapper() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const broadcastId = searchParams.get('id');
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();
    const [client, setClient] = useState<StreamVideoClient | null>(null);
    const [call, setCall] = useState<Call | null>(null);

    const broadcastDocRef = useMemoFirebase(() => {
        if (!broadcastId) return undefined;
        return doc(firestore, 'broadcasts', broadcastId);
    }, [broadcastId, firestore]);

    const { data: broadcastData, isLoading: isBroadcastLoading } = useDoc<any>(broadcastDocRef);
    
    const liveBroadcast: Broadcast | null = useMemo(() => {
        if (!broadcastId || !broadcastData) return null;
        
        const hostInfo = {
            id: broadcastData.hostId,
            name: broadcastData.hostName,
            avatarUrl: broadcastData.hostAvatar,
            avatarHint: 'person portrait',
            bio: '',
            interests: [],
            watchHistory: []
        };
        
        return {
            id: broadcastId,
            title: broadcastData.title,
            user: hostInfo,
            thumbnailUrl: '',
            thumbnailHint: '',
            viewers: broadcastData.viewers,
            category: broadcastData.category,
            isLive: broadcastData.isLive,
            tags: broadcastData.tags,
        };
    }, [broadcastId, broadcastData]);

    useEffect(() => {
        if (isUserLoading || !user || !broadcastId || client) {
            return;
        }

        let videoClient: StreamVideoClient;

        const initStream = async () => {
            if (!apiKey) {
                toast({ variant: 'destructive', title: 'Stream API Key is missing.' });
                return;
            }

            try {
                const response = await fetch('/api/stream/token', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: user.uid }),
                });
                if (!response.ok) throw new Error('Failed to fetch token');
                const { token } = await response.json();
                
                videoClient = new StreamVideoClient({
                    apiKey,
                    user: {
                        id: user.uid,
                        name: user.displayName || 'Anonymous',
                        image: user.photoURL || undefined,
                    },
                    token,
                });

                setClient(videoClient);
                const callInstance = videoClient.call('livestream', broadcastId);
                await callInstance.join({ create: true });
                setCall(callInstance);

            } catch (error: any) {
                console.error("Stream initialization failed:", error);
                toast({ variant: 'destructive', title: 'Connection Failed', description: error.message || 'Could not connect to the broadcast.'});
            }
        };
        
        initStream();

        return () => {
            if (call) {
                call.leave().catch(err => console.error("Failed to leave call on cleanup", err));
            }
            if (client) {
                client.disconnectUser().catch(err => console.error("Failed to disconnect user on cleanup", err));
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [broadcastId, user, isUserLoading]); // Removed client and call from deps to prevent re-init


    useEffect(() => {
        // Redirect non-hosts or unauthenticated users.
        if (!isUserLoading && (!user || (broadcastData && user.uid !== broadcastData.hostId))) {
             toast({
                title: "Unauthorized",
                description: "You must be the host to access the live studio.",
                variant: "destructive",
            });
            router.push(`/broadcast/${broadcastId || ''}`);
        }
    }, [user, isUserLoading, router, toast, broadcastData, broadcastId]);

    useEffect(() => {
      // Redirect if the broadcast has ended.
      if (!isBroadcastLoading && broadcastData && !broadcastData.isLive) {
          toast({
              title: "Broadcast Ended",
              description: "This broadcast has ended.",
          });
          router.push('/');
      }
    }, [broadcastData, isBroadcastLoading, router, toast]);


    if (isUserLoading || isBroadcastLoading || !liveBroadcast || !client || !call) {
        return <div className="h-screen w-full flex items-center justify-center bg-black text-white">Loading Studio...</div>;
    }
    
    if (!broadcastId) {
        return <div className="h-screen w-full flex items-center justify-center bg-black text-white">Broadcast ID not found.</div>;
    }
    
    // Render the context providers, and pass the new LiveStudio component as a child.
    return (
        <StreamVideo client={client}>
            <StreamCall call={call}>
                <LiveStudio liveBroadcast={liveBroadcast} />
            </StreamCall>
        </StreamVideo>
    )
}

export default function LivePage() {
    return (
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-black text-white">Loading Studio...</div>}>
            <LiveStudioWrapper />
        </Suspense>
    )
}
