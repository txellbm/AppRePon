"use server";

import {
  categorizeProduct,
  type CategorizeProductInput,
  type CategorizeProductOutput,
} from "@/ai/flows/categorize-product";
import {
  refineCategory,
  type RefineCategoryInput,
} from "@/ai/flows/refine-category";
import {
  handleVoiceCommand,
  type VoiceCommandInput,
} from "@/ai/flows/voice-command-handler";
import {
  correctProductName,
  type CorrectProductNameInput,
  type CorrectProductNameOutput,
} from "@/ai/flows/correct-product-name";

async function runWhenAiIsEnabled<T, U>(fn: (input: T) => Promise<U>, input: T, fallback: U): Promise<U> {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        return fallback;
    }
    try {
        return await fn(input);
    } catch (error) {
        console.error(`AI function ${fn.name} failed:`, error);
        return fallback;
    }
}

export async function categorizeProductAction(input: CategorizeProductInput): Promise<CategorizeProductOutput> {
  return await runWhenAiIsEnabled(categorizeProduct, input, { category: 'Otros' });
}

export async function refineCategoryAction(input: RefineCategoryInput) {
  const fallback = { refinedCategory: input.userOverrideCategory };
  return await runWhenAiIsEnabled(refineCategory, input, fallback);
}

export async function handleVoiceCommandAction(input: VoiceCommandInput) {
  const fallback = { operations: [], response: "Los comandos de voz están desactivados." };
  return await runWhenAiIsEnabled(handleVoiceCommand, input, fallback);
}

export async function correctProductNameAction(input: CorrectProductNameInput): Promise<CorrectProductNameOutput> {
  const { productName } = input;
  const correctedName = productName.charAt(0).toUpperCase() + productName.slice(1).toLowerCase();
  const fallback = { correctedName };
  return await runWhenAiIsEnabled(correctProductName, input, fallback);
}

export async function isAiEnabledAction() {
    return !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
}
