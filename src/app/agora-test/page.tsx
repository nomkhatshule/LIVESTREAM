'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, X, Send, Smile, MessageCircle, CameraOff, Video, Mic, UserPlus, ScreenShare, VideoOff, MicOff, ArrowUp, MessageCircleOff, MonitorUp, Heart, ThumbsUp } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useUser, useUserDocument } from '@/firebase';
import { useRouter } from 'next/navigation';

interface Comment {
  id: number;
  username: string;
  avatar: string;
  message: string;
}

interface Reaction {
  id: number;
  emoji: React.ReactNode;
  x: number;
}

export default function AgoraTestPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatVisible, setIsChatVisible] = useState(true);
  const { user } = useUser();
  const { userDocument } = useUserDocument();
  const [viewerCount, setViewerCount] = useState(1234);
  const [reactions, setReactions] = useState<Reaction[]>([]);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        // Request both video and audio permissions
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Media Access Denied',
          description: 'Please enable camera and microphone permissions in your browser settings to see the local feed.',
        });
      }
    };

    getCameraPermission();
  }, [toast]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount(prevCount => {
        const change = Math.floor(Math.random() * 50) - 25; // Random change between -25 and +25
        const newCount = prevCount + change;
        return newCount > 0 ? newCount : 0; // Ensure count doesn't go below zero
      });
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const handleToggleVideo = () => {
    if (isScreenSharing) {
        handleToggleScreenShare();
        return;
    }
    setIsVideoEnabled(prev => {
        const nextState = !prev;
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getVideoTracks().forEach(track => {
            track.enabled = nextState;
            });
        }
        return nextState;
    });
  }

  const handleToggleMic = () => {
    setIsMicEnabled(prev => {
      const nextState = !prev;
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getAudioTracks().forEach(track => {
          track.enabled = nextState;
        });
      }
      return nextState;
    });
  }

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
        // Stop screen share and revert to camera
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (videoRef.current) {
                // Properly stop old stream tracks
                const oldStream = videoRef.current.srcObject as MediaStream;
                oldStream?.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = stream;
            }
            setIsScreenSharing(false);
            setIsVideoEnabled(true);
        } catch (error) {
            console.error('Error switching back to camera:', error);
            // Handle error, e.g., show a toast
        }
    } else {
        // Start screen share
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            if (videoRef.current) {
                // Stop existing camera tracks before switching
                const existingStream = videoRef.current.srcObject as MediaStream;
                existingStream?.getTracks().forEach(track => track.stop());

                videoRef.current.srcObject = screenStream;
            }
            setIsScreenSharing(true);
            setIsVideoEnabled(true); // Screen is a form of video

            // Listen for when the user stops sharing via the browser UI
            screenStream.getVideoTracks()[0].onended = () => {
                setIsScreenSharing(false);
                // When browser share is stopped, revert to showing "video off" state
                // rather than trying to auto-restart camera.
                setIsVideoEnabled(false);
                 if (videoRef.current) {
                    const oldStream = videoRef.current.srcObject as MediaStream;
                    oldStream?.getTracks().forEach(track => track.stop());
                    videoRef.current.srcObject = null;
                }
            };

        } catch (error) {
            console.error('Error starting screen share:', error);
            toast({
                variant: 'destructive',
                title: 'Screen Share Failed',
                description: 'Could not start screen sharing. Please ensure you have given permission.',
            });
        }
    }
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    const newComment: Comment = {
        id: Date.now(),
        username: userDocument?.username || user?.displayName || 'You',
        avatar: userDocument?.profilePicture || user?.photoURL || 'https://picsum.photos/seed/my-avatar/100/100',
        message: newMessage,
    };

    setComments(prev => [...prev, newComment]);
    setNewMessage('');
  }
  
  const handleEndStream = () => {
    // Release camera and microphone
    if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
    }
    // Navigate to homepage
    router.push('/');
  }

  const handleInviteGuest = () => {
    toast({
        title: "Guest Link Copied!",
        description: "A unique invite link has been copied to your clipboard.",
    });
    // In a real implementation, you'd generate a link and copy it.
    // e.g., navigator.clipboard.writeText('https://agorademo.live/join/UNIQUE_TOKEN');
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
        x: Math.random() * 20 + 40, // Horizontal position percentage (40% to 60%)
    };
    setReactions(prev => [...prev, newReaction]);

    // Remove the reaction after animation completes (5s)
    setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== newReaction.id));
    }, 5000);
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <div className="h-screen w-full bg-black text-white flex flex-col relative">
        {/* Local Video Feed Container */}
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
          
          {!isVideoEnabled && (
             <Image
                src="https://picsum.photos/seed/agora-bg/1920/1080"
                alt="Video feed off background"
                fill={true}
                objectFit="cover"
                data-ai-hint="abstract background"
              />
          )}

          <video 
            ref={videoRef} 
            className={`w-full h-full object-cover ${!isVideoEnabled ? 'hidden' : ''}`} 
            autoPlay 
            muted 
            playsInline 
          />

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

        {/* Floating Reactions Container */}
        <div className="absolute bottom-24 right-4 h-96 w-20 z-20 pointer-events-none">
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

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center gap-3 bg-black/30 p-2 rounded-full">
             <Avatar className="h-9 w-9 border-2 border-primary">
                <AvatarImage src={userDocument?.profilePicture || user?.photoURL || ''} alt={userDocument?.username || user?.displayName || ''} />
                <AvatarFallback>{(userDocument?.username || user?.displayName || 'U').charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                <span className="font-bold text-sm leading-tight">{userDocument?.username || user?.displayName || 'Host'}</span>
                <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white animate-pulse">
                        LIVE
                    </span>
                    <span className="inline-flex items-center text-xs font-medium gap-1">
                        <Users className="h-3 w-3" />
                        {viewerCount.toLocaleString()}
                    </span>
                </div>
            </div>
          </div>
          <Button variant="destructive" size="sm" onClick={handleEndStream}>
            <X className="h-4 w-4 mr-1.5" /> End
          </Button>
        </div>

        {/* Right side controls */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-4 p-2 bg-black/40 rounded-full backdrop-blur-sm">
            <Button variant="secondary" size="icon" className="rounded-full h-12 w-12" onClick={handleToggleVideo}>
                {isVideoEnabled && !isScreenSharing ? <Video className="h-6 w-6"/> : <VideoOff className="h-6 w-6"/>}
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

        {/* Chat and Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent h-2/5">
          {isChatVisible && (
            <ScrollArea className="h-full max-h-[250px] pr-4">
              <div className="flex flex-col gap-3">
                {/* Dynamic Comments */}
                {comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-3 text-sm text-white bg-black/20 p-2 rounded-lg max-w-xs sm:max-w-sm">
                    <Avatar className="h-6 w-6 border-2 border-secondary">
                      <AvatarImage src={comment.avatar} alt={comment.username} />
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
        </div>
      </div>
    </div>
  );
}

    