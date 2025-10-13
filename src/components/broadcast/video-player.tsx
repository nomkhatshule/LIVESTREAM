'use client';

import { useEffect, useRef, useState } from 'react';
import type { Broadcast } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Maximize, Mic, MicOff, Minimize, Video, VideoOff, Volume2, VolumeX, Play, Pause, Users } from 'lucide-react';
import type { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import { useUser } from '@/firebase';

interface VideoPlayerProps {
  broadcast: Broadcast;
  isHost?: boolean;
}

const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';

async function fetchToken(channelName: string, uid: number | string): Promise<string> {
    const response = await fetch('/api/agora/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channelName, uid }),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch token');
    }
    const data = await response.json();
    return data.token;
}


export default function VideoPlayer({ broadcast, isHost = false }: VideoPlayerProps) {
  const { user: currentUser } = useUser();
  const videoRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<IAgoraRTCClient>();
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  
  const [isMuted, setIsMuted] = useState(!isHost);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isHost);
  const [isAudioEnabled, setIsAudioEnabled] = useState(isHost);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!appId || !videoRef.current || !currentUser) return;

    let AgoraRTC: any;
    let client: IAgoraRTCClient;

    const init = async () => {
      AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
      client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
      clientRef.current = client;

      const handleUserPublished = async (user: any, mediaType: 'video' | 'audio') => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'video') {
          setRemoteUsers(prev => [...prev, user]);
          const remoteVideoTrack = user.videoTrack;
          
          let playerContainer = document.getElementById(user.uid);
          if (!playerContainer) {
            playerContainer = document.createElement('div');
            playerContainer.id = user.uid.toString();
            playerContainer.style.width = '100%';
            playerContainer.style.height = '100%';
            playerContainer.style.position = 'absolute';
            videoRef.current?.append(playerContainer);
          }
          
          remoteVideoTrack.play(playerContainer);
        }
      };

      const handleUserUnpublished = (user: any, mediaType: 'video' | 'audio') => {
         if (mediaType === 'video') {
           setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
           const playerContainer = document.getElementById(user.uid);
           if (playerContainer) {
               playerContainer.remove();
           }
         }
      };

      client.on('user-published', handleUserPublished);
      client.on('user-unpublished', handleUserUnpublished);

      try {
        const uid = isHost ? currentUser.uid : null;
        const token = await fetchToken(broadcast.id, uid || 0);

        await client.join(appId, broadcast.id, token, uid);
        
        if (isHost) {
          client.setClientRole('host');
          const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
          
          localAudioTrackRef.current = audioTrack;
          localVideoTrackRef.current = videoTrack;

          videoTrack.play(videoRef.current!);
          await client.publish([audioTrack, videoTrack]);
          setIsVideoEnabled(true);
          setIsAudioEnabled(true);
        } else {
          client.setClientRole('audience');
        }
      } catch (error) {
        console.error('Failed to join channel or fetch token', error);
      }
    };

    init();

    return () => {
      localVideoTrackRef.current?.close();
      localAudioTrackRef.current?.close();
      clientRef.current?.leave();
      clientRef.current?.removeAllListeners();
    };
  }, [broadcast.id, isHost, currentUser]);
  
  const toggleMute = () => {
      setIsMuted(!isMuted);
      if (remoteUsers.length > 0) {
        remoteUsers.forEach(user => {
            if (user.audioTrack) {
                user.audioTrack.setVolume(isMuted ? 100 : 0);
            }
        });
      }
  };

  return (
    <div className="absolute inset-0 w-full h-full">
      <div ref={videoRef} className="w-full h-full bg-black">
        {/* The video track will be injected here by Agora */}
      </div>

      {!isHost && remoteUsers.length === 0 && (
         <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center text-white">
                <p className="text-lg font-semibold">Stream Offline</p>
                <p className="text-muted-foreground">Waiting for the host to start the broadcast...</p>
            </div>
        </div>
      )}


      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        {broadcast.isLive && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-600 text-white">
            <span className="w-2 h-2 mr-2 bg-white rounded-full animate-pulse"></span>
            LIVE
          </span>
        )}
         <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-black/50 text-white gap-1.5">
            <Users className="h-4 w-4" />
            {Intl.NumberFormat('en-US', { notation: 'compact' }).format(broadcast.viewers + remoteUsers.length)}
          </span>
      </div>

       <div className="absolute top-4 right-4 z-10">
         <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="text-white hover:bg-white/20 rounded-full">
            {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
         </Button>
      </div>
    </div>
  );
}
