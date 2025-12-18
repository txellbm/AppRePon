# Blueprint técnico de RePon

## 1) Propósito y visión
RePon es una aplicación web de Next.js (App Router) para gestionar de forma colaborativa una despensa y su lista de la compra. La interfaz principal se sirve desde `/pantry/[listId]`, y la home redirige automáticamente a la lista compartida `nuestra-despensa-compartida`.【F:src/app/page.tsx†L1-L6】【F:src/app/pantry/[listId]/page.tsx†L1-L9】

## 2) Stack y capas principales
- **Frontend**: Next.js 15 (React 18, TypeScript) con Tailwind y componentes shadcn/ui. Animaciones con Framer Motion.
- **Datos**: Firestore como base en tiempo real, con copia de seguridad en `backup-{listId}` en cada escritura.【F:src/services/firebase-service.ts†L63-L115】
- **IA**: Genkit + Google AI (Gemini 1.5 Flash) para corrección de nombres, categorización y mensajes gramaticales. Gating mediante `AI_CATEG_ENABLED` y `GOOGLE_API_KEY`.【F:src/ai/genkit.ts†L1-L26】【F:src/lib/actions.ts†L24-L85】
- **PWA/offline**: Persistencia en IndexedDB (`enableIndexedDbPersistence`); opera offline si la app ya está abierta. 【F:src/lib/firebase-config.ts†L1-L53】

## 3) Modelo de dominio
- **Product**: `id`, `name`, `category`, `status` (`available` | `low` | `out of stock`), `reason?`, `isPendingPurchase`, `buyLater`, `frozenAt?`.【F:src/lib/types.ts†L1-L21】
- **ListData (Firestore)**: `pantry: Product[]`, `shoppingList: Product[]`, `history: string[]` (sugerencias) y `categoryOverrides: Record<string, Category>`. Limpieza y generación de IDs se hace en `sanitizeProductArray` antes de guardar o mostrar.【F:src/services/firebase-service.ts†L17-L62】【F:src/services/firebase-service.ts†L90-L151】
- **Categorías válidas**: 10 categorías (Frutas y Verduras, Lácteos y Huevos, Proteínas, Panadería y Cereales, Aperitivos, Bebidas, Hogar y Limpieza, Condimentos y Especias, Conservas y Despensa, Otros). 【F:src/lib/types.ts†L3-L14】

## 4) Flujo de datos y sincronización
1) `useSharedList(listId)` abre un `onSnapshot` a `lists/{listId}` con `includeMetadataChanges` para detectar escritura local/remota y poblar estado local. **Siempre procesa todos los snapshots** para evitar drift y actualiza `isLoaded/hasPendingWrites`.【F:src/hooks/use-shared-list.ts†L28-L84】
2) Las operaciones de escritura pasan por `updateList`, que respalda el documento actual, normaliza arrays y permite `forceClear` para vaciados explícitos. 【F:src/services/firebase-service.ts†L63-L142】
3) Los formularios de alta (despensa y compra) corrigen ortografía (`correctProductName`), revisan duplicados y categorizan cada producto (override > reglas locales > IA > fallback). 【F:src/hooks/use-shared-list.ts†L86-L154】【F:src/lib/actions.ts†L43-L126】
4) El front (`PantryPage`) reacciona a cambios y aplica filtros locales (búsqueda, vista lista/cuadrícula, orden alfabético, agrupación por categoría, filtro por estado o congelados). También calcula diffs para toasts (ej. estados que cambian).【F:src/components/pantry-page.tsx†L140-L207】【F:src/components/pantry-page.tsx†L232-L285】

