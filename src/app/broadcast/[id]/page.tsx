import { broadcasts } from '@/lib/data';
import { notFound } from 'next/navigation';
import VideoPlayer from '@/components/broadcast/video-player';
import Chat from '@/components/broadcast/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Share2, Users, Bell, Star } from 'lucide-react';

export default function BroadcastPage({ params }: { params: { id: string } }) {
  const broadcast = broadcasts.find((b) => b.id === params.id);

  if (!broadcast) {
    notFound();
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
      <div className="flex-1 flex flex-col bg-black">
        <VideoPlayer broadcast={broadcast} />
        <div className="p-4 bg-card text-card-foreground border-t">
          <div className="flex flex-col sm:flex-row justify-between">
            <div className="flex items-start mb-4 sm:mb-0">
              <Avatar className="h-14 w-14 mr-4 border-2 border-primary">
                <AvatarImage src={broadcast.user.avatarUrl} alt={broadcast.user.name} data-ai-hint={broadcast.user.avatarHint} />
                <AvatarFallback>{broadcast.user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold font-headline">{broadcast.title}</h1>
                <p className="font-semibold text-primary">{broadcast.user.name}</p>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Users className="h-4 w-4 mr-1.5" />
                  <span>{Intl.NumberFormat('en-US').format(broadcast.viewers)} viewers</span>
                  <span className="mx-2">·</span>
                  <Badge variant="secondary">{broadcast.category}</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-start space-x-2 shrink-0">
              <Button variant="outline">
                <Heart className="h-4 w-4 mr-2" />
                Follow
              </Button>
              <Button variant="outline">
                <Bell className="h-4 w-4 mr-2" />
                Subscribe
              </Button>
               <Button variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>
      <aside className="w-full lg:w-96 bg-card border-l flex flex-col">
        <Chat />
      </aside>
    </div>
  );
}
