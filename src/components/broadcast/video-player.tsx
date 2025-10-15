'use client';

import { useEffect, useRef, useState } from 'react';
import type { Broadcast } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Users } from 'lucide-react';
import type { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, IAgoraRTC, IScreenVideoTrack } from 'agora-rtc-sdk-ng';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

interface VideoPlayerProps {
  broadcast: Broadcast;
  isHost: boolean;
  isAudioEnabled?: boolean;
  isVideoEnabled?: boolean;
  isScreenSharing?: boolean;
}

const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';
let AgoraRTC: IAgoraRTC | null = null;


async function fetchToken(channelName: string, account: string): Promise<string> {
    const response = await fetch('/api/agora/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName, account }),
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
  const clientRef = useRef<IAgoraRTCClient>();
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const screenVideoTrackRef = useRef<IScreenVideoTrack | null>(null);
  
  const { toast } = useToast();
  
  const [isMuted, setIsMuted] = useState(!isHost);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    if (isUserLoading || !appId || !currentUser) return;
    
    let client: IAgoraRTCClient;

    const initAgora = async () => {
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

      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'video') {
            const remotePlayerContainer = document.createElement('div');
            remotePlayerContainer.id = `player-${user.uid}`;
            remotePlayerContainer.className = 'w-full h-full absolute top-0 left-0';
            
            const playerContainer = document.getElementById('remote-players');
            if (playerContainer) {
                const existingPlayer = document.getElementById(remotePlayerContainer.id);
                if (existingPlayer) existingPlayer.remove();
                playerContainer.append(remotePlayerContainer);
            }
            user.videoTrack.play(remotePlayerContainer);
        }
        if (mediaType === 'audio') {
          user.audioTrack.play();
        }
        setRemoteUsers(prev => [...prev.filter(u => u.uid !== user.uid), user]);
      });

      client.on('user-unpublished', (user) => {
         const playerContainer = document.getElementById(`player-${user.uid}`);
         if (playerContainer) playerContainer.remove();
         setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      });

      try {
        const account = currentUser.uid;
        const token = await fetchToken(broadcast.id, account);
        await client.join(appId, broadcast.id, token, account);
        
        if (isHost) {
          client.setClientRole('host');
          try {
            // THIS IS THE CRITICAL PERMISSION REQUEST
            const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
            localAudioTrackRef.current = audioTrack;
            localVideoTrackRef.current = videoTrack;
            
            // Play local video to the dedicated div
            videoTrack.play('local-player');
            
            await client.publish([audioTrack, videoTrack]);
          } catch(permError) {
              console.error('Failed to get camera/mic permissions', permError);
              toast({ 
                variant: 'destructive', 
                title: "Camera/Mic Required", 
                description: "Please grant camera and microphone access to stream. You may need to refresh and try again.",
                duration: 10000,
              });
          }
        } else {
          client.setClientRole('audience');
        }
      } catch (error: any) {
        console.error('Failed to join channel or publish', error);
        toast({ variant: 'destructive', title: 'Connection Failed', description: error.message || 'Could not connect to the broadcast.'});
      } finally {
        setIsConnecting(false);
      }
    };

    initAgora();

    return () => {
      localAudioTrackRef.current?.close();
      localVideoTrackRef.current?.close();
      screenVideoTrackRef.current?.close();
      clientRef.current?.leave();
      clientRef.current?.removeAllListeners();
    };
  }, [broadcast.id, isHost, currentUser, isUserLoading, toast]);
  
  useEffect(() => {
    if (isHost && localVideoTrackRef.current) {
      localVideoTrackRef.current.setEnabled(isVideoEnabled ?? true).catch(e => console.error("Failed to toggle video", e));
    }
  }, [isVideoEnabled, isHost]);

  useEffect(() => {
    if (isHost && localAudioTrackRef.current) {
      localAudioTrackRef.current.setEnabled(isAudioEnabled ?? true).catch(e => console.error("Failed to toggle audio", e));
    }
  }, [isAudioEnabled, isHost]);

  // Effect for screen sharing
  useEffect(() => {
      const handleScreenShare = async () => {
          if (!isHost || !clientRef.current || !AgoraRTC || !localVideoTrackRef.current) return;
          
          const client = clientRef.current;

          if (isScreenSharing) {
              try {
                  await client.unpublish(localVideoTrackRef.current);
                  
                  const screenTrack = await AgoraRTC.createScreenVideoTrack({}, "auto");
                  screenVideoTrackRef.current = screenTrack;
                  
                  screenTrack.on("track-ended", async () => {
                      if (screenVideoTrackRef.current) {
                        await client.unpublish(screenVideoTrackRef.current);
                        screenVideoTrackRef.current.close();
                        screenVideoTrackRef.current = null;
                      }
                      if (localVideoTrackRef.current) {
                          await client.publish(localVideoTrackRef.current);
                      }
                  });

                  await client.publish(screenTrack);
                  // Screen share also needs a player element
                  screenTrack.play('local-player');
                  
              } catch (error) {
                  console.error("Screen sharing failed:", error);
                  toast({ variant: 'destructive', title: "Screen Share Failed", description: "Could not start screen sharing."})
                  if (localVideoTrackRef.current) {
                    await client.publish(localVideoTrackRef.current);
                  }
              }
          } else { 
              if (screenVideoTrackRef.current) {
                  await client.unpublish(screenVideoTrackRef.current);
                  screenVideoTrackRef.current.close();
                  screenVideoTrackRef.current = null;
                  
                  if (localVideoTrackRef.current) {
                      await client.publish(localVideoTrackRef.current);
                      localVideoTrackRef.current.play('local-player');
                  }
              }
          }
      };

      handleScreenShare();
      
  }, [isScreenSharing, isHost, toast]);


  const toggleMute = () => {
      setIsMuted(!isMuted);
      clientRef.current?.remoteUsers.forEach(user => {
          if (user.audioTrack) {
              user.audioTrack.setVolume(isMuted ? 0 : 100);
          }
      });
  };

  const showAudienceUI = !isHost;
  const showOfflineMessage = showAudienceUI && remoteUsers.length === 0 && !isConnecting;


  return (
    <div className="absolute inset-0 w-full h-full bg-black">
      {/* This is the container where all video feeds will be injected */}
      <div id="video-container" className="w-full h-full overflow-hidden relative">
        {/* Host's own video feed is rendered here */}
        {isHost && (
          <div 
            id="local-player" 
            className="w-full h-full absolute top-0 left-0"
          />
        )}
        {/* Viewers will see remote streams injected here */}
        {!isHost && (
             <div id="remote-players" className="w-full h-full" />
        )}
      </div>

      {showOfflineMessage && (
         <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center text-white">
                <p className="text-lg font-semibold">Stream Offline</p>
                <p className="text-muted-foreground">Waiting for the host to start the broadcast...</p>
            </div>
        </div>
      )}
      
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
                <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-white/20 rounded-full">
                    {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                </Button>
            </div>
        </>
      )}
    </div>
  );
}
