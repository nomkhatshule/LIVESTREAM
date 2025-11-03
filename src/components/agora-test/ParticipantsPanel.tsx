
'use client';

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Users } from "lucide-react";

interface ParticipantsPanelProps {
    viewerCount: number;
}

export default function ParticipantsPanel({ viewerCount }: ParticipantsPanelProps) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12">
                    <Users className="h-5 w-5 md:h-6 md-w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Viewers ({viewerCount})</SheetTitle>
                </SheetHeader>
                <div className="py-8 text-center text-muted-foreground">
                    <p>Viewer list is coming soon!</p>
                </div>
            </SheetContent>
        </Sheet>
    );
};
