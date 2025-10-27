
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Users } from "lucide-react";

interface ParticipantsPanelProps {
    viewerCount: number;
    participants: any[]; // Consider using a more specific type from Stream SDK if available
}

export default function ParticipantsPanel({ viewerCount, participants }: ParticipantsPanelProps) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12">
                    <Users className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Participants ({viewerCount})</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
                    <div className="space-y-4">
                        {participants.map((p: any) => (
                            <div key={p.sessionId} className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={p.image} alt={p.name} />
                                    <AvatarFallback>{p.name?.charAt(0) || 'A'}</AvatarFallback>
                                </Avatar>
                                <span className="font-headline">{p.name || 'Anonymous Viewer'}</span>
                            </div>
                        ))}
                        {participants.length <= 1 && (
                            <p className="text-muted-foreground text-center py-8">
                                Just you for now.
                            </p>
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
};
