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
        <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 md:h-14 md:w-14 text-white hover:bg-white/20" onClick={onClick}>
            <Minus className="h-6 w-6 md:h-7 md:w-7"/>
        </Button>
    );
}
