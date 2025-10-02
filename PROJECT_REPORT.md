# Informe del Proyecto: RePon - Asistente de Despensa Inteligente

## 1. Resumen del Proyecto

- **Nombre:** RePon
- **Concepto:** Una aplicación web inteligente para la gestión de la despensa y la lista de compras. Su objetivo es simplificar la organización de productos del hogar mediante una interfaz limpia, automatizaciones y funcionalidades de IA.
- **Público Objetivo:** Individuos, familias o compañeros de piso que buscan una manera colaborativa y eficiente de gestionar sus compras y su inventario doméstico.

## 2. Características Principales Implementadas

- **Gestión de Despensa y Lista de Compras:** Dos vistas principales (Despensa, Lista de Compra) donde los usuarios pueden añadir, eliminar y modificar productos.
- **Estados de Producto:** Los productos en la despensa tienen estados visuales (disponible, queda poco, agotado) que se pueden cambiar con un clic.
- **Flujo Automatizado:**
    - Marcar un producto como "agotado" en la despensa lo mueve automáticamente a la lista de la compra.
    - Marcar un producto como "comprado" en la lista de la compra lo mueve a la despensa con estado "disponible".
- **Categorización con IA:** Al añadir un producto, una llamada a Genkit sugiere su categoría más probable (p. ej., "Leche" -> "Lácteos y Huevos").
- **Corrección de Nombres con IA:** Los nombres de los productos introducidos son corregidos ortográficamente y capitalizados correctamente por la IA.
- **Generación de Recetas con IA:** Basado en los ingredientes disponibles en la despensa, la IA sugiere una receta equilibrada para una comida/cena.
- **Asistente Conversacional por Voz y Texto:** Una interfaz de chat permite gestionar las listas mediante comandos en lenguaje natural (p. ej., "Añade leche a la compra", "Tengo pan"). El asistente responde con voz.
- **Notificaciones con Voz:** La aplicación utiliza un flujo de Texto a Voz (TTS) para notificar al usuario de las acciones realizadas (p. ej., "He añadido Leche a tu despensa").
- **Listas Compartidas en Tiempo Real:** La aplicación utiliza una única URL compartida (`/pantry/[listId]`) y sincroniza los datos entre todos los usuarios que la usan a través de Firebase Firestore.
- **Autenticación de Usuarios:** Sistema de inicio de sesión con Google (Firebase Auth) para acceder a la lista compartida. Incluye un modo de desarrollo para saltar la autenticación.
- **Personalización de la Interfaz:**
    - Vistas de lista o cuadrícula.
    - Agrupación de productos por categoría.
    - Ordenación alfabética (ascendente/descendente).
    - Filtrado por estado.
- **Edición de Nombres:** Los usuarios pueden modificar el nombre de un producto después de haberlo añadido.
- **"Comprar otro día":** Funcionalidad dentro de la lista de la compra para mover productos a una sección separada y plegable para compras futuras.

## 3. Pila Tecnológica (Stack)

- **Framework Frontend:** Next.js 15 (con App Router)
- **Lenguaje:** TypeScript
- **Librería UI:** React 18
- **Componentes UI:** shadcn/ui
- **Estilos:** Tailwind CSS
- **Base de Datos en Tiempo Real:** Google Firebase Firestore
- **Autenticación:** Google Firebase Authentication
- **Funcionalidades de IA:** Google AI con Genkit
- **Hosting:** Firebase Hosting y App Hosting

## 4. Arquitectura y Estructura de Archivos Clave

La aplicación sigue la estructura del App Router de Next.js, promoviendo el uso de Server Components y Server Actions.

- `src/app/`
    - `layout.tsx`: Layout raíz de la aplicación. Configura providers globales (Autenticación, Audio).
    - `page.tsx`: Página de inicio de sesión (Login).
    - `pantry/[listId]/page.tsx`: Página principal que renderiza el componente de la despensa.
