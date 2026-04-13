/**
 * lib/firebase.ts
 *
 * Firebase client SDK initialisation.
 * Reads all config from environment variables (see .env.local.example).
 * Uses a singleton pattern to prevent multiple app initialisations
 * during Next.js hot-module replacement in development.
 *
 * Security note: Only public config (API key, project ID, etc.) is exposed
 * here. All sensitive operations that require service-account credentials
 * must happen in server-side API routes using the Firebase Admin SDK.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate required config keys on module load (dev-time hint)
if (typeof window !== 'undefined' && !firebaseConfig.projectId) {
  console.warn(
    '[NexArena] Firebase is not configured. ' +
    'Copy .env.local.example to .env.local and fill in your credentials.'
  );
}

/**
 * Singleton Firebase app instance.
 * Guards against re-initialisation during HMR.
 */
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

/** Firebase Authentication instance */
const auth: Auth = getAuth(app);

/** Cloud Firestore instance */
const db: Firestore = getFirestore(app);

export { app, auth, db };
