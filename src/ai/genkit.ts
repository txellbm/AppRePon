import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import type {GenkitOptions} from 'genkit';

const apiKey = process.env.GOOGLE_API_KEY;

// Base config object.
const config: GenkitOptions = {
  plugins: [],
};

// Only configure the googleAI plugin and set a default model if the API key is available.
// This prevents the server from crashing if the key is not set.
if (apiKey) {
  config.plugins?.push(googleAI({ apiKey }));
  config.model = 'googleai/gemini-1.5-flash-latest';
} else {
  console.warn(
    'GOOGLE_API_KEY no está definida. Las funciones de IA estarán deshabilitadas.'
  );
}

export const ai = genkit(config);
