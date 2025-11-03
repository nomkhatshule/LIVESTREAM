
'use client';

import {
  Call,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  ParticipantView,
} from '@stream-io/video-react-sdk';
import { useUser } from '@/firebase';
import type { BroadcastData } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  broadcast: BroadcastData;
  isHost?: boolean;
}

export default function VideoPlayer({ broadcast, isHost = false }: VideoPlayerProps) {
  const { user } = useUser();
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !broadcast?.id || client) return;

    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    if (!apiKey) {
      console.error('Stream API key is missing.');
      return;
    }

    let videoClient: StreamVideoClient;

    const initClient = async () => {
      try {
        const response = await fetch('/api/stream/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid }),
        });
        if (!response.ok) throw new Error('Failed to get stream token');

        const { token } = await response.json();

        videoClient = new StreamVideoClient({
          apiKey,
          user: {
            id: user.uid,
            name: user.displayName || 'Viewer',
            image: user.photoURL || undefined,
          },
          token,
        });
        setClient(videoClient);
        
        const callInstance = videoClient.call('livestream', broadcast.id);
        
        // For viewers, we join. For hosts, join is handled in the studio page.
        if (!isHost) {
          await callInstance.join();
        }

        setCall(callInstance);

      } catch (error) {
        console.error('Failed to init Stream client', error);
        toast({
          title: 'Connection Error',
          description: 'Could not connect to the video service.',
          variant: 'destructive',
        });
      }
    };

    initClient();

    return () => {
      if (call) {
        call.leave().catch(err => console.error("Failed to leave call on cleanup", err));
      }
      if (client) {
        client.disconnectUser().catch(err => console.error("Failed to disconnect user on cleanup", err));
      }
      setClient(null);
      setCall(null);
    };
  }, [user, broadcast?.id, isHost, toast, client, call]);

  if (!client || !call || !broadcast?.hostId) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
         <div className="absolute inset-0 w-full h-full bg-black">
            <ParticipantView participant={broadcast.hostId} />
         </div>
      </StreamCall>
    </StreamVideo>
  );
}
