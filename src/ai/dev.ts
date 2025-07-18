(async () => {
  await import('@/ai/flows/categorize-product.ts');
  await import('@/ai/flows/refine-category.ts');
  await import('@/ai/flows/voice-command-handler.ts');
  await import('@/ai/flows/improve-categorization.ts');
  await import('@/ai/flows/correct-product-name.ts');
  await import('@/ai/flows/identify-products-from-photo.ts');
  await import('@/ai/flows/generate-recipe.ts');
  await import('@/ai/flows/generate-grammatical-message.ts');
  await import('@/ai/flows/conversational-assistant.ts');
  await import('@/ai/flows/text-to-speech.ts');
})();
