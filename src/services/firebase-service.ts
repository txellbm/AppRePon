
import { doc, getDoc, setDoc, onSnapshot, type Unsubscribe, updateDoc, arrayUnion } from "firebase/firestore";
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
        if (p && typeof p === 'object' && p.id != null) { // Check that id is not null/undefined
            if (!seenIds.has(p.id)) {
                if (p.name && p.category && p.status) {
                    seenIds.add(p.id);
                    const newProd: Product = {
                        id: p.id,
                        name: p.name,
                        category: p.category,
                        status: p.status,
                        isPendingPurchase: p.isPendingPurchase ?? false,
                        buyLater: p.buyLater ?? false,
                    };
                    if (newProd.status !== 'available' && p.reason) {
                        newProd.reason = p.reason;
                    }
                    uniqueProducts.push(newProd);
                }
            } else {
                 console.warn(`Duplicate product ID found and removed during sanitization: ${p.id} (${p.name})`);
            }
        } else if (p && typeof p === 'object' && !p.id) {
             console.warn("Product found without an ID, assigning a temporary one. Please check data integrity.", p);
             const newId = uuidv4();
             if (!seenIds.has(newId)) {
                seenIds.add(newId);
                const newProd: Product = {
                    id: newId,
                    name: p.name || 'Producto sin nombre',
                    category: p.category || 'Otros',
                    status: p.status || 'available',
                    isPendingPurchase: p.isPendingPurchase ?? false,
                    buyLater: p.buyLater ?? false,
                };
                 if (newProd.status !== 'available' && p.reason) {
                    newProd.reason = p.reason;
                }
                uniqueProducts.push(newProd);
             }
        }
    }
    
    return uniqueProducts;
};


export async function addProductsToPantry(listId: string, products: Product[], currentPantry: Product[], currentHistory: string[]): Promise<Product[]> {
  if (!db || products.length === 0) {
    console.warn("Firebase not initialized or no products to add. Skipping.");
    return [];
  }

  const docRef = doc(db, listsCollection, listId);

  try {
    const currentPantryNames = new Set(currentPantry.map(p => p.name.toLowerCase()));
    const productsToAdd = products.filter(p => !currentPantryNames.has(p.name.toLowerCase()));

    if (productsToAdd.length === 0) {
      console.log("All products already exist in the pantry.");
      return [];
    }

    const newPantry = [...currentPantry, ...productsToAdd];
    const newHistory = [...new Set([...currentHistory, ...productsToAdd.map(p => p.name)])];
    
    await setDoc(docRef, {
      pantry: newPantry,
      history: newHistory,
    }, { merge: true });
    
    return productsToAdd;

  } catch (error) {
    console.error("Error adding products to pantry:", error);
    throw error;
  }
}

export async function addProductsToShoppingList(listId: string, products: Product[], currentShoppingList: Product[], currentHistory: string[]): Promise<Product[]> {
  if (!db || products.length === 0) {
    console.warn("Firebase not initialized or no products to add. Skipping.");
    return [];
  }

  const docRef = doc(db, listsCollection, listId);

  try {
    const currentShoppingListNames = new Set(currentShoppingList.map(p => p.name.toLowerCase()));
    const productsToAdd = products.filter(p => !currentShoppingListNames.has(p.name.toLowerCase()));

    if (productsToAdd.length === 0) {
      console.log("All products already exist in the shopping list.");
      return [];
    }

    const newShoppingList = [...currentShoppingList, ...productsToAdd];
    const newHistory = [...new Set([...currentHistory, ...productsToAdd.map(p => p.name)])];
    
    await setDoc(docRef, {
      shoppingList: newShoppingList,
      history: newHistory,
    }, { merge: true });
    
    return productsToAdd;

  } catch (error) {
    console.error("Error adding products to shopping list:", error);
    throw error;
  }
}


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
      // Data integrity check and sanitation
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
    // Re-throw the error so the calling function can handle it (e.g., show a toast).
    throw error;
  }
}

export function onListUpdate(listId: string, callback: (data: ListData) => void): Unsubscribe {
  if (!db) {
    console.warn("Firebase is not initialized. Listener not attached.");
    return () => {}; // Return a no-op unsubscribe function
  }
  const docRef = doc(db, listsCollection, listId);
  const unsubscribe = onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      // Sanitize data on every update from Firebase.
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

    