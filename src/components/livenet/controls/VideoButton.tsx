
'use client';

import { Button } from "@/components/ui/button";
import { Video, VideoOff } from "lucide-react";

interface VideoButtonProps {
    isVideoEnabled: boolean;
    onClick: () => void;
}

export default function VideoButton({ isVideoEnabled, onClick }: VideoButtonProps) {
    return (
        <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12 text-white hover:bg-white/20 hover:text-white" onClick={onClick}>
            {isVideoEnabled ? <Video className="h-5 w-5 md:h-6 md:w-6"/> : <VideoOff className="h-5 w-5 md:h-6 md:w-6"/>}
        </Button>
    );
}

    