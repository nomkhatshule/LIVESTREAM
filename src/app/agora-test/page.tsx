'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, X, Send, Smile, MessageCircleOff, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

/**
 * This is a completely static test page to visualize the live stream UI.
 * It is not connected to any data, state, or functionality.
 */
export default function AgoraTestPage() {
  return (
    <div className="relative h-screen w-full">
      <div className="h-screen w-full bg-black text-white flex flex-col relative">
        {/* Mock Video Background */}
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <p className="text-2xl text-gray-400">Static Video Area</p>
        </div>

        {/* Mock Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-600 text-white">
              <span className="w-2 h-2 mr-2 bg-white rounded-full"></span>
              LIVE
            </span>
            <span className="inline-flex items-center text-sm font-medium gap-1.5">
              <Users className="h-4 w-4" />
              1,234
            </span>
          </div>
          <Button variant="destructive" size="sm">
            <X className="h-4 w-4 mr-1.5"/> End
          </Button>
        </div>

        {/* Mock Chat and Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent h-2/5">
            <ScrollArea className="h-full max-h-[250px] pr-4">
                <div className="flex flex-col gap-3">
                    {/* Static Chat Message Example */}
                    <div className="flex items-start gap-3 text-sm text-white bg-black/20 p-2 rounded-lg max-w-xs sm:max-w-sm">
                        <Avatar className="h-6 w-6 border-2 border-primary">
                            <AvatarImage src="https://picsum.photos/seed/static-avatar/100/100" alt="username" />
                            <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <span className="font-bold text-primary mr-1.5">StaticUser:</span>
                            <p className="break-words inline">This is a static comment!</p>
                        </div>
                    </div>
                </div>
            </ScrollArea>
          <div className="mt-4 flex items-center gap-2">
            <form onSubmit={(e) => e.preventDefault()} className="relative flex-1">
              <Input
                placeholder="Add a comment..."
                className="bg-black/50 border-white/20 text-white placeholder:text-gray-400 pr-10"
              />
              <Button variant="ghost" size="icon" type="submit" className="absolute inset-y-0 right-0 text-white">
                <Send className="h-5 w-5"/>
              </Button>
            </form>
            <Button variant="ghost" size="icon" className="text-white bg-black/50 rounded-full h-10 w-10">
              <Smile className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white bg-black/50 rounded-full h-10 w-10">
              <MessageCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
