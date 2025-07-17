
/**
 * @fileOverview A Genkit flow to correct spelling and capitalization of a product name.
 *
 * - correctProductName - A function that takes a product name and returns the corrected version.
 * - CorrectProductNameInput - The input type for the correctProductName function.
 * - CorrectProductNameOutput - The return type for the correctProductName function.
 */

import {generateText} from '@/lib/gemini';
import {z} from 'genkit';

const CorrectProductNameInputSchema = z.object({
  productName: z.string().describe('The product name to be corrected.'),
});
export type CorrectProductNameInput = z.infer<typeof CorrectProductNameInputSchema>;

const CorrectProductNameOutputSchema = z.object({
  correctedName: z.string().describe('The corrected product name with proper spelling and capitalization.'),
});
export type CorrectProductNameOutput = z.infer<typeof CorrectProductNameOutputSchema>;

export async function correctProductName(input: CorrectProductNameInput): Promise<CorrectProductNameOutput> {
  const prompt = `Eres un asistente de edición. Tu tarea es corregir errores ortográficos y gramaticales en el nombre de un producto y asegurarte de que la primera letra del nombre esté en mayúscula, el resto en minúscula a menos que sea un nombre propio.

Nombre del producto a corregir: ${input.productName}

Devuelve únicamente un objeto JSON con la clave "correctedName" y el valor del nombre del producto corregido. No añadas explicaciones ni texto adicional.`;

  const text = await generateText(prompt);
  try {
    return JSON.parse(text) as CorrectProductNameOutput;
  } catch {
    return { correctedName: input.productName } as CorrectProductNameOutput;
  }
}
