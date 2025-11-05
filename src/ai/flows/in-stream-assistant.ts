
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
  openingStatement: z.string().describe("A brief, conversational opening that acknowledges the user's question before providing the main answer."),
  body: z.string().describe("The main body of the response. Use simple markdown for formatting (e.g., **bold**, *italics*, bullet points). If web search was used, cite sources at the end like (Source 1, Source 2)."),
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
  prompt: `You are a helpful and friendly AI assistant integrated into a live streaming platform called AgoraLive. Your goal is to answer viewer questions.

Your entire public response must adhere to the following rules.

- **Driven Opener:** Your response MUST begin with a charismatic, engaging opener.
- **Structure and Clarity:** Use Markdown for structure. Headings, bold text, and lists are essential for readability.
- **Bulleted Sentences:** For detailed explanations, transform long paragraphs into a list of bullet points. Each bullet point should be a complete sentence.
- **Tables for Tabular Data:** When presenting data in rows and columns, you MUST use Markdown table syntax.
- **Visual Separators:** Use a Markdown horizontal rule ("---") to visually separate distinct topics or sections within your answer.
- **Concluding Thought & Engagement:** End your answer with a concluding thought that summarizes the key takeaway. Follow this with one or two engaging follow-up questions to encourage further interaction.
- **Web Search**: If the user's request requires real-time information (e.g., "latest news", "stock prices", "who won the game") and the 'useWebSearch' flag is true, you MUST use the 'webSearch' tool. After getting the results, synthesize them into a clear, structured answer and cite your sources at the end, like this: (Source: CNN, Reuters).

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
        prompt: `The user's question is: ${input.query}. Context: ${input.broadcastContext}. Use Web Search: ${input.useWebSearch}`,
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
