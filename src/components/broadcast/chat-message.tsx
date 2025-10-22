import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { ChatMessage } from '@/lib/data';
import { Badge } from '../ui/badge';
import { Shield } from 'lucide-react';

interface ChatMessageItemProps {
  message: ChatMessage;
}

export default function ChatMessageItem({ message }: ChatMessageItemProps) {
  const isMod = message.user.name.toLowerCase().includes('king'); // Mock moderator check

  return (
    <div className="flex items-start gap-3 text-sm">
      <Avatar className="w-8 h-8 border-2 border-secondary">
        <AvatarImage src={message.user.avatarUrl} alt={message.user.name} data-ai-hint={message.user.avatarHint} />
        <AvatarFallback>{message.user.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <span className="font-bold font-headline text-primary mr-2">{message.user.name}</span>
        {isMod && <Badge variant="secondary" className="px-1.5 py-0.5"><Shield className="h-3 w-3 mr-1" />Mod</Badge>}
        <p className="text-foreground/90 break-words">{message.message}</p>
      </div>
    </div>
  );
}
