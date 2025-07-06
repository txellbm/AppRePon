import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, type Firestore } from 'firebase/firestore';

// Hardcoded configuration to ensure availability in all environments.
// These are client-safe variables.
export const firebaseConfig = {
  apiKey: "AIzaSyA66O2Gjf2lyUqh6lx1cUK-GAzwNJ-VU1g",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "apprepon.web.app",
  projectId: "apprepon",
  storageBucket: "apprepon.appspot.com",
  messagingSenderId: "165040282600",
  appId: "1:165040282600:web:3869fbbfee23f559fce25d"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

db = getFirestore(app);
auth = getAuth(app);

// Enable persistence on the client side, but don't block initialization.
// This should only be called once, so we use a global flag for HMR safety.
if (typeof window !== 'undefined' && !(window as any).__firebase_persistence_enabled) {
    (window as any).__firebase_persistence_enabled = true;
    enableIndexedDbPersistence(db)
      .catch((err) => {
        if (err.code == 'failed-precondition') {
          console.warn(
            'Firebase persistence failed: Multiple tabs open. Persistence can only be enabled in one tab at a time.'
          );
        } else if (err.code == 'unimplemented') {
          console.warn(
            'Firebase persistence failed: The current browser does not support all of the features required to enable persistence.'
          );
        } else {
             console.error("Firebase persistence error", err);
        }
      });
}

export { db, auth };

if (typeof window !== 'undefined') {
  (window as any).__FIREBASE_APP__ = app;
}
