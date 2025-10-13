import BroadcastPage from '@/app/broadcast/[id]/page';
import { broadcasts } from '@/lib/data';

export default function FeedPage() {
  const liveBroadcasts = broadcasts.filter((b) => b.isLive);

  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-scroll snap-y snap-mandatory">
      {liveBroadcasts.map((broadcast) => (
        <BroadcastPage key={broadcast.id} params={{ id: broadcast.id }} />
      ))}
    </div>
  );
}
