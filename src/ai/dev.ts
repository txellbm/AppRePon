(async () => {
  await import('@/ai/flows/categorize-product.ts');
  await import('@/ai/flows/refine-category.ts');
  await import('@/ai/flows/improve-categorization.ts');
  await import('@/ai/flows/correct-product-name.ts');
  await import('@/ai/flows/generate-grammatical-message.ts');
})();
