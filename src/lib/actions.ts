
"use server";

import {
  categorizeProduct,
  type CategorizeProductInput,
  type CategorizeProductOutput,
} from "@/ai/flows/categorize-product";
import {
  refineCategory,
  type RefineCategoryInput,
  type RefineCategoryOutput,
} from "@/ai/flows/refine-category";
import {
  improveCategorization,
  type ImproveCategorizationInput,
  type ImproveCategorizationOutput,
} from "@/ai/flows/improve-categorization";
import {
  handleVoiceCommand,
  type VoiceCommandInput,
  type VoiceCommandOutput,
} from "@/ai/flows/voice-command-handler";
import {
  correctProductName,
  type CorrectProductNameInput,
  type CorrectProductNameOutput,
} from "@/ai/flows/correct-product-name";
import {
  identifyProductsFromPhoto,
  type IdentifyProductsFromPhotoInput,
  type IdentifyProductsFromPhotoOutput,
} from '@/ai/flows/identify-products-from-photo';
import {
  textToSpeech,
  type TextToSpeechInput,
  type TextToSpeechOutput,
} from "@/ai/flows/text-to-speech";

import { generateGrammaticalMessage } from '@/ai/flows/generate-grammatical-message';
import type { GenerateGrammaticalMessageInput, GenerateGrammaticalMessageOutput } from '@/lib/types';
import {
  generateRecipe,
  type GenerateRecipeInput,
  type GenerateRecipeOutput,
} from '@/ai/flows/generate-recipe';
import {
  conversationalAssistant,
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

export async function categorizeProductAction(
  input: CategorizeProductInput
): Promise<CategorizeProductOutput> {
  return runWithAIFallback(categorizeProduct, input, { category: 'Otros' }, 'categorizeProduct');
}

export async function refineCategoryAction(
  input: RefineCategoryInput
): Promise<RefineCategoryOutput> {
  const fallback = { refinedCategory: input.userOverrideCategory };
  return runWithAIFallback(refineCategory, input, fallback, 'refineCategory');
}

export async function improveCategorizationAction(
  input: ImproveCategorizationInput
): Promise<ImproveCategorizationOutput> {
  const fallback = { success: true, message: '' };
  return runWithAIFallback(improveCategorization, input, fallback, 'improveCategorization');
}

export async function handleVoiceCommandAction(
  input: VoiceCommandInput
): Promise<VoiceCommandOutput> {
  const fallback = {
    operations: [],
    response: 'No he podido procesar el comando de voz en este momento.',
  };
  return runWithAIFallback(handleVoiceCommand, input, fallback, 'handleVoiceCommand');
}

export async function correctProductNameAction(
  input: CorrectProductNameInput
): Promise<CorrectProductNameOutput> {
  const correctedName =
    input.productName.charAt(0).toUpperCase() +
    input.productName.slice(1).toLowerCase();
  const fallback = { correctedName };
  return runWithAIFallback(correctProductName, input, fallback, 'correctProductName');
}

export async function identifyProductsFromPhotoAction(
  input: IdentifyProductsFromPhotoInput
): Promise<IdentifyProductsFromPhotoOutput> {
  return runWithAIFallback(identifyProductsFromPhoto, input, { products: [] }, 'identifyProductsFromPhoto');
}

export async function textToSpeechAction(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
    return runWithAIFallback(textToSpeech, input, { audioDataUri: undefined }, 'textToSpeech');
}


export async function generateGrammaticalMessageAction(
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
    return runWithAIFallback(generateGrammaticalMessage, input, { message: fallbackMessage }, 'generateGrammaticalMessage');
}

export async function generateRecipeAction(
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
  return runWithAIFallback(generateRecipe, input, fallback, 'generateRecipe');
}

export async function conversationalAssistantAction(
  input: AssistantInput
): Promise<AssistantOutput> {
  const fallback = {
    response:
      'Lo siento, no he podido procesar tu petición en este momento. Inténtalo de nuevo.',
    operations: [],
    uiActions: [],
  };
  return runWithAIFallback(conversationalAssistant, input, fallback, 'conversationalAssistant');
}

