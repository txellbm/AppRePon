import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "gen-lang-client-0978103445.firebaseapp.com",
  projectId: "gen-lang-client-0978103445",
  storageBucket: "gen-lang-client-0978103445.firebasestorage.app",
  messagingSenderId: "351312631161",
  appId: "1:351312631161:web:160f31bdc3975b6cb94ba8",
  measurementId: "G-XFPE4J6HCJ"
};

let app;
// This check prevents Firebase from being initialized multiple times.
if (getApps().length === 0) {
    // Only initialize if the API key is provided. This is crucial for client-side rendering.
    if (firebaseConfig.apiKey) {
        app = initializeApp(firebaseConfig);
    } else {
        console.warn("Firebase API key is not set. Firebase features will be disabled.");
        app = null;
    }
} else {
    app = getApp();
}

const db = app ? getFirestore(app) : null;

export { db };
