'use server';

/**
 * @fileOverview This file defines a Genkit flow for manually overriding the category of an item.
 * It has been simplified to use a direct prompt instead of a tool to ensure deployment stability.
 *
 * - refineCategory - A function that handles the category refinement process.
 * - RefineCategoryInput - The input type for the refineCategory function.
 * - RefineCategoryOutput - The return type for the refineCategory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RefineCategoryInputSchema = z.object({
  itemName: z.string().describe('The name of the item to refine the category for.'),
  currentCategory: z.string().describe('The current category of the item.'),
  userOverrideCategory: z.string().describe('The category the user wants to assign to the item.'),
});
export type RefineCategoryInput = z.infer<typeof RefineCategoryInputSchema>;

const RefineCategoryOutputSchema = z.object({
  refinedCategory: z.string().describe('The refined category for the item.'),
});
export type RefineCategoryOutput = z.infer<typeof RefineCategoryOutputSchema>;

export async function refineCategory(input: RefineCategoryInput): Promise<RefineCategoryOutput> {
  return refineCategoryFlow(input);
}

const refineCategoryPrompt = ai.definePrompt({
  name: 'refineCategoryPrompt',
  input: {schema: RefineCategoryInputSchema},
  output: {schema: RefineCategoryOutputSchema},
  prompt: `Eres un asistente de categorización. El usuario quiere cambiar la categoría de un producto. Tu única tarea es aceptar la nueva categoría propuesta por el usuario.

Nombre del Producto: {{{itemName}}}
Categoría Actual: {{{currentCategory}}}
Categoría Deseada por el Usuario: {{{userOverrideCategory}}}

Devuelve únicamente un objeto JSON con la clave "refinedCategory" y el valor de la categoría deseada por el usuario ({{{userOverrideCategory}}}).`,
});

const refineCategoryFlow = ai.defineFlow(
  {
    name: 'refineCategoryFlow',
    inputSchema: RefineCategoryInputSchema,
    outputSchema: RefineCategoryOutputSchema,
  },
  async (input) => {
    // For now, we will just honor the user's override.
    // The prompt will guide the model to do this, but we add a fallback.
    try {
        const {output} = await refineCategoryPrompt(input);
        if (output?.refinedCategory) {
            return output;
        }
    } catch (error) {
        console.warn("AI for category refinement failed, using user override directly.", error);
    }
    
    // Fallback to simply returning what the user selected.
    return { refinedCategory: input.userOverrideCategory };
  }
);
