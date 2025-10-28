
'use client';

import { useState } from 'react';
import { useUser, useUserDocument, useUserDocumentById } from '@/firebase';
import { useChatContext } from '@/components/chat/ChatProvider';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Message } from 'stream-chat';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, CornerUpLeft, Check, CheckCheck } from 'lucide-react';


interface CustomMessageProps {
    message: Message, 
    onReply: (message: Message) => void;
    isEditing: boolean;
    onStartEdit: (message: Message) => void;
    onCancelEdit: () => void;
    onSaveEdit: (messageId: string, newText: string) => void;
    onDelete: (messageId: string) => void;
}

export default function CustomMessage({ message, onReply, isEditing, onStartEdit, onCancelEdit, onSaveEdit, onDelete }: CustomMessageProps) {
    const { user: currentUser } = useUser();
    const { channel: activeChannel } = useChatContext();
    const { userDocument: currentUserDocument } = useUserDocument();
    const isCurrentUser = message.user?.id === currentUser?.uid;
    const [editText, setEditText] = useState(message.text || '');
    
    const { userDocument: otherUserDocument } = useUserDocumentById(isCurrentUser ? undefined : message.user?.id);

    const streamUser = message.user;
    const avatarUrl = isCurrentUser ? currentUserDocument?.profilePicture : otherUserDocument?.profilePicture;
    
    let fallback = 'U';
    if (streamUser?.name) {
        fallback = streamUser.name.charAt(0).toUpperCase();
    }


    if (!streamUser) return null;
    
    if (message.deleted_at) {
        return (
             <div className={cn("flex items-center gap-2 my-2 text-xs text-zinc-500", isCurrentUser ? "justify-end" : "justify-start ml-10")}>
                <em>This message was deleted.</em>
            </div>
        )
    }

    const latestReactions = message.latest_reactions || [];
    const hasLiked = latestReactions.some(r => r.type === 'like' && r.user_id === currentUser?.uid);
    const likeCount = latestReactions.filter(r => r.type === 'like').length;

    const quotedMessage = message.quoted_message;
    const attachment = message.attachments?.[0];
    
    const handleSave = () => {
        onSaveEdit(message.id, editText);
    }
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            onCancelEdit();
        }
    };
    
    const otherUser = Object.values(activeChannel?.state.members || {}).find(member => member.user_id !== currentUser?.uid);
    const isRead = isCurrentUser && otherUser && (message.readBy || []).some(read => read.id === otherUser.user_id);
    const ReadReceipt = isRead ? CheckCheck : Check;

    return (
        <div className={cn("flex items-end gap-2 my-2 group", isCurrentUser ? "justify-end" : "justify-start")}>
             {isCurrentUser && (
                 <div className="flex-col items-center gap-2 hidden group-hover:flex">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => onStartEdit(message)}>
                                <Pencil className="mr-2 h-4 w-4"/>
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onDelete(message.id)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4"/>
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full"
                        onClick={() => onReply(message)}
                    >
                        <CornerUpLeft className="h-4 w-4" />
                    </Button>
                 </div>
            )}
            {!isCurrentUser && (
                <Avatar className="h-8 w-8 self-end">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback>{fallback}</AvatarFallback>
                </Avatar>
            )}
            <div className="flex flex-col">
                 <div className={cn(
                    "max-w-xs md:max-w-md rounded-lg text-sm relative", 
                    isEditing ? 'p-0' : (attachment?.type === 'giphy' ? 'bg-transparent' : (isCurrentUser ? "bg-primary text-primary-foreground p-3" : "bg-zinc-200 text-black p-3"))
                )}>
                    {isEditing ? (
                        <div className="space-y-2">
                           <Input 
                             value={editText} 
                             onChange={(e) => setEditText(e.target.value)}
                             onKeyDown={handleKeyDown}
                             className="bg-zinc-700 border-zinc-600 focus-visible:ring-primary"
                             autoFocus
                           />
                           <div className="text-xs">
                             esc to <Button variant="link" size="sm" className="p-0 h-auto text-primary" onClick={onCancelEdit}>cancel</Button> • enter to <Button variant="link" size="sm" className="p-0 h-auto text-primary" onClick={handleSave}>save</Button>
                           </div>
                        </div>
                    ) : (
                         <>
                            {quotedMessage && (
                                <div className="border-l-2 border-white/50 pl-2 mb-2 text-xs opacity-80">
                                    <p className="font-bold">{quotedMessage.user?.name || 'User'}</p>
                                    <p className="truncate">{quotedMessage.text}</p>
                                </div>
                            )}
                            {attachment?.type === 'giphy' ? (
                                <img src={attachment.image_url || attachment.thumb_url} alt={attachment.title} className="rounded-md" />
                            ) : (
                                <p>{message.text}</p>
                            )}
                            
                            {likeCount > 0 && (
                                <div className="absolute -bottom-3 right-2 bg-zinc-700 text-white rounded-full px-2 py-0.5 text-xs flex items-center">
                                    👍 {likeCount}
                                </div>
                            )}
                        </>
                    )}
                </div>
                 {message.created_at && (
                    <div className={cn("text-xs text-zinc-200 mt-1 flex items-center gap-1", isCurrentUser ? "text-right flex-row-reverse" : "text-left")}>
                         <p>{format(new Date(message.created_at), 'p')}</p>
                         
                         {isCurrentUser && <ReadReceipt className={cn("h-4 w-4", isRead ? "text-blue-400" : "text-zinc-400")} />}
                    </div>
                )}
            </div>
             {isCurrentUser && (
                <Avatar className="h-8 w-8 self-end">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback>{fallback}</AvatarFallback>
                </Avatar>
            )}
             {!isCurrentUser && (
                 <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full bg-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onReply(message)}
                >
                    <CornerUpLeft className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}