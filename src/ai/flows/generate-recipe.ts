
/**
 * @fileOverview A Genkit flow to generate a recipe from a list of ingredients.
 *
 * - generateRecipe - A function that takes a list of products and returns a recipe.
 * - GenerateRecipeInput - The input type for the generateRecipe function.
 * - GenerateRecipeOutput - The return type for the generateRecipe function.
 */

import {generateText} from '@/lib/gemini';
import {z} from 'genkit';

const GenerateRecipeInputSchema = z.object({
  products: z.array(z.string()).describe('A list of available ingredients.'),
  previousRecipeTitles: z.array(z.string()).optional().describe('A list of previously generated recipe titles to avoid generating the same recipe again.'),
});
export type GenerateRecipeInput = z.infer<typeof GenerateRecipeInputSchema>;

const GenerateRecipeOutputSchema = z.object({
  title: z.string().describe('The creative and appealing title of the recipe.'),
  ingredients: z.array(z.string()).describe('A list of ingredients required for the recipe. Each string should include the ingredient name and its quantity in both metric units (grams, ml) and common household measures (e.g., "1 cucharada", "1/2 taza").'),
  instructions: z.array(z.string()).describe('Step-by-step instructions to prepare the dish.'),
  note: z.string().describe("A brief explanation of how the recipe contributes to the user's health goals."),
});
export type GenerateRecipeOutput = z.infer<typeof GenerateRecipeOutputSchema>;

export async function generateRecipe(input: GenerateRecipeInput): Promise<GenerateRecipeOutput> {
  const prompt = `Eres un nutricionista y chef experto en cocina saludable y estética corporal. Tu tarea es generar una receta de plato único y equilibrado para una persona, utilizando exclusivamente los ingredientes disponibles en la despensa del usuario.

**Condiciones de la receta:**
1.  **Estructura Harvard:** La receta debe seguir la estructura del Plato de Harvard: 50% verduras, 25% proteína saludable y 25% hidratos de carbono complejos.
2.  **Objetivos de Salud:** Debe ser una receta antiinflamatoria, drenante y anticelulítica, diseñada para favorecer la pérdida de grasa y el mantenimiento de la masa muscular.
3.  **Ingredientes Limpios:** No incluyas ingredientes ultraprocesados, fritos, harinas blancas ni salsas industriales. Asume que el usuario tiene básicos como agua, sal y pimienta.
4.  **Cantidades Precisas:** En la lista de 'ingredients', especifica las cantidades tanto en unidades métricas (gramos, ml) como en medidas caseras (cucharadas, tazas, etc.). Las cantidades deben estar calculadas con precisión para una ración.
5.  **Fácil y Rápida:** La preparación debe ser sencilla, ideal para alguien que cuida su alimentación.
6.  **Especias y Grasas Saludables:** Utiliza, si es posible, especias o aceites saludables presentes en la despensa (como cúrcuma, jengibre, canela, romero, aceite de oliva).
7.  **Formato de Salida:** Presenta el plato con un \`title\` (nombre), \`ingredients\` (lista de ingredientes) y \`instructions\` (pasos claros).

{{#if previousRecipeTitles}}
**Recetas a Evitar:** No sugieras recetas con los siguientes títulos: {{#each previousRecipeTitles}}"{{{this}}}"{{#unless @last}}, {{/unless}}{{/each}}. Sé creativo y ofrece una alternativa completamente diferente.
{{/if}}

**Nota Final:**
Al final, en el campo 'note', añade una nota explicando brevemente cómo esta receta contribuye a los objetivos del usuario (anticelulítico, drenante, mantenimiento muscular, etc.).

**Ingredientes Disponibles (NO USES NINGÚN OTRO):**
{{#each products}}
- {{{this}}}
{{/each}}

Recuerda, no inventes ingredientes que no estén en la lista. Usa solo lo que hay en la despensa.`;
  const text = await generateText(
    prompt
      .replace(/{{#each products}}\n- {{{this}}}\n{{\/each}}/, input.products.map(p => `- ${p}`).join('\n'))
      .replace(/{{#if previousRecipeTitles}}[^]*{{\/if}}/, input.previousRecipeTitles && input.previousRecipeTitles.length ? `Recetas a Evitar: ${input.previousRecipeTitles.join(', ')}` : '')
  );
  try {
    return JSON.parse(text) as GenerateRecipeOutput;
  } catch {
    return {
      title: 'Receta',
      ingredients: input.products,
      instructions: [text],
      note: ''
    } as GenerateRecipeOutput;
  }
}
