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
            className="rounded-full h-14 w-14 text-white hover:bg-white/20" 
            onClick={onClick}
            disabled={isFlipping}
        >
            {isFlipping ? (
                <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
                <SwitchCamera className="h-8 w-8" />
            )}
        </Button>
    );
}
