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
            variant="ghost" 
            size="icon" 
            className={cn(
                "rounded-full h-12 w-12 md:h-14 md:w-14 text-white hover:bg-white/20"
            )} 
            onClick={onClick}
        >
            {isMicEnabled ? <Mic className="h-6 w-6 md:h-7 md:w-7"/> : <MicOff className="h-6 w-6 md:h-7 md:w-7"/>}
        </Button>
    );
}
