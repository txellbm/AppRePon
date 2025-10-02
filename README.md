# RePon – App de Gestión de Despensa con IA

---

## 📑 Esquema de secciones
- [Resumen general](#resumen-general)
- [Funcionalidades](#funcionalidades)
- [Flujo de uso](#flujo-de-uso)
- [Inteligencia Artificial (IA)](#inteligencia-artificial-ia)
- [Modo offline](#modo-offline)
- [Despliegue y entorno](#despliegue-y-entorno)
- [Herramientas y flujo de trabajo](#herramientas-y-flujo-de-trabajo)
- [Comandos útiles](#comandos-útiles)
- [Notas finales y seguridad](#notas-finales-y-seguridad)

---

## 🟦 Resumen general
RePon es una aplicación web colaborativa para gestionar la despensa y la lista de la compra, con flujos visuales, sincronización en tiempo real y funciones inteligentes de IA. No requiere registro y está optimizada para móvil y escritorio. Los datos se almacenan en Firestore y la app puede instalarse como PWA.

---

## 🧠 Funcionalidades

- **Prevención de duplicados:**
  - Al añadir productos, la app avisa si ya existen en la despensa o la lista de la compra mediante notificaciones tipo toast.
- **Corrección ortográfica inteligente:**
  - Detecta errores de escritura (ej: “ceres” → “cerezas”) usando Levenshtein y una lista de productos comunes.
  - Sugerencias de productos previos al escribir, con opción de eliminar del historial (❌) de forma instantánea y sincronizada.
- **Estados visuales e interactivos:**
  - Verde: disponible
  - Amarillo: queda poco (puedes enviarlo a la compra y mantenerlo en la despensa como pendiente)
  - Rojo: agotado (pasa automáticamente a la lista de la compra)
  - Cambios de estado con un solo clic/tap.
- **Sincronización en tiempo real:**
  - Todos los cambios se reflejan al instante en todos los dispositivos conectados (Firestore `onSnapshot`).
- **Modo sin conexión (offline):**
  - Los datos se almacenan localmente con IndexedDB (`enableIndexedDbPersistence`).
  - Puedes ver, añadir y editar productos sin conexión **si la app ya estaba abierta**.
  - Al recuperar conexión, los cambios se sincronizan automáticamente.
  - **Nota:** Si cierras la app y la abres sin conexión, no funcionará (falta service worker para cachear assets).
- **Gestión de sugerencias:**
  - Elimina sugerencias del historial con una ❌. El borrado es inmediato y sincronizado; si falla, se muestra un toast de error.
- **Gestión de “comprar ahora” y “comprar otro día”:**
  - La lista de la compra está dividida en dos secciones y puedes mover productos entre ambas.
- **Generación de recetas con IA:**
  - La app puede sugerir recetas según los productos disponibles en la despensa.
  - **Nota:** Puede no funcionar si hay problemas con la clave de IA o la conexión.
- **Añadir productos por voz:**
  - Puedes añadir productos dictando por voz y revisar los nombres sugeridos antes de guardarlos.
- **Copias de seguridad automáticas:**
  - Antes de sobrescribir la lista, se guarda automáticamente una copia en Firestore (`backup-{listId}`).
- **Otras:**
  - Edición y eliminación de productos mediante menú contextual.
  - Búsqueda, filtros, ordenación, vista de lista/cuadrícula y agrupación por categorías.
  - Compartir enlace de la app o copiar la lista/despensa.
  - Leyenda de colores y ayuda integrada.

---

## 🚦 Flujo de uso
1. Abre la app y añade productos desde la barra de texto o por voz.
2. Cambia el estado de los productos tocando sobre ellos (verde → amarillo → rojo). Al llegar a rojo, pasan a la lista de la compra.
3. Desde amarillo, puedes pulsar el icono del carrito para enviarlo a la compra sin borrarlo de la despensa.
4. Gestiona la lista de la compra marcando productos como comprados, devolviéndolos a la despensa o guardándolos para otro día.
5. Usa búsqueda, filtros, ordenación y agrupación para ver la información como prefieras.
6. Si lo deseas, genera una receta con lo que tengas disponible o comparte tu lista.

---

## 🤖 Inteligencia Artificial (IA)
- **Corrección ortográfica y sugerencias inteligentes** al añadir productos.
- **Categorización automática** de productos.
- **Generación de recetas** según los productos disponibles.
- **Reconocimiento de voz** para añadir productos.
- **Aprendizaje de categorías**: si cambias la categoría manualmente, la app la recordará para futuras ocasiones.

---

## 📡 Modo offline
- **Persistencia local:**
  - Los datos se almacenan en IndexedDB y puedes trabajar sin conexión **si la app ya estaba abierta**.
  - Al volver la conexión, los cambios se sincronizan automáticamente.
- **Limitación:**
  - Si cierras la app y la abres sin conexión, no funcionará (no hay service worker para cachear assets todavía).

---

## 🚀 Despliegue y entorno
- **Despliegue actual:**
  - La app está desplegada en **Vercel**. Los cambios se reflejan automáticamente tras hacer push a GitHub.
  - El hosting antiguo de Firebase sigue disponible pero no se actualiza.
- **Repositorio GitHub:**
  - `AppRePon`
- **Tecnologías:**
  - Next.js 15, TypeScript, React, shadcn/ui, Tailwind CSS, Firestore, Google AI & Genkit, Vercel, Firebase.

---

## 🛠️ Herramientas y flujo de trabajo
- **Cursor:** para revisar, modificar y testear el código antes de subirlo.
- **GitHub:** para control de versiones y despliegue automático en Vercel.
- **Firebase:** como backend (Firestore), hosting antiguo y para autenticación (no usada en la app pública).
- **Colaboración:**
  - Todos los cambios se reflejan en tiempo real para todos los usuarios conectados.

---

## 💻 Comandos útiles
```bash
git status
git add .
git commit -m "Mensaje del commit"
git push
```

---

## 🔐 Notas finales y seguridad
- **Claves privadas** (como `GOOGLE_API_KEY`) **nunca deben ir en el cliente** ni en archivos públicos. Solo deben usarse en el backend o en entornos protegidos.
- Las claves públicas de Firebase (`NEXT_PUBLIC_FIREBASE_API_KEY`, etc.) son necesarias para la inicialización del cliente y no suponen riesgo.
- Antes de sobrescribir la despensa, se guarda automáticamente una copia en `backup-{listId}`. Estas copias se actualizan en cada escritura y no se van acumulando. La restauración debe hacerse manualmente desde Firestore.
- Si tienes dudas sobre el funcionamiento, despliegue o seguridad, consulta este README o contacta con el equipo.

---

## 👩‍💻 Créditos
Proyecto mantenido por un pequeño equipo humano con ayuda de la IA.
