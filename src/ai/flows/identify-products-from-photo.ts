
/**
 * @fileOverview A Genkit flow to identify products from a photo.
 *
 * - identifyProductsFromPhoto - A function that takes an image and returns a list of product names.
 * - IdentifyProductsFromPhotoInput - The input type for the function.
 * - IdentifyProductsFromPhotoOutput - The return type for the function.
 */

import {generateVision} from '@/lib/gemini';
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
  const match = input.photoDataUri.match(/^data:(.+);base64,(.*)$/);
  if (!match) {
    return { products: [] };
  }
  const [, mimeType, data] = match;
  const parts = [
    { inlineData: { mimeType, data } },
    {
      text: `Eres un experto en identificar productos de supermercado a partir de imágenes. Analiza la foto proporcionada.

Identifica todos los productos de alimentación o de hogar visibles. Ignora objetos que no sean productos de supermercado.

Devuelve únicamente un objeto JSON con una clave "products" que contenga un array con los nombres de los productos identificados. Si no identificas ninguno, devuelve un array vacío.`,
    },
  ];

  const text = await generateVision(parts);
  try {
    return JSON.parse(text) as IdentifyProductsFromPhotoOutput;
  } catch {
    return { products: [] } as IdentifyProductsFromPhotoOutput;
  }
}
