'use client';

import { useEffect, useRef, useState } from 'react';
import type { Broadcast } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, Volume2, VolumeX, Users, AlertCircle, ScreenShare, ScreenShareOff, X, FlipHorizontal } from 'lucide-react';
import type { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, IAgoraRTC, IRemoteVideoTrack, IScreenVideoTrack } from 'agora-rtc-sdk-ng';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

interface VideoPlayerProps {
  broadcast: Broadcast;
  isHost: boolean;
  isAudioEnabled?: boolean;
  isVideoEnabled?: boolean;
  isScreenSharing?: boolean;
}

const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';
let AgoraRTC: IAgoraRTC | null = null;


async function fetchToken(channelName: string, uid: number | string): Promise<string> {
    const response = await fetch('/api/agora/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channelName, uid }),
    });
    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error || 'Failed to fetch token');
    }
    const data = await response.json();
    return data.token;
}


export default function VideoPlayer({ 
    broadcast, 
    isHost,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
}: VideoPlayerProps) {
  const { user: currentUser, isUserLoading } = useUser();
  const videoRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<IAgoraRTCClient>();
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const screenVideoTrackRef = useRef<IScreenVideoTrack | null>(null);
  const router = useRouter();

  const { toast } = useToast();
  
  const [isMuted, setIsMuted] = useState(!isHost);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);

  // Effect for Agora Connection (both host and audience)
  useEffect(() => {
    if (isUserLoading || !appId || !currentUser) return;
    
    let client: IAgoraRTCClient;
    let localTracks: [IMicrophoneAudioTrack, ICameraVideoTrack] | null = null;

    const init = async () => {
      setIsConnecting(true);
      try {
        if (!AgoraRTC) {
           AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
        }
      } catch (error) {
        console.error("Failed to load Agora SDK", error);
        toast({ variant: 'destructive', title: "Could not load streaming service."});
        setIsConnecting(false);
        return;
      }

      client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
      clientRef.current = client;

      const handleUserPublished = async (user: any, mediaType: 'video' | 'audio') => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'video') {
            const remotePlayerContainer = document.createElement('div');
            remotePlayerContainer.id = `player-${user.uid}`;
            remotePlayerContainer.style.width = '100%';
            remotePlayerContainer.style.height = '100%';
            remotePlayerContainer.style.position = 'absolute';
            if (videoRef.current) {
                // Ensure we don't wipe out the container if we are just adding another track
                if (!document.getElementById(remotePlayerContainer.id)) {
                    videoRef.current.append(remotePlayerContainer);
                }
            }
            user.videoTrack.play(remotePlayerContainer);
            setRemoteUsers(prev => [...prev.filter(u => u.uid !== user.uid), user]);
        }
         if (mediaType === 'audio') {
          user.audioTrack.play();
        }
      };

      const handleUserUnpublished = (user: any) => {
         const playerContainer = document.getElementById(`player-${user.uid}`);
         if (playerContainer) {
             playerContainer.remove();
         }
         setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      };

      client.on('user-published', handleUserPublished);
      client.on('user-unpublished', handleUserUnpublished);

      try {
        const uid = currentUser.uid;
        const token = await fetchToken(broadcast.id, uid);

        await client.join(appId, broadcast.id, token, uid);
        
        if (isHost) {
          client.setClientRole('host');
          try {
            localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();
            localAudioTrackRef.current = localTracks[0];
            localVideoTrackRef.current = localTracks[1];
            if(videoRef.current) {
                // Make sure host can see their own video
                localTracks[1].play(videoRef.current);
            }
            await client.publish(localTracks);
          } catch(permError) {
              console.error('Failed to get camera/mic permissions', permError);
              // The create page handles permissions, so we should not show an error here
          }
        } else {
          client.setClientRole('audience');
        }
      } catch (error) {
        console.error('Failed to join channel or fetch token', error);
        toast({ variant: 'destructive', title: 'Connection Failed', description: 'Could not connect to the broadcast.'});
      } finally {
        setIsConnecting(false);
      }
    };

    init();

    return () => {
      localTracks?.forEach(track => track.close());
      screenVideoTrackRef.current?.close();
      clientRef.current?.leave();
      clientRef.current?.removeAllListeners();
    };
  }, [broadcast.id, isHost, currentUser, toast, isUserLoading]);
  
  useEffect(() => {
    if (isHost && localVideoTrackRef.current) {
      localVideoTrackRef.current.setEnabled(isVideoEnabled ?? true);
    }
  }, [isVideoEnabled, isHost]);

  useEffect(() => {
    if (isHost && localAudioTrackRef.current) {
      localAudioTrackRef.current.setEnabled(isAudioEnabled ?? true);
    }
  }, [isAudioEnabled, isHost]);


  const toggleMute = () => {
      setIsMuted(!isMuted);
      remoteUsers.forEach(user => {
          if (user.audioTrack) {
              user.audioTrack.setVolume(isMuted ? 100 : 0);
          }
      });
  };

  const showAudienceUI = !isHost;
  const showOfflineMessage = showAudienceUI && remoteUsers.length === 0 && !isConnecting;


  return (
    <div className="absolute inset-0 w-full h-full bg-black">
      <div ref={videoRef} className="w-full h-full">
        {/* Host self-view or remote user video is injected here */}
      </div>

      {showOfflineMessage && (
         <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center text-white">
                <p className="text-lg font-semibold">Stream Offline</p>
                <p className="text-muted-foreground">Waiting for the host to start the broadcast...</p>
            </div>
        </div>
      )}

      {/* UI overlays are now handled by the parent live/page.tsx or broadcast/[id]/page.tsx */}
      
      {showAudienceUI && (
        <>
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-600 text-white animate-pulse">
                    <span className="w-2 h-2 mr-2 bg-white rounded-full"></span>
                    LIVE
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-black/50 text-white gap-1.5">
                    <Users className="h-4 w-4" />
                    {Intl.NumberFormat('en-US', { notation: 'compact' }).format(broadcast.viewers + remoteUsers.length)}
                </span>
            </div>
            <div className="absolute top-4 left-4 z-10">
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="text-white hover:bg-white/20 rounded-full">
                    {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                </Button>
            </div>
        </>
      )}

    </div>
  );
}
