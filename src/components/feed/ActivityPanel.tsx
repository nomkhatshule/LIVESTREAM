'use client';

import { ScrollArea } from "@/components/ui/scroll-area";
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import ActivityItem from "./ActivityItem";
import type { Notification } from '@/lib/data';
import { Skeleton } from "../ui/skeleton";
import { MessageCircleHeart } from "lucide-react";
import { Separator } from "../ui/separator";
import React from "react";

interface ActivityPanelProps {
    notifications: Notification[];
    isLoading: boolean;
}

const ActivitySkeleton = () => (
    <div className="flex items-start gap-3 p-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/4" />
        </div>
    </div>
);


export default function ActivityPanel({ notifications, isLoading }: ActivityPanelProps) {
    // Sort notifications by date, as they might not be sorted if combined with other data previously
    const sortedNotifications = React.useMemo(() => {
        if (!notifications) return [];
        return [...notifications].sort((a, b) => {
            const dateA = a.timestamp?.toDate() || new Date(0);
            const dateB = b.timestamp?.toDate() || new Date(0);
            return dateB.getTime() - dateA.getTime();
        });
    }, [notifications]);

    return (
        <>
            <SheetHeader>
                <SheetTitle>Activity</SheetTitle>
                <SheetDescription>
                    Recent likes, comments, and follows.
                </SheetDescription>
            </SheetHeader>
            <ScrollArea className="h-[calc(100%-4rem)] -mx-6">
                <div className="px-6 py-4">
                    {isLoading ? (
                        <>
                            <ActivitySkeleton />
                            <ActivitySkeleton />
                            <ActivitySkeleton />
                        </>
                    ) : sortedNotifications.length > 0 ? (
                        <div className="space-y-2">
                            {sortedNotifications.map((item: Notification, index: number) => (
                               <React.Fragment key={item.id}>
                                    <ActivityItem activity={item} />
                                    {index < sortedNotifications.length - 1 && <Separator className="my-2 bg-zinc-800" />}
                               </React.Fragment>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 pt-24">
                           <MessageCircleHeart className="h-12 w-12 mb-4" />
                           <h3 className="text-lg font-semibold text-white">No Activity Yet</h3>
                           <p>Likes, comments, and new followers will appear here.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </>
    );
}
