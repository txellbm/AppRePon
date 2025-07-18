

import {
  categorizeProduct as categorizeProductFlow,
  type CategorizeProductInput,
  type CategorizeProductOutput,
} from "@/ai/flows/categorize-product";
import {
  refineCategory as refineCategoryFlow,
  type RefineCategoryInput,
  type RefineCategoryOutput,
} from "@/ai/flows/refine-category";
import {
  improveCategorization as improveCategorizationFlow,
  type ImproveCategorizationInput,
  type ImproveCategorizationOutput,
} from "@/ai/flows/improve-categorization";
import {
  handleVoiceCommand as handleVoiceCommandFlow,
  type VoiceCommandInput,
  type VoiceCommandOutput,
} from "@/ai/flows/voice-command-handler";
import {
  correctProductName as correctProductNameFlow,
  type CorrectProductNameInput,
  type CorrectProductNameOutput,
} from "@/ai/flows/correct-product-name";
import { COMMON_PRODUCTS } from "@/data/common-products";
import { levenshtein } from "@/lib/levenshtein";
import {
  identifyProductsFromPhoto as identifyProductsFromPhotoFlow,
  type IdentifyProductsFromPhotoInput,
  type IdentifyProductsFromPhotoOutput,
} from '@/ai/flows/identify-products-from-photo';
import {
  textToSpeech as textToSpeechFlow,
  type TextToSpeechInput,
  type TextToSpeechOutput,
} from "@/ai/flows/text-to-speech";

import { generateGrammaticalMessage as generateGrammaticalMessageFlow } from '@/ai/flows/generate-grammatical-message';
import type { GenerateGrammaticalMessageInput, GenerateGrammaticalMessageOutput } from '@/lib/types';
import {
  generateRecipe as generateRecipeFlow,
  type GenerateRecipeInput,
  type GenerateRecipeOutput,
} from '@/ai/flows/generate-recipe';
import {
  conversationalAssistant as conversationalAssistantFlow,
  type AssistantInput,
  type AssistantOutput,
} from '@/ai/flows/conversational-assistant';

// Helper function to run AI flows with a fallback mechanism
async function runWithAIFallback<T, U>(
  fn: (input: T) => Promise<U>,
  input: T,
  fallback: U,
  actionName: string
): Promise<U> {
  try {
    // In a real app, you might check for an API key here before even trying.
    // if (!process.env.GOOGLE_API_KEY) throw new Error("AI features disabled.");
    return await fn(input);
  } catch (error) {
    console.error(
      `La acción de IA '${actionName}' ha fallado. Usando el valor de respaldo. Error:`,
      error
    );
    return fallback;
  }
}

export async function categorizeProduct(
  input: CategorizeProductInput
): Promise<CategorizeProductOutput> {
  try {
    const result = await categorizeProductFlow(input);
    const validCategories = [
      "Frutas y Verduras",
      "Lácteos y Huevos",
      "Proteínas",
      "Panadería y Cereales",
      "Aperitivos",
      "Bebidas",
      "Hogar y Limpieza",
      "Condimentos y Especias",
      "Conservas y Despensa",
      "Otros"
    ];
    if (!result || !result.category) {
      console.error('[CATEGORIZACIÓN] La IA no devolvió ninguna categoría para', input.productName, '->', result);
      console.warn('[CATEGORIZACIÓN] Usando fallback: "Otros"');
      return { category: 'Otros' };
    }
    if (!validCategories.includes(result.category)) {
      console.error('[CATEGORIZACIÓN] La IA devolvió una categoría no válida para', input.productName, ':', result.category);
      console.warn('[CATEGORIZACIÓN] Usando fallback: "Otros"');
      return { category: 'Otros' };
    }
    // Log de éxito
    console.log('[CATEGORIZACIÓN] Categoría IA para', input.productName, ':', result.category);
    return result;
  } catch (error) {
    console.error('[CATEGORIZACIÓN] Error al llamar a la IA para', input.productName, ':', error);
    console.warn('[CATEGORIZACIÓN] Usando fallback: "Otros"');
    return { category: 'Otros' };
  }
}

export async function refineCategory(
  input: RefineCategoryInput
): Promise<RefineCategoryOutput> {
  const fallback = { refinedCategory: input.userOverrideCategory };
  return runWithAIFallback(refineCategoryFlow, input, fallback, 'refineCategory');
}

export async function improveCategorization(
  input: ImproveCategorizationInput
): Promise<ImproveCategorizationOutput> {
  const fallback = { success: true, message: '' };
  return runWithAIFallback(improveCategorizationFlow, input, fallback, 'improveCategorization');
}

