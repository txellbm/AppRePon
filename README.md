
# RePon: Tu Asistente de Despensa Inteligente

RePon es una aplicación web moderna diseñada para ayudarte a gestionar tu despensa y tu lista de compras de manera eficiente e inteligente. Construida con un stack tecnológico de vanguardia, esta aplicación no solo organiza tus productos, sino que también aprende de tus hábitos para hacerte la vida más fácil.

## Pila Tecnológica

- **Framework:** [Next.js](https://nextjs.org/) (con App Router)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
- **Base de Datos y Auth:** [Google Firebase](https://firebase.google.com/) (Firestore, Authentication)
- **Funcionalidades de IA:** [Google AI & Genkit](https://firebase.google.com/docs/genkit)
- **UI:** [React](https://react.dev/)
- **Componentes:** [shadcn/ui](https://ui.shadcn.com/)
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
- **Despliegue Recomendado:** [Firebase Hosting](https://firebase.google.com/docs/hosting)

---

## 🚀 Descripción General

RePon te permite añadir productos a tu despensa o lista de compra usando texto, voz o foto. La IA te sugiere productos, crea recetas y sincroniza los estados de tu despensa de forma automática. Todo está organizado visualmente por colores e iconos que indican el estado del producto. También puedes compartir tu despensa con otros.

---

## ⚙️ Instalación y Configuración para Desarrollo Local

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/tu-repo.git
cd tu-repo
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con tu clave de Firebase:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=TU_CLAVE_API
```

Verifica también que estén activadas en tu proyecto de Firebase/Google Cloud:

- Vertex AI
- Cloud Text-to-Speech

### 4. Ejecutar el Proyecto

Abre dos terminales:

- **Frontend (Next.js):**
```bash
npm run dev
```

- **Servidor IA (Genkit):**
```bash
npm run genkit:watch
```

---

## 📦 Despliegue en Firebase Hosting

1. **Instala Firebase CLI si no la tienes:**

```bash
npm install -g firebase-tools
```

2. **Inicia sesión:**

```bash
firebase login
```

3. **Inicializa Firebase en tu proyecto:**

```bash
firebase init
```

Selecciona:
- **Hosting:** para desplegar
- **Functions:** si quieres desplegar también IA en cloud (opcional)

4. **Lanza el despliegue:**

```bash
firebase deploy
```

La aplicación quedará disponible en tu dominio Firebase o personalizado si lo configuras.

---

## 💡 Sobre integración con GPT Code Interpreter

> Puedes subir este repositorio a GitHub y utilizar el **GPT Code Interpreter** (ChatGPT Code) para ayudarte a revisar errores, depurar o automatizar partes del desarrollo. Solo asegúrate de tener un README claro (como este 😌), y si quieres, puedes añadir instrucciones adicionales para facilitarle el contexto a la IA.

---

## 🧠 Créditos

Desarrollado con 💙 por un equipo humano + IA. Con funciones inteligentes para hacerte la vida más práctica (y la compra más rápida).
