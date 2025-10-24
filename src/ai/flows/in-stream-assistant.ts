'use server';
/**
 * @fileOverview An AI agent that functions as an in-stream assistant.
 *
 * - askAssistant - A function that handles user queries during a stream.
 * - AskAssistantInput - The input type for the askAssistant function.
 * - AskAssistantOutput - The return type for the askAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const AskAssistantInputSchema = z.object({
  query: z.string().describe("The user's question for the assistant."),
  broadcastContext: z
    .string()
    .describe(
      'Information about the current broadcast, like title, category, or what the streamer is doing.'
    ),
});
export type AskAssistantInput = z.infer<typeof AskAssistantInputSchema>;

export const AskAssistantOutputSchema = z.object({
  response: z
    .string()
    .describe("The AI assistant's helpful response to the user's query."),
});
export type AskAssistantOutput = z.infer<typeof AskAssistantOutputSchema>;

export async function askAssistant(
  input: AskAssistantInput
): Promise<AskAssistantOutput> {
  return askAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'askAssistantPrompt',
  input: {schema: AskAssistantInputSchema},
  output: {schema: AskAssistantOutputSchema},
  prompt: `You are a helpful and friendly AI assistant integrated into a live streaming platform called AgoraLive.

Your goal is to answer viewer questions concisely and accurately based on the context of the live stream they are watching.

Current Stream Context:
"{{{broadcastContext}}}"

Viewer's Question:
"{{{query}}}"

Based on the context and the question, provide a helpful response. If the question is unrelated to the stream, politely guide the conversation back to the stream content.`,
});

const askAssistantFlow = ai.defineFlow(
  {
    name: 'askAssistantFlow',
    inputSchema: AskAssistantInputSchema,
    outputSchema: AskAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
