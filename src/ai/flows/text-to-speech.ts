
/**
 * @fileOverview A Genkit flow to convert text to speech using the Gemini TTS model.
 * It returns raw PCM audio data as a data URI.
 *
 * - textToSpeech - A function that takes text and returns audio data.
 * - TextToSpeechInput - The input type for the function.
 * - TextToSpeechOutput - The return type for the function.
 */
import {synthesizeSpeech} from '@/lib/gemini';
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
  if (!input.text.trim()) {
    return { audioDataUri: undefined };
  }

  const audioDataUri = await synthesizeSpeech(input.text);
  return { audioDataUri: audioDataUri || undefined };
}
