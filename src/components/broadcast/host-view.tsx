'use client';

import { useState } from 'react';
import type { Broadcast } from '@/lib/data';
import VideoPlayer from './video-player';
import Chat from './chat';
import { Button } from '@/components/ui/button';
import { PanelLeft, PanelRight } from 'lucide-react';

interface HostViewProps {
  broadcast: Broadcast;
}

export default function HostView({ broadcast }: HostViewProps) {
  const [isChatOpen, setIsChatOpen] = useState(true);
  
  // State for media controls, passed down to VideoPlayer
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const toggleAudio = () => setIsAudioEnabled(prev => !prev);
  const toggleVideo = () => setIsVideoEnabled(prev => !prev);
  const handleScreenShare = () => {
      // In a real app, this would involve more complex logic managed by the VideoPlayer
      // For now, we just toggle the state
      setIsScreenSharing(prev => !prev);
  }

  return (
    <div className="flex h-screen bg-black text-white">
      <div className="flex-1 relative">
        <VideoPlayer 
            broadcast={broadcast} 
            isHost={true}
            isAudioEnabled={isAudioEnabled}
            isVideoEnabled={isVideoEnabled}
            isScreenSharing={isScreenSharing}
            toggleAudio={toggleAudio}
            toggleVideo={toggleVideo}
            handleScreenShare={handleScreenShare}
        />
      </div>
      
      {isChatOpen && (
        <div className="w-[350px] bg-background text-foreground border-l border-border flex flex-col">
          <Chat />
        </div>
      )}

      <div className="absolute top-4 left-4 z-20">
         <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(!isChatOpen)} className="text-white bg-black/30 hover:bg-black/50">
            {isChatOpen ? <PanelLeft /> : <PanelRight />}
        </Button>
      </div>
    </div>
  );
}
