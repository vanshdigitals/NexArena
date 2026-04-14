/**
 * lib/firestore.ts
 *
 * Typed Firestore helper functions for NexArena.
 * All reads/writes go through this module to keep data access
 * centralised, auditable, and easy to unit-test.
 *
 * ✅ Build-safe: every function guards against `db === null`
 *    (which happens during SSR prerender when Firebase env vars
 *    are absent, e.g. in the Docker build environment).
 *
 * Collections:
 *   zones/         – crowd density per stadium zone (real-time)
 *   alerts/        – operator-issued alerts broadcast to fans
 *   events/        – active event metadata
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  serverTimestamp,
  type Unsubscribe,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';

/* ──────────────────────────────────────────
   Types
   ────────────────────────────────────────── */

export interface ZoneDensity {
  gateA:     number;   // 0-100
  gateB:     number;
  foodCourt: number;
  sectionD:  number;
  updatedAt?: ReturnType<typeof serverTimestamp>;
}

export interface ArenaAlert {
  id:        string;
  message:   string;
  severity:  'info' | 'warning' | 'critical';
  zone:      string;
  createdAt: ReturnType<typeof serverTimestamp>;
}

/* ──────────────────────────────────────────
   Zone Density
   ────────────────────────────────────────── */

const ZONES_DOC = 'zones/current';

/**
 * Write a single zone density value to Firestore.
 * No-ops gracefully if Firebase is not configured.
 */
export async function updateZoneDensity(
  field: keyof Omit<ZoneDensity, 'updatedAt'>,
  value: number
): Promise<void> {
  if (!db) return;
  const ref = doc(db, ZONES_DOC);
  await setDoc(
    ref,
    { [field]: value, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/**
 * Fetch current zone densities (one-time read).
 * Returns empty object if Firebase is not configured.
 */
export async function getZoneDensities(): Promise<Partial<ZoneDensity>> {
  if (!db) return {};
  const snap = await getDoc(doc(db, ZONES_DOC));
  return snap.exists() ? (snap.data() as ZoneDensity) : {};
}

/**
 * Subscribe to real-time zone density updates.
 * Returns a no-op unsubscribe function if Firebase is not configured.
 */
export function subscribeToZoneDensity(
  callback: (data: Partial<ZoneDensity>) => void
): Unsubscribe {
  if (!db) return () => {};   // no-op when Firebase is unconfigured
  return onSnapshot(doc(db, ZONES_DOC), snap => {
    callback(snap.exists() ? (snap.data() as ZoneDensity) : {});
  });
}

/* ──────────────────────────────────────────
   Alerts
   ────────────────────────────────────────── */

/**
 * Publish a new operator alert (admin only).
 * No-ops if Firebase is not configured.
 */
export async function publishAlert(
  alert: Omit<ArenaAlert, 'id' | 'createdAt'>
): Promise<string> {
  if (!db) return '';
  const ref = doc(collection(db, 'alerts'));
  await setDoc(ref, { ...alert, createdAt: serverTimestamp() });
  return ref.id;
}

/**
 * Subscribe to live alerts.
 * Returns a no-op unsubscribe function if Firebase is not configured.
 */
export function subscribeToAlerts(
  callback: (alerts: DocumentData[]) => void,
  _zone?: string
): Unsubscribe {
  if (!db) return () => {};
  return onSnapshot(collection(db, 'alerts'), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

/* ──────────────────────────────────────────
   Event Metadata
   ────────────────────────────────────────── */

/**
 * Fetch the active event details.
 * Returns null if Firebase is not configured.
 */
export async function getActiveEvent(): Promise<DocumentData | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'events/active'));
  return snap.exists() ? snap.data() : null;
}

/**
 * Update the active event (admin only).
 * No-ops if Firebase is not configured.
 */
export async function updateActiveEvent(data: DocumentData): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'events/active'), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
