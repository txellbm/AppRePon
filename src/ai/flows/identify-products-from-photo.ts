'use server';
/**
 * @fileOverview A Genkit flow to identify products from a photo.
 *
 * - identifyProductsFromPhoto - A function that takes an image and returns a list of product names.
 * - IdentifyProductsFromPhotoInput - The input type for the function.
 * - IdentifyProductsFromPhotoOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const IdentifyProductsFromPhotoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of grocery products, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type IdentifyProductsFromPhotoInput = z.infer<typeof IdentifyProductsFromPhotoInputSchema>;

const IdentifyProductsFromPhotoOutputSchema = z.object({
  products: z.array(z.string()).describe('An array of identified product names.'),
});
export type IdentifyProductsFromPhotoOutput = z.infer<typeof IdentifyProductsFromPhotoOutputSchema>;

export async function identifyProductsFromPhoto(
  input: IdentifyProductsFromPhotoInput
): Promise<IdentifyProductsFromPhotoOutput> {
  return identifyProductsFromPhotoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyProductsFromPhotoPrompt',
  input: {schema: IdentifyProductsFromPhotoInputSchema},
  output: {schema: IdentifyProductsFromPhotoOutputSchema},
  prompt: `Eres un experto en identificar productos de supermercado a partir de imágenes. Analiza la foto proporcionada.

**Instrucciones clave:**
1. Identifica el tipo de producto, no la marca comercial (salvo en casos populares).
2. Genera nombres genéricos y descriptivos, por ejemplo:
   - "vinagre de Módena"
   - "galletas tipo María"
   - "detergente para lavadora"
   - "leche vegetal"
3. Evita incluir marcas como "Borges", "Hacendado", "Colhogar", etc., salvo que la marca sea parte del nombre con el que el producto se identifica popularmente (por ejemplo: "galletas Oreo", "ColaCao", "Nesquik", "Actimel").
4. El objetivo es que la app RePon pueda gestionar productos de forma flexible, sin importar la marca concreta que se compre en cada ocasión.

Identifica todos los productos de alimentación o de hogar visibles. Ignora objetos que no sean productos de supermercado.

Devuelve únicamente un objeto JSON con una clave "products" que contenga un array con los nombres de los productos identificados. Si no identificas ninguno, devuelve un array vacío.

Imagen de los productos: {{media url=photoDataUri}}`,
});

const identifyProductsFromPhotoFlow = ai.defineFlow(
  {
    name: 'identifyProductsFromPhotoFlow',
    inputSchema: IdentifyProductsFromPhotoInputSchema,
    outputSchema: IdentifyProductsFromPhotoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
