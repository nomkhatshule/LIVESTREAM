
'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, updateDoc, collection, query, orderBy, limit, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useUser, useDoc, useFirestore, useMemoFirebase, useUserDocument, useCollection } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Reaction, StagedChallenge, BroadcastData, Comment, GiphyResult } from '@/lib/types';
import { Loader2, X } from 'lucide-react';
import FloatingReactions from '@/components/agora-test/FloatingReactions';
import StreamHeader from '@/components/agora-test/StreamHeader';
import InStreamGamesPanel from '@/components/agora-test/InStreamGamesPanel';
import StreamControls from '@/components/agora-test/StreamControls';
import ChatPanel from '@/components/agora-test/ChatPanel';
import ChallengeDisplayCard from '@/components/broadcast/ChallengeDisplayCard';
import CountdownTimer from '@/components/broadcast/CountdownTimer';
import { Resizable } from 're-resizable';
import { cn } from '@/lib/utils';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { generateGamePrompts } from '@/ai/flows/generate-game-prompts';
import VideoPlayer from '@/components/broadcast/video-player';


// --- Main UI Component ---
function AgoraTestPageUI() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const broadcastId = searchParams.get('id');
  const firestore = useFirestore();
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
  const [cardSize, setCardSize] = useState({ width: 320, height: 460 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [isPinching, setIsPinching] = useState(false);
  const initialPinchDistanceRef = useRef(0);
  const initialCardSizeRef = useRef({ width: 320, height: 460 });
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
  const [selectedGif, setSelectedGif] = useState<GiphyResult | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);


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
    async function setupMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setMediaStream(stream);
      } catch (err) {
        console.error("Error accessing media devices.", err);
        toast({ variant: 'destructive', title: 'Media Error', description: 'Could not access camera and microphone.' });
      }
    }
    setupMedia();

    return () => {
        mediaStream?.getTracks().forEach(track => track.stop());
    }
  }, []); 

  useEffect(() => {
    if (broadcastData?.activeChallenge) {
        setIsChallengeVisible(true);
    }
    if (broadcastData?.challengeCardPosition) {
        setCardPosition(broadcastData.challengeCardPosition);
    }
    if (broadcastData?.challengeCardSize) {
        setCardSize(broadcastData.challengeCardSize);
    }
  }, [broadcastData?.activeChallenge, broadcastData?.challengeCardPosition, broadcastData?.challengeCardSize]);


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
        if (broadcastData?.activeChallenge) {
             setIsTimerFinished(true);
        }
    }
  }, [broadcastData?.challengeStartTime, broadcastData?.challengeDurationSeconds, broadcastData?.activeChallenge]);

    // Drag and Drop Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.className.includes('handle')) {
        return;
    }
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
    if (isDragging && broadcastDocRef) {
        updateDoc(broadcastDocRef, { challengeCardPosition: cardPosition });
    }
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

  const getDistance = (touches: React.TouchList) => {
    const [touch1, touch2] = [touches[0], touches[1]];
    return Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
     if (e.touches.length === 2) {
        e.preventDefault();
        setIsPinching(true);
        initialPinchDistanceRef.current = getDistance(e.touches);
        initialCardSizeRef.current = cardSize;
    } else if (e.touches.length === 1) {
        setIsDragging(true);
        dragOffsetRef.current = {
            x: e.touches[0].clientX - cardPosition.x,
            y: e.touches[0].clientY - cardPosition.y,
        };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
     if (e.touches.length === 2 && isPinching) {
        const newDist = getDistance(e.touches);
        const scale = newDist / initialPinchDistanceRef.current;
        const newWidth = Math.max(300, initialCardSizeRef.current.width * scale);
        const aspectRatio = initialCardSizeRef.current.width / initialCardSizeRef.current.height;
        setCardSize({ width: newWidth, height: newWidth / aspectRatio });
    } else if (e.touches.length === 1 && isDragging) {
        const newX = e.touches[0].clientX - dragOffsetRef.current.x;
        const newY = e.touches[0].clientY - dragOffsetRef.current.y;
        setCardPosition({ x: newX, y: newY });
    }
  };
  
  const handleTouchEnd = () => {
    if (broadcastDocRef) {
        if (isDragging) {
            updateDoc(broadcastDocRef, { challengeCardPosition: cardPosition });
        }
        if (isPinching) {
            updateDoc(broadcastDocRef, { challengeCardSize: cardSize });
        }
    }
    setIsDragging(false);
    setIsPinching(false);
  };
  
  const handleResizeStop = (e: any, direction: any, ref: any, d: any) => {
    const newSize = {
        width: cardSize.width + d.width,
        height: cardSize.height + d.height
    };
    setCardSize(newSize);
    if (broadcastDocRef) {
        updateDoc(broadcastDocRef, { challengeCardSize: newSize });
    }
  };


  const handleToggleVideo = async () => {
    mediaStream?.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsVideoEnabled(track.enabled);
    });
  }

  const handleToggleMic = async () => {
    mediaStream?.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsMicEnabled(track.enabled);
    });
  }

  const handleToggleScreenShare = async () => {
    toast({ variant: 'destructive', title: 'Coming Soon!', description: 'Screen sharing is not yet implemented.' });
    // Placeholder for screen share logic
  }
  
  const handleFlipCamera = () => {
     toast({ variant: 'destructive', title: 'Coming Soon!', description: 'Camera flipping is not yet implemented.' });
    // Placeholder for camera flip logic
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((newMessage.trim() === '' && !selectedGif) || !user || !broadcastId || !userDocument) return;

    let attachment;
    if (selectedGif) {
        attachment = {
            type: 'giphy',
            title: selectedGif.title,
            imageUrl: selectedGif.images.original.url,
            thumbUrl: selectedGif.images.fixed_width.url,
        }
    }

    const newComment: Omit<Comment, 'id'> & { timestamp: any, attachment?: any } = {
        userId: user.uid,
        username: userDocument.username || 'Anonymous',
        userAvatar: userDocument.profilePicture || '',
        message: newMessage,
        timestamp: serverTimestamp(),
        attachment: attachment || null,
    };
    
    const messagesCollectionRef = collection(firestore, 'broadcasts', broadcastId, 'messages');
    addDocumentNonBlocking(messagesCollectionRef, newComment);
    setNewMessage('');
    setSelectedGif(null);
  }
  
  const handleEndStream = async () => {
    mediaStream?.getTracks().forEach(track => track.stop());
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

  const handleReaction = (emoji: React.ReactNode) => {
    const newReaction: Reaction = {
        id: Date.now() + Math.random(),
        emoji: emoji,
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
       if (broadcastDocRef) {
         try {
            const result = await generateGamePrompts({
                gameType: gameType,
                category: 'Live Stream Audience',
                count: 1,
            });

            if (result.prompts && result.prompts.length > 0) {
                 await updateDoc(broadcastDocRef, {
                    activeChallenge: result.prompts[0],
                    activeChallengeType: gameType,
                    challengeDurationSeconds: result.durationsInSeconds[0] || 120,
                    challengeStartTime: serverTimestamp(),
                });
            } else {
                 throw new Error('AI could not generate a challenge.');
            }
         } catch(e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not generate next challenge.' });
         }
       }
  };
  
    const handleGifSelect = (gif: GiphyResult) => {
        setSelectedGif(gif);
        setIsGifPickerOpen(false);
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
        
        {/* We use a video tag for local preview, MuxPlayer for playback */}
        {broadcastData.isLive ? (
            <VideoPlayer broadcast={broadcastData} />
        ) : (
            <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
        )}

        <FloatingReactions reactions={reactions} />

        <StreamHeader
            broadcastData={broadcastData}
            viewerCount={0} // Placeholder for viewer count
            onEndStream={handleEndStream}
        />
        
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

        {isChallengeVisible && broadcastData.activeChallenge && broadcastData.activeChallengeType && (
            <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
                style={{
                  transform: `translate(calc(-50% + ${cardPosition.x}px), calc(-50% + ${cardPosition.y}px))`,
                }}
            >
                <Resizable
                    size={{ width: cardSize.width, height: cardSize.height }}
                    onResizeStop={handleResizeStop}
                    onResize={(e, direction, ref, d) => {
                        setCardSize({
                            width: cardSize.width + d.width,
                            height: cardSize.height + d.height,
                        });
                    }}
                    minWidth={300}
                    minHeight={400}
                    lockAspectRatio
                    className="relative"
                >
                    <div 
                      className={cn("pointer-events-auto h-full w-full", isDragging ? 'cursor-grabbing' : 'cursor-grab')}
                      onMouseDown={handleMouseDown}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
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
                           {/* Action buttons can be added here if needed */}
                        </ChallengeDisplayCard>
                    </div>
                </Resizable>
            </div>
        )}
        
        <div className="absolute right-4 top-1/3 -translate-y-1/3 z-30">
            <StreamControls 
                onToggleVideo={handleToggleVideo}
                onToggleMic={handleToggleMic}
                onFlipCamera={handleFlipCamera}
                onToggleScreenShare={handleToggleScreenShare}
                onInviteGuest={handleInviteGuest}
                onToggleChallengeVisibility={() => setIsChallengeVisible(prev => !prev)}
                isChallengeActive={!!broadcastData.activeChallenge}
                isVideoEnabled={isVideoEnabled}
                isMicEnabled={isMicEnabled}
                isScreenSharing={isScreenSharing}
                isCallJoined={!!mediaStream}
                onOpenGames={() => setIsGamePanelOpen(true)}
                isChatVisible={isChatVisible}
                onToggleChatVisibility={() => setIsChatVisible(prev => !prev)}
                viewerCount={0} // Placeholder
            />
        </div>
        
        <InStreamGamesPanel 
            onSelectChallenge={handleChallengeSelect} 
            open={isGamePanelOpen} 
            onOpenChange={setIsGamePanelOpen} 
        />

        <div className="absolute bottom-0 left-0 p-4 w-full md:w-auto md:max-w-sm pointer-events-none">
            <ChatPanel 
                broadcastId={broadcastId}
                isVisible={isChatVisible}
                comments={comments}
                onReaction={handleReaction}
                onToggleVisibility={() => setIsChatVisible(prev => !prev)}
            />
        </div>
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

    const firestore = useFirestore();
    const broadcastDocRef = useMemoFirebase(() => {
        if (!broadcastId || !firestore) return null;
        return doc(firestore, 'broadcasts', broadcastId);
    }, [broadcastId, firestore]);
    const { data: broadcastData, isLoading: isBroadcastLoading } = useDoc<BroadcastData>(broadcastDocRef);

    useEffect(() => {
        const getMediaPermission = async () => {
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
        getMediaPermission();
      }, [toast]);

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

    if (isUserLoading || isBroadcastLoading || !broadcastId) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading your studio...</p>
            </div>
        );
    }

    return <AgoraTestPageUI />;
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