export async function handleVoiceCommand(
  input: VoiceCommandInput
): Promise<VoiceCommandOutput> {
  const fallback = {
    operations: [],
    response: 'No he podido procesar el comando de voz en este momento.',
  };
  return runWithAIFallback(handleVoiceCommandFlow, input, fallback, 'handleVoiceCommand');
}

export async function correctProductName(
  input: CorrectProductNameInput
): Promise<CorrectProductNameOutput> {
  const normalizedInput = input.productName.trim().toLowerCase();
  // Comprobar si el nombre ya existe en la lista de productos comunes
  const exactMatch = COMMON_PRODUCTS.find(
    (candidate) => candidate.toLowerCase() === normalizedInput
  );
  let correctedName: string;
  if (exactMatch) {
    // Si existe, solo capitalizar correctamente
    correctedName =
      exactMatch.charAt(0).toUpperCase() + exactMatch.slice(1).toLowerCase();
    return { correctedName };
  }

  // Si no existe, buscar el mejor match por Levenshtein
  const bestMatch = COMMON_PRODUCTS.reduce<{ name: string; dist: number }>(
    (acc, candidate) => {
      const d = levenshtein(candidate.toLowerCase(), normalizedInput);
      return d < acc.dist ? { name: candidate, dist: d } : acc;
    },
    { name: input.productName, dist: Infinity }
  );

  if (bestMatch.dist <= 2) {
    correctedName = bestMatch.name.charAt(0).toUpperCase() + bestMatch.name.slice(1).toLowerCase();
  } else {
    correctedName =
      input.productName.charAt(0).toUpperCase() + input.productName.slice(1).toLowerCase();
  }

  let fallback = { correctedName };
  return runWithAIFallback(correctProductNameFlow, input, fallback, 'correctProductName');
}

export async function identifyProductsFromPhoto(
  input: IdentifyProductsFromPhotoInput
): Promise<IdentifyProductsFromPhotoOutput> {
  return runWithAIFallback(identifyProductsFromPhotoFlow, input, { products: [] }, 'identifyProductsFromPhoto');
}

export async function textToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
    return runWithAIFallback(textToSpeechFlow, input, { audioDataUri: undefined }, 'textToSpeech');
}


export async function generateGrammaticalMessage(
  input: GenerateGrammaticalMessageInput
): Promise<GenerateGrammaticalMessageOutput> {
    let fallbackMessage = "";
    switch(input.messageType) {
        case 'low_stock': fallbackMessage = `El stock de "${input.productName}" es bajo.`; break;
        case 'out_of_stock': fallbackMessage = `"${input.productName}" se ha agotado.`; break;
        case 'moved_to_shopping_list': fallbackMessage = `"${input.productName}" se ha movido a la lista de la compra.`; break;
        case 'added_to_shopping_list': fallbackMessage = `"${input.productName}" se ha añadido a la lista de la compra.`; break;
        case 'out_of_stock_and_moved': fallbackMessage = `"${input.productName}" se ha agotado y se ha añadido a la lista de la compra.`; break;
        case 'added_to_pantry': fallbackMessage = `"${input.productName}" se ha añadido a la despensa.`; break;
        case 'available': fallbackMessage = `"${input.productName}" ahora está disponible.`; break;
    }
    return runWithAIFallback(generateGrammaticalMessageFlow, input, { message: fallbackMessage }, 'generateGrammaticalMessage');
}

export async function generateRecipe(
  input: GenerateRecipeInput
): Promise<GenerateRecipeOutput> {
  const fallback = {
    title: 'Error al generar receta',
    ingredients: [],
    instructions: [
      'No se pudo conectar con el servicio de IA para generar la receta.',
    ],
    note: 'El servicio de IA no está disponible en este momento. Por favor, inténtelo de nuevo más tarde.',
  };
  try {
    const result = await generateRecipeFlow(input);
    if (!result || !result.title || !result.ingredients || !result.instructions) {
      console.error('[RECETA] La IA no devolvió una receta válida para', input.products, '->', result);
      console.warn('[RECETA] Usando fallback de error');
      return fallback;
    }
    // Log de éxito
    console.log('[RECETA] Receta generada por IA:', result.title);
    return result;
  } catch (error) {
    console.error('[RECETA] Error al llamar a la IA para generar receta:', error);
    console.warn('[RECETA] Usando fallback de error');
    return fallback;
  }
}

export async function conversationalAssistant(
  input: AssistantInput
): Promise<AssistantOutput> {
  const fallback = {
    response:
      'Lo siento, no he podido procesar tu petición en este momento. Inténtalo de nuevo.',
    operations: [],
    uiActions: [],
  };
  return runWithAIFallback(conversationalAssistantFlow, input, fallback, 'conversationalAssistant');
}

