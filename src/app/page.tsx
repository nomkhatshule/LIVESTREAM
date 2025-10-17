import { categories, users } from '@/lib/data';
import HomePageClient from './home-page-client';

export default function Home() {
  // Data fetching is now handled on the client in HomePageClient
  const upcomingBroadcasts = []; // Upcoming can be implemented later

  // In a real app, currentUser would be derived from the server session
  const currentUser = users[0];

  return (
    <HomePageClient
      upcomingBroadcasts={upcomingBroadcasts}
      categories={categories}
      currentUser={currentUser}
    />
  );
}
