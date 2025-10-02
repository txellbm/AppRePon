import { doc, getDoc, setDoc } from "firebase/firestore";

import { categorizeProduct, type CategorizeProductSource } from "@/lib/actions";
import { db } from "@/lib/firebase-config";
import {
  ensureValidCategory,
  isValidCategory,
  normalizeForCategorization,
} from "@/lib/categorization/localRules";
import type { Category } from "@/lib/types";

const DEFAULT_LIST_ID = "nuestra-despensa-compartida";
const MAX_EXAMPLES = 5;

interface ProductLike {
  id?: string;
  name?: unknown;
  category?: unknown;
  [key: string]: unknown;
}

export interface ReclassifyExampleEntry {
  id: string;
  name: string;
  previousCategory: Category;
  newCategory: Category;
  source: CategorizeProductSource;
  collection: "pantry" | "shoppingList";
}

export interface ReclassifyOthersSummary {
  totalProcessed: number;
  changed: number;
  unchanged: number;
  overridesAdded: number;
  bySource: Record<CategorizeProductSource, number>;
  examples: ReclassifyExampleEntry[];
}

export interface ReclassifyOthersResult {
  message: string;
  summary: ReclassifyOthersSummary;
}

function resolveListId(candidate?: string | null): string {
  const trimmed = typeof candidate === "string" ? candidate.trim() : "";
  return trimmed || DEFAULT_LIST_ID;
}

function normalizeOverrides(raw: Record<string, unknown>): {
  overrides: Record<string, Category>;
  changed: boolean;
} {
  const normalized: Record<string, Category> = {};
  let changed = false;

  for (const [key, value] of Object.entries(raw)) {
    const categoryValue = typeof value === "string" ? value : undefined;
    if (!isValidCategory(categoryValue)) {
      changed = true;
      continue;
    }
    if (categoryValue === "Otros") {
      changed = true;
      continue;
    }

    const normalizedKey = normalizeForCategorization(key);
    if (normalizedKey !== key) {
      changed = true;
    }
    normalized[normalizedKey] = categoryValue;
  }

  return { overrides: normalized, changed };
}

function ensureSummaryStructure(): ReclassifyOthersSummary {
  return {
    totalProcessed: 0,
    changed: 0,
    unchanged: 0,
    overridesAdded: 0,
    bySource: {
      override: 0,
      local: 0,
      ai: 0,
      fallback: 0,
    },
    examples: [],
  };
}

export async function reclassifyOthersClient(listId?: string): Promise<ReclassifyOthersResult> {
  if (!db) {
    throw new Error("Firebase no está inicializado en el cliente.");
  }

  const resolvedListId = resolveListId(listId);
  const docRef = doc(db, "lists", resolvedListId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    throw new Error(`La lista "${resolvedListId}" no existe.`);
  }

  const data = snapshot.data() ?? {};

  const pantry = Array.isArray(data.pantry)
    ? ([...data.pantry] as ProductLike[])
    : [];
  const shoppingList = Array.isArray(data.shoppingList)
    ? ([...data.shoppingList] as ProductLike[])
    : [];

  const rawOverrides =
    typeof data.categoryOverrides === "object" && data.categoryOverrides !== null
      ? (data.categoryOverrides as Record<string, unknown>)
      : {};

  const { overrides: normalizedOverrides, changed: overridesInitiallyChanged } =
    normalizeOverrides(rawOverrides);

  const summary = ensureSummaryStructure();

  let pantryChanged = false;
  let shoppingListChanged = false;
  let overridesChanged = overridesInitiallyChanged;

  const maybeTrackExample = (entry: ReclassifyExampleEntry) => {
    if (summary.examples.length < MAX_EXAMPLES) {
      summary.examples.push(entry);
    }
  };

  const processItem = async (
    item: ProductLike,
    collection: "pantry" | "shoppingList"
  ) => {
    if (!item || typeof item !== "object") {
      return;
    }

    const name = typeof item.name === "string" ? item.name.trim() : "";
    const currentCategoryRaw =
      typeof item.category === "string" ? item.category : "Otros";
    const currentCategory = ensureValidCategory(currentCategoryRaw);

    if (!name || currentCategory !== "Otros") {
      return;
    }

    summary.totalProcessed += 1;

    const normalizedKey = normalizeForCategorization(name);
    const legacyKey = name.toLowerCase();
    const overrideForRun =
      normalizedOverrides[normalizedKey] ?? normalizedOverrides[legacyKey];

    const { category, source } = await categorizeProduct({
      productName: name,
      overrideCategory: overrideForRun,
    });

    summary.bySource[source] += 1;

    if (category !== currentCategory) {
      item.category = category;
      summary.changed += 1;
      maybeTrackExample({
        id: typeof item.id === "string" ? item.id : "",
        name,
        previousCategory: currentCategory,
        newCategory: category,
        source,
        collection,
      });

      if (collection === "pantry") {
        pantryChanged = true;
      } else {
        shoppingListChanged = true;
      }
    } else {
      summary.unchanged += 1;
    }

    if ((source === "local" || source === "ai") && category !== "Otros") {
      if (normalizedOverrides[normalizedKey] !== category) {
        normalizedOverrides[normalizedKey] = category;
        summary.overridesAdded += 1;
        overridesChanged = true;
      }
      if (legacyKey !== normalizedKey && legacyKey in normalizedOverrides) {
        delete normalizedOverrides[legacyKey];
        overridesChanged = true;
      }
    }
  };

  for (const item of pantry) {
    // eslint-disable-next-line no-await-in-loop
    await processItem(item, "pantry");
  }

  for (const item of shoppingList) {
    // eslint-disable-next-line no-await-in-loop
    await processItem(item, "shoppingList");
  }

  summary.unchanged = summary.totalProcessed - summary.changed;

  if (!pantryChanged && !shoppingListChanged && !overridesChanged) {
    return {
      message: "No se encontraron productos en 'Otros' para reclasificar.",
      summary,
    };
  }

  const payload: Record<string, unknown> = {};
  if (pantryChanged) {
    payload.pantry = pantry;
  }
  if (shoppingListChanged) {
    payload.shoppingList = shoppingList;
  }
  if (overridesChanged) {
    payload.categoryOverrides = normalizedOverrides;
  }

  await setDoc(docRef, payload, { merge: true });

  return {
    message: "Reclasificación completada.",
    summary,
  };
}
