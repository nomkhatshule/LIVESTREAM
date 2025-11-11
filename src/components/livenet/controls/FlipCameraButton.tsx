
'use client';

import { Button } from "@/components/ui/button";
import { SwitchCamera } from "lucide-react";

interface FlipCameraButtonProps {
    onClick: () => void;
}

export default function FlipCameraButton({ onClick }: FlipCameraButtonProps) {
    return (
        <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onClick}>
            <SwitchCamera className="h-5 w-5 md:h-6 md:w-6" />
        </Button>
    );
}
