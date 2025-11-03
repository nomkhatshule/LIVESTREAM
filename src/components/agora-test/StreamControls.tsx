
'use client';

import { Button } from "@/components/ui/button";
import { Dice6, Mic, MicOff, Minus, MonitorUp, ScreenShare, UserPlus, Users, Video, VideoOff, SwitchCamera, MessageCircle, MessageCircleOff } from "lucide-react";
import ParticipantsPanel from "./ParticipantsPanel";
import { cn } from "@/lib/utils";

interface StreamControlsProps {
    onToggleVideo: () => void;
    onToggleMic: () => void;
    onFlipCamera: () => void;
    onToggleScreenShare: () => void;
    onInviteGuest: () => void;
    onToggleChallengeVisibility: () => void;
    onOpenGames: () => void;
    isVideoEnabled: boolean;
    isMicEnabled: boolean;
    isScreenSharing: boolean;
    isCallJoined: boolean;
    isChallengeActive: boolean;
    isChatVisible: boolean;
    onToggleChatVisibility: () => void;
    viewerCount: number;
}


export default function StreamControls({ onToggleVideo, onToggleMic, onFlipCamera, onToggleScreenShare, onInviteGuest, isVideoEnabled, isMicEnabled, isScreenSharing, isCallJoined, onToggleChallengeVisibility, isChallengeActive, onOpenGames, isChatVisible, onToggleChatVisibility, viewerCount }: StreamControlsProps) {
    return (
        <div className="flex flex-col items-center gap-2 md:gap-4 p-2 bg-black/40 rounded-full backdrop-blur-sm">
            <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onToggleVideo} disabled={!isCallJoined}>
                {isVideoEnabled ? <Video className="h-5 w-5 md:h-6 md:w-6"/> : <VideoOff className="h-5 w-5 md:h-6 md:w-6"/>}
            </Button>
            <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onToggleMic} disabled={!isCallJoined}>
                {isMicEnabled ? <Mic className="h-5 w-5 md:h-6 md:w-6"/> : <MicOff className="h-5 w-5 md:h-6 md:w-6 text-red-500"/>}
            </Button>
            <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onFlipCamera} disabled={!isCallJoined || isScreenSharing}>
                <SwitchCamera className="h-5 w-5 md:h-6 md:w-6"/>
            </Button>
            <Button variant={isScreenSharing ? "primary" : "secondary"} size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onToggleScreenShare} disabled={!isCallJoined}>
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
             <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onToggleChatVisibility}>
                {isChatVisible ? <MessageCircleOff className="h-5 w-5 md:h-6 md:w-6"/> : <MessageCircle className="h-5 w-5 md:h-6 md:w-6"/>}
            </Button>
            <ParticipantsPanel viewerCount={viewerCount} />
            <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onOpenGames}>
                <Dice6 className="h-5 w-5 md:h-6 md:w-6"/>
            </Button>
        </div>
    );
};
