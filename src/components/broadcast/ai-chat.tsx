
'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkle, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';

interface AIChatMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

interface AIChatProps {
  children: ReactNode;
}

export default function AIChat({ children }: AIChatProps) {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      sender: 'ai',
      text: "Hi there! I'm your in-stream assistant. Ask me anything about what's happening.",
      timestamp: format(new Date(), 'HH:mm'),
    },
  ]);
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === '') return;

    const userMessage: AIChatMessage = {
      sender: 'user',
      text: input,
      timestamp: format(new Date(), 'HH:mm'),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Mock AI response
    setTimeout(() => {
      const aiResponse: AIChatMessage = {
        sender: 'ai',
        text: `I'm still learning, but I've noted your query about: "${input}".`,
        timestamp: format(new Date(), 'HH:mm'),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  useEffect(() => {
    // Auto-scroll to the bottom when new messages are added
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[75vh] bg-card pointer-events-auto"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <Sparkle className="h-5 w-5 text-primary" />
            Ask Anything
          </SheetTitle>
          <SheetDescription>
            Find information about what's happening in the stream without
            leaving.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-64">
          <ScrollArea className="flex-1 my-4 pr-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-end gap-2',
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-lg px-3 py-2',
                      msg.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p
                      className={cn(
                        'text-xs mt-1',
                        msg.sender === 'user'
                          ? 'text-right opacity-70'
                          : 'text-left'
                      )}
                    >
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <footer className="pt-2">
            <form
              onSubmit={handleSendMessage}
              className="relative flex items-center"
            >
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 bg-background text-foreground placeholder:text-muted-foreground rounded-full pr-10 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="absolute inset-y-0 right-1 text-muted-foreground hover:bg-accent rounded-full h-8 w-8"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </form>
          </footer>
        </div>
      </SheetContent>
    </Sheet>
  );
}
