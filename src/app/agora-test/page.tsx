
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, X, Send, Smile, MessageCircle, Video, Mic, UserPlus, ScreenShare, VideoOff, MicOff, ArrowUp, MessageCircleOff, MonitorUp, Heart, ThumbsUp, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useRef, useState, useMemo, Suspense, forwardRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useDoc, useFirestore, useMemoFirebase, useUserDocument } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, updateDoc, collection, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { useCollection } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import {
  Call,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  useCall,
  useCallStateHooks,
  CallingState,
  ParticipantView,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import VideoPlayer from '@/components/broadcast/video-player';
import { User } from 'lucide-react';

// Type Definitions
interface Comment {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  message: string;
  timestamp: any;
}

interface Reaction {
  id: number;
  emoji: React.ReactNode;
  x: number;
}

interface BroadcastData {
    title: string;
    hostId: string;
    hostName: string;
    hostAvatar: string;
    isLive: boolean;
    streamDetails?: {
      isScreenSharing: boolean;
    },
    user?: {
        id: string;
        name: string;
        avatarUrl: string;
    }
}

// Sub-components for AgoraTestPageUI

const StreamHeader = ({ broadcastData, viewerCount, onEndStream }: { broadcastData: BroadcastData, viewerCount: number, onEndStream: () => void }) => {
    return (
        <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
            <div className="flex items-center gap-3 bg-black/30 p-2 rounded-full">
                <Avatar className="h-9 w-9 border-2 border-primary">
                    <AvatarImage src={broadcastData?.hostAvatar || broadcastData?.user?.avatarUrl || ''} alt={broadcastData?.hostName || broadcastData?.user?.name || ''} />
                    <AvatarFallback>{(broadcastData?.hostName || broadcastData?.user?.name || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="font-bold text-sm leading-tight text-white">{broadcastData?.hostName || broadcastData?.user?.name || 'Host'}</span>
                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white animate-pulse">
                            LIVE
                        </span>
                        <span className="inline-flex items-center text-xs font-medium gap-1 text-white">
                            <Users className="h-3 w-3" />
                            {viewerCount.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
            <Button variant="destructive" size="sm" onClick={onEndStream}>
                <X className="h-4 w-4 mr-1.5" /> End
            </Button>
        </div>
    );
};

const StreamControls = ({ onToggleVideo, onToggleMic, onToggleScreenShare, onInviteGuest, isVideoEnabled, isMicEnabled, isScreenSharing, isCallJoined }: any) => {
    const { useParticipants } = useCallStateHooks();
    const participants = useParticipants();
    const viewerCount = Math.max(0, participants.length -1);

    return (
        <div className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2 md:gap-4 p-2 bg-black/40 rounded-full backdrop-blur-sm">
            <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onToggleVideo} disabled={!isCallJoined}>
                {isVideoEnabled ? <Video className="h-5 w-5 md:h-6 md:w-6"/> : <VideoOff className="h-5 w-5 md:h-6 md:w-6"/>}
            </Button>
            <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onToggleMic} disabled={!isCallJoined}>
                {isMicEnabled ? <Mic className="h-5 w-5 md:h-6 md:w-6"/> : <MicOff className="h-5 w-5 md:h-6 md:w-6"/>}
            </Button>
            <Button variant={isScreenSharing ? "primary" : "secondary"} size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onToggleScreenShare} disabled={!isCallJoined}>
                {isScreenSharing ? <MonitorUp className="h-5 w-5 md:h-6 md:w-6"/> : <ScreenShare className="h-5 w-5 md:h-6 md:w-6"/>}
            </Button>
            <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onInviteGuest}>
                <UserPlus className="h-5 w-5 md:h-6 md:w-6"/>
            </Button>
            <ParticipantsPanel viewerCount={viewerCount} participants={participants} />
        </div>
    );
};

