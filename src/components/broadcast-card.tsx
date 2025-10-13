import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Broadcast } from '@/lib/data';
import { Users } from 'lucide-react';

interface BroadcastCardProps {
  broadcast: Broadcast;
}

export default function BroadcastCard({ broadcast }: BroadcastCardProps) {
  const username = broadcast.user.name;

  return (
    <Link href={`/broadcast/${broadcast.id}`} className="group">
      <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
        <CardContent className="p-0">
          <div className="relative">
            <Image
              src={broadcast.thumbnailUrl}
              alt={broadcast.title}
              width={600}
              height={400}
              className="aspect-video object-cover w-full"
              data-ai-hint={broadcast.thumbnailHint}
            />
            {broadcast.isLive && (
              <Badge
                variant="destructive"
                className="absolute top-2 left-2 uppercase text-xs font-bold tracking-wider"
              >
                Live
              </Badge>
            )}
            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{Intl.NumberFormat('en-US', { notation: 'compact' }).format(broadcast.viewers)}</span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-start space-x-3">
              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarImage
                  src={broadcast.user.avatarUrl}
                  alt={username}
                  data-ai-hint={broadcast.user.avatarHint}
                />
                <AvatarFallback>{username.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-bold font-headline leading-tight truncate group-hover:text-primary transition-colors">
                  {broadcast.title}
                </h3>
                   <p className="text-sm text-muted-foreground mt-1">
                    {username}
                  </p>
                <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="secondary">{broadcast.category}</Badge>
                    {broadcast.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
