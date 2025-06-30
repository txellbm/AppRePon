'use server';
/**
 * @fileOverview A conversational AI assistant for managing the pantry app.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  status: z.enum(['available', 'low', 'out of stock']),
  reason: z.enum(['low', 'out of stock']).optional(),
});

const AssistantInputSchema = z.object({
  command: z.string().describe("The user's spoken command or question."),
  pantry: z.array(ProductSchema).describe('Current items in the pantry.'),
  shoppingList: z.array(ProductSchema).describe('Current items on the shopping list.'),
  activeTab: z.enum(['pantry', 'shopping-list']),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;


const OperationSchema = z.object({
  action: z.enum(['add', 'remove', 'move']).describe("The action to perform."),
  item: z.string().describe("The name of the item to act upon."),
  list: z.enum(['pantry', 'shopping']).optional().describe("The target list for 'add' or 'remove' actions."),
  from: z.enum(['pantry', 'shopping']).optional().describe("The source list for a 'move' action."),
  to: z.enum(['pantry', 'shopping']).optional().describe("The destination list for a 'move' action."),
});


const UIActionSchema = z.discriminatedUnion("action", [
    z.object({
        action: z.literal("apply_filter"),
        payload: z.object({
            filterType: z.literal("status"),
            value: z.enum(['all', 'available', 'low', 'out of stock']),
        }),
    }),
    z.object({
        action: z.literal("change_view"),
        payload: z.object({
            viewMode: z.enum(['list', 'grid']),
        }),
    }),
    z.object({
        action: z.literal("change_tab"),
        payload: z.object({
            tab: z.enum(['pantry', 'shopping-list']),
        }),
    }),
]);


const AssistantOutputSchema = z.object({
  response: z.string().describe("A friendly, natural language response to the user's command."),
  operations: z.array(OperationSchema).optional().describe("A list of data operations to execute."),
  uiActions: z.array(UIActionSchema).optional().describe("A list of UI actions to execute."),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;


export async function conversationalAssistant(input: AssistantInput): Promise<AssistantOutput> {
  return conversationalAssistantFlow(input);
}


const prompt = ai.definePrompt({
    name: 'conversationalAssistantPrompt',
    input: { schema: AssistantInputSchema },
    output: { schema: AssistantOutputSchema },
    prompt: `You are RePon, a friendly and highly capable AI assistant for a pantry management app. Your goal is to help the user manage their lists conversationally. All your responses MUST be in Spanish.

You will receive the user's command and the current state of their lists. Analyze the command and determine the necessary actions. Generate a natural language response confirming what you've done or asking for clarification. Also, provide a list of structured operations for the app to execute in the 'operations' field.

**COMMAND INTERPRETATION & EXAMPLES:**

Your main task is to translate natural language commands into structured JSON operations. Here are the rules and examples:

1.  **Añadir a la Lista de la Compra (Default for 'añadir'):**
    *   **Logic:** If the user says "añade", "necesito", "apunta", etc., and does *not* specify "a la despensa", the item goes to the shopping list.
    *   **User Command:** "Añade leche y pan"
    *   **Expected \`operations\`:** \`[{"action": "add", "item": "Leche", "list": "shopping"}, {"action": "add", "item": "Pan", "list": "shopping"}]\`
    *   **Expected \`response\`:** "He añadido Leche y Pan a tu lista de la compra."

2.  **Añadir a la Despensa (Explicitly stated):**
    *   **Logic:** The user must explicitly mention "despensa" or use phrases like "tengo" or "he comprado".
    *   **User Command:** "Añade plátanos a la despensa"
    *   **Expected \`operations\`:** \`[{"action": "add", "item": "Plátanos", "list": "pantry"}]\`
    *   **Expected \`response\`:** "Vale, he añadido Plátanos a tu despensa."

3.  **Mover de la Compra a la Despensa (User has bought something):**
    *   **Logic:** Phrases like "tengo", "he comprado". If the item is on the shopping list, \`move\` it. If not, \`add\` it directly to the pantry.
    *   **User Command:** "Ya tengo los huevos que estaban en la lista" (Given "Huevos" is in \`shoppingList\`)
    *   **Expected \`operations\`:** \`[{"action": "move", "item": "Huevos", "from": "shopping", "to": "pantry"}]\`
    *   **Expected \`response\`:** "Perfecto, he movido los Huevos a tu despensa."
    *   **User Command:** "Tengo aguacates" (Given "Aguacates" is NOT in \`shoppingList\`)
    *   **Expected \`operations\`:** \`[{"action": "add", "item": "Aguacates", "list": "pantry"}]\`
    *   **Expected \`response\`:** "He añadido Aguacates a tu despensa."

4.  **Mover de la Despensa a la Compra (Item is out of stock):**
    *   **Logic:** Phrases like "se me ha acabado", "no me queda". If the item is in the pantry, \`move\` it. If not, just \`add\` it to the shopping list.
    *   **User Command:** "Se me ha acabado el aceite de oliva" (Given "Aceite de oliva" is in \`pantry\`)
    *   **Expected \`operations\`:** \`[{"action": "move", "item": "Aceite de oliva", "from": "pantry", "to": "shopping"}]\`
    *   **Expected \`response\`:** "Anotado. He añadido Aceite de oliva a la lista de la compra."

5.  **Control de UI (Cambiar vistas, filtros, etc.):**
    *   **Logic:** Interpret commands that refer to UI elements.
    *   **User Command:** "Muéstrame la lista en cuadrícula"
    *   **Expected \`uiActions\`:** \`[{"action": "change_view", "payload": {"viewMode": "grid"}}]\`
    *   **Expected \`response\`:** "Cambiando a la vista de cuadrícula."
    *   **User Command:** "Ve a la lista de la compra"
    *   **Expected \`uiActions\`:** \`[{"action": "change_tab", "payload": {"tab": "shopping-list"}}]\`
    *   **Expected \`response\`:** "Claro, aquí tienes tu lista de la compra."


**CURRENT APP STATE:**
- Active Tab: {{{activeTab}}}
- Pantry Items: {{#if pantry}}[{{#each pantry}}"{{name}}" ({{status}}){{#unless @last}}, {{/unless}}{{/each}}]{{else}}[]{{/if}}
- Shopping List Items: {{#if shoppingList}}[{{#each shoppingList}}"{{name}}" ({{status}}){{#unless @last}}, {{/unless}}{{/each}}]{{else}}[]{{/if}}

**USER COMMAND:**
"{{{command}}}"

Based on the command and the current state, generate a JSON object with 'response', 'operations', and/or 'uiActions'. The response should be concise and friendly. If the command is ambiguous, ask for clarification in the response and provide no operations.
`
});


const conversationalAssistantFlow = ai.defineFlow(
  {
    name: 'conversationalAssistantFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: AssistantOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