const ParticipantsPanel = ({ viewerCount, participants }: any) => {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12">
                    <Users className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Participants ({viewerCount})</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
                    <div className="space-y-4">
                        {participants.map((p: any) => (
                            <div key={p.sessionId} className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={p.image} alt={p.name} />
                                    <AvatarFallback>{p.name?.charAt(0) || 'A'}</AvatarFallback>
                                </Avatar>
                                <span>{p.name || 'Anonymous Viewer'}</span>
                            </div>
                        ))}
                        {participants.length <= 1 && (
                            <p className="text-muted-foreground text-center py-8">
                                Just you for now.
                            </p>
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
};

const ChatPanel = ({ isVisible, comments, newMessage, onNewMessageChange, onSendMessage, onReaction, onToggleVisibility }: any) => {
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
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/40 to-transparent h-[40%] pointer-events-none">
            <ScrollArea className="h-full pr-4 pointer-events-auto">
                <div className="flex flex-col gap-3">
                    {comments && comments.map((comment: Comment) => (
                        <div key={comment.id} className="flex items-start gap-3 text-sm text-white bg-black/20 p-2 rounded-lg max-w-xs sm:max-w-sm">
                            <Avatar className="h-6 w-6 border-2 border-secondary">
                                <AvatarImage src={comment.userAvatar} alt={comment.username} />
                                <AvatarFallback>{comment.username.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <span className="font-bold text-red-700 mr-1.5">{comment.username}:</span>
                                <p className="break-words inline">{comment.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
            <form onSubmit={onSendMessage} className="relative mt-4 flex items-center gap-2 pointer-events-auto">
                <div className="relative flex-1">
                    <Input
                        placeholder="Add a comment..."
                        value={newMessage}
                        onChange={(e) => onNewMessageChange(e.target.value)}
                        className="bg-black/50 border-white/20 text-white placeholder:text-gray-400 pr-10"
                    />
                    <Button variant="ghost" size="icon" type="submit" className="absolute inset-y-0 right-0 text-white">
                        <ArrowUp className="h-5 w-5" />
                    </Button>
                </div>
                <Button variant="ghost" size="icon" onClick={onReaction} className="text-white bg-black/50 rounded-full h-10 w-10">
                    <Smile className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onToggleVisibility} className="text-white bg-black/50 rounded-full h-10 w-10">
                    <MessageCircleOff className="h-5 w-5" />
                </Button>
            </form>
        </div>
    );
};

const FloatingReactions = ({ reactions }: { reactions: Reaction[] }) => (
    <div className="absolute bottom-16 left-4 h-96 w-64 z-30 pointer-events-none">
        {reactions.map(reaction => (
            <div
                key={reaction.id}
                className="animate-float-up absolute bottom-0 text-3xl opacity-0"
                style={{ left: `${reaction.x}%` }}
            >
                {reaction.emoji}
            </div>
        ))}
    </div>
);


// Main UI Component
function AgoraTestPageUI() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const broadcastId = searchParams.get('id');
  const firestore = useFirestore();
  const call = useCall();
  const { toast } = useToast();
  
  const [newMessage, setNewMessage] = useState('');
  const [isChatVisible, setIsChatVisible] = useState(true);
  const { user } = useUser();
  const { userDocument } = useUserDocument();
  const [reactions, setReactions] = useState<Reaction[]>([]);

  // Stream SDK Hooks
  const { useCameraState, useMicrophoneState, useScreenShareState, useParticipants, useCallCallingState } = useCallStateHooks();
  const { camera } = useCameraState();
  const { microphone } = useMicrophoneState();
  const { isScreenSharing, screenShare } = useScreenShareState();
  const participants = useParticipants();
  const callingState = useCallCallingState();
  
  const viewerCount = Math.max(0, participants.length -1); // Exclude the host
  const isCallJoined = callingState === CallingState.JOINED;
  const isVideoEnabled = camera && !camera.isMute;
  const isMicEnabled = microphone && !microphone.isMute;

  // Real-time broadcast document
  const broadcastDocRef = useMemoFirebase(() => {
    if (!broadcastId || !firestore) return null;
    return doc(firestore, 'broadcasts', broadcastId);
  }, [broadcastId, firestore]);
  
  const { data: broadcastData, isLoading: isBroadcastLoading } = useDoc<BroadcastData>(broadcastDocRef);

  // Real-time chat messages
   const messagesQuery = useMemoFirebase(() => {
    if (!broadcastId || !firestore) return null;
    return query(
        collection(firestore, `broadcasts/${broadcastId}/messages`),
        orderBy('timestamp', 'asc'),
        limit(100)
    );
  }, [broadcastId, firestore]);
  const { data: comments } = useCollection<Comment>(messagesQuery);

  // This effect automatically enables the camera once the call is joined with high-quality settings.
  useEffect(() => {
    if (callingState === CallingState.JOINED && call && call.camera) {
      const highQualityConstraints = {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 },
      };
      call.camera.enable(highQualityConstraints);
    }
  }, [callingState, call]);


  const handleToggleVideo = async () => {
    if (call && call.camera) {
      await call.camera.toggle();
    }
  }

  const handleToggleMic = async () => {
    if (call && call.microphone) {
      await call.microphone.toggle();
    }
  }

  const handleToggleScreenShare = async () => {
    const nextIsScreenSharing = !isScreenSharing;
    try {
        if(call && call.screenShare) {
            await call.screenShare.toggle();
            if (broadcastDocRef) {
                updateDoc(broadcastDocRef, { 'streamDetails.isScreenSharing': nextIsScreenSharing });
            }
        }
    } catch (error) {
        console.error('Error toggling screen share:', error);
        toast({
            variant: 'destructive',
            title: 'Screen Share Failed',
            description: 'Could not change screen sharing state.',
        });
        if (broadcastDocRef) {
            updateDoc(broadcastDocRef, { 'streamDetails.isScreenSharing': isScreenSharing });
        }
    }
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !user || !broadcastId || !userDocument) return;

    const newComment: Omit<Comment, 'id'> & { timestamp: any } = {
        userId: user.uid,
        username: userDocument.username || 'Anonymous',
        userAvatar: userDocument.profilePicture || '',
        message: newMessage,
        timestamp: serverTimestamp(),
    };
    
    const messagesCollectionRef = collection(firestore, 'broadcasts', broadcastId, 'messages');
    addDocumentNonBlocking(messagesCollectionRef, newComment);
    setNewMessage('');
  }
  
  const handleEndStream = async () => {
    if (call) {
        await call.leave();
    }
    if (broadcastDocRef) {
        await updateDoc(broadcastDocRef, { isLive: false });
    }
    router.push('/');
  }

  const handleInviteGuest = () => {
    toast({
        title: "Guest Link Copied!",
        description: "A unique invite link has been copied to your clipboard.",
    });
  }

  const handleReaction = () => {
    const emojis = [
        <Heart key="heart" className="text-red-500 fill-red-500" />,
        <ThumbsUp key="thumbsup" className="text-yellow-400 fill-yellow-400" />,
        '😂', '🔥', '🎉'
    ];
    const newReaction: Reaction = {
        id: Date.now() + Math.random(),
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        x: Math.random() * 80 + 10,
    };
    setReactions(prev => [...prev, newReaction]);
    setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== newReaction.id));
    }, 5000);
  }
  
  if (isBroadcastLoading || !broadcastData) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-gray-900">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      )
  }

  return (
    <div className="relative h-screen w-full bg-black text-white overflow-hidden">
        
        <VideoPlayer 
            broadcast={broadcastData} 
            isHost={true} 
        />

        <FloatingReactions reactions={reactions} />

        <StreamHeader
            broadcastData={broadcastData}
            viewerCount={viewerCount}
            onEndStream={handleEndStream}
        />

        <StreamControls 
            onToggleVideo={handleToggleVideo}
            onToggleMic={handleToggleMic}
            onToggleScreenShare={handleToggleScreenShare}
            onInviteGuest={handleInviteGuest}
            isVideoEnabled={isVideoEnabled}
            isMicEnabled={isMicEnabled}
            isScreenSharing={isScreenSharing}
            isCallJoined={isCallJoined}
        />

        <ChatPanel 
            isVisible={isChatVisible}
            comments={comments}
            newMessage={newMessage}
            onNewMessageChange={setNewMessage}
            onSendMessage={handleSendMessage}
            onReaction={handleReaction}
            onToggleVisibility={() => setIsChatVisible(prev => !prev)}
        />
    </div>
  );
}

