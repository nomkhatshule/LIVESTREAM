'use client';
import { broadcasts, users, categories } from '@/lib/data';
import HomePageClient from './home-page-client';
import { useUser } from '@/firebase';
import { useMemo } from 'react';

export default function Home() {
  const { user } = useUser();
  // In a real application, you would fetch this data from your API
  const liveBroadcasts = broadcasts.filter((b) => b.isLive);
  const upcomingBroadcasts = broadcasts.filter((b) => !b.isLive);

  // Mock a current user for personalized recommendations
  const currentUser = useMemo(() => {
    if (user) {
      // Find a mock user profile that could correspond to the logged-in user
      // or create a default one. In a real app, you'd fetch this from your database.
      const profile = users.find(u => u.id === user.uid) || users.find(u => u.name.toLowerCase().includes('king'));
      return profile || users[0];
    }
    return users[0];
  }, [user]);


  return (
    <HomePageClient
      liveBroadcasts={liveBroadcasts}
      upcomingBroadcasts={upcomingBroadcasts}
      categories={categories}
      currentUser={currentUser}
    />
  );
}
