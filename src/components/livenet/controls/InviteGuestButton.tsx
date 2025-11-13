
'use client';

import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

interface InviteGuestButtonProps {
    onClick: () => void;
}

export default function InviteGuestButton({ onClick }: InviteGuestButtonProps) {
    return (
        <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onClick}>
            <UserPlus className="h-5 w-5 md:h-6 md:w-6"/>
        </Button>
    );
}

    