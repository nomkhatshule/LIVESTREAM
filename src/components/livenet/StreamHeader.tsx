'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BroadcastData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Users, X } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

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
                <Avatar className="h-8 w-8 md:h-9 md:w-9 border-none">
                    <AvatarImage src={broadcastData?.hostAvatar || broadcastData?.user?.avatarUrl || ''} alt={broadcastData?.hostName || broadcastData?.user?.name || ''} />
                    <AvatarFallback>{(broadcastData?.hostName || broadcastData?.user?.name || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="font-bold font-headline text-xs md:text-sm leading-tight text-white">{broadcastData?.hostName || broadcastData?.user?.name || 'Host'}</span>
                        {broadcastData.isLive && (
                           <Badge variant="destructive" className="px-1.5 py-0.5 text-[10px] h-4 blinking-text">LIVE</Badge>
                        )}
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
                {/* This container ensures the button inside is centered relative to the w-14 stream controls */}
                <div className="w-14 flex justify-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 text-white rounded-full hover:bg-white/20 border border-white/50" onClick={onEndStream}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
