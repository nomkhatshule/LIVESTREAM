
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, X, Send, Smile, MessageCircle, Video, Mic, UserPlus, ScreenShare, VideoOff, MicOff, ArrowUp, MessageCircleOff, MonitorUp, Heart, ThumbsUp, Loader2, Dice6, Trophy, Check, Minus, Swords, Undo2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Suspense, forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useDoc, useFirestore, useMemoFirebase, useUserDocument } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, updateDoc, collection, query, orderBy, limit, serverTimestamp, Timestamp } from 'firebase/firestore';
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
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import ChallengeDisplayCard from '@/components/broadcast/ChallengeDisplayCard';
import CountdownTimer from '@/components/broadcast/CountdownTimer';
import StreamHeader from '@/components/agora-test/StreamHeader';
import FloatingReactions from '@/components/agora-test/FloatingReactions';
import InStreamGamesPanel from '@/components/agora-test/InStreamGamesPanel';
import StreamControls from '@/components/agora-test/StreamControls';
import ChatPanel from '@/components/agora-test/ChatPanel';
import type { Reaction, StagedChallenge, BroadcastData, Comment } from '@/lib/types';


// --- Main UI Component ---
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
  const [isChallengeVisible, setIsChallengeVisible] = useState(true);
  const [isTimerFinished, setIsTimerFinished] = useState(false);
  const [isGamePanelOpen, setIsGamePanelOpen] = useState(false);
  const [showChallengeCoverCard, setShowChallengeCoverCard] = useState(false);
  const [stagedChallenge, setStagedChallenge] = useState<StagedChallenge | null>(null);
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

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

  useEffect(() => {
    if (broadcastData?.activeChallenge) {
        setIsChallengeVisible(true);
    }
  }, [broadcastData?.activeChallenge]);

  // Effect to manage timer state
  useEffect(() => {
    setIsTimerFinished(false); // Reset on challenge change

    if (broadcastData?.challengeStartTime && broadcastData?.challengeDurationSeconds) {
      const { challengeStartTime, challengeDurationSeconds } = broadcastData;
      
      const checkTimer = () => {
        const now = new Date();
        const start = challengeStartTime.toDate();
        const elapsedSeconds = Math.floor((now.getTime() - start.getTime()) / 1000);
        
        if (elapsedSeconds >= challengeDurationSeconds) {
          setIsTimerFinished(true);
          return true; // Timer is done
        }
        return false; // Timer is still running
      };

      if (!checkTimer()) { // If not already finished
        const interval = setInterval(() => {
          if (checkTimer()) {
            clearInterval(interval);
          }
        }, 1000);
        return () => clearInterval(interval);
      }
    } else {
        // If there's no timer, the "continue" button can be shown immediately
        if (broadcastData?.activeChallenge) {
             setIsTimerFinished(true);
        }
    }
  }, [broadcastData?.challengeStartTime, broadcastData?.challengeDurationSeconds, broadcastData?.activeChallenge]);

    // Drag and Drop Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragOffsetRef.current = {
      x: e.clientX - cardPosition.x,
      y: e.clientY - cardPosition.y,
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffsetRef.current.x;
      const newY = e.clientY - dragOffsetRef.current.y;
      setCardPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  useEffect(() => {
    if (isDragging) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    } else {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);


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
        await updateDoc(broadcastDocRef, { isLive: false, activeChallenge: null, activeChallengeType: null });
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

  const handleChallengeSelect = (challenge: string, type: 'truth' | 'dare' | 'challenge', duration: number) => {
    setStagedChallenge({ text: challenge, type, duration });
    setShowChallengeCoverCard(true); // Show the cover card first
  };

  const handleStartStagedChallenge = async () => {
    if (broadcastDocRef && stagedChallenge) {
        await updateDoc(broadcastDocRef, { 
            activeChallenge: stagedChallenge.text, 
            activeChallengeType: stagedChallenge.type,
            challengeDurationSeconds: stagedChallenge.duration,
            challengeStartTime: serverTimestamp(),
        });
        toast({ title: 'New Challenge Started!', description: stagedChallenge.text });
        setStagedChallenge(null);
        setShowChallengeCoverCard(false);
    }
  };

  const handleCancelStagedChallenge = () => {
    setShowChallengeCoverCard(false);
    setStagedChallenge(null);
  };

  const handleGenerateNextChallenge = async (gameType: 'truth' | 'dare' | 'challenge') => {
      // Re-use logic from InStreamGamesPanel to generate next challenge
      const panel = InStreamGamesPanel({ onSelectChallenge: handleChallengeSelect, open: false, onOpenChange: () => {} });
      // This is a bit of a hack, ideally the generation logic is a standalone utility
      // For now, we simulate opening the panel and clicking a button
       if (broadcastDocRef) {
         try {
            const nextChallenge = await (panel.type as any).generateNextChallengeLogic(gameType);
            await updateDoc(broadcastDocRef, {
                activeChallenge: nextChallenge.prompt,
                activeChallengeType: gameType,
                challengeDurationSeconds: nextChallenge.duration,
                challengeStartTime: serverTimestamp(),
            });
         } catch(e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not generate next challenge.' });
         }
       }
  };

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
        
        {/* "Ready for a Challenge?" Cover Card */}
        {showChallengeCoverCard && (
             <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center p-4 pointer-events-auto">
                 <div className="relative h-[550px] w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center text-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-10 w-10 text-muted-foreground rounded-full hover:bg-black/10"
                        onClick={handleCancelStagedChallenge}
                    >
                        <X className="h-6 w-6" />
                    </Button>
                    <h2 className="text-3xl font-bold text-black font-headline mb-8">Ready for a Challenge?</h2>
                    <Button size="lg" className="w-full" onClick={handleStartStagedChallenge}>
                      Start
                    </Button>
                </div>
            </div>
        )}

        {/* Active Challenge Display Card */}
        {isChallengeVisible && broadcastData.activeChallenge && broadcastData.activeChallengeType && (
            <div 
                className="absolute top-1/2 left-1/2 w-[384px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  transform: `translate(calc(-50% + ${cardPosition.x}px), calc(-50% + ${cardPosition.y}px))`,
                }}
            >
                <div 
                  className={cn("pointer-events-auto", isDragging ? 'cursor-grabbing' : 'cursor-grab')}
                  onMouseDown={handleMouseDown}
                >
                    <ChallengeDisplayCard 
                        text={broadcastData.activeChallenge}
                        type={broadcastData.activeChallengeType}
                        onClose={() => {
                            if (broadcastDocRef) {
                              updateDoc(broadcastDocRef, {
                                activeChallenge: null,
                                activeChallengeType: null,
                                challengeStartTime: null,
                                challengeDurationSeconds: null,
                              });
                            }
                        }}
                        timer={broadcastData.challengeStartTime && broadcastData.challengeDurationSeconds ? (
                            <CountdownTimer 
                                startTime={broadcastData.challengeStartTime} 
                                durationSeconds={broadcastData.challengeDurationSeconds} 
                            />
                        ) : null}
                    >
                        <div className="flex w-full gap-2">
                            <Button 
                                size="lg" 
                                variant="outline" 
                                className="w-full bg-black/80 text-white" 
                                onClick={() => handleGenerateNextChallenge(broadcastData.activeChallengeType!)}
                            >
                                <Undo2 className="mr-2 h-5 w-5" />
                                Skip
                            </Button>
                            {isTimerFinished && (
                               <Button 
                                    size="lg" 
                                    className="w-full"
                                    onClick={() => handleGenerateNextChallenge(broadcastData.activeChallengeType!)}
                                >
                                    <Check className="mr-2 h-5 w-5" />
                                    Continue
                                </Button>
                            )}
                        </div>
                    </ChallengeDisplayCard>
                </div>
            </div>
        )}

        <StreamControls 
            onToggleVideo={handleToggleVideo}
            onToggleMic={handleToggleMic}
            onToggleScreenShare={handleToggleScreenShare}
            onInviteGuest={handleInviteGuest}
            onToggleChallengeVisibility={() => setIsChallengeVisible(prev => !prev)}
            isChallengeActive={!!broadcastData.activeChallenge}
            isVideoEnabled={isVideoEnabled}
            isMicEnabled={isMicEnabled}
            isScreenSharing={isScreenSharing}
            isCallJoined={isCallJoined}
            onOpenGames={() => setIsGamePanelOpen(true)}
        />
        
        <InStreamGamesPanel 
            onSelectChallenge={handleChallengeSelect} 
            open={isGamePanelOpen} 
            onOpenChange={setIsGamePanelOpen} 
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

// --- Wrapper Component for Initialization and Auth ---
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
                  headers: { 'Content-Type': 'json' },
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

// --- Default Export with Suspense ---
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

    