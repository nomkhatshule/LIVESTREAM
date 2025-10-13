'use server';

/**
 * @fileOverview A personalized broadcast recommendation AI agent.
 *
 * - personalizedBroadcastRecommendations - A function that generates personalized broadcast recommendations.
 * - PersonalizedBroadcastRecommendationsInput - The input type for the personalizedBroadcastRecommendations function.
 * - PersonalizedBroadcastRecommendationsOutput - The return type for the personalizedBroadcastRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedBroadcastRecommendationsInputSchema = z.object({
  watchHistory: z
    .array(z.string())
    .describe('The user watch history, a list of broadcast IDs.'),
  profileInformation: z.string().describe('The user profile information.'),
  interests: z.array(z.string()).describe('The user interests.'),
});
export type PersonalizedBroadcastRecommendationsInput = z.infer<
  typeof PersonalizedBroadcastRecommendationsInputSchema
>;

const PersonalizedBroadcastRecommendationsOutputSchema = z.object({
  recommendations: z
    .array(z.string())
    .describe('A list of recommended broadcast IDs.'),
});
export type PersonalizedBroadcastRecommendationsOutput = z.infer<
  typeof PersonalizedBroadcastRecommendationsOutputSchema
>;

export async function personalizedBroadcastRecommendations(
  input: PersonalizedBroadcastRecommendationsInput
): Promise<PersonalizedBroadcastRecommendationsOutput> {
  return personalizedBroadcastRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedBroadcastRecommendationsPrompt',
  input: {schema: PersonalizedBroadcastRecommendationsInputSchema},
  output: {schema: PersonalizedBroadcastRecommendationsOutputSchema},
  prompt: `You are an expert recommendation system for live broadcasts.

  Based on the user's watch history, profile information, and interests,
  recommend a list of broadcast IDs that the user might be interested in.

  Watch History: {{{watchHistory}}}
  Profile Information: {{{profileInformation}}}
  Interests: {{{interests}}}

  Return ONLY a list of broadcast IDs.
  `,
});

const personalizedBroadcastRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedBroadcastRecommendationsFlow',
    inputSchema: PersonalizedBroadcastRecommendationsInputSchema,
    outputSchema: PersonalizedBroadcastRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
