
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy } from 'firebase/firestore';
import { Bell, Heart, Loader2, MessageSquare, User as UserIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Notification } from '@/lib/data';
import { cn } from '@/lib/utils';

export default function InboxPanel() {
    const { user } = useUser();
    const firestore = useFirestore();
    
    const notificationsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, `users/${user.uid}/notifications`), orderBy('timestamp', 'desc'));
    }, [user, firestore]);
    const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);

    const messages = [
        { id: 1, user: { name: 'GamerGirl_99', avatar: 'https://picsum.photos/seed/notif2/40' }, message: 'Hey, loved your last stream!', time: '1h ago', unread: true },
    ];
    
    const getIconForType = (type: Notification['type']) => {
        switch(type) {
            case 'follow': return <UserIcon className="h-5 w-5 text-blue-500"/>;
            case 'like': return <Heart className="h-5 w-5 text-red-500" />;
            case 'comment': return <MessageSquare className="h-5 w-5 text-green-500" />;
            default: return <Bell className="h-5 w-5" />;
        }
    }

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>
    }

    return (
         <Tabs defaultValue="all" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="flex-1 overflow-y-auto mt-4 space-y-2">
                {notifications && notifications.length > 0 ? (
                    notifications.map(n => (
                        <div key={n.id} className={cn("flex items-center gap-3 p-2 rounded-lg", !n.isRead && "bg-primary/10")}>
                            <div className="flex-shrink-0">{getIconForType(n.type)}</div>
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={n.actorAvatar} />
                                <AvatarFallback>{n.actorName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="text-sm flex-1">
                                <p>
                                    <Link href={`/profile/${n.actorId}`} className="font-semibold hover:underline">{n.actorName}</Link>
                                    {' '}
                                    {n.type === 'follow' && 'started following you.'}
                                    {n.type === 'like' && n.entityInfo}
                                    {n.type === 'comment' && n.entityInfo}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {n.timestamp ? formatDistanceToNow(n.timestamp.toDate(), { addSuffix: true }) : ''}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-muted-foreground py-16">No notifications yet.</div>
                )}
            </TabsContent>
            <TabsContent value="messages" className="flex-1 overflow-y-auto mt-4 space-y-2">
                {messages.map(m => (
                    <Link key={m.id} href={`/messages?with=${m.user.name}`} passHref>
                        <div className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={m.user.avatar} />
                                <AvatarFallback>{m.user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="text-sm flex-1">
                                <div className="flex justify-between">
                                    <p className="font-semibold">{m.user.name}</p>
                                    <p className="text-xs text-muted-foreground">{m.time}</p>
                                </div>
                                <p className={cn("truncate", m.unread && "font-bold text-primary")}>{m.message}</p>
                            </div>
                        </div>
                    </Link>
                ))}
                 {messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-16">No messages yet.</div>
                )}
            </TabsContent>
        </Tabs>
    )
}
