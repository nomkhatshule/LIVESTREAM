
'use client';

import { Button } from "@/components/ui/button";
import { Dice6, Mic, MicOff, Minus, MonitorUp, ScreenShare, UserPlus, Video, VideoOff } from "lucide-react";
import ParticipantsPanel from "./ParticipantsPanel";

interface StreamControlsProps {
    onToggleVideo: () => void;
    onToggleMic: () => void;
    onToggleScreenShare: () => void;
    onInviteGuest: () => void;
    onToggleChallengeVisibility: () => void;
    onOpenGames: () => void;
    isVideoEnabled: boolean;
    isMicEnabled: boolean;
    isScreenSharing: boolean;
    isChallengeActive: boolean;
    viewerCount: number;
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
    viewerCount
}: StreamControlsProps) {
    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 md:gap-4 p-2 bg-black/40 rounded-full backdrop-blur-sm pointer-events-auto">
            <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onToggleVideo}>
                {isVideoEnabled ? <Video className="h-5 w-5 md:h-6 md:w-6"/> : <VideoOff className="h-5 w-5 md:h-6 md:w-6 text-red-500"/>}
            </Button>
            <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onToggleMic}>
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
            <ParticipantsPanel viewerCount={viewerCount} />
            <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onOpenGames}>
                <Dice6 className="h-5 w-5 md:h-6 md:w-6"/>
            </Button>
        </div>
    );
};
