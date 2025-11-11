'use client';

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Mic, MicOff } from "lucide-react";

interface MicButtonProps {
    isMicEnabled: boolean;
    onClick: () => void;
}

export default function MicButton({ isMicEnabled, onClick }: MicButtonProps) {
    return (
        <Button 
            variant="secondary" 
            size="icon" 
            className={cn(
                "rounded-full h-10 w-10 md:h-12 md:w-12",
                isMicEnabled && "animate-breathing-green"
            )} 
            onClick={onClick}
        >
            {isMicEnabled ? <Mic className="h-5 w-5 md:h-6 md:w-6"/> : <MicOff className="h-5 w-5 md:h-6 md:w-6 text-red-500"/>}
        </Button>
    );
}
