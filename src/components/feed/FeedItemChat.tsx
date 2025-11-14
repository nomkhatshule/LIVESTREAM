
'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, useUserDocument, useFirestore, useMemoFirebase, useStorage } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, doc, orderBy, serverTimestamp, getDocs, writeBatch } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { cn } from '@/lib/utils';
import type { Broadcast, ChatMessage } from '@/lib/data';
import type { GiphyResult } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import GifPicker from '@/components/inbox/GifPicker';
import { CornerUpLeft, ArrowUp, X, Paperclip, Loader2, MessageSquareMore } from 'lucide-react';


interface FeedItemChatProps {
    broadcast: Broadcast;
}

export default function FeedItemChat({ broadcast }: FeedItemChatProps) {
    const { user } = useUser();
    const { userDocument } = useUserDocument();
    const firestore = useFirestore();
    const storage = useStorage();
    const { toast } = useToast();

    const [newMessage, setNewMessage] = useState('');
    const [isChatVisible, setIsChatVisible] = useState(true);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
    const [selectedGif, setSelectedGif] = useState<GiphyResult | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [imageAttachment, setImageAttachment] = useState<{ file: File, url: string } | null>(null);

    const messagesQuery = useMemoFirebase(() => {
        if (!broadcast.id || !firestore) return null;
        return query(
            collection(firestore, `broadcasts/${broadcast.id}/messages`),
            orderBy('timestamp', 'asc'),
        );
    }, [broadcast.id, firestore]);
    const { data: comments } = useCollection<ChatMessage>(messagesQuery);
    const reversedComments = useMemo(() => (comments || []).slice().reverse(), [comments]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedGif && !imageAttachment) || !user || !userDocument) return;
    
        setIsSending(true);
        let messageAttachment: ChatMessage['attachment'] | null = null;
    
        try {
            if (imageAttachment) {
                const imageFile = imageAttachment.file;
                const filePath = `chat_images/${broadcast.id}/${Date.now()}-${imageFile.name}`;
                const fileRef = storageRef(storage, filePath);
                await uploadBytes(fileRef, imageFile);
                const downloadURL = await getDownloadURL(fileRef);
                messageAttachment = {
                    type: 'image',
                    imageUrl: downloadURL,
                };
            } else if (selectedGif) {
                messageAttachment = {
                    type: 'giphy',
                    title: selectedGif.title,
                    imageUrl: selectedGif.images.original.url,
                    thumbUrl: selectedGif.images.fixed_width.url,
                };
            }
    
            let newComment: Partial<ChatMessage> & { timestamp: any } = {
                userId: user.uid,
                username: userDocument.username || "Anonymous",
                userAvatar: userDocument.profilePicture || '',
                message: newMessage,
                timestamp: serverTimestamp(),
            };
    
            if (messageAttachment) {
                newComment.attachment = messageAttachment;
            }
            
            const mentionMatch = newMessage.match(/^@(\w+)\s/);
            if (mentionMatch && mentionMatch[1]) {
                newComment.replyingTo = mentionMatch[1];
            }
    
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
                    entityInfo: `commented: "${newMessage.substring(0, 50)}${newMessage.length > 50 ? '...' : ''}"`,
                    isRead: false,
                    timestamp: serverTimestamp(),
                });
            }
    
            setNewMessage('');
            setSelectedGif(null);
            setImageAttachment(null);
    
        } catch (error) {
            console.error("Error sending message:", error);
            toast({ title: "Error", description: "Could not send message.", variant: "destructive" });
        } finally {
            setIsSending(false);
        }
    };

    const handleReplyClick = (username: string) => {
        setNewMessage(`@${username} `);
        textareaRef.current?.focus();
    }
    
    const handleGifSelect = (gif: GiphyResult) => {
        setSelectedGif(gif);
        setIsGifPickerOpen(false);
        setImageAttachment(null);
    }

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                toast({ title: "File too large", description: "Please select an image under 2MB.", variant: "destructive" });
                return;
            }
            if (!file.type.startsWith('image/')) {
                toast({ title: "Invalid file type", description: "Please select an image file.", variant: "destructive" });
                return;
            }
            setImageAttachment({ file, url: URL.createObjectURL(file) });
            setSelectedGif(null);
        }
    };

    return (
        <>
            {/* The chat visibility toggle needs to be outside the main chat component */}
            <div className="absolute top-1/2 right-0 -translate-y-1/2 z-40 flex flex-col items-center gap-y-4 md:gap-y-6 pointer-events-auto text-white p-2 md:p-4">
                 <div className="flex flex-col items-center group" style={{marginTop: '4.5rem'}}>
                    <button className="p-0 bg-transparent border-none text-white hover:scale-110 transition-transform" onClick={() => setIsChatVisible(!isChatVisible)}>
                       <MessageSquareMore className="h-7 w-7 drop-shadow-md" strokeWidth={1.5} />
                    </button>
                    <span className="text-xs font-bold text-white drop-shadow-md mt-1.5">{comments?.length || 0}</span>
                </div>
            </div>

            {isChatVisible && (
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
                                                {comment.replyingTo && <Link href={`/profile/${comment.replyingTo}`} className="text-accent font-semibold mr-1.5 hover:underline pointer-events-auto text-xs">@{comment.replyingTo}</Link>}
                                                
                                                {comment.attachment?.type === 'giphy' || comment.attachment?.type === 'image' ? (
                                                    <div className='mt-1'>
                                                        <Image src={comment.attachment.imageUrl} width={150} height={100} alt={comment.attachment.title || 'attachment'} className="rounded-md" />
                                                        {comment.message && <p className="break-words mt-1 text-sm">{comment.message.replace(/^@\w+\s/, '')}</p>}
                                                    </div>
                                                ) : (
                                                    <span className="break-words text-sm">{comment.message.replace(/^@\w+\s/, '')}</span>
                                                )}
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 pointer-events-auto" onClick={() => handleReplyClick(comment.username)}>
                                                <CornerUpLeft className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                        <div className="pb-16 md:pb-4">
                            <form onSubmit={handleSendMessage} className="relative flex w-full pointer-events-auto items-center gap-2 mt-2">
                                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/png, image/jpeg, image/gif" />
                                <div className="relative flex-1 bg-transparent border border-white/50 rounded-2xl overflow-hidden flex flex-col">
                                    {(selectedGif || imageAttachment) && (
                                        <div className='p-2'>
                                            <div className="relative w-32 h-24">
                                                <Image src={imageAttachment?.url || selectedGif?.images.fixed_width.url || ''} alt={imageAttachment?.file.name || selectedGif?.title || ''} fill className="object-cover rounded-md" />
                                                <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => { setSelectedGif(null); setImageAttachment(null); }}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <Separator className='my-2 bg-white/20'/>
                                        </div>
                                    )}
                                    <div className="relative flex items-center">
                                        <Textarea
                                            ref={textareaRef}
                                            placeholder="Add a comment..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage(e);
                                                }
                                            }}
                                            className={cn(
                                                "bg-transparent border-none placeholder:text-white w-full min-h-[40px] h-10 resize-none py-2 pr-24 pl-4 focus-visible:ring-0",
                                                (selectedGif || imageAttachment) ? "rounded-b-2xl rounded-t-none" : "rounded-2xl"
                                            )}
                                            disabled={isSending}
                                        />
                                        <div className="absolute bottom-1 right-1 flex items-center">
                                            <Button size="icon" type="button" variant="ghost" className="rounded-full h-9 w-9 text-white" onClick={() => fileInputRef.current?.click()} disabled={isSending}>
                                                <Paperclip className="h-5 w-5" />
                                            </Button>
                                            <Popover open={isGifPickerOpen} onOpenChange={setIsGifPickerOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button size="icon" type="button" variant="ghost" className="rounded-full h-9 w-9 text-white" disabled={isSending}>
                                                        <b className="text-xs">GIF</b>
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-screen sm:w-96 h-96 p-0 border-zinc-700 bg-zinc-900" side="top" align="end">
                                                <GifPicker onSendGif={handleGifSelect} />
                                                </PopoverContent>
                                            </Popover>
                                            <Button variant="ghost" size="icon" type="submit" className="text-white hover:bg-transparent hover:text-white h-9 w-9" disabled={isSending}>
                                                {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
