
'use client';

import { Button } from "@/components/ui/button";
import { Dice6, Mic, MicOff, Minus, MonitorUp, ScreenShare, UserPlus, Video, VideoOff, MessageCircle, MessageCircleOff } from "lucide-react";
import ParticipantsPanel from "./ParticipantsPanel";
import { StreamVideoParticipant } from "@stream-io/video-react-sdk";
import { cn } from "@/lib/utils";

interface StreamControlsProps {
    onToggleVideo: () => void;
    onToggleMic: () => void;
    onToggleScreenShare: () => void;
    onInviteGuest: () => void;
    onToggleChallengeVisibility: () => void;
    onOpenGames: () => void;
    onToggleChat: () => void;
    isVideoEnabled: boolean;
    isMicEnabled: boolean;
    isScreenSharing: boolean;
    isChallengeActive: boolean;
    isChatVisible: boolean;
    viewerCount: number;
    isCallJoined: boolean;
    participants: StreamVideoParticipant[];
}

export default function StreamControls({ 
    onToggleVideo, 
    onToggleMic, 
    onToggleScreenShare, 
    onInviteGuest, 
    isVideoEnabled, 
    isMicEnabled, 
    isScreenSharing, 
    onToggleChallengeVisibility, 
    isChallengeActive, 
    onOpenGames,
    viewerCount,
    isCallJoined,
    isChatVisible,
    onToggleChat,
    participants,
}: StreamControlsProps) {
    
    if (!isCallJoined) {
        return null;
    }
    
    return (
        <div className="absolute top-1/2 right-4 -translate-y-1/2 z-30 flex flex-col items-center gap-4 p-2 bg-black/40 rounded-full backdrop-blur-sm pointer-events-auto">
            <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onToggleVideo}>
                {isVideoEnabled ? <Video className="h-5 w-5 md:h-6 md:w-6"/> : <VideoOff className="h-5 w-5 md:h-6 md:w-6 text-red-500"/>}
            </Button>
            <Button 
              variant="secondary" 
              size="icon" 
              className={cn(
                "rounded-full h-10 w-10 md:h-12 md:w-12",
                isMicEnabled && "animate-breathing-green"
              )} 
              onClick={onToggleMic}
            >
                {isMicEnabled ? <Mic className="h-5 w-5 md:h-6 md:w-6"/> : <MicOff className="h-5 w-5 md:h-6 md:w-6 text-red-500"/>}
            </Button>
            <Button variant={isScreenSharing ? "primary" : "secondary"} size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onToggleScreenShare}>
                {isScreenSharing ? <MonitorUp className="h-5 w-5 md:h-6 md:w-6"/> : <ScreenShare className="h-5 w-5 md:h-6 md:w-6"/>}
            </Button>
            <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onInviteGuest}>
                <UserPlus className="h-5 w-5 md:h-6 md:w-6"/>
            </Button>
            {isChallengeActive && (
              <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onToggleChallengeVisibility}>
                  <Minus className="h-5 w-5 md:h-6 md:w-6"/>
              </Button>
            )}
            <ParticipantsPanel viewerCount={viewerCount} participants={participants} />
            <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onOpenGames}>
                <Dice6 className="h-5 w-5 md:h-6 md:w-6"/>
            </Button>
             <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onToggleChat}>
                {isChatVisible ? <MessageCircleOff className="h-5 w-5 md:h-6 md:w-6"/> : <MessageCircle className="h-5 w-5 md:h-6 md:w-6"/>}
            </Button>
        </div>
    );
};
