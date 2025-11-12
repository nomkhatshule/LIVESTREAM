
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
            variant="secondary" 
            size="icon" 
            className="rounded-full h-10 w-10 md:h-12 md:w-12" 
            onClick={onClick}
            disabled={isFlipping}
        >
            {isFlipping ? (
                <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin" />
            ) : (
                <SwitchCamera className="h-5 w-5 md:h-6 md:w-6" />
            )}
        </Button>
    );
}
