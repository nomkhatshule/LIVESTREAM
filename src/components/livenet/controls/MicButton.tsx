'use client';

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MicButtonProps {
    isMicEnabled: boolean;
    onClick: () => void;
}

export default function MicButton({ isMicEnabled, onClick }: MicButtonProps) {
    return (
        <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
                "rounded-full h-14 w-14 text-white hover:bg-white/20"
            )} 
            onClick={onClick}
        >
            {isMicEnabled ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10">
                    <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
                    <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-10">
                    <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l18 18a.75.75 0 1 0 1.06-1.06l-18-18Z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M6.933 6.138A6.723 6.723 0 0 1 12 5.25a6.75 6.75 0 0 1 6.75 6.75v.24l-1.5-.06A5.25 5.25 0 0 0 12 6.75a5.23 5.23 0 0 0-4.015 1.932l-1.052-1.543ZM8.25 4.5a3.75 3.75 0 0 1 3.728 3.513l-7.241 10.606A3.75 3.75 0 0 1 8.25 4.5ZM12.75 18.75a3.75 3.75 0 0 1-3.75-3.75v-2.566l-1.5-1.5v4.066a5.25 5.25 0 0 0 9.08-3.755l-1.636-1.636A3.734 3.734 0 0 1 12.75 15v3.75Z" clipRule="evenodd" />
                </svg>
            )}
        </Button>
    );
}
