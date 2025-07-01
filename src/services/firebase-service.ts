import { doc, getDoc, setDoc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase-config";
import type { Product } from "@/lib/types";
import { v4 as uuidv4 } from 'uuid';

export interface ListData {
  pantry: Product[];
  shoppingList: Product[];
  history: string[];
}

const listsCollection = "lists";

const emptyList: ListData = {
  pantry: [],
  shoppingList: [],
  history: [],
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
      };
    } else {
      await setDoc(docRef, emptyList);
      return { ...emptyList };
    }
  } catch (error) {
      console.error("Error fetching or creating list:", error);
      return { ...emptyList };
  }
}

export async function updateList(listId: string, data: Partial<ListData>): Promise<void> {
  if (!db) {
    console.warn("Firebase is not initialized. Update operation skipped.");
    return;
  }
  const docRef = doc(db, listsCollection, listId);
  try {
    const sanitizedData: Partial<ListData> = {};
    if (data.pantry) sanitizedData.pantry = sanitizeProductArray(data.pantry);
    if (data.shoppingList) sanitizedData.shoppingList = sanitizeProductArray(data.shoppingList);
    if (data.history) sanitizedData.history = data.history;

    await setDoc(docRef, sanitizedData, { merge: true });
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
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback({
        pantry: sanitizeProductArray(data.pantry),
        shoppingList: sanitizeProductArray(data.shoppingList),
        history: Array.isArray(data.history) ? data.history : [],
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
