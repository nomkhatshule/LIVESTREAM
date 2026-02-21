'use client';

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Loader2 } from "lucide-react";
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
                <Button variant="ghost" size="icon" className="rounded-full h-14 w-14 text-white hover:bg-white/20">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10">
                      <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" />
                    </svg>
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
