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
// Dynamically import Agora SDK
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
    isAudioEnabled = true,
    isVideoEnabled = true,
    isScreenSharing = false,
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

  // Main Effect for initializing Agora and handling connection
  useEffect(() => {
    // Strict guard clause: Do not proceed until everything is ready.
    if (isUserLoading || !currentUser || !broadcast.id) {
        console.log("VideoPlayer: Waiting for user and broadcast ID...");
        return;
    }
    
    let client: IAgoraRTCClient;
    let localTracks: [IMicrophoneAudioTrack, ICameraVideoTrack] | null = null;

    const initAndJoin = async () => {
        setIsConnecting(true);

        // --- 1. Load SDK ---
        try {
            if (!AgoraRTC) {
                AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
                console.log("Agora SDK loaded successfully.");
            }
        } catch (error) {
            console.error("Failed to load Agora SDK", error);
            toast({ variant: 'destructive', title: "Could not load streaming service."});
            setIsConnecting(false);
            return;
        }

        // --- 2. Create Client ---
        client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
        clientRef.current = client;
        console.log("Agora client created.");

        // --- 3. Setup Listeners (for viewers) ---
        if (!isHost) {
            client.on('user-published', async (user, mediaType) => {
                await client.subscribe(user, mediaType);
                console.log(`Subscribed to ${user.uid}'s ${mediaType} track.`);
                if (mediaType === 'video') {
                    const remotePlayerContainer = document.getElementById('remote-players');
                    if (remotePlayerContainer) {
                        const playerDiv = document.createElement('div');
                        playerDiv.id = `player-${user.uid}`;
                        playerDiv.className = 'w-full h-full absolute top-0 left-0';
                        remotePlayerContainer.append(playerDiv);
                        user.videoTrack!.play(playerDiv);
                    }
                }
                if (mediaType === 'audio') {
                    user.audioTrack!.play();
                }
            });

             client.on('user-unpublished', (user) => {
                const playerContainer = document.getElementById(`player-${user.uid}`);
                if (playerContainer) playerContainer.remove();
            });
        }

        // --- 4. Join Channel ---
        try {
            const account = currentUser.uid;
            const token = await fetchToken(broadcast.id, account);
            
            await client.join(appId, broadcast.id, token, account);
            console.log(`Successfully joined channel ${broadcast.id} as ${isHost ? 'host' : 'audience'}.`);

            if (isHost) {
                // --- 5. Get Permissions & Publish (Host only) ---
                try {
                    client.setClientRole('host');
                    // CRITICAL: Request hardware permissions
                    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();
                    localAudioTrackRef.current = localTracks[0];
                    localVideoTrackRef.current = localTracks[1];
                    
                    console.log("Successfully created local audio and video tracks.");
                    
                    // CRITICAL: Play the local video for the host to see themselves
                    localTracks[1].play('local-player');
                    console.log("Local video track is playing on the 'local-player' element.");

                    // Publish tracks to the channel
                    await client.publish(localTracks);
                    console.log("Successfully published local tracks to Agora.");

                } catch (permError) {
                    console.error('Failed to get permissions or publish tracks', permError);
                    toast({ 
                        variant: 'destructive', 
                        title: "Hardware Permission Denied", 
                        description: "Camera and microphone access is required to go live. Please check your browser settings and refresh.",
                        duration: 10000,
                    });
                }
            } else {
                client.setClientRole('audience');
            }
        } catch (joinError: any) {
            console.error('Failed to join Agora channel:', joinError);
            toast({ variant: 'destructive', title: 'Connection Failed', description: joinError.message || 'Could not connect to the broadcast.'});
        } finally {
            setIsConnecting(false);
        }
    };

    initAndJoin();

    // --- 6. Cleanup ---
    return () => {
        console.log("Cleaning up Agora connection.");
        localAudioTrackRef.current?.close();
        localVideoTrackRef.current?.close();
        screenVideoTrackRef.current?.close();
        clientRef.current?.leave();
        clientRef.current?.removeAllListeners();
    };
  // This effect runs once when the component mounts and has all necessary dependencies.
  }, [broadcast.id, isHost, currentUser?.uid, isUserLoading, toast]);
  
  // Effect for Toggling Video
  useEffect(() => {
    if (isHost && localVideoTrackRef.current) {
      localVideoTrackRef.current.setEnabled(isVideoEnabled).catch(e => console.error("Failed to toggle video", e));
    }
  }, [isVideoEnabled, isHost]);

  // Effect for Toggling Audio
  useEffect(() => {
    if (isHost && localAudioTrackRef.current) {
      localAudioTrackRef.current.setEnabled(isAudioEnabled).catch(e => console.error("Failed to toggle audio", e));
    }
  }, [isAudioEnabled, isHost]);

  // Effect for Screen Sharing
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
      <div id="video-container" className="w-full h-full overflow-hidden relative">
        {/* The DIV where the video will be rendered. This MUST exist in the DOM. */}
        {isHost && (
          <div 
            id="local-player" 
            className="w-full h-full"
          />
        )}
        {!isHost && (
             <div id="remote-players" className="w-full h-full" />
        )}
      </div>
      
      {isConnecting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <p className="text-white text-lg">Connecting to Stream...</p>
          </div>
      )}

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
