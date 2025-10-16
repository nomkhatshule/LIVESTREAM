'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, X, Send, Smile, MessageCircle, CameraOff, Video, Mic, UserPlus, ScreenShare, VideoOff, MicOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

export default function AgoraTestPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const { toast } = useToast();

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

  const handleToggleVideo = () => {
    setIsVideoEnabled(prev => !prev);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
  }

  const handleToggleMic = () => {
    setIsMicEnabled(prev => !prev);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
  }

  return (
    <div className="relative h-screen w-full">
      <div className="h-screen w-full bg-black text-white flex flex-col relative">
        {/* Local Video Feed Container */}
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
          
          {!isVideoEnabled && (
             <Image
                src="https://picsum.photos/seed/agora-bg/1920/1080"
                alt="Video feed off background"
                layout="fill"
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

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-600 text-white">
              <span className="w-2 h-2 mr-2 bg-white rounded-full"></span>
              LIVE
            </span>
            <span className="inline-flex items-center text-sm font-medium gap-1.5">
              <Users className="h-4 w-4" />
              1,234
            </span>
          </div>
          <Button variant="destructive" size="sm">
            <X className="h-4 w-4 mr-1.5" /> End
          </Button>
        </div>

        {/* Right side controls */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-4 p-2 bg-black/40 rounded-full backdrop-blur-sm">
            <Button variant="secondary" size="icon" className="rounded-full h-12 w-12" onClick={handleToggleVideo}>
                {isVideoEnabled ? <Video className="h-6 w-6"/> : <VideoOff className="h-6 w-6"/>}
            </Button>
            <Button variant="secondary" size="icon" className="rounded-full h-12 w-12" onClick={handleToggleMic}>
                {isMicEnabled ? <Mic className="h-6 w-6"/> : <MicOff className="h-6 w-6"/>}
            </Button>
            <Button variant="secondary" size="icon" className="rounded-full h-12 w-12">
                <ScreenShare className="h-6 w-6"/>
            </Button>
            <Button variant="secondary" size="icon" className="rounded-full h-12 w-12">
                <UserPlus className="h-6 w-6"/>
            </Button>
        </div>

        {/* Chat and Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent h-2/5">
          <ScrollArea className="h-full max-h-[250px] pr-4">
            <div className="flex flex-col gap-3">
              {/* Static Chat Message Example */}
              <div className="flex items-start gap-3 text-sm text-white bg-black/20 p-2 rounded-lg max-w-xs sm:max-w-sm">
                <Avatar className="h-6 w-6 border-2 border-primary">
                  <AvatarImage src="https://picsum.photos/seed/static-avatar/100/100" alt="username" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <span className="font-bold text-primary mr-1.5">StaticUser:</span>
                  <p className="break-words inline">This is a static comment!</p>
                </div>
              </div>
            </div>
          </ScrollArea>
          <div className="mt-4 flex items-center gap-2">
            <form onSubmit={(e) => e.preventDefault()} className="relative flex-1">
              <Input
                placeholder="Add a comment..."
                className="bg-black/50 border-white/20 text-white placeholder:text-gray-400 pr-10"
              />
              <Button variant="ghost" size="icon" type="submit" className="absolute inset-y-0 right-0 text-white">
                <Send className="h-5 w-5" />
              </Button>
            </form>
            <Button variant="ghost" size="icon" className="text-white bg-black/50 rounded-full h-10 w-10">
              <Smile className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white bg-black/50 rounded-full h-10 w-10">
              <MessageCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
