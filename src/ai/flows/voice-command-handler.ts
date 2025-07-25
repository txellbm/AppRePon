'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VoiceCommandInputSchema = z.object({
  command: z.string().describe("El comando de voz a procesar."),
  pantryList: z.array(z.string()).describe('La lista actual de productos en la despensa.'),
  shoppingList: z.array(z.string()).describe('La lista actual de productos de la compra.'),
});
export type VoiceCommandInput = z.infer<typeof VoiceCommandInputSchema>;

const OperationSchema = z.object({
  action: z.enum(['add', 'remove', 'move']).describe("La acción a realizar: 'add' (añadir), 'remove' (eliminar), o 'move' (mover) un producto."),
  item: z.string().describe("El nombre del producto afectado."),
  list: z.enum(['pantry', 'shopping']).optional().describe("La lista de destino para acciones 'add' o 'remove' ('pantry' o 'shopping')."),
  from: z.enum(['pantry', 'shopping']).optional().describe("La lista de origen para una acción 'move'."),
  to: z.enum(['pantry', 'shopping']).optional().describe("La lista de destino para una acción 'move'."),
});

const VoiceCommandOutputSchema = z.object({
  operations: z.array(OperationSchema).describe("Una lista de operaciones para modificar las listas de despensa y de la compra."),
  response: z.string().describe('Una respuesta de confirmación para el usuario.'),
});
export type VoiceCommandOutput = z.infer<typeof VoiceCommandOutputSchema>;

export async function handleVoiceCommand(input: VoiceCommandInput): Promise<VoiceCommandOutput> {
  return handleVoiceCommandFlow(input);
}

const prompt = ai.definePrompt({
  name: 'voiceCommandHandlerPrompt',
  input: {
    schema: VoiceCommandInputSchema,
  },
  output: {
    schema: VoiceCommandOutputSchema,
  },
  prompt: `Eres un asistente experto en gestionar una despensa y una lista de la compra. El usuario se comunica en español. Todas tus respuestas deben estar en español.

El usuario dará un comando de voz para modificar sus listas. Tienes dos listas: la despensa (productos que ya tiene) y la lista de la compra (productos que necesita comprar).

Analiza el comando y devuelve una lista de operaciones a realizar.

Reglas de Operaciones:
- Para añadir un nuevo producto: { "action": "add", "item": "nombre del producto", "list": "pantry" o "shopping" }
- Para eliminar un producto: { "action": "remove", "item": "nombre del producto", "list": "pantry" o "shopping" }
- Para mover un producto entre listas: { "action": "move", "item": "nombre del producto", "from": "pantry" o "shopping", "to": "pantry" o "shopping" }

Lógica:
- "añade leche", "necesito pan": add a la shopping list.
- "no quedan huevos": move de pantry a shopping. Si no está en pantry, add a shopping.
- "tengo leche", "he comprado pan": move de shopping a pantry. Si no está en shopping, add a pantry.
- "quita la leche": remove de la lista donde se encuentre. Si está en ambas, prioriza eliminar de shopping.
- Si el comando no es claro, devuelve una lista de operaciones vacía y un respuesta pidiendo aclaración.

Estado Actual:
Despensa: [{{#each pantryList}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}]
Lista de la compra: [{{#each shoppingList}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}]

Comando del usuario: "{{{command}}}"

Devuelve un objeto JSON con el campo operations (la lista de operaciones) y response (un breve mensaje de confirmación).`,
});

const handleVoiceCommandFlow = ai.defineFlow(
  {
    name: 'handleVoiceCommandFlow',
    inputSchema: VoiceCommandInputSchema,
    outputSchema: VoiceCommandOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
