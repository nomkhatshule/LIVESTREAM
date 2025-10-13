'use client';

import { useEffect, useRef, useState } from 'react';
import type { Broadcast } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, Volume2, VolumeX, Users, AlertCircle } from 'lucide-react';
import type { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


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
        const errorBody = await response.json();
        throw new Error(errorBody.error || 'Failed to fetch token');
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
  const { toast } = useToast();
  
  const [isMuted, setIsMuted] = useState(!isHost);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isHost);
  const [isAudioEnabled, setIsAudioEnabled] = useState(isHost);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);


  useEffect(() => {
    if (!appId || !currentUser) return;

    let AgoraRTC: any;
    let client: IAgoraRTCClient;

    const init = async () => {
      try {
        AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
      } catch (error) {
        console.error("Failed to load Agora SDK", error);
        toast({ variant: 'destructive', title: "Could not load streaming service."});
        return;
      }

      client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
      clientRef.current = client;

      const handleUserPublished = async (user: any, mediaType: 'video' | 'audio') => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'video') {
          setRemoteUsers(prev => [...prev.filter(u => u.uid !== user.uid), user]);
          const remoteVideoTrack = user.videoTrack;
          
          let playerContainer = document.getElementById(user.uid.toString());
          if (!playerContainer && videoRef.current) {
            playerContainer = document.createElement('div');
            playerContainer.id = user.uid.toString();
            playerContainer.style.width = '100%';
            playerContainer.style.height = '100%';
            playerContainer.style.position = 'absolute';
            videoRef.current.append(playerContainer);
          }
          remoteVideoTrack.play(playerContainer);
        }
         if (mediaType === 'audio') {
          user.audioTrack.play();
        }
      };

      const handleUserUnpublished = (user: any, mediaType: 'video' | 'audio') => {
         if (mediaType === 'video') {
           setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
           const playerContainer = document.getElementById(user.uid.toString());
           if (playerContainer) {
               playerContainer.remove();
           }
         }
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
            const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
            setHasCameraPermission(true);

            localAudioTrackRef.current = audioTrack;
            localVideoTrackRef.current = videoTrack;

            if (videoRef.current) {
              videoTrack.play(videoRef.current);
            }
            await client.publish([audioTrack, videoTrack]);
            setIsVideoEnabled(true);
            setIsAudioEnabled(true);

          } catch (permError) {
              console.error('Failed to get camera/mic permissions', permError);
              setHasCameraPermission(false);
              toast({
                  variant: 'destructive',
                  title: 'Permissions Denied',
                  description: 'Camera and microphone access is required to host a stream. Please enable permissions and refresh.'
              });
          }
        } else {
          client.setClientRole('audience');
        }
      } catch (error) {
        console.error('Failed to join channel or fetch token', error);
        toast({ variant: 'destructive', title: 'Connection Failed', description: 'Could not connect to the broadcast.'});
      }
    };

    init();

    return () => {
      localVideoTrackRef.current?.close();
      localAudioTrackRef.current?.close();
      clientRef.current?.leave();
      clientRef.current?.removeAllListeners();
    };
  }, [broadcast.id, isHost, currentUser, toast]);
  
  const toggleMute = () => {
      setIsMuted(!isMuted);
      remoteUsers.forEach(user => {
          if (user.audioTrack) {
              user.audioTrack.setVolume(isMuted ? 0 : 100);
          }
      });
  };

  const toggleVideo = async () => {
    if(localVideoTrackRef.current) {
        await localVideoTrackRef.current.setEnabled(!isVideoEnabled);
        setIsVideoEnabled(!isVideoEnabled);
    }
  }

  const toggleAudio = async () => {
      if(localAudioTrackRef.current) {
          await localAudioTrackRef.current.setEnabled(!isAudioEnabled);
          setIsAudioEnabled(!isAudioEnabled);
      }
  }

  return (
    <div className="absolute inset-0 w-full h-full">
      <div ref={videoRef} className="w-full h-full bg-black">
        {/* Agora video track is injected here */}
      </div>

       {isHost && !hasCameraPermission && (
         <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Camera & Mic Access Required</AlertTitle>
              <AlertDescription>
                To start your broadcast, please allow camera and microphone access in your browser settings, then refresh the page.
              </AlertDescription>
            </Alert>
        </div>
      )}

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
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-600 text-white animate-pulse">
            <span className="w-2 h-2 mr-2 bg-white rounded-full"></span>
            LIVE
          </span>
        )}
         <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-black/50 text-white gap-1.5">
            <Users className="h-4 w-4" />
            {Intl.NumberFormat('en-US', { notation: 'compact' }).format(broadcast.viewers + remoteUsers.length)}
          </span>
      </div>

       <div className="absolute top-4 right-4 z-10">
         {!isHost && (
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="text-white hover:bg-white/20 rounded-full">
                {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
            </Button>
         )}
      </div>

      {isHost && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4 p-2 bg-black/40 rounded-full">
            <Button variant={isAudioEnabled ? "secondary" : "destructive"} size="icon" onClick={toggleAudio} className="rounded-full h-12 w-12">
                {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
            </Button>
            <Button variant={isVideoEnabled ? "secondary" : "destructive"} size="icon" onClick={toggleVideo} className="rounded-full h-12 w-12">
                {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
            </Button>
        </div>
      )}
    </div>
  );
}
