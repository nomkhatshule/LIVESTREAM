'use client';

import { useEffect, useRef, useState } from 'react';
import type { Broadcast } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Maximize, Mic, MicOff, Minimize, Video, VideoOff, Volume2, VolumeX } from 'lucide-react';

interface VideoPlayerProps {
  broadcast: Broadcast;
}

export default function VideoPlayer({ broadcast }: VideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // In a real application, this is where you would initialize the Agora client
  // and join the channel to receive the live stream.
  useEffect(() => {
    // 1. Initialize Agora RTC client
    // const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
    
    // 2. Set user role to 'audience'
    // client.setClientRole('audience');

    // 3. Join the channel with App ID, channel name, and token
    // client.join(appId, broadcast.id, token, broadcast.user.id);

    // 4. Listen for 'user-published' event to get the remote stream
    // client.on('user-published', (user, mediaType) => {
    //   client.subscribe(user, mediaType).then(() => {
    //     if (mediaType === 'video' && videoRef.current) {
    //       user.videoTrack.play(videoRef.current);
    //     }
    //   });
    // });

    console.log(`Joining broadcast channel: ${broadcast.id}`);

    // Cleanup on component unmount
    return () => {
      // client.leave();
      console.log(`Leaving broadcast channel: ${broadcast.id}`);
    };
  }, [broadcast.id]);
  
  const toggleMute = () => setIsMuted(!isMuted);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.parentElement?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  return (
    <div className="relative w-full flex-1 group bg-black">
      {/* This div is the container for the remote video stream */}
      <div ref={videoRef} className="w-full h-full flex items-center justify-center">
         <p className="text-muted-foreground">This is where the live video from Agora SDK would be rendered.</p>
      </div>

      <div className="absolute top-4 left-4 z-10">
        {broadcast.isLive && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-600 text-white">
            <span className="w-2 h-2 mr-2 bg-white rounded-full animate-pulse"></span>
            LIVE
          </span>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                 <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-white/20">
                    {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                 </Button>
            </div>
            <div className="flex items-center gap-4">
                 <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white hover:bg-white/20">
                    {isFullscreen ? <Minimize className="h-6 w-6" /> : <Maximize className="h-6 w-6" />}
                 </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
