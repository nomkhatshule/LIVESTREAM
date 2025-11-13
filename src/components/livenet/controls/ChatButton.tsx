
'use client';

import { Button } from "@/components/ui/button";
import { MessageCircle, MessageCircleOff } from "lucide-react";

interface ChatButtonProps {
    isChatVisible: boolean;
    onClick: () => void;
}

export default function ChatButton({ isChatVisible, onClick }: ChatButtonProps) {
    return (
        <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onClick}>
            {isChatVisible ? <MessageCircleOff className="h-5 w-5 md:h-6 md:w-6"/> : <MessageCircle className="h-5 w-5 md:h-6 md:w-6"/>}
        </Button>
    );
}

    