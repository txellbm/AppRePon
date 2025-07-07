import { doc, getDoc, setDoc, updateDoc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase-config";
import type { Product, Category } from "@/lib/types";
import { v4 as uuidv4 } from 'uuid';

export interface ListData {
  pantry: Product[];
  shoppingList: Product[];
  history: string[];
  categoryOverrides: Record<string, Category>;
}

const listsCollection = "lists";

const emptyList: ListData = {
  pantry: [],
  shoppingList: [],
  history: [],
  categoryOverrides: {},
};

export const sanitizeProductArray = (products: any): Product[] => {
    if (!Array.isArray(products)) return [];

    const seenIds = new Set<string>();
    const uniqueProducts: Product[] = [];

    for (const p of products) {
        if (p && typeof p === 'object' && p.id != null) {
            if (!seenIds.has(p.id)) {
                if (p.name && p.category && p.status) {
                    seenIds.add(p.id);
                    uniqueProducts.push({
                        id: p.id,
                        name: p.name,
                        category: p.category,
                        status: p.status,
                        isPendingPurchase: p.isPendingPurchase ?? false,
                        buyLater: p.buyLater ?? false,
                        ...(p.reason ? { reason: p.reason } : {}),
                    });
                }
            }
        } else if (p && typeof p === 'object' && p.id == null) {
            const newId = uuidv4();
            if (!seenIds.has(newId)) {
                seenIds.add(newId);
                uniqueProducts.push({
                    id: newId,
                    name: p.name || 'Producto sin nombre',
                    category: p.category || 'Otros',
                    status: p.status || 'available',
                    isPendingPurchase: p.isPendingPurchase ?? false,
                    buyLater: p.buyLater ?? false,
                    ...(p.reason ? { reason: p.reason } : {}),
                });
            }
        }
    }

    return uniqueProducts;
};

export async function getOrCreateList(listId: string): Promise<ListData> {
  if (!db) {
    console.warn("Firebase is not initialized. Returning empty list.");
    return { ...emptyList };
  }
  const docRef = doc(db, listsCollection, listId);
  try {
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        pantry: sanitizeProductArray(data.pantry),
        shoppingList: sanitizeProductArray(data.shoppingList),
        history: Array.isArray(data.history) ? data.history : [],
        categoryOverrides: typeof data.categoryOverrides === 'object' ? data.categoryOverrides : {},
      };
    } else {
      // Do not create the document automatically when empty
      return { ...emptyList };
    }
  } catch (error) {
      console.error("Error fetching or creating list:", error);
      return { ...emptyList };
  }
}

export async function updateList(
  listId: string,
  data: Partial<ListData> & { forceClear?: boolean }
): Promise<void> {
  if (!db) {
    console.warn("Firebase is not initialized. Update operation skipped.");
    return;
  }
  const docRef = doc(db, listsCollection, listId);
  const backupRef = doc(db, listsCollection, `backup-${listId}`);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await setDoc(backupRef, docSnap.data(), { merge: true });
    }

    const { forceClear, ...rest } = data;
    const sanitizedData: Partial<ListData> = {};

    if (rest.pantry !== undefined) {
      const arr = sanitizeProductArray(rest.pantry);
      if (arr.length > 0 || forceClear) {
        sanitizedData.pantry = arr;
      }
    }

    if (rest.shoppingList !== undefined) {
      const arr = sanitizeProductArray(rest.shoppingList);
      if (arr.length > 0 || forceClear) {
        sanitizedData.shoppingList = arr;
      }
    }

    if (rest.history !== undefined) {
      sanitizedData.history = rest.history;
    }

    if (rest.categoryOverrides !== undefined) {
      sanitizedData.categoryOverrides = rest.categoryOverrides;
    }

    if (Object.keys(sanitizedData).length === 0) {
      return;
    }

    if (docSnap.exists()) {
      await updateDoc(docRef, sanitizedData);
    } else if (
      (sanitizedData.pantry && sanitizedData.pantry.length > 0) ||
      (sanitizedData.shoppingList && sanitizedData.shoppingList.length > 0) ||
      forceClear
    ) {
      await setDoc(docRef, sanitizedData, { merge: true });
    } else {
      console.warn("Attempted to create list with empty data; operation skipped.");
    }
  } catch (error) {
    console.error("Error updating list:", error);
    throw error;
  }
}

export function onListUpdate(listId: string, callback: (data: ListData) => void): Unsubscribe {
  if (!db) {
    console.warn("Firebase is not initialized. Listener not attached.");
    return () => {};
  }
  const docRef = doc(db, listsCollection, listId);
  const unsubscribe = onSnapshot(
    docRef,
    { includeMetadataChanges: true },
    (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback({
        pantry: sanitizeProductArray(data.pantry),
        shoppingList: sanitizeProductArray(data.shoppingList),
        history: Array.isArray(data.history) ? data.history : [],
        categoryOverrides: typeof data.categoryOverrides === 'object' ? data.categoryOverrides : {},
      });
    } else {
      callback({ ...emptyList });
    }
  }, (error) => {
      console.error("Firebase snapshot listener error:", error);
      callback({ ...emptyList });
  });

  return unsubscribe;
}
