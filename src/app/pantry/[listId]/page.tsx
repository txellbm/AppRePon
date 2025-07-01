'use client'

import { useParams } from 'next/navigation'
import { useSharedList } from '@/hooks/use-shared-list'

export default function PantryPage() {
  const params = useParams()
  const listId = Array.isArray(params?.listId) ? params.listId[0] : params?.listId || ''
  const { pantry, shoppingList, history, updateRemoteList } = useSharedList(listId)

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Tu lista compartida: {listId}</h1>

      <h2>Mi despensa</h2>
      <ul>
        {pantry.map((product) => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>

      <h2>Lista de compra</h2>
      <ul>
        {shoppingList.map((product) => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>

      <h2>Historial</h2>
      <ul>
        {history.map((product) => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
    </div>
  )
}