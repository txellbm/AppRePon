'use client'

import { useParams } from 'next/navigation'
import { useSharedList } from '@/hooks/use-shared-list'
import { useReponToast } from '@/hooks/use-repon-toast'
import type { Product } from '@/lib/types'

export default function PantryPage() {
  const params = useParams()
  const listId = Array.isArray(params?.listId) ? params.listId[0] : params?.listId || ''
  const { toast } = useReponToast()
  const { pantry, shoppingList, history, updateRemoteList } = useSharedList(listId, toast)

  const getCounts = (
    arr: Product[],
    key: 'id' | 'name'
  ): Record<string, number> => {
    return arr.reduce((acc, item) => {
      const value = item[key]
      if (value) {
        acc[value] = (acc[value] ?? 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
  }

  const pantryIdCount = getCounts(pantry, 'id')
  const pantryNameCount = getCounts(pantry, 'name')
  const shoppingIdCount = getCounts(shoppingList, 'id')
  const shoppingNameCount = getCounts(shoppingList, 'name')

  const getKey = (
    product: Product,
    index: number,
    idCounts: Record<string, number>,
    nameCounts: Record<string, number>
  ): string | number => {
    if (product.id && idCounts[product.id] === 1) {
      return product.id
    }
    if (product.name && nameCounts[product.name] === 1) {
      return product.name
    }
    return index
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Tu lista compartida: {listId}</h1>

      <h2>Mi despensa</h2>
      <ul>
        {pantry.map((product, index) => (
          <li key={getKey(product, index, pantryIdCount, pantryNameCount)}>
            {product.name}
          </li>
        ))}
      </ul>

      <h2>Lista de compra</h2>
      <ul>
        {shoppingList.map((product, index) => (
          <li key={getKey(product, index, shoppingIdCount, shoppingNameCount)}>
            {product.name}
          </li>
        ))}
      </ul>

      <h2>Historial</h2>
      <ul>
        {history.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
