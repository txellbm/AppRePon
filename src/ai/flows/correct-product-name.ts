'use server';
/**
 * @fileOverview A Genkit flow to correct spelling and capitalization of a product name.
 *
 * - correctProductName - A function that takes a product name and returns the corrected version.
 * - CorrectProductNameInput - The input type for the correctProductName function.
 * - CorrectProductNameOutput - The return type for the correctProductName function.
 */

import {ai} from '@/ai/genkit';
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
  return correctProductNameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'correctProductNamePrompt',
  input: {schema: CorrectProductNameInputSchema},
  output: {schema: CorrectProductNameOutputSchema},
  prompt: `Eres un asistente de edición. Tu tarea es corregir errores ortográficos y gramaticales en el nombre de un producto y asegurarte de que la primera letra del nombre esté en mayúscula. El resto debe estar en minúscula, a menos que sea un nombre propio.

Ejemplos:
- "lece" -> "Leche"
- "pan de MOLDE" -> "Pan de molde"
- "qeso fresco" -> "Queso fresco"
- "AGUA CON GAS" -> "Agua con gas"
- "curcuma" -> "Cúrcuma"

Nombre del producto a corregir: {{{productName}}}

Devuelve únicamente un objeto JSON con la clave "correctedName" y el valor del nombre del producto corregido. No añadas explicaciones ni texto adicional.`,
});

const correctProductNameFlow = ai.defineFlow(
  {
    name: 'correctProductNameFlow',
    inputSchema: CorrectProductNameInputSchema,
    outputSchema: CorrectProductNameOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
