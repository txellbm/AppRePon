'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebase-config'
import { ListData, Product } from '@/lib/types'

export const useSharedList = (listId: string) => {
  const [sharedListData, setSharedListData] = useState<ListData>({
    pantry: [],
    shoppingList: [],
    history: [],
  })

  useEffect(() => {
    if (!listId) return

    const sharedListDocRef = doc(collection(db, 'lists'), listId)

    const unsubscribe = onSnapshot(sharedListDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setSharedListData(docSnapshot.data() as ListData)
      } else {
        const defaultData: ListData = {
          pantry: [],
          shoppingList: [],
          history: [],
        }
        setDoc(sharedListDocRef, defaultData)
        setSharedListData(defaultData)
      }
    })

    return () => unsubscribe()
  }, [listId])

  const updateRemoteList = useCallback(
    async (updatedData: Partial<ListData>) => {
      if (!listId) return

      const sharedListRef = doc(db, 'lists', listId)

      const existingDoc = await getDoc(sharedListRef)
      if (existingDoc.exists()) {
        const data = existingDoc.data() as ListData

        const detectDeletedItems = (
          original: Product[],
          updated: Product[]
        ) => {
          const updatedIds = new Set(updated.map((p) => p.id))
          return original.filter((p) => !updatedIds.has(p.id))
        }

        const deletedFromPantry = updatedData.pantry
          ? detectDeletedItems(data.pantry, updatedData.pantry)
          : []
        const deletedFromShopping = updatedData.shoppingList
          ? detectDeletedItems(data.shoppingList, updatedData.shoppingList)
          : []
        const deletedFromHistory = updatedData.history
          ? detectDeletedItems(data.history, updatedData.history)
          : []

        const deletedProducts = [
          ...deletedFromPantry,
          ...deletedFromShopping,
          ...deletedFromHistory,
        ]

        for (const product of deletedProducts) {
          try {
            await deleteDoc(doc(db, 'products', product.id))
          } catch (error) {
            console.error('❌ Error al eliminar producto de Firestore:', error)
          }
        }
      }

      await updateDoc(sharedListRef, updatedData)
    },
    [listId]
  )

  return { ...sharedListData, updateRemoteList }
}