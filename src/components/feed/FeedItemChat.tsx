

'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, useUserDocument, useFirestore, useMemoFirebase, useStorage } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, doc, orderBy, serverTimestamp, query } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { Broadcast, ChatMessage } from '@/lib/data';
import type { GiphyResult } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CornerUpLeft } from 'lucide-react';
import ChatInputForm from '../chat/ChatInputForm';

interface FeedItemChatProps {
    broadcast: Broadcast;
    isChatVisible: boolean;
}

export default function FeedItemChat({ broadcast, isChatVisible }: FeedItemChatProps) {
    const { user } = useUser();
    const { userDocument } = useUserDocument();
    const firestore = useFirestore();
    const storage = useStorage();
    const { toast } = useToast();

    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const messagesQuery = useMemoFirebase(() => {
        if (!broadcast.id || !firestore) return null;
        return query(
            collection(firestore, `broadcasts/${broadcast.id}/messages`),
            orderBy('timestamp', 'asc'),
        );
    }, [broadcast.id, firestore]);
    const { data: comments } = useCollection<ChatMessage>(messagesQuery);
    const reversedComments = useMemo(() => (comments || []).slice().reverse(), [comments]);

    const handleSendMessage = async (message: string, attachment: GiphyResult | { file: File, url: string } | null) => {
        if ((!message.trim() && !attachment) || !user || !userDocument) return;
    
        let messageAttachment: ChatMessage['attachment'] | null = null;
        const finalMessage = replyingTo ? `@${replyingTo} ${message}` : message;
    
        try {
            if (attachment) {
                 if ('file' in attachment) { // Image attachment
                    const imageFile = attachment.file;
                    const filePath = `chat_images/${broadcast.id}/${Date.now()}-${imageFile.name}`;
                    const fileRef = storageRef(storage, filePath);
                    await uploadBytes(fileRef, imageFile);
                    const downloadURL = await getDownloadURL(fileRef);
                    messageAttachment = {
                        type: 'image',
                        imageUrl: downloadURL,
                    };
                } else { // Giphy attachment
                    messageAttachment = {
                        type: 'giphy',
                        title: attachment.title,
                        imageUrl: attachment.images.original.url,
                        thumbUrl: attachment.images.fixed_width.url,
                    };
                }
            }
    
            const newComment: Partial<ChatMessage> & { timestamp: any } = {
                userId: user.uid,
                username: userDocument.username || "Anonymous",
                userAvatar: userDocument.profilePicture || '',
                message: finalMessage.replace(`@${replyingTo} `, ''),
                timestamp: serverTimestamp(),
            };
    
            if (messageAttachment) newComment.attachment = messageAttachment;
            if (replyingTo) newComment.replyingTo = replyingTo;
    
            const messagesCollectionRef = collection(firestore, 'broadcasts', broadcast.id, 'messages');
            addDocumentNonBlocking(messagesCollectionRef, newComment);

            if (user.uid !== broadcast.hostId) {
                const hostNotificationsRef = collection(firestore, `users/${broadcast.hostId}/notifications`);
                addDocumentNonBlocking(hostNotificationsRef, {
                    userId: broadcast.hostId,
                    type: 'comment',
                    actorId: user.uid,
                    actorName: userDocument.username || 'Someone',
                    actorAvatar: userDocument.profilePicture || '',
                    entityId: broadcast.id,
                    entityInfo: `commented: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
                    isRead: false,
                    timestamp: serverTimestamp(),
                });
            }
    
            setReplyingTo(null);
    
        } catch (error) {
            console.error("Error sending message:", error);
            toast({ title: "Error", description: "Could not send message.", variant: "destructive" });
        }
    };

    const handleReplyClick = (username: string) => {
        setReplyingTo(username);
        textareaRef.current?.focus();
    }

    if (!isChatVisible) {
        return null;
    }

    return (
        <div className="p-3 md:p-4 flex flex-col justify-end">
            <div className="w-full sm:max-w-sm md:max-w-md self-start flex-grow flex flex-col justify-end">
                <div className="h-80 w-full pointer-events-auto">
                    <ScrollArea className="h-full pr-2">
                        <div className="flex flex-col-reverse">
                            {reversedComments.map((comment) => (
                                <div key={comment.id} className="group flex items-start text-sm text-white pb-1">
                                    <Link href={`/profile/${comment.userId}`} className="pointer-events-auto flex-shrink-0">
                                        <Avatar className="h-6 w-6 border-2 border-secondary">
                                            <AvatarImage src={comment.userAvatar} alt={comment.username} />
                                            <AvatarFallback>{comment.username.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    </Link>
                                    <div className="flex-1 ml-2">
                                        <Link href={`/profile/${comment.userId}`} className="pointer-events-auto">
                                            <span className="font-bold font-headline text-primary mr-1.5 hover:underline text-xs">{comment.username}</span>
                                        </Link>
                                        {comment.replyingTo && <Link href={`/profile/${comment.userId}`} className="text-accent font-semibold mr-1.5 hover:underline pointer-events-auto text-xs">@{comment.replyingTo}</Link>}
                                        
                                        {comment.attachment?.type === 'giphy' || comment.attachment?.type === 'image' ? (
                                            <div className='mt-1'>
                                                <Image src={comment.attachment.imageUrl} width={150} height={100} alt={comment.attachment.title || 'attachment'} className="rounded-md" />
                                                {comment.message && <p className="break-words mt-1 text-sm">{comment.message.replace(/^@\w+\s/, '')}</p>}
                                            </div>
                                        ) : (
                                            <span className="break-words text-sm">{comment.message.replace(/^@\w+\s/, '')}</span>
                                        )}
                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 pointer-events-auto inline-flex" onClick={() => handleReplyClick(comment.username)}>
                                          <CornerUpLeft className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
                <div className="pb-10 md:pb-4 pointer-events-auto">
                   <ChatInputForm 
                        onSubmit={handleSendMessage} 
                        inputRef={textareaRef}
                        replyingTo={replyingTo}
                        onCancelReply={() => setReplyingTo(null)}
                        attachmentIconType='image'
                   />
                </div>
            </div>
        </div>
    );
}
