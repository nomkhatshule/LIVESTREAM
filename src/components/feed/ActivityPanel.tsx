'use client';

import { ScrollArea } from "@/components/ui/scroll-area";
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import ActivityItem from "./ActivityItem";
import type { Notification } from '@/lib/data';
import { Skeleton } from "../ui/skeleton";
import { MessageCircleHeart, Swords } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { useMemo, useState } from "react";
import ChallengeNotificationItem from "./ChallengeNotificationItem";

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


export default function ActivityPanel({ notifications, isLoading: areNotificationsLoading }: ActivityPanelProps) {
    const { user } = useUser();
    const firestore = useFirestore();

    const challengesQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(
            collection(firestore, `users/${user.uid}/challenges`),
            orderBy('createdAt', 'desc')
        );
    }, [user, firestore]);
    const { data: challenges, isLoading: areChallengesLoading } = useCollection(challengesQuery);

    const isLoading = areNotificationsLoading || areChallengesLoading;

    // Combine and sort notifications and challenges by date
    const combinedActivity = useMemo(() => {
        const allItems = [
            ...(notifications || []).map(item => ({ ...item, itemType: 'notification' })),
            ...(challenges || []).map(item => ({ ...item, itemType: 'challenge' }))
        ];

        allItems.sort((a, b) => {
            const dateA = a.createdAt?.toDate() || a.timestamp?.toDate() || new Date(0);
            const dateB = b.createdAt?.toDate() || b.timestamp?.toDate() || new Date(0);
            return dateB.getTime() - dateA.getTime();
        });

        return allItems;
    }, [notifications, challenges]);


    return (
        <>
            <SheetHeader>
                <SheetTitle>Activity</SheetTitle>
                <SheetDescription>
                    Recent challenges, likes, comments, and follows.
                </SheetDescription>
            </SheetHeader>
            <ScrollArea className="h-[calc(100%-4rem)] -mx-6">
                <div className="px-6 py-4 space-y-1">
                    {isLoading ? (
                        <>
                            <ActivitySkeleton />
                            <ActivitySkeleton />
                            <ActivitySkeleton />
                        </>
                    ) : combinedActivity.length > 0 ? (
                        combinedActivity.map((item: any) => {
                            if (item.itemType === 'challenge') {
                                return <ChallengeNotificationItem key={`challenge-${item.id}`} challenge={item} />;
                            }
                            return <ActivityItem key={`notification-${item.id}`} activity={item} />;
                        })
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
