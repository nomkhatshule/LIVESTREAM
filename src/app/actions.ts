'use server';

import {
  personalizedBroadcastRecommendations,
  type PersonalizedBroadcastRecommendationsInput,
  type PersonalizedBroadcastRecommendationsOutput,
} from '@/ai/flows/personalized-broadcast-recommendations';

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
