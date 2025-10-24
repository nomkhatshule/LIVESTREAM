
'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, ArrowUp, Bot, Loader2 } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { askAssistant } from '@/ai/flows/in-stream-assistant';

interface AIChatMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

interface AIChatProps {
  children: ReactNode;
  userAvatar?: string;
  broadcastContext: string;
}

export default function AIChat({
  children,
  userAvatar,
  broadcastContext,
}: AIChatProps) {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      sender: 'ai',
      text: "Hi there! I'm your in-stream assistant. Ask me anything about what's happening.",
      timestamp: format(new Date(), 'HH:mm'),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === '' || isLoading) return;

    const userMessage: AIChatMessage = {
      sender: 'user',
      text: input,
      timestamp: format(new Date(), 'HH:mm'),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const result = await askAssistant({
        query: currentInput,
        broadcastContext: broadcastContext,
      });

      const aiResponse: AIChatMessage = {
          sender: 'ai',
          text: result.response,
          timestamp: format(new Date(), 'HH:mm'),
      };
      setMessages(prev => [...prev, aiResponse]);

    } catch (error) {
        console.error("Error calling AI assistant:", error);
        const errorResponse: AIChatMessage = {
            sender: 'ai',
            text: "I'm sorry, my connection to the AI service is currently unavailable. Please try again later.",
            timestamp: format(new Date(), 'HH:mm'),
        };
        setMessages(prev => [...prev, errorResponse]);
    } finally {
        setIsLoading(false);
    }
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
        className="rounded-t-2xl max-h-[75vh] bg-white text-black pointer-events-auto"
      >
        <SheetHeader>
          <SheetTitle className="text-black">
            Your AI Stream Assistant
          </SheetTitle>
          <SheetDescription className="text-gray-500">
            Curious about something in the stream? Ask me anything!
          </SheetDescription>
        </SheetHeader>

        <Separator className="my-4 bg-gray-200" />

        <div className="flex flex-col h-96">
          <ScrollArea className="flex-1 -my-4 pr-4" ref={scrollAreaRef}>
            <div className="space-y-4 py-4">
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
                      'max-w-[70%]',
                      msg.sender === 'user'
                        ? 'bg-black text-white rounded-lg px-3 py-2'
                        : '' // Removed bubble style for AI
                    )}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p
                      className={cn(
                        'text-xs mt-1',
                        msg.sender === 'user'
                          ? 'text-right opacity-70'
                          : 'text-left text-gray-500'
                      )}
                    >
                      {msg.timestamp}
                    </p>
                  </div>
                  {msg.sender === 'user' && (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={userAvatar} />
                        <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 justify-start">
                    <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />
                    <p className="text-sm text-gray-500">Assistant is thinking...</p>
                </div>
              )}
            </div>
          </ScrollArea>
          <footer>
            <form
              onSubmit={handleSendMessage}
              className="relative flex items-center"
            >
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 bg-gray-100 text-black border-gray-300 placeholder:text-gray-500 rounded-full pr-10 focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="absolute inset-y-0 right-1 text-gray-500 hover:bg-gray-200 rounded-full p-2 h-auto aspect-square"
                disabled={isLoading}
              >
                <ArrowUp className="h-full w-full" />
              </Button>
            </form>
          </footer>
        </div>
      </SheetContent>
    </Sheet>
  );
}