- `src/components/`
    - `pantry-page.tsx`: **El componente principal de la aplicación.** Contiene la mayor parte de la lógica de la interfaz, el estado local y la interacción con las acciones del servidor.
    - `assistant-dialog.tsx`: Componente para la interfaz del asistente conversacional.
    - `share-dialog.tsx`: Componente para compartir el contenido de las listas.
    - `ui/`: Directorio con todos los componentes de shadcn/ui (Button, Dialog, Card, etc.).
- `src/ai/flows/`
    - Contiene todos los flujos de Genkit que definen la lógica de la IA. Cada archivo es un módulo independiente para una tarea específica (categorizar, generar recetas, etc.).
    - `genkit.ts`: Archivo de configuración global de Genkit.
- `src/services/`
    - `firebase-service.ts`: Abstrae toda la comunicación con Firestore (leer, escribir, actualizar y suscribirse a cambios en las listas).
    - `auth-service.ts`: Abstrae la lógica de autenticación con Firebase Auth.
- `src/hooks/`
    - `use-shared-list.ts`: Hook personalizado que encapsula la lógica de obtener y sincronizar los datos de una lista desde Firebase.
    - `use-repon-toast.ts`: Hook para mostrar notificaciones (`toasts`) que se integra con el sistema de audio.
    - `use-speech-recognition.ts`: Hook que gestiona la API de reconocimiento de voz del navegador.
- `src/providers/`
    - `auth-provider.tsx`: Gestiona el estado de autenticación del usuario en toda la aplicación.
    - `audio-provider.tsx`: Gestiona la cola de reproducción de audio para las respuestas de voz de la IA.
- `src/lib/`
    - `actions.ts`: Define las Server Actions de Next.js. Son el puente entre los componentes de cliente y los flujos de IA del servidor.
    - `firebase-config.ts`: Configuración e inicialización de Firebase.
    - `types.ts`: Definiciones de tipos de TypeScript usadas en toda la aplicación (Product, Category, etc.).
    - `utils.ts`: Utilidades generales como `cn` para las clases de Tailwind.

## 5. Detalle de los Flujos de IA (Genkit)

1.  **`categorize-product.ts`**:
    - **Entrada:** `productName: string`
    - **Salida:** `category: string`
    - **Lógica:** Recibe el nombre de un producto y lo asigna a una de las categorías predefinidas (`"Frutas y Verduras"`, `"Lácteos y Huevos"`, etc.) basándose en el contexto de una despensa.

2.  **`correct-product-name.ts`**:
    - **Entrada:** `productName: string`
    - **Salida:** `correctedName: string`
    - **Lógica:** Corrige errores ortográficos y de capitalización. Pone en mayúscula la primera letra y el resto en minúscula, salvo nombres propios.

3.  **`generate-recipe.ts`**:
    - **Entrada:** `products: string[]` (lista de ingredientes disponibles).
    - **Salida:** Objeto con `title`, `ingredients`, `instructions` y `note`.
    - **Lógica:** Crea una receta de plato único y saludable para una persona, siguiendo la estructura del "Plato de Harvard" y objetivos de salud (antiinflamatorio, drenante). Solo usa los ingredientes proporcionados.

4.  **`conversational-assistant.ts`**:
    - **Entrada:** `command: string`, estado actual de `pantry` y `shoppingList`.
    - **Salida:** `response: string` (respuesta hablada), `operations: object[]` (acciones a ejecutar en los datos), `uiActions: object[]` (acciones a ejecutar en la UI).
    - **Lógica:** Es el cerebro del asistente. Interpreta comandos en español para añadir/mover productos o cambiar la interfaz, y genera las operaciones estructuradas correspondientes.

5.  **`text-to-speech.ts`**:
    - **Entrada:** `query: string` (texto a convertir).
    - **Salida:** `audioDataUri: string` (audio en formato Data URI).
    - **Lógica:** Utiliza el modelo TTS de Google para convertir una cadena de texto en audio reproducible.

6.  **`generate-grammatical-message.ts`**:
    - **Entrada:** `productName: string`, `messageType: string`.
    - **Salida:** `message: string`.
    - **Lógica:** Construye frases gramaticalmente correctas en español, ajustando género y número del producto para notificaciones (p. ej., "Queda poc**a** lech**e**" vs. "Quedan poc**os** huev**os**").
