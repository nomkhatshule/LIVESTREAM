'use client';

import { Button } from "@/components/ui/button";
import { Video, VideoOff } from "lucide-react";

interface VideoButtonProps {
    isVideoEnabled: boolean;
    onClick: () => void;
}

export default function VideoButton({ isVideoEnabled, onClick }: VideoButtonProps) {
    return (
        <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 md:h-14 md:w-14 text-white hover:bg-white/20" onClick={onClick}>
            {isVideoEnabled ? <Video className="h-6 w-6 md:h-7 md:w-7"/> : <VideoOff className="h-6 w-6 md:h-7 md:w-7"/>}
        </Button>
    );
}
