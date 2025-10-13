import BroadcastPage from '@/app/broadcast/[id]/page';
import { broadcasts } from '@/lib/data';
import Link from 'next/link';

export default function FeedPage() {
  const liveBroadcasts = broadcasts.filter((b) => b.isLive);

  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-scroll snap-y snap-mandatory">
      {liveBroadcasts.map((broadcast) => (
        // The BroadcastPage is not designed to be rendered directly here.
        // We will link to the broadcast page instead.
        // A more robust implementation might fetch and render the video previews here.
        // For now, this preserves the scroll-snap behavior while correctly routing.
        <div key={broadcast.id} className="snap-start h-[calc(100vh-4rem)] w-full">
            <iframe src={`/broadcast/${broadcast.id}`} className="w-full h-full border-0" />
        </div>
      ))}
    </div>
  );
}
