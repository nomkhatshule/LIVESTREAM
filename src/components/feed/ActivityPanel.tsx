'use client';

import { ScrollArea } from "@/components/ui/scroll-area";
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import ActivityItem, { type Activity } from "./ActivityItem";

// Hard-coded examples for styling purposes
const mockActivities: Activity[] = [
    {
        type: 'comment',
        actorName: 'JaneDoe',
        actorAvatar: 'https://picsum.photos/seed/avatar1/200',
        actorId: 'user1',
        entityInfo: 'My First Live Stream!',
        commentText: 'This is so cool! Thanks for sharing. 🚀',
        timestamp: '2h ago',
    },
    {
        type: 'follow',
        actorName: 'StreamFan22',
        actorAvatar: 'https://picsum.photos/seed/avatar2/200',
        actorId: 'user2',
        timestamp: '5h ago',
    },
    {
        type: 'like',
        actorName: 'SuperViewer',
        actorAvatar: 'https://picsum.photos/seed/avatar3/200',
        actorId: 'user3',
        entityInfo: 'My First Live Stream!',
        timestamp: '1d ago',
    },
     {
        type: 'follow',
        actorName: 'GamerGod',
        actorAvatar: 'https://picsum.photos/seed/avatar4/200',
        actorId: 'user4',
        timestamp: '2d ago',
    },
];


export default function ActivityPanel() {
    return (
        <>
            <SheetHeader>
                <SheetTitle>Activity</SheetTitle>
                <SheetDescription>
                    Recent likes, comments, and follows from your audience.
                </SheetDescription>
            </SheetHeader>
            <ScrollArea className="h-[calc(100%-4rem)] -mx-6">
                <div className="px-6 py-4 space-y-1">
                    {mockActivities.map((activity, index) => (
                        <ActivityItem key={index} activity={activity} />
                    ))}
                </div>
            </ScrollArea>
        </>
    );
}
