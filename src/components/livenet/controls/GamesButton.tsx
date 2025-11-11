'use client';

import { Button } from "@/components/ui/button";
import { Dice6 } from "lucide-react";

interface GamesButtonProps {
    onClick: () => void;
}

export default function GamesButton({ onClick }: GamesButtonProps) {
    return (
        <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onClick}>
            <Dice6 className="h-5 w-5 md:h-6 md:w-6"/>
        </Button>
    );
}
