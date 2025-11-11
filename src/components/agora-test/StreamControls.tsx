
'use client';

import { Button } from "@/components/ui/button";
import { Users, X, Send, Smile, MessageCircle, Video, Mic, UserPlus, ScreenShare, VideoOff, MicOff, ArrowUp, MessageCircleOff, MonitorUp, Heart, ThumbsUp, Loader2, Dice6, Trophy, Check, Minus, Swords, Undo2, SwitchCamera } from 'lucide-react';
import { cn } from "@/lib/utils";

interface StreamControlsProps {
    onToggleVideo: () => void;
    onToggleMic: () => void;
    onToggleScreenShare: () => void;
    onInviteGuest: () => void;
    onToggleChallengeVisibility: () => void;
    isChallengeActive: boolean;
    isVideoEnabled: boolean;
    isMicEnabled: boolean;
    isScreenSharing: boolean;
    isCallJoined: boolean;
    onOpenGames: () => void;
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
    isCallJoined,
    onToggleChallengeVisibility,
    isChallengeActive,
    onOpenGames,
    viewerCount
}: StreamControlsProps) {
    
    if (!isCallJoined) {
        return null; // Don't render controls until the call is joined
    }
    
    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 p-2 bg-black/40 rounded-full backdrop-blur-sm pointer-events-auto">
            <Button variant="secondary" size="icon" className={cn("rounded-full h-12 w-12 md:h-14 md:w-14", isVideoEnabled && "bg-green-500/50 animate-breathing-green")} onClick={onToggleVideo}>
                {isVideoEnabled ? <Video className="h-6 w-6"/> : <VideoOff className="h-6 w-6 text-red-500"/>}
            </Button>
            <Button variant="secondary" size="icon" className="rounded-full h-12 w-12 md:h-14 md:w-14" onClick={onToggleMic}>
                {isMicEnabled ? <Mic className="h-6 w-6"/> : <MicOff className="h-6 w-6 text-red-500"/>}
            </Button>
             <Button variant="secondary" size="icon" className="rounded-full h-12 w-12 md:h-14 md:w-14">
                <SwitchCamera className="h-6 w-6"/>
            </Button>
            <Button variant={isScreenSharing ? "primary" : "secondary"} size="icon" className="rounded-full h-12 w-12 md:h-14 md:w-14" onClick={onToggleScreenShare}>
                {isScreenSharing ? <MonitorUp className="h-6 w-6"/> : <ScreenShare className="h-6 w-6"/>}
            </Button>
             <Button variant="secondary" size="icon" className="rounded-full h-12 w-12 md:h-14 md:w-14" onClick={onInviteGuest}>
                <UserPlus className="h-6 w-6"/>
            </Button>
            {isChallengeActive && (
                <Button variant="secondary" size="icon" className="rounded-full h-12 w-12 md:h-14 md:w-14" onClick={onToggleChallengeVisibility}>
                    <Minus className="h-6 w-6"/>
                </Button>
            )}
            <div className="relative">
                <Button variant="secondary" size="icon" className="rounded-full h-12 w-12 md:h-14 md:w-14">
                    <Users className="h-6 w-6"/>
                </Button>
                {viewerCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5">
                        {viewerCount}
                    </span>
                )}
            </div>
             <Button variant="secondary" size="icon" className="rounded-full h-12 w-12 md:h-14 md:w-14" onClick={onOpenGames}>
                <Dice6 className="h-6 w-6"/>
            </Button>
        </div>
    );
};

      