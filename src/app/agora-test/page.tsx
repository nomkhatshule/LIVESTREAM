
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, X, Send, Smile, MessageCircle, CameraOff, Video, Mic, UserPlus, ScreenShare, VideoOff, MicOff, ArrowUp, MessageCircleOff, MonitorUp, Heart, ThumbsUp, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useRef, useState, useMemo, Suspense } from 'react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useUser, useDoc, useFirestore, useMemoFirebase, useUserDocument } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, updateDoc, collection, query, orderBy, limit } from 'firebase/firestore';
import { useCollection } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { serverTimestamp } from 'firebase/firestore';
import {
  Call,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  useCall,
  useCallStateHooks,
  ParticipantView,
  StreamTheme,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';

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
    }
}

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || '';

function AgoraTestPageUI() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const broadcastId = searchParams.get('id');
  const firestore = useFirestore();
  const call = useCall();

  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const { toast } = useToast();
  
  const [newMessage, setNewMessage] = useState('');
  const [isChatVisible, setIsChatVisible] = useState(true);
  const { user } = useUser();
  const { userDocument } = useUserDocument();
  const [reactions, setReactions] = useState<Reaction[]>([]);

  // Stream SDK Hooks
  const { useCameraState, useMicrophoneState, useScreenShareState, useLocalParticipant, useParticipants } = useCallStateHooks();
  const { isMute: isVideoMute, camera } = useCameraState();
  const { isMute: isMicMute, microphone } = useMicrophoneState();
  const { isScreenSharing, screenShare } = useScreenShareState();
  const localParticipant = useLocalParticipant();
  const participants = useParticipants();
  
  const isVideoEnabled = !isVideoMute;
  const isMicEnabled = !isMicMute;


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

  
  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasCameraPermission(true);
      } catch (error) {
        console.error('Error accessing media devices:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Media Access Denied',
          description: 'Please enable camera and microphone permissions in your browser settings to go live.',
        });
      }
    };
    getCameraPermission();
  }, [toast]);

  const handleToggleVideo = async () => {
    if (isScreenSharing) {
        await screenShare.toggle();
    }
    await camera.toggle();
  }

  const handleToggleMic = async () => {
    await microphone.toggle();
  }

  const handleToggleScreenShare = async () => {
    const nextIsScreenSharing = !isScreenSharing;
    try {
        await screenShare.toggle();
        if (broadcastDocRef) {
            updateDoc(broadcastDocRef, { 'streamDetails.isScreenSharing': nextIsScreenSharing });
        }
    } catch (error) {
        console.error('Error toggling screen share:', error);
        toast({
            variant: 'destructive',
            title: 'Screen Share Failed',
            description: 'Could not change screen sharing state.',
        });
        // Revert firestore state if SDK call fails
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
    camera.disable();
    microphone.disable();
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

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <div className="h-screen w-full bg-black text-white flex flex-col relative">
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
          
          <StreamTheme as="main" className="w-full h-full str-video__connection-quality--hidden">
            {localParticipant && <ParticipantView participant={localParticipant} />}
          </StreamTheme>

          {!isVideoEnabled && !isScreenSharing && (
             <Image
                src="https://picsum.photos/seed/agora-bg/1920/1080"
                alt="Video feed off background"
                fill={true}
                objectFit="cover"
                data-ai-hint="abstract background"
              />
          )}
          
          {!hasCameraPermission && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white z-10">
                <CameraOff className="h-16 w-16 mb-4" />
                <h2 className="text-2xl font-bold">Camera Access Denied</h2>
                <p className="text-muted-foreground max-w-sm text-center mt-2">
                    Please allow camera access in your browser to view your local video feed.
                </p>
            </div>
          )}
        </div>

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

        <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center gap-3 bg-black/30 p-2 rounded-full">
             <Avatar className="h-9 w-9 border-2 border-primary">
                <AvatarImage src={broadcastData?.hostAvatar || ''} alt={broadcastData?.hostName || ''} />
                <AvatarFallback>{(broadcastData?.hostName || 'U').charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                <span className="font-bold text-sm leading-tight">{broadcastData?.hostName || 'Host'}</span>
                <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white animate-pulse">
                        LIVE
                    </span>
                    <span className="inline-flex items-center text-xs font-medium gap-1">
                        <Users className="h-3 w-3" />
                        {participants.length.toLocaleString()}
                    </span>
                </div>
            </div>
          </div>
          <Button variant="destructive" size="sm" onClick={handleEndStream}>
            <X className="h-4 w-4 mr-1.5" /> End
          </Button>
        </div>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-4 p-2 bg-black/40 rounded-full backdrop-blur-sm">
            <Button variant="secondary" size="icon" className="rounded-full h-12 w-12" onClick={handleToggleVideo}>
                {isVideoEnabled ? <Video className="h-6 w-6"/> : <VideoOff className="h-6 w-6"/>}
            </Button>
            <Button variant="secondary" size="icon" className="rounded-full h-12 w-12" onClick={handleToggleMic}>
                {isMicEnabled ? <Mic className="h-6 w-6"/> : <MicOff className="h-6 w-6"/>}
            </Button>
            <Button variant={isScreenSharing ? "primary" : "secondary"} size="icon" className="rounded-full h-12 w-12" onClick={handleToggleScreenShare}>
                {isScreenSharing ? <MonitorUp className="h-6 w-6"/> : <ScreenShare className="h-6 w-6"/>}
            </Button>
            <Button variant="secondary" size="icon" className="rounded-full h-12 w-12" onClick={handleInviteGuest}>
                <UserPlus className="h-6 w-6"/>
            </Button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent h-2/5">
          {isChatVisible && (
            <>
              <ScrollArea className="h-full max-h-[250px] pr-4">
                <div className="flex flex-col gap-3">
                  {comments && comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-3 text-sm text-white bg-black/20 p-2 rounded-lg max-w-xs sm:max-w-sm">
                      <Avatar className="h-6 w-6 border-2 border-secondary">
                        <AvatarImage src={comment.userAvatar} alt={comment.username} />
                        <AvatarFallback>{comment.username.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <span className="font-bold text-secondary mr-1.5">{comment.username}:</span>
                        <p className="break-words inline">{comment.message}</p>
                      </div>
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
                    <ArrowUp className="h-5 w-5" />
                  </Button>
                </form>
                <Button variant="ghost" size="icon" onClick={handleReaction} className="text-white bg-black/50 rounded-full h-10 w-10">
                  <Smile className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsChatVisible(prev => !prev)} className="text-white bg-black/50 rounded-full h-10 w-10">
                  {isChatVisible ? <MessageCircleOff className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
                </Button>
              </div>
            </>
          )}
           {!isChatVisible && (
            <div className="flex justify-end">
                 <Button variant="ghost" size="icon" onClick={() => setIsChatVisible(prev => !prev)} className="text-white bg-black/50 rounded-full h-10 w-10">
                    <MessageCircle className="h-5 w-5" />
                </Button>
            </div>
           )}
        </div>
      </div>
    </div>
  );
}

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


    useEffect(() => {
        if (!user || !broadcastId || client) return;

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
    

    

    