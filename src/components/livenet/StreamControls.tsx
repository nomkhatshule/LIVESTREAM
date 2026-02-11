'use client';

import { StreamVideoParticipant } from "@stream-io/video-react-sdk";
import ParticipantsPanel from "./ParticipantsPanel";
import VideoButton from "./controls/VideoButton";
import MicButton from "./controls/MicButton";
import FlipCameraButton from "./controls/FlipCameraButton";
import ChallengeVisibilityButton from "./controls/ChallengeVisibilityButton";

interface StreamControlsProps {
    onToggleVideo: () => void;
    onToggleMic: () => void;
    onFlipCamera: () => void;
    onToggleChallengeVisibility: () => void;
    isVideoEnabled: boolean;
    isMicEnabled: boolean;
    isChallengeActive: boolean;
    isFlippingCamera: boolean;
    viewerCount: number;
    isCallJoined: boolean;
    participants: StreamVideoParticipant[];
}

export default function StreamControls({ 
    onToggleVideo, 
    onToggleMic,
    onFlipCamera,
    isVideoEnabled, 
    isMicEnabled, 
    onToggleChallengeVisibility, 
    isChallengeActive, 
    viewerCount,
    isCallJoined,
    participants,
    isFlippingCamera,
}: StreamControlsProps) {
    
    if (!isCallJoined) {
        return null;
    }
    
    return (
        <div className="absolute top-1/2 right-4 -translate-y-1/2 z-30 flex flex-col items-center gap-4 pointer-events-auto">
            <VideoButton isVideoEnabled={isVideoEnabled} onClick={onToggleVideo} />
            <FlipCameraButton onClick={onFlipCamera} isFlipping={isFlippingCamera} />
            <MicButton isMicEnabled={isMicEnabled} onClick={onToggleMic} />
            <ChallengeVisibilityButton isChallengeActive={isChallengeActive} onClick={onToggleChallengeVisibility} />
            <ParticipantsPanel viewerCount={viewerCount} participants={participants} />
        </div>
    );
};
