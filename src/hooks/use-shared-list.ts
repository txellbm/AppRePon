
"use client";

import { useState, useEffect, useCallback } from "react";
import { doc, onSnapshot, setDoc, type Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase-config";
import { updateList, addProductsToPantry, addProductsToShoppingList, type ListData, sanitizeProductArray } from "@/services/firebase-service";
import { type Product, type Category } from "@/lib/types";
import { useReponToast } from "@/hooks/use-repon-toast";
import { v4 as uuidv4 } from 'uuid';
import {
  categorizeProductAction,
  correctProductNameAction,
  handleVoiceCommandAction,
  refineCategoryAction
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


export function useSharedList(listId: string | null, toast: ToastFn) {
  const [listData, setListData] = useState<ListData>({ pantry: [], shoppingList: [], history: [] });
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasPendingWrites, setHasPendingWrites] = useState(false);
  
  // This useEffect handles data fetching and real-time updates robustly.
  useEffect(() => {
    if (!listId || !db) {
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);
    const docRef = doc(db, "lists", listId);
    let isFirstSnapshot = true;

    const unsubscribe: Unsubscribe = onSnapshot(docRef, 
      (docSnap) => {
        setHasPendingWrites(docSnap.metadata.hasPendingWrites);
        if (!docSnap.exists() && isFirstSnapshot) {
          // If the document doesn't exist on the first check, create it.
          // This write will trigger the listener again with the new empty document.
          setDoc(docRef, { pantry: [], shoppingList: [], history: [] })
            .catch(error => {
              console.error("Failed to create list document:", error);
              toast({
                title: "Error de Creación",
                description: "No se pudo crear la lista compartida.",
                variant: "destructive",
              });
            });
        } else if (docSnap.exists()) {
          // Document exists, update state.
          const data = docSnap.data();
          setListData({
            pantry: sanitizeProductArray(data.pantry),
            shoppingList: sanitizeProductArray(data.shoppingList),
            history: Array.isArray(data.history) ? data.history : [],
          });
        }
        // Always mark as loaded after the first snapshot has been processed.
        if (isFirstSnapshot) {
            setIsLoaded(true);
            isFirstSnapshot = false;
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

    // Cleanup function to unsubscribe when the component unmounts
    return () => unsubscribe();
  }, [listId, toast]);

  const updateRemoteList = useCallback((updatedData: Partial<ListData>) => {
    if (!listId || !db) {
       toast({
        title: "Error de Conexión",
        description: "No se puede conectar a la base de datos. Los cambios no se guardarán.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    updateList(listId, updatedData).catch(error => {
      console.error("Failed to update list:", error);
      toast({ title: "Error de Sincronización", description: "No se pudieron guardar los cambios.", variant: "destructive" });
    });
  }, [listId, toast]);

  const handleBulkAdd = useCallback(async (names: string[]) => {
    if (!listId || !db || names.length === 0) return;

    const toastie = toast({ title: `Añadiendo ${names.length} producto(s)...`, duration: 5000 });

    try {
        const currentPantryNames = new Set(listData.pantry.map(p => p.name.toLowerCase()));
        const shoppingListMap = new Map(listData.shoppingList.map(p => [p.name.toLowerCase(), p]));

        const itemsToMoveFromShoppingList: Product[] = [];
        const namesToCreate: string[] = [];

        const correctedNamesMap = new Map<string, string>();
        for (const name of names) {
          const { correctedName } = await correctProductNameAction({ productName: name });
          correctedNamesMap.set(name, correctedName);
        }

        const uniqueCorrectedNames = [...new Set(correctedNamesMap.values())];

        for (const correctedName of uniqueCorrectedNames) {
            const lowerName = correctedName.toLowerCase();
            if (currentPantryNames.has(lowerName)) {
                toast({ title: "¡Ya lo tienes!", description: `"${correctedName}" ya está en tu despensa.` });
            } else if (shoppingListMap.has(lowerName)) {
                itemsToMoveFromShoppingList.push(shoppingListMap.get(lowerName)!);
            } else {
                namesToCreate.push(correctedName);
            }
        }
        
        const newProductsFromScratch = await Promise.all(
            namesToCreate.map(async (name) => {
                const { category } = await categorizeProductAction({ productName: name });
                return {
                    id: uuidv4(),
                    name: name,
                    category: category as Category,
                    status: 'available' as const,
                    isPendingPurchase: false,
                    buyLater: false,
                };
            })
        );
        
        const finalProductsToAdd = [
          ...newProductsFromScratch,
          ...itemsToMoveFromShoppingList.map(p => {
            const { reason, ...rest } = p; // Remove reason when moving to pantry
            return { ...rest, status: 'available' as const, isPendingPurchase: false, buyLater: false };
          })
        ];
        
        if (finalProductsToAdd.length > 0) {
            const newShoppingList = listData.shoppingList.filter(item => !itemsToMoveFromShoppingList.some(moved => moved.id === item.id));
            const newPantry = [...listData.pantry, ...finalProductsToAdd];
            const newHistory = [...new Set([...listData.history, ...finalProductsToAdd.map(p => p.name)])];
            
            updateRemoteList({
                pantry: newPantry,
                shoppingList: newShoppingList,
                history: newHistory
            });
            
            const successMessage = finalProductsToAdd.length === 1 
                ? `Se ha añadido "${finalProductsToAdd[0].name}" a tu despensa.`
                : `Se han añadido ${finalProductsToAdd.length} productos a tu despensa.`

            toastie.update({ 
                id: toastie.id, 
                title: "¡Añadido!", 
                description: successMessage
            });

        } else {
             toastie.dismiss();
        }
        
    } catch (error) {
        console.error("Failed to add item(s):", error);
        toastie.update({ 
            id: toastie.id, 
            title: "¡Error!", 
            description: "No se pudieron guardar los productos.", 
            variant: "destructive" 
        });
    }
  }, [listId, listData.pantry, listData.shoppingList, listData.history, toast, updateRemoteList]);

  const handleAddItem = useCallback((name: string) => {
    const productNames = name.split(',').map(n => n.trim()).filter(Boolean);
    if (productNames.length > 0) {
      handleBulkAdd(productNames);
    }
  }, [handleBulkAdd]);

  const handleBulkAddToShoppingList = useCallback(async (names: string[]) => {
    if (!listId || !db || names.length === 0) return;

    const toastie = toast({ title: `Añadiendo ${names.length} producto(s) a la compra...`, duration: 5000 });

    try {
        const pantryNames = new Set(listData.pantry.map(p => p.name.toLowerCase()));
        const shoppingListNames = new Set(listData.shoppingList.map(p => p.name.toLowerCase()));
        
        const productsToCreate: { name: string }[] = [];
        
        const correctedNames = await Promise.all(names.map(name => correctProductNameAction({ productName: name })));
        const uniqueCorrectedNames = [...new Map(correctedNames.map(item => [item.correctedName.toLowerCase(), item.correctedName])).values()];

        for (const correctedName of uniqueCorrectedNames) {
            const lowerName = correctedName.toLowerCase();
            if (pantryNames.has(lowerName)) {
                toast({ title: "¡Ya lo tienes!", description: `"${correctedName}" ya está en tu despensa.` });
            } else if (shoppingListNames.has(lowerName)) {
                toast({ title: "¡Ya anotado!", description: `"${correctedName}" ya está en la lista de la compra.` });
            } else {
                productsToCreate.push({ name: correctedName });
            }
        }
        
        if (productsToCreate.length === 0) {
            toastie.dismiss();
            return;
        }

        const newProducts = await Promise.all(
            productsToCreate.map(async (product) => {
                const { category } = await categorizeProductAction({ productName: product.name });
                return {
                    id: uuidv4(),
                    name: product.name,
                    category: category as Category,
                    status: 'out of stock' as const,
                    reason: 'out of stock' as const,
                    isPendingPurchase: false,
                    buyLater: false,
                };
            })
        );
        
        const addedProducts = await addProductsToShoppingList(listId, newProducts, listData.shoppingList, listData.history);

        if (addedProducts.length > 0) {
            const successMessage = addedProducts.length === 1 
                ? `Se ha añadido "${addedProducts[0].name}" a la lista de la compra.`
                : `Se han añadido ${addedProducts.length} productos a la lista de la compra.`

            toastie.update({ 
                id: toastie.id, 
                title: "¡Anotado!", 
                description: successMessage
            });
        } else {
             toastie.dismiss();
        }
    } catch (error) {
        console.error("Failed to add item(s) to shopping list:", error);
        toastie.update({ 
            id: toastie.id, 
            title: "¡Error!", 
            description: "No se pudieron añadir los productos a la compra.", 
            variant: "destructive" 
        });
    }
  }, [listId, listData.pantry, listData.shoppingList, listData.history, toast]);

  const handleShoppingListAddItem = useCallback(async (name: string) => {
    const productNames = name.split(',').map(n => n.trim()).filter(Boolean);
    if (productNames.length > 0) {
      await handleBulkAddToShoppingList(productNames);
    }
  }, [handleBulkAddToShoppingList]);
  
  const handleVoiceCommand = useCallback(async (command: string) => {
    if (!command || !listId || !db) return;

    try {
      const pantryNames = listData.pantry.map(p => p.name);
      const shoppingListNames = listData.shoppingList.map(p => p.name);

      const result = await handleVoiceCommandAction({
        command,
        pantryList: pantryNames,
        shoppingList: shoppingListNames,
      });
      
      if (!result || result.operations.length === 0) {
        toast({ title: "Comando de voz", description: result?.response || "No se pudo procesar el comando.", audioText: result?.response });
        return;
      }

      let newPantry = [...listData.pantry];
      let newShoppingList = [...listData.shoppingList];
      let newHistory = [...listData.history];
      const addedItems = new Set<string>();

      const productNamesToCreate = [...new Set(result.operations
        .filter(op => op.action === 'add' || op.action === 'move')
        .map(op => op.item))];

      const createdProducts = await Promise.all(
        productNamesToCreate.map(async (name) => {
            const correctedNameResult = await correctProductNameAction({ productName: name });
            const { category } = await categorizeProductAction({ productName: correctedNameResult.correctedName });
            return {
                id: uuidv4(),
                name: correctedNameResult.correctedName,
                category: category as Category,
                status: 'available' as const,
                isPendingPurchase: false,
                buyLater: false,
            };
        })
      );
      
      const productMap = new Map(createdProducts.map(p => [p.name.toLowerCase(), p]));

      for (const op of result.operations) {
        const opItemNameLower = op.item.toLowerCase();

        if (op.action === 'add') {
          const productToAdd = productMap.get(opItemNameLower);
          if (productToAdd) {
            if (op.list === 'pantry' && !newPantry.some(p => p.name.toLowerCase() === opItemNameLower)) {
              newPantry.push({ ...productToAdd, status: 'available' });
              addedItems.add(productToAdd.name);
            } else if (op.list === 'shopping' && !newShoppingList.some(p => p.name.toLowerCase() === opItemNameLower)) {
              newShoppingList.push({ ...productToAdd, status: 'out of stock', reason: 'out of stock' });
               addedItems.add(productToAdd.name);
            }
          }
        } else if (op.action === 'remove') {
          const inShoppingList = newShoppingList.some(p => p.name.toLowerCase() === opItemNameLower);
          if (op.list === 'shopping' || (op.list === undefined && inShoppingList)) {
              newShoppingList = newShoppingList.filter(p => p.name.toLowerCase() !== opItemNameLower);
          } else if (op.list === 'pantry' || op.list === undefined) {
              newPantry = newPantry.filter(p => p.name.toLowerCase() !== opItemNameLower);
          }
        } else if (op.action === 'move') {
          const itemInPantry = newPantry.find(p => p.name.toLowerCase() === opItemNameLower);
          const itemInShopping = newShoppingList.find(p => p.name.toLowerCase() === opItemNameLower);
          const productToMove = itemInPantry || itemInShopping || productMap.get(opItemNameLower);
          
          if (productToMove) {
            if (op.from === 'pantry' && op.to === 'shopping') {
              newPantry = newPantry.filter(p => p.name.toLowerCase() !== opItemNameLower);
              if (!newShoppingList.some(p => p.name.toLowerCase() === opItemNameLower)) {
                newShoppingList.push({ ...productToMove, status: 'out of stock', reason: 'out of stock' });
                addedItems.add(productToMove.name);
              }
            } else if (op.from === 'shopping' && op.to === 'pantry') {
              newShoppingList = newShoppingList.filter(p => p.name.toLowerCase() !== opItemNameLower);
              if (!newPantry.some(p => p.name.toLowerCase() === opItemNameLower)) {
                newPantry.push({ ...productToMove, status: 'available' });
                 addedItems.add(productToMove.name);
              }
            }
          }
        }
      }
      
      newHistory = [...new Set([...newHistory, ...Array.from(addedItems)])];
      
      updateRemoteList({
          pantry: newPantry,
          shoppingList: newShoppingList,
          history: newHistory
      });
      
      toast({ title: "¡Entendido!", description: result.response, audioText: result.response });

    } catch (error) {
      console.error("Voice command failed:", error);
      toast({ title: "¡Ups! Algo falló", description: "No pude entender el comando de voz.", variant: "destructive" });
    }
}, [listId, listData.pantry, listData.shoppingList, listData.history, updateRemoteList, toast]);


  return { ...listData, isLoaded, hasPendingWrites, handleAddItem, handleBulkAdd, updateRemoteList, handleVoiceCommand, handleShoppingListAddItem };
}
