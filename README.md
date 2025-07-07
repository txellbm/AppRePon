# RePon – App de Gestión de Despensa con IA

## Descripción General
RePon es una aplicación web pensada para ayudarte a organizar la despensa y la lista de la compra. Todos los datos se guardan en una lista pública de Firestore llamada `nuestra-despensa-compartida`, por lo que **no se necesita inicio de sesión**. La interfaz está optimizada para usarse como **PWA** desde cualquier navegador moderno e incluso puede instalarse en el móvil. Firestore mantiene una copia local de la lista, permitiendo consultar y modificar productos sin conexión.

## Funcionalidades
- **Añadir productos por texto** con autocompletado basado en tu historial y posibilidad de introducir varios nombres separados por comas.
- **Añadir productos por foto** usando la cámara o una imagen; la IA identifica los artículos.
- **Corrección automática de nombres** y **categorización sugerida** al guardar.
- **Estados visuales** de cada producto:
  - **Verde:** disponible.
  - **Amarillo:** queda poco.
  - **Rojo:** agotado (se mueve automáticamente a la lista de la compra).
- **Cambio de estado con clics:** cada toque sobre el producto avanza de verde → amarillo → rojo.
- **Botón de carrito** en estado amarillo para enviarlo manualmente a la lista de la compra.
- **Edición y eliminación** mediante un menú contextual para cada producto.
- **Búsqueda**, **filtros por estado**, **ordenación alfabética**, **vista de lista o cuadrícula** y **agrupación por categorías**.
- **Generación de recetas** a partir de los productos disponibles.
- **Leyenda de colores** y ayuda integrada.
- **Compartir enlace** a la lista pública o copiar el contenido mediante un diálogo.
- **Lista de la compra** dividida en "Para comprar ahora" y "Comprar otro día". Puedes mover productos entre ambas secciones, marcarlos como comprados para devolverlos a la despensa o eliminarlos definitivamente.

## Flujo de uso
1. Abre la app y añade productos desde la barra de texto o desde una foto.
2. Toca un producto para cambiar su estado (verde → amarillo → rojo). Al llegar a rojo pasa a la lista de la compra.
3. Desde amarillo puedes pulsar el icono del carrito para enviarlo a la compra sin borrarlo de la despensa.
4. Gestiona la lista de la compra marcando los productos como comprados, devolviéndolos a la despensa o guardándolos para otro día.
5. Utiliza las opciones de búsqueda, filtros, ordenación y agrupación para ver la información como prefieras.
6. Si lo deseas, genera una receta con lo que tengas disponible o comparte tu lista.

## Funciones de IA
- **Corrección ortográfica** y capitalización de los nombres introducidos.
- **Sugerencia automática de categoría** para cada nuevo producto.
- **Identificación de productos en una foto** para añadirlos en bloque.
- **Generación de mensajes gramaticales** y notificaciones.
- **Creación de recetas** basadas en lo que está disponible en la despensa.

## Pila tecnológica
- **Next.js** 15 con App Router
- **TypeScript**
- **React** y **shadcn/ui**
- **Tailwind CSS**
- **Firestore** como base de datos
- **Google AI & Genkit** para las funciones inteligentes
- **Firebase Hosting** para el despliegue

## Despliegue y entorno
La aplicación se pensó para ejecutarse siempre online, desde **Firebase Hosting**. El modo local (`npm run dev`) no está mantenido y puede dar errores. Cuando quieras actualizar el código:
1. Haz `git commit` y `git push` con tus cambios.
2. Ejecuta `firebase deploy --only hosting` para publicar una nueva versión.
3. Vuelve a abrir la app en el navegador o en el móvil. Si la tienes instalada como PWA, puede que debas cerrarla y volverla a abrir para que se actualice.
Todos los usuarios acceden a la misma lista pública sin autenticación, y Firestore sincroniza las modificaciones en tiempo real (también funciona sin conexión gracias a la caché local).

## Configuración de Firebase y Google Cloud
- **Servicios de Firebase activos**: se utilizan *Firestore* y *Hosting* (App Hosting con región `us-central1`). Existe una función HTTP mínima (`disabledInitJson`) para desactivar la inicialización automática. Aunque la biblioteca de `auth` está incluida en el código, no se usa porque la lista es pública.
- **Estructura y reglas de Firestore**: toda la información se guarda en la colección `lists`. La app consulta siempre el documento `nuestra-despensa-compartida`. Las reglas actuales permiten lectura y escritura a cualquiera:
  ```
  match /lists/{listId} {
    allow read, write: if true;
  }
  ```
- **Hosting**: el despliegue se hace sobre Firebase Hosting/App Hosting y la aplicación se sirve en `apprepon.web.app` (también accesible en `apprepon.firebaseapp.com`). No hay dominio personalizado definido en este repositorio.
- **APIs de Google Cloud**: están habilitadas *Vertex AI* (para los modelos generativos usados mediante Genkit) y *Cloud Text-to-Speech*. Los flujos de IA se ejecutan en el backend de Next.js.
- **Variables de entorno**: `NEXT_PUBLIC_FIREBASE_API_KEY` y `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` configuran la app de Firebase. `GOOGLE_API_KEY` puede usarse como alternativa para las funciones de IA. Estas variables se definen en `firebase.env.json` o en la configuración de App Hosting.
- **Dependencias relevantes**: `firebase`, `firebase-functions`, `genkit` y `@genkit-ai/googleai` para la integración con los servicios de Google.

## Créditos
Proyecto mantenido por un pequeño equipo humano con ayuda de la IA.
