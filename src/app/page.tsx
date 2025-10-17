
import { categories, users } from '@/lib/data';
import HomePageClient from './home-page-client';
import { getLiveBroadcasts } from './actions';

export default async function Home() {
  // Fetch live broadcasts using the server-side action
  const liveBroadcasts = await getLiveBroadcasts();
  const upcomingBroadcasts = []; // Upcoming can be implemented later

  // In a real app, currentUser would be derived from the server session
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
