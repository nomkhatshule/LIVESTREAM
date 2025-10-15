'use client';

import { useEffect, useRef, useState } from 'react';
import type { Broadcast } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Users } from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, IScreenVideoTrack, IAgoraRTC } from 'agora-rtc-sdk-ng';


interface VideoPlayerProps {
  broadcast: Broadcast;
  isHost: boolean;
  isAudioEnabled?: boolean;
  isVideoEnabled?: boolean;
  isScreenSharing?: boolean;
}

const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';

// Updated to call the new Go middleware token server via our proxy
async function fetchToken(channelName: string, account: string, role: 'publisher' | 'subscriber'): Promise<string> {
    if (!account) {
        throw new Error("User account is not available to generate a token.");
    }
    console.log(`Requesting token for account: ${account}, channel: ${channelName}, role: ${role}`);
    // Calls our own Next.js API route which acts as a proxy
    const response = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            tokenType: 'rtc',
            channel: channelName,
            role: role,
            uid: account,
            expire: 3600 // Token expiration time in seconds
        }),
    });

    if (!response.ok) {
        let errorBody: any = { error: `Failed to fetch token from proxy: ${response.statusText}` };
        try {
            const textBody = await response.text();
            console.error("Proxy server error response text:", textBody);
            try {
              errorBody = JSON.parse(textBody);
            } catch {
              errorBody.details = textBody;
            }
        } catch (e) {
             console.error("Could not parse error response body:", e);
        }
        throw new Error(errorBody.error || errorBody.details || `Failed to fetch token from proxy: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Successfully received token.");
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
  const agoraClientRef = useRef<IAgoraRTCClient | null>(null);
  const agoraRTCRef = useRef<IAgoraRTC | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const screenVideoTrackRef = useRef<IScreenVideoTrack | null>(null);
  
  const { toast } = useToast();
  
  const [isMuted, setIsMuted] = useState(!isHost);
  const [isConnecting, setIsConnecting] = useState(true);

  // Main Effect for initializing Agora and handling connection
  useEffect(() => {
    if (isUserLoading || !currentUser || !broadcast.id) {
        console.log("VideoPlayer: Waiting for user and broadcast ID...");
        return;
    }
    
    let client: IAgoraRTCClient;
    let localTracks: [IMicrophoneAudioTrack, ICameraVideoTrack] | null = null;
    let AgoraRTC: IAgoraRTC;

    const initAndJoin = async () => {
        setIsConnecting(true);

        try {
            // Dynamically import Agora SDK on the client side
            const AgoraSDK = (await import('agora-rtc-sdk-ng'));
            AgoraRTC = AgoraSDK.default;
            agoraRTCRef.current = AgoraRTC;
        } catch (e) {
            console.error("Failed to load Agora SDK", e);
            toast({ variant: "destructive", title: "Could not load video library", description: "Please check your connection and try again." });
            return;
        }
        
        client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
        agoraClientRef.current = client;
        console.log("Agora client created.");

        // --- Token Expiration Handlers ---
        client.on("token-privilege-will-expire", async () => {
          console.log("Agora token is about to expire. Renewing...");
          try {
            const role = isHost ? 'publisher' : 'subscriber';
            const newToken = await fetchToken(broadcast.id, currentUser.uid, role);
            await client.renewToken(newToken);
            console.log("Agora token renewed successfully.");
          } catch (error) {
            console.error("Failed to renew Agora token", error);
            toast({
              variant: "destructive",
              title: "Connection Unstable",
              description: "Could not renew the session token. The stream may disconnect."
            })
          }
        });

        client.on("token-privilege-did-expire", async () => {
            console.error("Agora token has expired. Reconnecting...");
             toast({
              variant: "destructive",
              title: "Stream Disconnected",
              description: "Your session has expired. Attempting to rejoin..."
            });
             try {
                const role = isHost ? 'publisher' : 'subscriber';
                const newToken = await fetchToken(broadcast.id, currentUser.uid, role);
                if (client.connectionState !== 'DISCONNECTED') {
                    await client.leave();
                }
                await client.join(appId, broadcast.id, newToken, currentUser.uid);
             } catch(error) {
                 console.error("Failed to rejoin after token expired", error);
                 toast({ variant: "destructive", title: "Reconnection Failed", description: "Could not rejoin the stream."});
             }
        });
        // --- End of Token Handlers ---


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

        try {
            const account = currentUser.uid;
            // Ensure account is a non-empty string.
            if (!account || typeof account !== 'string' || account.trim() === '') {
                throw new Error("Invalid user account for token generation.");
            }
            const role = isHost ? 'publisher' : 'subscriber';
            const token = await fetchToken(broadcast.id, account, role);
            
            await client.join(appId, broadcast.id, token, account);
            console.log(`Successfully joined channel ${broadcast.id} as ${role}.`);

            if (isHost) {
                try {
                    client.setClientRole('host');
                    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();
                    localAudioTrackRef.current = localTracks[0];
                    localVideoTrackRef.current = localTracks[1];
                    
                    console.log("Successfully created local audio and video tracks.");
                    
                    localTracks[1].play('local-player');
                    console.log("Local video track is playing on the 'local-player' element.");

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

    return () => {
        console.log("Cleaning up Agora connection.");
        localAudioTrackRef.current?.close();
        localVideoTrackRef.current?.close();
        screenVideoTrackRef.current?.close();
        // Use a timeout to prevent race conditions on fast refreshes
        setTimeout(() => {
          agoraClientRef.current?.leave();
          agoraClientRef.current?.removeAllListeners();
        }, 100);
    };
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
          if (!isHost || !agoraClientRef.current || !localVideoTrackRef.current || !agoraRTCRef.current) return;
          
          const client = agoraClientRef.current;
          const AgoraRTC = agoraRTCRef.current;

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
      agoraClientRef.current?.remoteUsers.forEach(user => {
          if (user.audioTrack) {
              // Set volume based on the new muted state.
              user.audioTrack.setVolume(isMuted ? 100 : 0);
          }
      });
  };

  const showAudienceUI = !isHost;
  const showOfflineMessage = showAudienceUI && agoraClientRef.current?.remoteUsers.length === 0 && !isConnecting;


  return (
    <div className="absolute inset-0 w-full h-full bg-black">
      <div id="video-container" className="w-full h-full overflow-hidden relative">
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
                    {Intl.NumberFormat('en-US', { notation: 'compact' }).format(broadcast.viewers + (agoraClientRef.current?.remoteUsers.length || 0))}
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
