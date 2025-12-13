
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BroadcastData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Users, X } from "lucide-react";
import type { ReactNode } from "react";

interface StreamHeaderProps {
    broadcastData: BroadcastData,
    viewerCount: number,
    onEndStream: () => void,
    children?: ReactNode;
}

export default function StreamHeader({ broadcastData, viewerCount, onEndStream, children }: StreamHeaderProps) {
    return (
        <div className="absolute top-0 left-0 right-0 z-30 p-2 md:p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
            <div className="flex items-center gap-2 md:gap-3 bg-black/30 p-1.5 md:p-2 rounded-full">
                <Avatar className={cn("h-8 w-8 md:h-9 md:w-9 border-4 border-destructive", broadcastData?.isLive && "animate-breathing-destructive")}>
                    <AvatarImage src={broadcastData?.hostAvatar || broadcastData?.user?.avatarUrl || ''} alt={broadcastData?.hostName || broadcastData?.user?.name || ''} />
                    <AvatarFallback>{(broadcastData?.hostName || broadcastData?.user?.name || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="font-bold font-headline text-xs md:text-sm leading-tight text-white">{broadcastData?.hostName || broadcastData?.user?.name || 'Host'}</span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 mt-0.5">
                        <span className="inline-flex items-center text-[10px] md:text-xs font-medium gap-1 text-white">
                            <Users className="h-3 w-3" />
                            {viewerCount.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4">
                {children}
                <Button variant="destructive" size="sm" className="h-8 px-3 md:h-9 md:px-4" onClick={onEndStream}>
                    <X className="h-4 w-4 mr-1.5" /> End
                </Button>
            </div>
        </div>
    );
};
