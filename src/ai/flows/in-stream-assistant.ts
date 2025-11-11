
'use server';
/**
 * @fileOverview An AI stream assistant powered by Genkit and Gemini that can use Tavily for web search.
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
  useWebSearch: z.boolean().optional().describe('Whether to use the web search tool for the query. If true, the model should use the provided webSearch tool.'),
});
export type AskAssistantInput = z.infer<typeof AskAssistantInputSchema>;

const AskAssistantOutputSchema = z.object({
  openingStatement: z.string().describe("A brief, conversational opening that directly answers the user's question in one or two sentences."),
  body: z.string().describe("The main body of the response, providing key milestones or points as a Markdown bulleted list. Each point should be a single, concise sentence. Start a new bullet point after every full stop. This should be followed by a concluding summary sentence."),
  sources: z.array(z.object({
      title: z.string().describe("The title of the source article."),
      url: z.string().describe("The URL of the source article."),
      image: z.string().optional().describe("The meta image URL of the source article, if available.")
  })).optional().describe("An array of web sources used to generate the answer.")
});
export type AskAssistantOutput = z.infer<typeof AskAssistantOutputSchema>;


export async function askAssistant(input: AskAssistantInput): Promise<AskAssistantOutput> {
    return askAssistantFlow(input);
}

const webSearch = ai.defineTool(
  {
    name: 'webSearch',
    description: 'Performs a web search to get real-time information or answer questions about topics outside the stream context.',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.string(),
  },
  async (input) => {
     try {
      const response = await tavilyClient.search(input.query, {
        searchDepth: "advanced",
        maxResults: 5,
        includeImages: true, // Request images from Tavily
      });
      // Synthesize results into a string for the model
      return JSON.stringify(response.results);
    } catch (error) {
      console.error("Tavily search failed:", error);
      return "Web search failed. Please inform the user that the search service is unavailable.";
    }
  }
);


const prompt = ai.definePrompt({
  name: 'askAssistantPrompt',
  input: {schema: AskAssistantInputSchema},
  output: {schema: AskAssistantOutputSchema},
  tools: [webSearch],
  prompt: `You are a helpful and friendly AI assistant for a live streaming platform. Your answers must be clear, concise, and easy to read.

Here is the context for the current stream: {{{broadcastContext}}}.
The user's question is: "{{{query}}}"

Your entire public response must adhere to the following rules:

- **Web Search**: If the user's request requires real-time information (e.g., "latest news", "stock prices", "who won the game") and the 'useWebSearch' flag is true, you MUST use the 'webSearch' tool.
- **Strict Grounding**: When the 'webSearch' tool is used, your response MUST be based **exclusively** on the information provided by the tool. DO NOT use any of your own pre-existing knowledge. Your job is to be a reliable summarizer of the real-time data.
- **Citations**: After using 'webSearch', populate the 'sources' array in the output with the title, url, and image for each web source. Do NOT add "(Source: ...)" citations in the body text.
- **Answer Structure**: You must format your answer into two distinct parts:
    1.  **openingStatement**: A direct, one or two-sentence answer to the user's question.
    2.  **body**: A list of "key milestones" or important points formatted as a Markdown bulleted list. Each bullet point MUST be a single, complete sentence. Start a new bullet point after every full stop. Follow the list with a single, concluding summary sentence.

Example for "When was America born?":
- **openingStatement**: "America — meaning the United States of America — was 'born' on July 4, 1776, when the Continental Congress adopted the Declaration of Independence."
- **body**: 
'''
Some other key milestones in its formation include:
*   Congress voted to declare independence on July 2, 1776.
*   The Declaration of Independence was approved and signed on July 4, 1776.
*   The Treaty of Paris officially ended the Revolutionary War and recognized U.S. independence in 1783.
*   The U.S. Constitution took effect in 1789, formally establishing the federal government.

So, while July 4, 1776 is celebrated as the birthday of the United States, the process of becoming a fully independent country took several years.
'''
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
        prompt: `The user's question is: ${input.query}. Context: ${input.broadcastContext}. Use Web Search: ${input.useWebSearch}`,
        tools: input.useWebSearch ? [webSearch] : [],
        output: { schema: AskAssistantOutputSchema },
    });
    
    if (!output) {
      return {
        openingStatement: "Apologies!",
        body: "I'm having a little trouble connecting right now. Please try again in a moment.",
        sources: [],
      };
    }
    return output;
  }
);