// Wrapper Component for Initialization and Auth
function AgoraTestWrapper() {
    const searchParams = useSearchParams();
    const broadcastId = searchParams.get('id');
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();
    const router = useRouter();

    const [client, setClient] = useState<StreamVideoClient | null>(null);
    const [call, setCall] = useState<Call | null>(null);
    
    // Authorization check
    const firestore = useFirestore();
    const broadcastDocRef = useMemoFirebase(() => {
        if (!broadcastId || !firestore) return null;
        return doc(firestore, 'broadcasts', broadcastId);
    }, [broadcastId, firestore]);
    const { data: broadcastData, isLoading: isBroadcastLoading } = useDoc<BroadcastData>(broadcastDocRef);

    // Camera permission check
    useEffect(() => {
        const getCameraPermission = async () => {
          try {
            await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          } catch (error) {
            console.error('Error accessing media devices:', error);
            toast({
              variant: 'destructive',
              title: 'Media Access Denied',
              description: 'Please enable camera and microphone permissions in your browser settings to go live.',
            });
          }
        };
        getCameraPermission();
      }, [toast]);

    // Auth check
    useEffect(() => {
        if (isUserLoading || isBroadcastLoading) return;
        
        if (!user) {
            router.push('/login');
            return;
        }

        if (broadcastData && broadcastData.hostId !== user.uid) {
            toast({
                title: 'Unauthorized',
                description: "You are not the host of this stream.",
                variant: 'destructive',
            });
            router.push('/');
        }

    }, [user, isUserLoading, broadcastData, isBroadcastLoading, router, toast]);

    // Stream Client initialization
    useEffect(() => {
        if (!user || !broadcastId || client) return;

        let videoClient: StreamVideoClient;
        const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || '';

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
                if (!response.ok) throw new Error('Failed to fetch stream token');
                
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
    }, [broadcastId, user, client]);

    if (isUserLoading || isBroadcastLoading || !broadcastId) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading your studio...</p>
            </div>
        );
    }
    
    if (!client || !call) {
         return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Connecting to broadcast channel...</p>
            </div>
        );
    }

    return (
        <StreamVideo client={client}>
            <StreamCall call={call}>
                <AgoraTestPageUI />
            </StreamCall>
        </StreamVideo>
    )
}

// Default Export with Suspense
export default function AgoraTestPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <AgoraTestWrapper />
        </Suspense>
    )
}

    

    