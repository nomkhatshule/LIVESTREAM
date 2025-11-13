

'use client';

import { StreamVideoParticipant } from "@stream-io/video-react-sdk";
import ParticipantsPanel from "./ParticipantsPanel";
import VideoButton from "./controls/VideoButton";
import MicButton from "./controls/MicButton";
import FlipCameraButton from "./controls/FlipCameraButton";
import ScreenShareButton from "./controls/ScreenShareButton";
import InviteGuestButton from "./controls/InviteGuestButton";
import ChallengeVisibilityButton from "./controls/ChallengeVisibilityButton";
import GamesButton from "./controls/GamesButton";
import ChatButton from "./controls/ChatButton";

interface StreamControlsProps {
    onToggleVideo: () => void;
    onToggleMic: () => void;
    onFlipCamera: () => void;
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
    isFlippingCamera: boolean;
    viewerCount: number;
    isCallJoined: boolean;
    participants: StreamVideoParticipant[];
}

export default function StreamControls({ 
    onToggleVideo, 
    onToggleMic,
    onFlipCamera,
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
    isFlippingCamera,
}: StreamControlsProps) {
    
    if (!isCallJoined) {
        return null;
    }
    
    return (
        <div className="absolute top-1/2 right-4 -translate-y-1/2 z-30 flex flex-col items-center gap-4 p-2 bg-black/40 rounded-full backdrop-blur-sm pointer-events-auto">
            <VideoButton isVideoEnabled={isVideoEnabled} onClick={onToggleVideo} />
            <FlipCameraButton onClick={onFlipCamera} isFlipping={isFlippingCamera} />
            <MicButton isMicEnabled={isMicEnabled} onClick={onToggleMic} />
            <ScreenShareButton isScreenSharing={isScreenSharing} onClick={onToggleScreenShare} />
            <InviteGuestButton onClick={onInviteGuest} />
            <ChallengeVisibilityButton isChallengeActive={isChallengeActive} onClick={onToggleChallengeVisibility} />
            <ParticipantsPanel viewerCount={viewerCount} participants={participants} />
            <GamesButton onClick={onOpenGames} />
            <ChatButton isChatVisible={isChatVisible} onClick={onToggleChat} />
        </div>
    );
};

    