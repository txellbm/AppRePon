
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInAnonymously,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import { auth } from '@/lib/firebase-config';

const provider = new GoogleAuthProvider();

export const signInAnonymouslyForDev = async (): Promise<User | null> => {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error: any) {
    console.error("Error durante el inicio de sesión anónimo:", error);
    if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/admin-restricted-operation') {
      throw new Error("El inicio de sesión de invitado (anónimo) no está habilitado en tu proyecto de Firebase. Por favor, ve a la sección de AutenticaciÃ³n en la Consola de Firebase y habilita el proveedor 'Anónimo'.");
    }
    throw new Error(`Ocurrió un error inesperado al intentar iniciar sesión anónimamente: ${error.message}`);
  }
};

export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    console.error("Error durante el inicio de sesión con Google:", error);
    if (error.code === 'auth/popup-blocked') {
        throw new Error("El popup de inicio de sesiÃ³n fue bloqueado por el navegador. Por favor, habilita los popups para este sitio.");
    } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error("Este dominio no está autorizado para el inicio de sesión. Revisa la configuración de autenticación en tu proyecto de Firebase y asegúrate de que el dominio actual esté en la lista de dominios autorizados.");
    }
    throw new Error(`Ocurrió un error inesperado al intentar iniciar sesión: ${error.message}`);
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  }
};

export const onAuthStateChanged = (callback: (user: User | null) => void): Unsubscribe => {
  return firebaseOnAuthStateChanged(auth, callback);
};

    