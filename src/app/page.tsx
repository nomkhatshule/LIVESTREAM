import { broadcasts, users, categories } from '@/lib/data';
import HomePageClient from './home-page-client';

export default function Home() {
  // In a real application, you would fetch this data from your API
  const liveBroadcasts = broadcasts.filter((b) => b.isLive);
  const upcomingBroadcasts = broadcasts.filter((b) => !b.isLive);

  // Mock a current user for personalized recommendations
  const currentUser = users[0];

  return (
    <HomePageClient
      liveBroadcasts={liveBroadcasts}
      upcomingBroadcasts={upcomingBroadcasts}
      categories={categories}
      currentUser={currentUser}
    />
  );
}
