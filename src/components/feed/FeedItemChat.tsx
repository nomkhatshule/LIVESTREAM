
'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, useUserDocument, useFirestore, useMemoFirebase, useStorage } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, doc, orderBy, serverTimestamp, query, limit } from 'firebase/firestore';
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
            orderBy('timestamp', 'desc'),
            limit(50), // only the latest messages, not the whole history
        );
    }, [broadcast.id, firestore]);
    
    const { data: comments } = useCollection<ChatMessage>(messagesQuery);
    
    // Newest-first already suits the flex-col-reverse layout.
    const reversedComments = comments || [];

    const handleSendMessage = async (message: string, attachment: GiphyResult | { file: File, url: string } | null) => {
        if ((!message.trim() && !attachment) || !user || !userDocument) return;
    
        let messageAttachment: ChatMessage['attachment'] | null = null;
        const finalMessage = replyingTo ? `@${replyingTo} ${message}` : message;
    
        try {
            if (attachment) {
                 if ('file' in attachment) {
                    const imageFile = attachment.file;
                    const filePath = `chat_images/${broadcast.id}/${user.uid}/${Date.now()}-${imageFile.name}`;
                    const fileRef = storageRef(storage, filePath);
                    await uploadBytes(fileRef, imageFile);
                    const downloadURL = await getDownloadURL(fileRef);
                    messageAttachment = {
                        type: 'image',
                        imageUrl: downloadURL,
                    };
                } else {
                    messageAttachment = {
                        type: 'giphy',
                        title: attachment.title,
                        imageUrl: attachment.images.original.url,
                        thumbUrl: attachment.images.fixed_width.url,
                    };
                }
            }
    
            const newComment: Omit<Partial<ChatMessage>, 'timestamp'> & { timestamp: unknown } = {
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
                {/* Chat Container with Vanish Point Mask */}
                <div 
                    className="h-80 w-full pointer-events-auto overflow-y-auto scrollbar-hide pr-2"
                    style={{
                        maskImage: 'linear-gradient(to top, black 75%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to top, black 75%, transparent 100%)'
                    }}
                >
                    <div className="flex flex-col-reverse gap-y-2">
                        {reversedComments.map((comment) => (
                            <div key={comment.id} className="group flex items-start text-sm text-white py-0.5">
                                <Link href={`/profile/${comment.userId}`} className="pointer-events-auto flex-shrink-0">
                                    <Avatar className="h-6 w-6 border border-white/20 shadow-lg">
                                        <AvatarImage src={comment.userAvatar} alt={comment.username} />
                                        <AvatarFallback>{comment.username.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </Link>
                                <div className="flex-1 ml-2">
                                    <div className="flex items-center gap-1">
                                        <Link href={`/profile/${comment.userId}`} className="pointer-events-auto">
                                            <span className="font-bold font-headline text-primary hover:underline text-[10px] drop-shadow-md">
                                                {comment.username}
                                            </span>
                                        </Link>
                                        {comment.replyingTo && (
                                            <span className="text-accent/80 font-semibold text-[10px] drop-shadow-md">
                                                @{comment.replyingTo}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {comment.attachment?.type === 'giphy' || comment.attachment?.type === 'image' ? (
                                        <div className='mt-1'>
                                            <div className="max-w-[150px] rounded-lg overflow-hidden border border-white/10 shadow-2xl">
                                                <img src={comment.attachment.imageUrl} alt={comment.attachment.title || 'attachment'} className="w-full h-auto" />
                                            </div>
                                            {comment.message && (
                                                <p className="text-white text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,1)] leading-snug mt-1">
                                                    {comment.message.replace(/^@\w+\s/, '')}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <p className="text-white text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,1)] leading-snug flex-1">
                                                {comment.message.replace(/^@\w+\s/, '')}
                                            </p>
                                            <Button variant="ghost" size="icon" className="h-4 w-4 opacity-0 group-hover:opacity-100 pointer-events-auto" onClick={() => handleReplyClick(comment.username)}>
                                                <CornerUpLeft className="h-3 w-3 text-white/50" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="pb-4 pointer-events-auto mt-2">
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
