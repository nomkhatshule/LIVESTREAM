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
        <Button variant="ghost" size="icon" className="rounded-full h-14 w-14 text-white hover:bg-white/20" onClick={onClick}>
            <Minus className="h-8 w-8"/>
        </Button>
    );
}
