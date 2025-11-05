
'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, ArrowUp, Bot, Loader2, Globe, Search } from 'lucide-react';
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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';

type AssistantMessage = {
  sender: 'ai';
  text: { openingStatement: string; body: string };
  timestamp: string;
};

type UserMessage = {
  sender: 'user';
  text: string;
  timestamp: string;
};


type AIChatMessage = AssistantMessage | UserMessage;

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
      text: {
        openingStatement: "Hi there!",
        body: "I'm your in-stream assistant, powered by Gemini. Ask me anything about what's happening in the stream. Toggle the globe icon to enable web search for real-time questions."
      },
      timestamp: format(new Date(), 'HH:mm'),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isWebSearchActive, setIsWebSearchActive] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === '' || isLoading) return;

    const userMessage: UserMessage = {
      sender: 'user',
      text: input,
      timestamp: format(new Date(), 'HH-mm'),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
        const result = await askAssistant({
            query: currentInput,
            broadcastContext: broadcastContext,
            useWebSearch: isWebSearchActive,
        });

        const aiResponse: AssistantMessage = {
            sender: 'ai',
            text: result,
            timestamp: format(new Date(), 'HH:mm'),
        };
        setMessages(prev => [...prev, aiResponse]);

    } catch (error) {
        console.error("Error calling AI service:", error);
        const errorResponse: AssistantMessage = {
            sender: 'ai',
            text: {
              openingStatement: "Connection Error",
              body: "I'm sorry, my connection to the AI service is currently unavailable. Please try again later."
            },
            timestamp: format(new Date(), 'HH-mm'),
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
             {isWebSearchActive ? 'Web Search Enabled' : 'Your AI Stream Assistant'}
          </SheetTitle>
          <SheetDescription className="text-gray-500">
             {isWebSearchActive ? 'Powered by Tavily and Gemini' : 'Powered by Gemini'}
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
                      'max-w-[80%]',
                      msg.sender === 'user'
                        ? 'bg-black text-white rounded-2xl px-4 py-3 rounded-br-none'
                        : 'text-black' 
                    )}
                  >
                     {msg.sender === 'user' ? (
                        <p className="text-sm">{msg.text}</p>
                     ) : ( // msg.sender === 'ai'
                        <div className="space-y-2 text-sm prose prose-sm max-w-full">
                          <p className="font-semibold">{msg.text.openingStatement}</p>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text.body}</ReactMarkdown>
                        </div>
                     )}
                    <p
                      className={cn(
                        'text-xs mt-2',
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
                    <p className="text-sm text-gray-500">{isWebSearchActive ? 'Searching and summarizing...' : 'Assistant is thinking...'}</p>
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
                placeholder={isWebSearchActive ? "Ask a real-time question..." : "Ask about the stream..."}
                className="flex-1 bg-gray-100 text-black border-gray-300 placeholder:text-gray-500 rounded-full pr-20 focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={isLoading}
              />
              <div className="absolute inset-y-0 right-1 flex items-center">
                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className={cn("text-gray-500 hover:bg-gray-200 rounded-full p-2 h-auto aspect-square", isWebSearchActive && "bg-blue-100 text-blue-600 hover:bg-blue-200")}
                    onClick={() => setIsWebSearchActive(prev => !prev)}
                    disabled={isLoading}
                >
                    <Globe className="h-full w-full" />
                </Button>
                <Button
                    type="submit"
                    size="icon"
                    variant="ghost"
                    className="text-gray-500 hover:bg-gray-200 rounded-full p-2 h-auto aspect-square"
                    disabled={isLoading}
                >
                    <ArrowUp className="h-full w-full" />
                </Button>
              </div>
            </form>
          </footer>
        </div>
      </SheetContent>
    </Sheet>
  );
}
