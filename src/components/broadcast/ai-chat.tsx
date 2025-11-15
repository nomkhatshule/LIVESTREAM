'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, ArrowUp, Bot, Loader2, Globe, Search, User, Calendar, Newspaper, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
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
import { askAssistant, type AskAssistantOutput } from '@/ai/flows/in-stream-assistant';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import Image from 'next/image';

type AssistantMessage = {
  sender: 'ai';
  text: AskAssistantOutput;
  timestamp: string;
};

type UserMessage = {
  sender: 'user';
  text: string;
  timestamp: string;
  imagePreview?: string;
};


type AIChatMessage = AssistantMessage | UserMessage;

interface AIChatProps {
  children: ReactNode;
  userAvatar?: string;
  broadcastContext: string;
}

const SourceItem = ({ source }: { source: NonNullable<AskAssistantOutput['sources']>[0] }) => {
    const formattedDate = source.publishDate ? format(parseISO(source.publishDate), 'MMM d, yyyy') : null;

    return (
        <a href={source.url} target="_blank" rel="noopener noreferrer" className="no-underline text-black hover:bg-gray-100 p-3 rounded-lg border border-gray-200 flex flex-col gap-3 transition-colors">
            {source.image && (
                <div className="relative w-full aspect-video flex-shrink-0 bg-gray-200 rounded-md overflow-hidden">
                    <Image src={source.image} alt={source.title} fill className="object-cover" />
                </div>
            )}
            <div className="overflow-hidden space-y-2">
                <p className="font-semibold text-black truncate text-sm">{source.title}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    {source.publisher && (
                        <div className="flex items-center gap-1.5">
                            {source.publisherLogoUrl && (
                                <Image src={source.publisherLogoUrl} alt={`${source.publisher} logo`} width={14} height={14} className="rounded-sm" />
                            )}
                            <span>{source.publisher}</span>
                        </div>
                    )}
                     {source.author && (
                        <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            <span>{source.author}</span>
                        </div>
                    )}
                    {formattedDate && (
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formattedDate}</span>
                        </div>
                    )}
                </div>
            </div>
        </a>
    )
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
        openingStatement: "Hi there! I'm your in-stream assistant. Ask me anything about what's happening, or use the camera icon to ask a question about the current video frame.",
        body: ""
      },
      timestamp: format(new Date(), 'HH:mm'),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isWebSearchActive, setIsWebSearchActive] = useState(false);
  const [frameDataUri, setFrameDataUri] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === '' || isLoading) return;

    const userMessage: UserMessage = {
      sender: 'user',
      text: input,
      timestamp: format(new Date(), 'HH:mm'),
      imagePreview: frameDataUri || undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    const currentFrame = frameDataUri;
    setInput('');
    setFrameDataUri(null);
    setIsLoading(true);

    try {
        const result = await askAssistant({
            query: currentInput,
            broadcastContext: broadcastContext,
            useWebSearch: isWebSearchActive,
            videoFrame: currentFrame || undefined,
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
            timestamp: format(new Date(), 'HH:mm'),
        };
        setMessages(prev => [...prev, errorResponse]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleScanFrame = () => {
    const videoElement = document.querySelector('.str-video__video') as HTMLVideoElement;
    if (!videoElement) {
        alert('Could not find the video stream to capture.');
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        setFrameDataUri(dataUri);
    }
  };


  useEffect(() => {
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
    <Sheet onOpenChange={(isOpen) => {
        if (!isOpen) {
            setFrameDataUri(null); // Clear frame on close
        }
    }}>
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
             {frameDataUri ? "Image captured! Ask a question about it." : "Ask me anything about the stream or scan a frame."}
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
                      'flex flex-col',
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    )}
                  >
                    <div className={cn(
                       'max-w-[80%]',
                      msg.sender === 'user'
                        ? 'bg-black text-white rounded-2xl px-4 py-3 rounded-br-none'
                        : 'text-black'
                    )}>
                      {msg.sender === 'user' ? (
                          <div className="space-y-2">
                            {msg.imagePreview && (
                              <Image src={msg.imagePreview} alt="Scanned frame" width={150} height={100} className="rounded-lg" />
                            )}
                            <p className="text-sm">{msg.text}</p>
                          </div>
                      ) : ( // msg.sender === 'ai'
                          <div className="space-y-2 text-sm prose prose-sm max-w-full">
                            <p>{msg.text.openingStatement}</p>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}
                                components={{
                                    ul(props) {
                                        const {node, ...rest} = props
                                        return <ul className="prose-ul:text-black" {...rest} />
                                    }
                                }}
                            >{msg.text.body}</ReactMarkdown>
                            {msg.text.sources && msg.text.sources.length > 0 && (
                              <>
                                <Separator className="my-3" />
                                <h4 className="font-semibold !mb-2 !text-black">Sources</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 not-prose">
                                    {msg.text.sources.map((source, i) => (
                                      <SourceItem key={i} source={source} />
                                    ))}
                                </div>
                              </>
                            )}
                          </div>
                      )}
                    </div>
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
                className="flex-1 bg-gray-100 text-black border-gray-300 placeholder:text-gray-500 rounded-full pr-32 focus-visible:ring-0 focus-visible:ring-offset-0"
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
                    type="button"
                    size="icon"
                    variant="ghost"
                    className={cn("text-gray-500 hover:bg-gray-200 rounded-full p-2 h-auto aspect-square", frameDataUri && "bg-blue-100 text-blue-600 hover:bg-blue-200")}
                    onClick={handleScanFrame}
                    disabled={isLoading}
                >
                    <Camera className="h-full w-full" />
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
