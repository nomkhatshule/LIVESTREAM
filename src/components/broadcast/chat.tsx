'use client';

import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { chatMessages as initialMessages, users } from '@/lib/data';
import type { ChatMessage } from '@/lib/data';
import { Send, Smile } from 'lucide-react';
import ChatMessageItem from './chat-message';

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    const currentUser = users[0]; // Simulate current user
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      user: {
        name: currentUser.name,
        avatarUrl: currentUser.avatarUrl,
        avatarHint: currentUser.avatarHint,
      },
      message: newMessage,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold font-headline text-center">Live Chat</h2>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-4">
          {messages.map((msg) => (
            <ChatMessageItem key={msg.id} message={msg} />
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSendMessage} className="relative">
          <Input
            placeholder="Send a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="pr-24"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
             <Button variant="ghost" size="icon" type="button">
                <Smile className="h-5 w-5 text-muted-foreground"/>
             </Button>
             <Button variant="ghost" size="icon" type="submit">
                <Send className="h-5 w-5 text-primary"/>
             </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
