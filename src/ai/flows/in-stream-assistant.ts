'use server';
/**
 * @fileOverview An AI stream assistant powered by Genkit and Gemini.
 *
 * - askAssistant - A function that takes a user's query and broadcast context to get a response from an AI assistant.
 * - AskAssistantInput - The input type for the askAssistant function.
 * - AskAssistantOutput - The return type for the askAssistant function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AskAssistantInputSchema = z.object({
  query: z.string().describe("The user's question for the assistant."),
  broadcastContext: z
    .string()
    .describe(
      'A summary of the current broadcast including title, category, and host.'
    ),
});
export type AskAssistantInput = z.infer<typeof AskAssistantInputSchema>;

const AskAssistantOutputSchema = z.object({
  response: z.string().describe('The AI assistant response.'),
});
export type AskAssistantOutput = z.infer<typeof AskAssistantOutputSchema>;


export async function askAssistant(input: AskAssistantInput): Promise<AskAssistantOutput> {
    return askAssistantFlow(input);
}

const askAssistantFlow = ai.defineFlow(
  {
    name: 'askAssistantFlow',
    inputSchema: AskAssistantInputSchema,
    outputSchema: AskAssistantOutputSchema,
  },
  async (input) => {
    const { text } = await ai.generate({
      prompt: `You are a helpful AI assistant integrated into a live streaming platform called AgoraLive. 
      Your goal is to answer viewer questions about the current stream. 
      Here is the context for the current stream: ${input.broadcastContext}.
      
      The user's question is: ${input.query}`,
    });

    return {
      response: text || "I'm sorry, I couldn't generate a response.",
    };
  }
);
