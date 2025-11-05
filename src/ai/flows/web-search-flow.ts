'use server';
/**
 * @fileOverview A Genkit flow that performs a direct web search using Tavily.
 *
 * - webSearch - A function that takes a query and returns structured search results.
 * - WebSearchInput - The input type for the webSearch function.
 * - WebSearchOutput - The return type for the webSearch function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { tavily } from '@tavily/core';

const tavilyClient = tavily({
    apiKey: process.env.TAVILY_API_KEY,
});

const WebSearchInputSchema = z.object({
  query: z.string().describe("The search query."),
});
export type WebSearchInput = z.infer<typeof WebSearchInputSchema>;

const WebSearchResultSchema = z.object({
    title: z.string(),
    url: z.string().url(),
    content: z.string(),
    score: z.number(),
});

const WebSearchOutputSchema = z.object({
  query: z.string(),
  results: z.array(WebSearchResultSchema),
});
export type WebSearchOutput = z.infer<typeof WebSearchOutputSchema>;

export async function webSearch(input: WebSearchInput): Promise<WebSearchOutput> {
  return webSearchFlow(input);
}

const webSearchFlow = ai.defineFlow(
  {
    name: 'webSearchFlow',
    inputSchema: WebSearchInputSchema,
    outputSchema: WebSearchOutputSchema,
  },
  async (input) => {
    try {
      const response = await tavilyClient.search(input.query, {
        searchDepth: "basic",
        maxResults: 5,
      });

      // Ensure the response matches the expected Zod schema
      const validatedOutput: WebSearchOutput = {
        query: input.query,
        results: response.results.map((res: any) => ({
          title: res.title || 'No Title',
          url: res.url || '',
          content: res.content || 'No content available.',
          score: res.score || 0,
        })),
      };

      return validatedOutput;
    } catch (error) {
      console.error("Tavily search failed:", error);
      // Return a structured error response that still fits the schema
      return {
        query: input.query,
        results: [
          {
            title: "Search Failed",
            url: "#",
            content: "Sorry, the web search service is currently unavailable. Please try again later.",
            score: 0,
          },
        ],
      };
    }
  }
);
