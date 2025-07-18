'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRecipeInputSchema = z.object({
  products: z.array(z.string()).describe('A list of available ingredients.'),
  previousRecipeTitles: z.array(z.string()).optional().describe('A list of previously generated recipe titles to avoid generating the same recipe again.'),
});
export type GenerateRecipeInput = z.infer<typeof GenerateRecipeInputSchema>;

const GenerateRecipeOutputSchema = z.object({
  title: z.string(),
  ingredients: z.array(z.string()),
  instructions: z.array(z.string()),
  note: z.string(),
});
export type GenerateRecipeOutput = z.infer<typeof GenerateRecipeOutputSchema>;

export async function generateRecipe(input: GenerateRecipeInput): Promise<GenerateRecipeOutput> {
  return generateRecipeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRecipePrompt',
  input: {schema: GenerateRecipeInputSchema},
  output: {schema: GenerateRecipeOutputSchema},
  prompt: `Eres un nutricionista y chef experto en cocina saludable y estética corporal. Tu tarea es generar una receta de plato único y equilibrado para una persona, utilizando exclusivamente los ingredientes disponibles en la despensa del usuario.

**Condiciones de la receta:**
1.  **Estructura Harvard:** La receta debe seguir la estructura del Plato de Harvard: 50% verduras, 25% proteína saludable y 25% hidratos de carbono complejos.
2.  **Objetivos de Salud:** Debe ser una receta antiinflamatoria, drenante y anticelulítica, diseñada para favorecer la pérdida de grasa y el mantenimiento de la masa muscular.
3.  **Ingredientes Limpios:** No incluyas ingredientes ultraprocesados, fritos, harinas blancas ni salsas industriales. Asume que el usuario tiene básicos como agua, sal y pimienta.
4.  **Cantidades Precisas:** En la lista de 'ingredients', especifica las cantidades tanto en unidades métricas (gramos, ml) como en medidas caseras (cucharadas, tazas, etc.). Las cantidades deben estar calculadas con precisión para una ración.
5.  **Fácil y Rápida:** La preparación debe ser sencilla, ideal para alguien que cuida su alimentación.
6.  **Especias y Grasas Saludables:** Utiliza, si es posible, especias o aceites saludables presentes en la despensa (como cúrcuma, jengibre, canela, romero, aceite de oliva).
7.  **Formato de Salida:** Presenta el plato con un `title` (nombre), `ingredients` (lista de ingredientes) y `instructions`

{{#if previousRecipeTitles}}
**Recetas a Evitar:** No sugieras recetas con los siguientes títulos: {{#each previousRecipeTitles}}"{{{this}}}"{{#unless @last}}, {{/unless}}{{/each}}. Sé creativo y ofrece una alternativa completamente diferente.
{{/if}}

**Nota Final:**
Al final, en el campo 'note', añade una nota explicando brevemente cómo esta receta contribuye a los objetivos del usuario (anticelulítico, drenante, mantenimiento muscular, etc.).

**Ingredientes Disponibles (NO USES NINGÚN OTRO):**
{{#each products}}
- {{{this}}}
{{/each}}

Recuerda, no inventes ingredientes que no estén en la lista. Usa solo lo que hay en la despensa.`,
});

const generateRecipeFlow = ai.defineFlow(
  {
    name: 'generateRecipeFlow',
    inputSchema: GenerateRecipeInputSchema,
    outputSchema: GenerateRecipeOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
