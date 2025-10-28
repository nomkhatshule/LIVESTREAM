
'use client';

import { useState } from 'react';
import { useUser, useUserDocument, useUserDocumentById } from '@/firebase';
import { useChatContext } from '@/components/chat/ChatProvider';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Message, Reaction as StreamReaction } from 'stream-chat';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, CornerUpLeft, Check, CheckCheck, SmilePlus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface CustomMessageProps {
    message: Message, 
    onReply: (message: Message) => void;
    isEditing: boolean;
    onStartEdit: (message: Message) => void;
    onCancelEdit: () => void;
    onSaveEdit: (messageId: string, newText: string) => void;
    onDelete: (messageId: string) => void;
}

const emojiMap: Record<string, string> = {
    '👍': 'thumbs-up',
    '❤️': 'love',
    '😂': 'laugh',
    '😮': 'wow',
    '😢': 'sad',
    '🎉': 'party',
};

const reverseEmojiMap: Record<string, string> = Object.fromEntries(
    Object.entries(emojiMap).map(([key, value]) => [value, key])
);


const ReactionPicker = ({ onSelect }: { onSelect: (emojiId: string) => void }) => {
    return (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-700 rounded-full p-1 flex items-center gap-1 shadow-lg z-10">
            {Object.entries(emojiMap).map(([emoji, id]) => (
                <button
                    key={id}
                    onClick={() => onSelect(id)}
                    className="text-lg p-1 rounded-full hover:bg-zinc-700 transition-colors"
                >
                    {emoji}
                </button>
            ))}
        </div>
    );
};

const ReactionSummary = ({ reactions, messageId }: { reactions: StreamReaction[], messageId: string }) => {
    const { channel: activeChannel } = useChatContext();
    const { user: currentUser } = useUser();

    if (!reactions || reactions.length === 0) return null;

    // Group reactions by type
    const reactionCounts = reactions.reduce((acc, reaction) => {
        acc[reaction.type] = (acc[reaction.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const handleReactionClick = async (reactionType: string) => {
        if (!activeChannel || !currentUser) return;
         const userReaction = reactions.find(
            (r) => r.type === reactionType && r.user_id === currentUser.uid
        );

        if (userReaction) {
            await activeChannel.deleteReaction(messageId, userReaction.type);
        } else {
             await activeChannel.sendReaction(messageId, { type: reactionType });
        }
    }
    
    return (
        <div className="flex items-center gap-1 mt-1">
            {Object.entries(reactionCounts).map(([type, count]) => {
                const userHasReacted = reactions.some(r => r.type === type && r.user_id === currentUser?.uid);
                const emoji = reverseEmojiMap[type] || type;
                return (
                    <TooltipProvider key={type} delayDuration={100}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button 
                                    onClick={() => handleReactionClick(type)}
                                    className={cn(
                                        "bg-zinc-700/80 backdrop-blur-sm text-white rounded-full px-2 py-0.5 text-xs flex items-center gap-1 border border-transparent transition-colors",
                                        userHasReacted ? "border-primary bg-primary/20" : "hover:bg-zinc-600"
                                    )}
                                >
                                    <span>{emoji}</span>
                                    <span>{count}</span>
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs p-1">
                                {reactions.filter(r => r.type === type).map(r => r.user?.name || 'User').join(', ')}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )
            })}
        </div>
    );
}


export default function CustomMessage({ message, onReply, isEditing, onStartEdit, onCancelEdit, onSaveEdit, onDelete }: CustomMessageProps) {
    const { user: currentUser } = useUser();
    const { channel: activeChannel } = useChatContext();
    const { userDocument: currentUserDocument } = useUserDocument();
    const isCurrentUser = message.user?.id === currentUser?.uid;
    const [editText, setEditText] = useState(message.text || '');
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    
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

    const handleReaction = async (emojiId: string) => {
        if (activeChannel && currentUser) {
            const existingReaction = latestReactions.find(r => r.type === emojiId && r.user_id === currentUser.uid);
            if (existingReaction) {
                await activeChannel.deleteReaction(message.id, existingReaction.type);
            } else {
                await activeChannel.sendReaction(message.id, { type: emojiId });
            }
        }
        setShowReactionPicker(false);
    };

    return (
        <div className={cn("flex items-end gap-2 my-4 group", isCurrentUser ? "justify-end" : "justify-start")}>
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
                        onClick={() => setShowReactionPicker(prev => !prev)}
                    >
                        <SmilePlus className="h-4 w-4" />
                    </Button>
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
            <div className={cn("flex flex-col", isCurrentUser ? "items-end" : "items-start")}>
                 <div className={cn(
                    "max-w-xs md:max-w-md rounded-lg text-sm relative", 
                    isEditing ? 'p-0' : (attachment?.type === 'giphy' ? 'bg-transparent' : (isCurrentUser ? "bg-primary text-primary-foreground p-3" : "bg-zinc-200 text-black p-3"))
                )}>
                    {showReactionPicker && <ReactionPicker onSelect={handleReaction} />}
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
                        </>
                    )}
                </div>
                 <ReactionSummary reactions={latestReactions} messageId={message.id} />
                 {message.created_at && (
                    <div className={cn("text-xs text-zinc-200 mt-1 flex items-center gap-1", isCurrentUser ? "justify-end" : "justify-start")}>
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
                 <div className="flex-col items-center gap-2 hidden group-hover:flex">
                     <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full bg-zinc-800"
                        onClick={() => setShowReactionPicker(prev => !prev)}
                    >
                        <SmilePlus className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full bg-zinc-800"
                        onClick={() => onReply(message)}
                    >
                        <CornerUpLeft className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
    

    