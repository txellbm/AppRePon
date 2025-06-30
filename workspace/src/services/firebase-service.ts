import { doc, getDoc, setDoc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase-config";
import type { Product } from "@/lib/types";

export interface ListData {
  pantry: Product[];
  shoppingList: Product[];
  savedItems: Product[];
  history: string[];
}

const listsCollection = "lists";

const emptyList: ListData = {
  pantry: [],
  shoppingList: [],
  savedItems: [],
  history: [],
};

export async function getOrCreateList(listId: string): Promise<ListData> {
  if (!db) {
    console.warn("Firebase is not initialized. Returning empty list.");
    return emptyList;
  }
  try {
    const docRef = doc(db, listsCollection, listId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Ensure data integrity to prevent crashes
      return {
        pantry: data.pantry || [],
        shoppingList: data.shoppingList || [],
        savedItems: data.savedItems || [],
        history: data.history || [],
      };
    } else {
      await setDoc(docRef, emptyList);
      return emptyList;
    }
  } catch (error) {
    console.error("Firebase read error in getOrCreateList:", error);
    // Return an empty list on error to prevent crashing the app
    return emptyList;
  }
}

export async function updateList(listId: string, data: Partial<ListData>): Promise<void> {
  if (!db) {
    console.warn("Firebase is not initialized. Update operation skipped.");
    return;
  }
  try {
    const docRef = doc(db, listsCollection, listId);
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error("Firebase write error in updateList:", error);
  }
}

export async function onListUpdate(listId: string, callback: (data: ListData) => void): Promise<Unsubscribe> {
  if (!db) {
    console.warn("Firebase is not initialized. Listener not attached.");
    return () => {}; // Return a no-op unsubscribe function
  }

  const docRef = doc(db, listsCollection, listId);
  
  const unsubscribe = onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      // Ensure data integrity on updates as well
      callback({
        pantry: data.pantry || [],
        shoppingList: data.shoppingList || [],
        savedItems: data.savedItems || [],
        history: data.history || [],
      });
    } else {
      // If the document doesn't exist (e.g., deleted), callback with empty data
      callback(emptyList);
    }
  }, (error) => {
    console.error("Firebase snapshot listener error:", error);
  });

  return unsubscribe;
}
