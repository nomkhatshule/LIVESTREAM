
'use client';

import { ScrollArea } from "@/components/ui/scroll-area";
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import NotificationItem from "./NotificationItem";
import type { Notification } from '@/lib/data';
import { Skeleton } from "../ui/skeleton";
import { MessageCircleHeart } from "lucide-react";

interface NotificationsPanelProps {
    notifications: Notification[];
    isLoading: boolean;
}

const NotificationSkeleton = () => (
    <div className="flex items-start gap-3 p-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/4" />
        </div>
    </div>
);


export default function NotificationsPanel({ notifications, isLoading }: NotificationsPanelProps) {
    return (
        <>
            <SheetHeader>
                <SheetTitle>Notifications</SheetTitle>
                <SheetDescription>
                    Recent likes, comments, and follows from your audience.
                </SheetDescription>
            </SheetHeader>
            <ScrollArea className="h-[calc(100%-4rem)] -mx-6">
                <div className="px-6 py-4 space-y-1">
                    {isLoading ? (
                        <>
                            <NotificationSkeleton />
                            <NotificationSkeleton />
                            <NotificationSkeleton />
                        </>
                    ) : notifications.length > 0 ? (
                        notifications.map((notification) => (
                            <NotificationItem key={notification.id} notification={notification} />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 pt-24">
                           <MessageCircleHeart className="h-12 w-12 mb-4" />
                           <h3 className="text-lg font-semibold text-white">No Notifications Yet</h3>
                           <p>Likes, comments, and new followers will appear here.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </>
    );
}

    