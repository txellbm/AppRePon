import { NextResponse } from "next/server";
import { getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import { categorizeProduct, type CategorizeProductSource } from "@/lib/actions";
import {
  ensureValidCategory,
  isValidCategory,
  normalizeForCategorization,
} from "@/lib/categorization/localRules";
import type { Category } from "@/lib/types";

const DEFAULT_LIST_ID = "nuestra-despensa-compartida";

interface ReclassifyRequestBody {
  listId?: string;
}

interface ReclassifyUpdate {
  id: string;
  name: string;
  previousCategory: Category;
  newCategory: Category;
  source: CategorizeProductSource;
  collection: "pantry" | "shoppingList";
}

interface ReclassifySummary {
  totalCandidates: number;
  updated: number;
  overridesAdded: number;
  bySource: Record<CategorizeProductSource, number>;
  updates: ReclassifyUpdate[];
}

type ProductLike = {
  id?: string;
  name?: unknown;
  category?: unknown;
  [key: string]: unknown;
};

function parseRequestBody(value: unknown): ReclassifyRequestBody {
  if (typeof value !== "object" || value === null) {
    return {};
  }
  return value as ReclassifyRequestBody;
}

function extractListId(body: ReclassifyRequestBody): string {
  const requested = typeof body.listId === "string" ? body.listId.trim() : "";
  return requested || DEFAULT_LIST_ID;
}

export async function POST(req: Request) {
  try {
    const body = parseRequestBody(await req.json().catch(() => ({})));
    const listId = extractListId(body);

    if (getApps().length === 0) {
      initializeApp({ credential: applicationDefault() });
    }

    const db = getFirestore();
    const docRef = db.collection("lists").doc(listId);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: `La lista "${listId}" no existe.` },
        { status: 404 }
      );
    }

    const data = snap.data() ?? {};
    const pantry = Array.isArray(data.pantry) ? ([...data.pantry] as ProductLike[]) : [];
    const shoppingList = Array.isArray(data.shoppingList)
      ? ([...data.shoppingList] as ProductLike[])
      : [];

    const rawOverrides =
      typeof data.categoryOverrides === "object" && data.categoryOverrides !== null
        ? (data.categoryOverrides as Record<string, unknown>)
        : {};

    const normalizedOverrides: Record<string, Category> = {};
    let overridesChanged = false;

    for (const [key, value] of Object.entries(rawOverrides)) {
      const categoryValue = typeof value === "string" ? value : undefined;
      if (!isValidCategory(categoryValue)) {
        overridesChanged = true;
        continue;
      }
      if (categoryValue === "Otros") {
        overridesChanged = true;
        continue;
      }
      const normalizedKey = normalizeForCategorization(key);
      if (normalizedKey !== key) {
        overridesChanged = true;
      }
      normalizedOverrides[normalizedKey] = categoryValue as Category;
    }

    const summary: ReclassifySummary = {
      totalCandidates: 0,
      updated: 0,
      overridesAdded: 0,
      bySource: {
        override: 0,
        local: 0,
        ai: 0,
        fallback: 0,
      },
      updates: [],
    };

    let pantryChanged = false;
    let shoppingListChanged = false;

    const processItem = async (item: ProductLike, collection: "pantry" | "shoppingList") => {
      if (!item || typeof item !== "object") {
        return;
      }
      const name = typeof item.name === "string" ? item.name : "";
      const currentCategoryRaw = typeof item.category === "string" ? item.category : "Otros";
      const currentCategory = ensureValidCategory(currentCategoryRaw);

      if (currentCategory !== "Otros" || !name.trim()) {
        return;
      }

      summary.totalCandidates += 1;

      const normalizedKey = normalizeForCategorization(name);
      const legacyKey = name.toLowerCase();
      const storedOverride = normalizedOverrides[normalizedKey] ?? normalizedOverrides[legacyKey];
      const overrideForRun = storedOverride && storedOverride !== "Otros" ? storedOverride : undefined;

      const { category, source } = await categorizeProduct({
        productName: name,
        overrideCategory: overrideForRun,
      });

      summary.bySource[source] += 1;

      if (category !== currentCategory) {
        item.category = category;
        summary.updated += 1;
        summary.updates.push({
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
      }

      if ((source === "local" || source === "ai") && category !== "Otros") {
        if (normalizedOverrides[normalizedKey] !== category) {
          normalizedOverrides[normalizedKey] = category;
          summary.overridesAdded += 1;
          overridesChanged = true;
        }
        if (legacyKey !== normalizedKey && normalizedOverrides[legacyKey]) {
          delete normalizedOverrides[legacyKey];
          overridesChanged = true;
        }
      }
    };

    for (const item of pantry) {
      await processItem(item, "pantry");
    }

    for (const item of shoppingList) {
      await processItem(item, "shoppingList");
    }

    if (!pantryChanged && !shoppingListChanged && !overridesChanged) {
      return NextResponse.json({
        message: "No se encontraron productos en 'Otros' para reclasificar.",
        summary,
      });
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

    await docRef.set(payload, { merge: true });

    return NextResponse.json({
      message: "Reclasificación completada.",
      summary,
    });
  } catch (error) {
    console.error("[RECLASSIFY-OTHERS] Error al reclasificar productos", error);
    return NextResponse.json(
      { error: "Error interno al reclasificar los productos." },
      { status: 500 }
    );
  }
}
