import {genkit} from 'genkit';
// import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [/* googleAI() */], // Temporarily disabled to resolve build issues
  // model: 'googleai/gemini-2.5-flash',
});
