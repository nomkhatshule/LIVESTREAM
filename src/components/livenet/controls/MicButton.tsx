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
                "rounded-full h-14 w-14 text-white hover:bg-white/20"
            )} 
            onClick={onClick}
        >
            {isMicEnabled ? <Mic className="h-8 w-8"/> : <MicOff className="h-8 w-8"/>}
        </Button>
    );
}
