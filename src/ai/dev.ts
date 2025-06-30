import { config } from 'dotenv';
config();

import '@/ai/flows/categorize-product.ts';
import '@/ai/flows/refine-category.ts';
import '@/ai/flows/voice-command-handler.ts';
import '@/ai/flows/improve-categorization.ts';
import '@/ai/flows/correct-product-name.ts';
import '@/ai/flows/identify-products-from-photo.ts';
import '@/ai/flows/generate-recipe.ts';
import '@/ai/flows/generate-grammatical-message.ts';
import '@/ai/flows/conversational-assistant.ts';
import '@/ai/flows/text-to-speech.ts';
