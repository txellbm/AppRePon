'use server';
/**
 * @fileOverview A Genkit flow to convert text to speech using the Gemini TTS model.
 * It returns raw PCM audio data as a data URI.
 *
 * - textToSpeech - A function that takes text and returns audio data.
 * - TextToSpeechInput - The input type for the function.
 * - TextToSpeechOutput - The return type for the function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'zod';

const TextToSpeechInputSchema = z.object({
  text: z.string().describe('The text to be converted to speech.'),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
  audioDataUri: z
    .string()
    .optional()
    .describe(
      "The generated audio as a data URI. Expected format: 'data:audio/pcm;base64,<encoded_data>'."
    ),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

export async function textToSpeech(
  input: TextToSpeechInput
): Promise<TextToSpeechOutput> {
  return textToSpeechFlow(input);
}

const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async ({text}) => {
    if (!text.trim()) {
      return { audioDataUri: undefined };
    }
    
    // This model returns raw PCM data, which needs to be handled by the client
    // using the Web Audio API. The sample rate is 24000.
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {voiceName: 'Algenib'},
          },
        },
      },
      prompt: text,
    });

    if (!media) {
      console.warn('TTS flow did not return any media.');
      return { audioDataUri: undefined };
    }
    
    // The raw data URI from Gemini is already in a suitable format (e.g., 'data:audio/pcm;base64,...')
    // We just pass it along.
    return {
      audioDataUri: media.url,
    };
  }
);
