import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const plugins = [];
// Use the API key that is also used by Firebase for simplicity.
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (apiKey) {
  // Pass the key explicitly to the Google AI plugin
  plugins.push(googleAI({apiKey}));
}

export const ai = genkit({
  plugins,
  model: 'googleai/gemini-2.0-flash',
});
