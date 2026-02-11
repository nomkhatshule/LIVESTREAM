
'use client';

import { Button } from "@/components/ui/button";
import { Minus } from "lucide-react";

interface ChallengeVisibilityButtonProps {
    isChallengeActive: boolean;
    onClick: () => void;
}

export default function ChallengeVisibilityButton({ isChallengeActive, onClick }: ChallengeVisibilityButtonProps) {
    if (!isChallengeActive) {
        return null;
    }

    return (
        <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12 text-white hover:bg-white/20 hover:text-white" onClick={onClick}>
            <Minus className="h-5 w-5 md:h-6 md:w-6"/>
        </Button>
    );
}

    