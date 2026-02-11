'use client';

import { Button } from "@/components/ui/button";
import { Loader2, SwitchCamera } from "lucide-react";

interface FlipCameraButtonProps {
    onClick: () => void;
    isFlipping: boolean;
}

export default function FlipCameraButton({ onClick, isFlipping }: FlipCameraButtonProps) {
    return (
        <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full h-12 w-12 md:h-14 md:w-14 text-white hover:bg-white/20" 
            onClick={onClick}
            disabled={isFlipping}
        >
            {isFlipping ? (
                <Loader2 className="h-6 w-6 md:h-7 md:w-7 animate-spin" />
            ) : (
                <SwitchCamera className="h-6 w-6 md:h-7 md:w-7" />
            )}
        </Button>
    );
}
