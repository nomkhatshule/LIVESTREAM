'use server';

import {
  personalizedBroadcastRecommendations,
  type PersonalizedBroadcastRecommendationsInput,
  type PersonalizedBroadcastRecommendationsOutput,
} from '@/ai/flows/personalized-broadcast-recommendations';
import { db } from '@/firebase/server';
import type { Broadcast, User } from '@/lib/data';
import { users } from '@/lib/data';
import { revalidatePath } from 'next/cache';

export async function getPersonalizedRecommendations(
  input: PersonalizedBroadcastRecommendationsInput
): Promise<PersonalizedBroadcastRecommendationsOutput> {
  // In a real app, you might add more logic here, like fetching more user data
  // or handling errors more gracefully.
  console.log('Fetching personalized recommendations with input:', input);
  try {
    const result = await personalizedBroadcastRecommendations(input);
    console.log('Received recommendations:', result);
    return result;
  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    // Return a default or empty state in case of an error.
    return { recommendations: [] };
  }
}

// This server action is now only responsible for revalidating the cache.
// The database operation is moved to the client.
export async function revalidateProfilePaths() {
  revalidatePath('/profile');
  revalidatePath('/');
}

export async function getLiveBroadcasts(): Promise<Broadcast[]> {
  try {
    const broadcastsSnapshot = await db.collection('broadcasts').where('isLive', '==', true).get();
    if (broadcastsSnapshot.empty) {
      return [];
    }

    const broadcasts: Broadcast[] = broadcastsSnapshot.docs.map(doc => {
      const data = doc.data();
      // In a real app, you would fetch user data from the 'users' collection.
      // For now, we'll find a mock user.
      const user = users.find(u => u.id === data.hostId) || users[0];

      return {
        id: doc.id,
        title: data.title,
        user: { ...user, name: data.hostName, avatarUrl: data.hostAvatar },
        thumbnailUrl: data.thumbnailUrl || 'https://picsum.photos/seed/default/600/400',
        thumbnailHint: data.thumbnailHint || 'abstract',
        viewers: data.viewers,
        category: data.category,
        isLive: data.isLive,
        tags: data.tags,
      };
    });

    return broadcasts;
  } catch (error) {
    console.error("Error fetching live broadcasts with admin SDK:", error);
    return []; // Return an empty array on error
  }
}
