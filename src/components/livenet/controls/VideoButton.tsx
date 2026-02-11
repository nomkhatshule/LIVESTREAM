'use client';

import { Button } from "@/components/ui/button";
import { Video, VideoOff } from "lucide-react";

interface VideoButtonProps {
    isVideoEnabled: boolean;
    onClick: () => void;
}

export default function VideoButton({ isVideoEnabled, onClick }: VideoButtonProps) {
    return (
        <Button variant="ghost" size="icon" className="rounded-full h-14 w-14 text-white hover:bg-white/20" onClick={onClick}>
            {isVideoEnabled ? <Video className="h-8 w-8"/> : <VideoOff className="h-8 w-8"/>}
        </Button>
    );
}
