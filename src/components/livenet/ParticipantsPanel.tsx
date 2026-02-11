'use client';

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Users, Loader2 } from "lucide-react";
import { StreamVideoParticipant } from "@stream-io/video-react-sdk";
import { useUserDocumentById } from "@/firebase";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";
import { Skeleton } from "../ui/skeleton";

interface ViewerItemProps {
    participant: StreamVideoParticipant;
}

const ViewerItem = ({ participant }: ViewerItemProps) => {
    // We use the useUserDocumentById to get the rich profile info from Firestore
    const { userDocument, isDocLoading } = useUserDocumentById(participant.userId);

    if (isDocLoading) {
        return (
            <div className="flex items-center gap-3 p-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-5 w-24" />
            </div>
        );
    }
    
    // The name and image from Stream are fallbacks
    const name = userDocument?.username || participant.name || 'Anonymous';
    const avatarUrl = userDocument?.profilePicture || participant.image;

    return (
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
            <Avatar>
                <AvatarImage src={avatarUrl} alt={name} />
                <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <p className="font-semibold">{name}</p>
        </div>
    );
}

interface ParticipantsPanelProps {
    viewerCount: number;
    participants: StreamVideoParticipant[];
}

export default function ParticipantsPanel({ viewerCount, participants }: ParticipantsPanelProps) {
    // The host is also in the participants list, so we filter them out for the viewer list
    const viewers = participants.filter(p => !p.isLocalParticipant);

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 md:h-14 md:w-14 text-white hover:bg-white/20">
                    <Users className="h-6 w-6 md:h-7 md:w-7" />
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Viewers ({viewerCount})</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100%-4rem)] -mx-6 mt-4">
                    <div className="px-6 py-4 space-y-2">
                        {viewers.length > 0 ? (
                            viewers.map(participant => (
                                <ViewerItem key={participant.sessionId} participant={participant} />
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground pt-12">
                                <p>No one else is here yet.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
};
