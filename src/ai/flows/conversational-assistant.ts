
/**
 * @fileOverview A conversational AI assistant for managing the pantry app.
 */

import {generateText} from '@/lib/gemini';
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
  const prompt = `You are RePon, a friendly and highly capable AI assistant for a pantry management app. Your goal is to help the user manage their lists conversationally. All your responses MUST be in Spanish.

You will receive the user's command and the current state of their lists. Analyze the command and determine the necessary actions. Generate a natural language response confirming what you've done or asking for clarification. Also, provide a list of structured operations for the app to execute in the 'operations' field.

**COMMAND INTERPRETATION & EXAMPLES:**
1. Añadir a la Lista de la Compra (Default for 'añadir').
2. Añadir a la Despensa cuando se indique explícitamente.
3. Mover de la Compra a la Despensa si el usuario ya tiene el producto.
4. Mover de la Despensa a la Compra cuando se acabe un producto.
5. Control de UI para cambiar vistas o filtros.

**CURRENT APP STATE:**
- Active Tab: ${input.activeTab}
- Pantry Items: [${input.pantry.map(p => `"${p.name}" (${p.status})`).join(', ')}]
- Shopping List Items: [${input.shoppingList.map(p => `"${p.name}" (${p.status})`).join(', ')}]

**USER COMMAND:**
"${input.command}"

Based on the command and the current state, generate a JSON object with 'response', 'operations', and/or 'uiActions'. The response should be concise and friendly. If the command is ambiguous, ask for clarification in the response and provide no operations.`;

  const text = await generateText(prompt);
  try {
    return JSON.parse(text) as AssistantOutput;
  } catch {
    return { response: text } as AssistantOutput;
  }
}