## 5) Lógica de negocio clave en la UI (`PantryPage`)
- **Pestañas**: "Despensa" y "Lista de compra" (`Tabs`), con contadores y estado de conexión (online/offline).【F:src/components/pantry-page.tsx†L232-L285】【F:src/components/pantry-page.tsx†L315-L352】
- **Estados y transiciones**: Cambios entre `available` → `low` → `out of stock`, mover a compra, devolver a despensa, y transición directa mediante menús contextuales. Las tarjetas usan colores (verde/amarillo/rojo) y animaciones al deslizar/marcar. 【F:src/components/pantry-page.tsx†L402-L510】【F:src/components/pantry-page.tsx†L520-L612】
- **Congelados**: `isFrozen` depende de `frozenAt`; se puede congelar/descongelar y editar fecha. Congelados se pueden filtrar o resaltar. 【F:src/components/pantry-page.tsx†L402-L470】【F:src/components/pantry-page.tsx†L540-L585】
- **Edición y duplicados**: `handleUpdateName` corrige ortografía, comprueba duplicados en despensa/compra y actualiza historial y overrides. 【F:src/components/pantry-page.tsx†L334-L376】【F:src/hooks/use-shared-list.ts†L118-L154】
- **Share/ayuda**: `ShareDialog` permite copiar la despensa/lista (incluye secciones "Comprar otro día"). Diálogos adicionales muestran leyenda de colores e información offline. 【F:src/components/share-dialog.tsx†L1-L102】【F:src/components/pantry-page.tsx†L620-L700】
- **Reclasificación masiva**: `reclassifyOthersClient` recorre productos en categoría "Otros", aplica categorización (overrides/local/IA) y escribe overrides normalizados para futuras coincidencias. Útil para sanear datos históricos. 【F:src/lib/categorization/reclassifyClient.ts†L1-L120】【F:src/lib/categorization/reclassifyClient.ts†L150-L214】

## 6) Capa de IA y reglas
- **Config**: `ai/genkit.ts` habilita plugin Google AI solo si `GOOGLE_API_KEY` existe; modelo por defecto `googleai/gemini-1.5-flash-latest`. 【F:src/ai/genkit.ts†L1-L26】
- **Corrección de nombre**: heurística local (Levenshtein sobre lista de productos comunes) y, si hay IA, prompt de corrección ortográfica. 【F:src/lib/actions.ts†L86-L141】【F:src/ai/flows/correct-product-name.ts†L1-L60】
- **Categorización**: reglas locales por keywords, overrides de usuario (`categoryOverrides` normalizados), IA opcional y fallback "Otros". Mejoras persistentes vía `improveCategorizationFlow` escriben overrides en Firestore. 【F:src/lib/actions.ts†L24-L126】【F:src/lib/categorization/localRules.ts†L1-L120】【F:src/ai/flows/improve-categorization.ts†L1-L44】
- **Mensajes gramaticales**: IA genera frases con concordancia según `messageType`; hay fallback local para cada tipo. 【F:src/ai/flows/generate-grammatical-message.ts†L1-L74】【F:src/lib/actions.ts†L143-L160】

## 7) Configuración y variables de entorno
- Firebase (cliente): `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` (opcional), `projectId` fijo `apprepon`. 【F:src/lib/firebase-config.ts†L1-L26】
- IA: `GOOGLE_API_KEY` + `AI_CATEG_ENABLED` ("1/true/yes/on") para permitir categorización IA; otros prompts siguen intentando IA si hay clave, pero usan fallback seguro. 【F:src/lib/actions.ts†L24-L85】

## 8) Scripts y desarrollo
- `npm run dev` (Next), `npm run build`, `npm run lint`, `npm run typecheck`.
- Flujos Genkit locales: `npm run genkit:dev` y `npm run genkit:watch` ejecutan `src/ai/dev.ts`.

## 9) Consideraciones de seguridad y fiabilidad
- Las claves de IA nunca deben exponerse al cliente; las llamadas a IA se ejecutan en acciones/flows `use server`.
- `sanitizeProductArray` evita entradas corruptas/duplicadas y genera IDs faltantes antes de escribir en Firestore. 【F:src/services/firebase-service.ts†L17-L62】【F:src/services/firebase-service.ts†L90-L132】
- Copia de seguridad automática previa a cada escritura para permitir restaurar manualmente en Firestore (`backup-{listId}`). 【F:src/services/firebase-service.ts†L63-L115】

## 10) Blueprint resumido (para otra IA)
1. **Entrada del usuario** → formularios en `PantryPage` → corrección ortográfica y validación de duplicados → categorización (override/local/IA/fallback) → escritura en Firestore mediante `updateList`.
2. **Sincronización**: `onSnapshot` en `useSharedList` propaga cambios en tiempo real a toda la UI; `hasPendingWrites` indica estado offline/cola local.
3. **Estados de producto**: cambios en tarjetas disparan toasts y movimientos automáticos (ej. `out of stock` pasa a compra). Congelar agrega `frozenAt` y permite filtrar/editar.
4. **IA**: prompts de corrección, categoría y mensajes se ejecutan vía Genkit; si fallan o no hay clave, caen en heurísticas locales.
5. **Mantenimiento de datos**: `reclassifyOthersClient` y `improveCategorization` ajustan overrides para mejorar la precisión futura sin depender exclusivamente de IA.

