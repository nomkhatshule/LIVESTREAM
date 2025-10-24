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
  openingStatement: z.string().describe("A brief, conversational opening that acknowledges the user's question before providing the main answer."),
  body: z.string().describe("The main body of the response. Use simple markdown for formatting (e.g., **bold**, *italics*, bullet points)."),
});
export type AskAssistantOutput = z.infer<typeof AskAssistantOutputSchema>;


export async function askAssistant(input: AskAssistantInput): Promise<AskAssistantOutput> {
    return askAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'askAssistantPrompt',
  input: {schema: AskAssistantInputSchema},
  output: {schema: AskAssistantOutputSchema},
  prompt: `You are a helpful and friendly AI assistant integrated into a live streaming platform called AgoraLive. Your goal is to answer viewer questions about the current stream.

Here is the context for the current stream: {{{broadcastContext}}}.

The user's question is: {{{query}}}

Please structure your response in the following JSON format:
1.  **openingStatement**: Write a short, friendly acknowledgment of the user's question. For example, if they ask "What is this stream about?", you could say "Great question! This stream is all about...".
2.  **body**: Provide the detailed answer as a list of bullet points. Use simple markdown for formatting:
    - Use bullet points (* or -) for lists.
    - Use ** for bold text for emphasis.
`,
});


const askAssistantFlow = ai.defineFlow(
  {
    name: 'askAssistantFlow',
    inputSchema: AskAssistantInputSchema,
    outputSchema: AskAssistantOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      return {
        openingStatement: "Apologies!",
        body: "I'm having a little trouble connecting right now. Please try again in a moment.",
      };
    }
    return output;
  }
);
