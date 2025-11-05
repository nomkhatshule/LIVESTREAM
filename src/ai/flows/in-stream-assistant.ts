
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
import { tavily } from '@tavily/core';

const tavilyClient = tavily({
    apiKey: process.env.TAVILY_API_KEY,
});


const AskAssistantInputSchema = z.object({
  query: z.string().describe("The user's question for the assistant."),
  broadcastContext: z
    .string()
    .describe(
      'A summary of the current broadcast including title, category, and host.'
    ),
  useWebSearch: z.boolean().optional().describe('Whether to use the web search tool for the query.'),
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

const webSearch = ai.defineTool(
    {
        name: 'webSearch',
        description: 'Performs a web search to find real-time or up-to-date information.',
        inputSchema: z.object({ query: z.string() }),
        outputSchema: z.string(),
    },
    async (input) => {
        try {
            const response = await tavilyClient.search(input.query, { searchDepth: "advanced" });
            const context = response.results.map((result: any) => result.content).join('\n');
            return JSON.stringify(context);
        } catch (error) {
            console.error("Tavily search failed:", error);
            return "Web search failed. Please try again later.";
        }
    }
);


const prompt = ai.definePrompt({
  name: 'askAssistantPrompt',
  input: {schema: AskAssistantInputSchema},
  output: {schema: AskAssistantOutputSchema},
  prompt: `You are a helpful and friendly AI assistant integrated into a live streaming platform called AgoraLive. Your goal is to answer viewer questions about the current stream.

Your entire public response must adhere to the following rules.

- **For all tools or no tools:** Your response should be a standard conversational reply.
    - **Driven Opener:** Your response MUST begin with a charismatic, engaging opener.
- **Structure and Clarity:** Use Markdown for structure. Headings, bold text, and lists are essential for readability.
- **Bulleted Sentences:** For detailed explanations, transform long paragraphs into a list of bullet points. Each bullet point should be a complete sentence.
- **Tables for Tabular Data:** When presenting data in rows and columns, you MUST use Markdown table syntax.
- **Visual Separators:** Use a Markdown horizontal rule ("---") to visually separate distinct topics or sections within your answer.
- **Concluding Thought & Engagement:** End your answer with a concluding thought that summarizes the key takeaway. Follow this with one or two engaging follow-up questions to encourage further interaction.
- **Tool Usage:** If the user's question requires up-to-date information, breaking news, or knowledge beyond your training data, you MUST use the webSearch tool to find the answer.

Here is the context for the current stream: {{{broadcastContext}}}.

The user's question is: {{{query}}}

Please structure your response in the following JSON format:
1.  **openingStatement**: Write a short, friendly acknowledgment of the user's question. For example, if they ask "What is this stream about?", you could say "Great question! This stream is all about...".
2.  **body**: Provide the detailed answer, following all the markdown and structural rules defined above.
`,
});


const askAssistantFlow = ai.defineFlow(
  {
    name: 'askAssistantFlow',
    inputSchema: AskAssistantInputSchema,
    outputSchema: AskAssistantOutputSchema,
  },
  async (input) => {
    const {output} = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt: `The user's question is: ${input.query}. Context: ${input.broadcastContext}`,
        tools: input.useWebSearch ? [webSearch] : [],
        output: { schema: AskAssistantOutputSchema },
    });
    
    if (!output) {
      return {
        openingStatement: "Apologies!",
        body: "I'm having a little trouble connecting right now. Please try again in a moment.",
      };
    }
    return output;
  }
);
