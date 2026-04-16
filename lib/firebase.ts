/**
 * lib/firebase.ts
 *
 * Firebase client SDK initialisation — build-safe.
 *
 * ✅ Guards `initializeApp` behind a config-presence check so that
 *    Next.js SSR prerendering during `npm run build` (where NEXT_PUBLIC_*
 *    vars are absent) does NOT throw `auth/invalid-api-key`.
 * ✅ Singleton pattern prevents re-init during HMR.
 * ✅ All exports are nullable — callers in lib/firestore.ts check before use.
 * ✅ Firebase Performance Monitoring initialised lazily (browser only).
 *
 * Security note: Only public config is used here. Sensitive operations
 * require the Firebase Admin SDK in server-side API routes.
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

/**
 * True only when all required config values are present (non-empty strings).
 * Prevents Firebase from being initialised with empty/undefined credentials,
 * which would throw `auth/invalid-api-key` during SSR/prerender.
 */
const isConfigured =
  !!firebaseConfig.apiKey &&
  !!firebaseConfig.projectId &&
  !!firebaseConfig.appId;

if (!isConfigured && typeof window !== 'undefined') {
  console.warn(
    '[NexArena] Firebase is not configured. ' +
    'Copy .env.local.example → .env.local and fill in NEXT_PUBLIC_FIREBASE_* credentials.'
  );
}

// ── Singleton initialisation — only when config is present ────────────────
let app:  FirebaseApp | null = null;
let auth: Auth        | null = null;
let db:   Firestore   | null = null;

if (isConfigured) {
  app  = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db   = getFirestore(app);
}

/**
 * Lazily initialise Firebase Performance Monitoring.
 * Only runs in browser context with a configured Firebase app.
 * Non-blocking — errors are silently caught.
 */
async function initPerformance(): Promise<void> {
  if (typeof window === 'undefined' || !app || !isConfigured) return;
  try {
    const { getPerformance } = await import('firebase/performance');
    getPerformance(app);
  } catch {
    // Performance monitoring not available — non-critical
  }
}

// Kick off lazy perf init (non-blocking)
if (typeof window !== 'undefined' && isConfigured) {
  initPerformance();
}

export { app, auth, db, isConfigured };
