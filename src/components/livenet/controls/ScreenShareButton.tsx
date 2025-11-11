'use client';

import { Button } from "@/components/ui/button";
import { ScreenShare, MonitorUp } from "lucide-react";

interface ScreenShareButtonProps {
    isScreenSharing: boolean;
    onClick: () => void;
}

export default function ScreenShareButton({ isScreenSharing, onClick }: ScreenShareButtonProps) {
    return (
        <Button variant={isScreenSharing ? "primary" : "secondary"} size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onClick}>
            {isScreenSharing ? <MonitorUp className="h-5 w-5 md:h-6 md:w-6"/> : <ScreenShare className="h-5 w-5 md:h-6 md:w-6"/>}
        </Button>
    );
}
