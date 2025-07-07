"use client";

import { useState, useEffect, useCallback } from "react";
import { doc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase-config";
import { updateList, type ListData, sanitizeProductArray } from "@/services/firebase-service";
import { type Product, type Category } from "@/lib/types";
import { v4 as uuidv4 } from 'uuid';
import {
  categorizeProductAction,
  correctProductNameAction,
} from "@/lib/actions";
import type { Toast } from "@/hooks/use-toast";

interface ReponToastProps extends Toast {
    audioText?: string;
}

type ToastFn = (props: ReponToastProps) => {
    id: string;
    dismiss: () => void;
    update: (props: Toast) => void;
};

const DEFAULT_LIST_ID = "nuestra-despensa-compartida";

export function useSharedList(listId: string | null, toast: ToastFn) {
  const finalListId = listId ?? DEFAULT_LIST_ID;
  const [listData, setListData] = useState<ListData>({ pantry: [], shoppingList: [], history: [], categoryOverrides: {} });
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasPendingWrites, setHasPendingWrites] = useState(false);

  useEffect(() => {
    if (!db) {
      setIsLoaded(true);
      return;
    }
    setIsLoaded(false);
    const docRef = doc(db, "lists", finalListId);
    let first = true;

    const unsubscribe: Unsubscribe = onSnapshot(
      docRef,
      { includeMetadataChanges: true },
      (snap) => {
        setHasPendingWrites(snap.metadata.hasPendingWrites);
        if (snap.exists()) {
          const data = snap.data();
          setListData({
            pantry: sanitizeProductArray(data.pantry),
            shoppingList: sanitizeProductArray(data.shoppingList),
            history: Array.isArray(data.history) ? data.history : [],
            categoryOverrides: typeof data.categoryOverrides === 'object' ? data.categoryOverrides : {},
          });
        }
        if (first) {
          setIsLoaded(true);
          first = false;
        }
      },
      (error) => {
        console.error("Failed to subscribe to list data:", error);
        toast({
          title: "Error de Conexión",
          description: "No se pudieron cargar los datos. Revisa tu conexión a internet.",
          variant: "destructive",
        });
        setIsLoaded(true);
      }
    );

    return () => unsubscribe();
  }, [finalListId, toast]);

  const updateRemoteList = useCallback((updatedData: Partial<ListData> & { forceClear?: boolean }) => {
    if (!db) {
      toast({
        title: "Error de Conexión",
        description: "No se puede conectar a la base de datos. Los cambios no se guardarán.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    updateList(finalListId, updatedData).catch((error) => {
      console.error("Failed to update list:", error);
      toast({
        title: "Error de Sincronización",
        description: "No se pudieron guardar los cambios.",
        variant: "destructive",
      });
    });
  }, [finalListId, toast]);

  const handleBulkAdd = useCallback(async (names: string[]) => {
    if (!db || names.length === 0) return;



    try {
      const currentPantryNames = new Set(listData.pantry.map((p) => p.name.toLowerCase()));
      const shoppingListMap = new Map(listData.shoppingList.map((p) => [p.name.toLowerCase(), p]));

      const itemsToMoveFromShoppingList: Product[] = [];
      const namesToCreate: string[] = [];

      const correctedNamesMap = new Map<string, string>();
      for (const name of names) {
        const { correctedName } = await correctProductNameAction({ productName: name });
        correctedNamesMap.set(name, correctedName);
      }

      const uniqueCorrectedNames = [...new Set(correctedNamesMap.values())];

      for (const correctedName of uniqueCorrectedNames) {
        const lower = correctedName.toLowerCase();
        if (currentPantryNames.has(lower)) {
          if (typeof window !== 'undefined') alert(`"${correctedName}" ya está en tu despensa.`);
        } else if (shoppingListMap.has(lower)) {
          if (typeof window !== 'undefined') alert(`"${correctedName}" ya está en la lista de la compra.`);
        } else {
          namesToCreate.push(correctedName);
        }
      }

      const newProductsFromScratch = await Promise.all(
        namesToCreate.map(async (name) => {
          const lower = name.toLowerCase();
          const overrideCat = listData.categoryOverrides[lower];
          const { category } = overrideCat
            ? { category: overrideCat }
            : await categorizeProductAction({ productName: name });
          return {
            id: uuidv4(),
            name,
            category: category as Category,
            status: "available" as const,
            isPendingPurchase: false,
            buyLater: false,
          };
        })
      );

      const finalProductsToAdd = [
        ...newProductsFromScratch,
        ...itemsToMoveFromShoppingList.map((p) => {
          const { reason, ...rest } = p;
          return { ...rest, status: "available" as const, isPendingPurchase: false, buyLater: false };
        }),
      ];

      if (finalProductsToAdd.length > 0) {
        const newShoppingList = listData.shoppingList.filter(
          (item) => !itemsToMoveFromShoppingList.some((moved) => moved.name.toLowerCase() === item.name.toLowerCase())
        );
        const newPantry = [...listData.pantry, ...finalProductsToAdd];
        const newHistory = [...new Set([...listData.history, ...finalProductsToAdd.map((p) => p.name)])];

        updateRemoteList({ pantry: newPantry, shoppingList: newShoppingList, history: newHistory });
        // success
      }
    } catch (error) {
      console.error("Failed to add item(s):", error);
      if (typeof window !== 'undefined') alert('Error al guardar los productos');
    }
  }, [listData.pantry, listData.shoppingList, listData.history, toast, updateRemoteList, db]);

  const handleAddItem = useCallback(
    (name: string) => {
      const productNames = name.split(',').map((n) => n.trim()).filter(Boolean);
      if (productNames.length > 0) {
        handleBulkAdd(productNames);
      }
    },
    [handleBulkAdd]
  );

  const handleBulkAddToShoppingList = useCallback(async (names: string[]) => {
    if (!db || names.length === 0) return;

    try {
      const pantryNames = new Set(listData.pantry.map((p) => p.name.toLowerCase()));
      const shoppingListNames = new Set(listData.shoppingList.map((p) => p.name.toLowerCase()));

      const productsToCreate: { name: string }[] = [];

      const correctedNames = await Promise.all(names.map((name) => correctProductNameAction({ productName: name })));
      const uniqueCorrectedNames = [
        ...new Map(correctedNames.map((item) => [item.correctedName.toLowerCase(), item.correctedName])).values(),
      ];

      for (const correctedName of uniqueCorrectedNames) {
        const lower = correctedName.toLowerCase();
        if (pantryNames.has(lower)) {
          if (typeof window !== 'undefined') alert(`"${correctedName}" ya está en tu despensa.`);
        } else if (shoppingListNames.has(lower)) {
          if (typeof window !== 'undefined') alert(`"${correctedName}" ya está en la lista de la compra.`);
        } else {
          productsToCreate.push({ name: correctedName });
        }
      }

      if (productsToCreate.length === 0) {
        return;
      }

      const newProducts = await Promise.all(
        productsToCreate.map(async (product) => {
          const lower = product.name.toLowerCase();
          const overrideCat = listData.categoryOverrides[lower];
          const { category } = overrideCat
            ? { category: overrideCat }
            : await categorizeProductAction({ productName: product.name });
          return {
            id: uuidv4(),
            name: product.name,
            category: category as Category,
            status: "out of stock" as const,
            reason: "out of stock" as const,
            isPendingPurchase: false,
            buyLater: false,
          } as Product;
        })
      );

      const newShoppingList = [...listData.shoppingList, ...newProducts];
      const newHistory = [...new Set([...listData.history, ...newProducts.map((p) => p.name)])];

      updateRemoteList({ shoppingList: newShoppingList, history: newHistory });

      // success
    } catch (error) {
      console.error("Failed to add item(s) to shopping list:", error);
      if (typeof window !== 'undefined') alert('Error al guardar la lista de compra');
    }
  }, [listData.pantry, listData.shoppingList, listData.history, toast, updateRemoteList, db]);

  const handleShoppingListAddItem = useCallback(
    async (name: string) => {
      const productNames = name.split(',').map((n) => n.trim()).filter(Boolean);
      if (productNames.length > 0) {
        await handleBulkAddToShoppingList(productNames);
      }
    },
    [handleBulkAddToShoppingList]
  );

  const clearPantry = useCallback(() => {
    updateRemoteList({ pantry: [], forceClear: true });
  }, [updateRemoteList]);


  return {
    ...listData,
    isLoaded,
    hasPendingWrites,
    handleAddItem,
    handleBulkAdd,
    updateRemoteList,
    handleShoppingListAddItem,
    clearPantry,
  };
}
