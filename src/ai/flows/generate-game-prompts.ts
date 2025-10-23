'use server';
/**
 * @fileOverview An AI agent that generates prompts for games like Truth or Dare.
 *
 * - generateGamePrompts - A function that handles the prompt generation process.
 * - GenerateGamePromptsInput - The input type for the generateGamePrompts function.
 * - GenerateGamePromptsOutput - The return type for the generateGamePrompts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenerateGamePromptsInputSchema = z.object({
  gameType: z
    .enum(['truth', 'dare', 'challenge'])
    .describe('The type of game prompt to generate.'),
  category: z
    .string()
    .describe('The category or theme for the prompts (e.g., "Icebreaker", "Spicy", "Comedy").'),
  count: z.number().describe('The number of prompts to generate.'),
});
export type GenerateGamePromptsInput = z.infer<
  typeof GenerateGamePromptsInputSchema
>;

export const GenerateGamePromptsOutputSchema = z.object({
  prompts: z.array(z.string()).describe('The list of generated prompts.'),
});
export type GenerateGamePromptsOutput = z.infer<
  typeof GenerateGamePromptsOutputSchema
>;

export async function generateGamePrompts(
  input: GenerateGamePromptsInput
): Promise<GenerateGamePromptsOutput> {
  return generateGamePromptsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateGamePromptsPrompt',
  input: {schema: GenerateGamePromptsInputSchema},
  output: {schema: GenerateGamePromptsOutputSchema},
  prompt: `You are the 'Game Master' for a live streaming app. Your job is to create a list of engaging and creative prompts for a game.

  Game Type: {{{gameType}}}
  Category: {{{category}}}
  
  Based on this, generate {{{count}}} unique prompts.
  
  - If the game type is 'truth', generate personal and funny questions that are safe for a general audience.
  - If the game type is 'dare', generate silly but safe physical challenges that are fun to do on a live stream. Avoid anything dangerous, harmful, or inappropriate.
  - If the game type is 'challenge', invent creative mini-games or tasks for the streamer to perform.
  
  Return ONLY the list of prompts in the format requested. Do not add any extra commentary or text.
  `,
});

const generateGamePromptsFlow = ai.defineFlow(
  {
    name: 'generateGamePromptsFlow',
    inputSchema: GenerateGamePromptsInputSchema,
    outputSchema: GenerateGamePromptsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
