
/**
 * @fileOverview A Genkit flow to generate grammatically correct notification messages.
 *
 * - generateGrammaticalMessage - A function that takes a product name and message type and returns a correct sentence.
 */

import {generateText} from '@/lib/gemini';
import {z} from 'genkit';
import type { GenerateGrammaticalMessageInput, GenerateGrammaticalMessageOutput } from '@/lib/types';

const MessageTypeEnum = z.enum([
  'low_stock',
  'out_of_stock',
  'moved_to_shopping_list',
  'added_to_pantry',
  'available',
  'out_of_stock_and_moved',
  'added_to_shopping_list'
]);

const GenerateGrammaticalMessageInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  messageType: MessageTypeEnum.describe('The type of notification message to generate.'),
});

const GenerateGrammaticalMessageOutputSchema = z.object({
  message: z.string().describe('The grammatically correct notification message.'),
});

export async function generateGrammaticalMessage(input: GenerateGrammaticalMessageInput): Promise<GenerateGrammaticalMessageOutput> {
  const prompt = `Eres un asistente experto en gramática española. Tu tarea es generar una frase corta y natural para una notificación en una aplicación de gestión de despensa. Tu principal objetivo es que la frase tenga la concordancia de género (masculino/femenino) y número (singular/plural) PERFECTA con el producto.

**PROCESO OBLIGATORIO:**
1.  Identifica el género y número del producto: "{{{productName}}}".
2.  Selecciona la estructura de frase correcta según el \`messageType\`.
3.  Ajusta los artículos (el, la, los, las) y los adjetivos (poco, poca, pocos, pocas) para que concuerden EXACTAMENTE con el producto.

**PRODUCTO:** {{{productName}}}
**TIPO DE MENSAJE:** {{{messageType}}}

**ESTRUCTURAS DE FRASES (DEBES ADAPTARLAS):**

*   **low_stock**: "Queda poco/a [producto]." o "Quedan pocos/as [producto]."
    *   Ejemplo para "Leche": "Queda poca leche."
    *   Ejemplo para "Pan": "Queda poco pan."
    *   Ejemplo para "Peras": "Quedan pocas peras."
    *   Ejemplo para "Huevos": "Quedan pocos huevos."

*   **out_of_stock**: "El/La/Los/Las [producto] se ha/han acabado."
    *   Ejemplo para "Leche": "La leche se ha acabado."
    *   Ejemplo para "Pan": "El pan se ha acabado."
    *   Ejemplo para "Peras": "Las peras se han acabado."

*   **out_of_stock_and_moved**: "[Artículo] [producto] se ha/han acabado y se ha/han añadido a la lista de la compra."
    *   Ejemplo para "Leche": "La leche se ha acabado y se ha añadido a la lista de la compra."
    *   Ejemplo para "Pan": "El pan se ha acabado y se ha añadido a la lista de la compra."

*   **moved_to_shopping_list**: "[Artículo] [producto] se ha/han movido a la lista de la compra."
    *   Ejemplo para "Leche": "La leche se ha movido a la lista de la compra."

*   **added_to_shopping_list**: "[Artículo] [producto] se ha/han añadido a la lista de la compra."
    *   Ejemplo para "Leche": "La leche se ha añadido a la lista de la compra."

*   **added_to_pantry**: "[Artículo] [producto] se ha/han añadido a la despensa."
    *   Ejemplo para "Leche": "La leche se ha añadido a la despensa."

*   **available**: "[Artículo] [producto] ahora está/n disponible/s."
    *   Ejemplo para "Leche": "La leche ahora está disponible."

**RESPUESTA:**
Responde únicamente con un objeto JSON que contenga la clave "message" y el valor de la frase generada. No añadas explicaciones ni texto adicional.`;
  const text = await generateText(
    prompt
      .replace(/{{{productName}}}/g, input.productName)
      .replace(/{{{messageType}}}/g, input.messageType)
  );
  try {
    return JSON.parse(text) as GenerateGrammaticalMessageOutput;
  } catch {
    return { message: text } as GenerateGrammaticalMessageOutput;
  }
}
