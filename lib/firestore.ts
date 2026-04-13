/**
 * lib/firestore.ts
 *
 * Typed Firestore helper functions for NexArena.
 * All reads/writes go through this module to keep data access
 * centralised, auditable, and easy to unit-test.
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
 * Merges so other fields are not overwritten.
 */
export async function updateZoneDensity(
  field: keyof Omit<ZoneDensity, 'updatedAt'>,
  value: number
): Promise<void> {
  const ref = doc(db, ZONES_DOC);
  await setDoc(
    ref,
    { [field]: value, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/**
 * Fetch current zone densities (one-time read).
 */
export async function getZoneDensities(): Promise<Partial<ZoneDensity>> {
  const snap = await getDoc(doc(db, ZONES_DOC));
  return snap.exists() ? (snap.data() as ZoneDensity) : {};
}

/**
 * Subscribe to real-time zone density updates.
 * Returns an unsubscribe function to clean up the listener.
 */
export function subscribeToZoneDensity(
  callback: (data: Partial<ZoneDensity>) => void
): Unsubscribe {
  return onSnapshot(doc(db, ZONES_DOC), snap => {
    callback(snap.exists() ? (snap.data() as ZoneDensity) : {});
  });
}

/* ──────────────────────────────────────────
   Alerts
   ────────────────────────────────────────── */

/**
 * Publish a new operator alert (admin only).
 */
export async function publishAlert(
  alert: Omit<ArenaAlert, 'id' | 'createdAt'>
): Promise<string> {
  const ref = doc(collection(db, 'alerts'));
  await setDoc(ref, { ...alert, createdAt: serverTimestamp() });
  return ref.id;
}

/**
 * Subscribe to live alerts for a specific zone (or all zones).
 */
export function subscribeToAlerts(
  callback: (alerts: DocumentData[]) => void,
  _zone?: string
): Unsubscribe {
  return onSnapshot(collection(db, 'alerts'), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

/* ──────────────────────────────────────────
   Event Metadata
   ────────────────────────────────────────── */

/**
 * Fetch the active event details.
 */
export async function getActiveEvent(): Promise<DocumentData | null> {
  const snap = await getDoc(doc(db, 'events/active'));
  return snap.exists() ? snap.data() : null;
}

/**
 * Update the active event (admin only).
 */
export async function updateActiveEvent(data: DocumentData): Promise<void> {
  await updateDoc(doc(db, 'events/active'), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
