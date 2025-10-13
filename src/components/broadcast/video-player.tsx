'use client';

import { useEffect, useRef, useState } from 'react';
import type { Broadcast } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Maximize, Mic, MicOff, Minimize, Video, VideoOff, Volume2, VolumeX, Play, Pause } from 'lucide-react';

interface VideoPlayerProps {
  broadcast: Broadcast;
}

export default function VideoPlayer({ broadcast }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

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
    
    // For demonstration, let's play a placeholder video
    if (videoRef.current) {
      videoRef.current.play().catch(error => console.error("Video autoplay was prevented:", error));
    }


    // Cleanup on component unmount
    return () => {
      // client.leave();
      console.log(`Leaving broadcast channel: ${broadcast.id}`);
    };
  }, [broadcast.id]);
  
  const toggleMute = () => {
      setIsMuted(!isMuted);
      if(videoRef.current) {
          videoRef.current.muted = !isMuted;
      }
  };

  const togglePlay = () => {
    if (videoRef.current) {
        if(isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    }
  }

  return (
    <div className="absolute inset-0 w-full h-full" onClick={togglePlay}>
      {/* Mock video, in a real app this would be the stream */}
      <video 
        ref={videoRef}
        src="https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4" 
        loop
        muted={isMuted}
        playsInline
        className="w-full h-full object-cover"
      />

      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        {broadcast.isLive && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-600 text-white">
            <span className="w-2 h-2 mr-2 bg-white rounded-full animate-pulse"></span>
            LIVE
          </span>
        )}
         <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-black/50 text-white gap-1.5">
            <Users className="h-4 w-4" />
            {Intl.NumberFormat('en-US', { notation: 'compact' }).format(broadcast.viewers)}
          </span>
      </div>

       {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
             <Play className="h-20 w-20 text-white/70" />
          </div>
       )}

       <div className="absolute top-4 right-4 z-10">
         <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-white/20 rounded-full">
            {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
         </Button>
      </div>

    </div>
  );
}
