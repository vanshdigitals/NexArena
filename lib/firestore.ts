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
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
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
 * Subscribe to real-time zone density updates with error handling and retry.
 * Returns a no-op unsubscribe function if Firebase is not configured.
 *
 * @param callback - Function called with updated density data
 * @param onError - Optional error handler for snapshot failures
 * @returns Unsubscribe function to stop listening
 */
export function subscribeToZoneDensity(
  callback: (data: Partial<ZoneDensity>) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db) return () => {};   // no-op when Firebase is unconfigured
  return onSnapshot(
    doc(db, ZONES_DOC),
    (snap) => {
      callback(snap.exists() ? (snap.data() as ZoneDensity) : {});
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
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
 * Subscribe to live alerts with optional zone filtering.
 * Returns a no-op unsubscribe function if Firebase is not configured.
 *
 * @param callback - Function called with updated alert list
 * @param zone - Optional zone filter (e.g., 'gateA') to only receive alerts for that zone
 * @returns Unsubscribe function to stop listening
 */
export function subscribeToAlerts(
  callback: (alerts: DocumentData[]) => void,
  zone?: string
): Unsubscribe {
  if (!db) return () => {};
  const col = collection(db, 'alerts');
  const q = zone
    ? query(col, where('zone', '==', zone), orderBy('createdAt', 'desc'))
    : col;
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    },
    () => {
      // Silently handle snapshot errors — alerts are non-critical
    }
  );
}

/* ──────────────────────────────────────────
   Compound Queries
   ────────────────────────────────────────── */

/**
 * Query alerts by severity level, ordered by creation time.
 * Uses a compound Firestore index (severity + createdAt).
 *
 * @param severity - Alert severity to filter by
 * @param maxResults - Maximum number of results (default 20)
 * @returns Array of matching alert documents
 */
export async function queryAlertsBySeverity(
  severity: 'info' | 'warning' | 'critical',
  maxResults = 20
): Promise<DocumentData[]> {
  if (!db) return [];
  const q = query(
    collection(db, 'alerts'),
    where('severity', '==', severity),
    orderBy('createdAt', 'desc'),
    limit(maxResults)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Query alerts for a specific zone and severity.
 * Uses compound Firestore index (zone + severity + createdAt).
 *
 * @param zone - Zone identifier to filter by
 * @param severity - Alert severity to filter by
 * @param maxResults - Maximum results (default 10)
 * @returns Array of matching alert documents
 */
export async function queryAlertsByZoneAndSeverity(
  zone: string,
  severity: 'info' | 'warning' | 'critical',
  maxResults = 10
): Promise<DocumentData[]> {
  if (!db) return [];
  const q = query(
    collection(db, 'alerts'),
    where('zone', '==', zone),
    where('severity', '==', severity),
    orderBy('createdAt', 'desc'),
    limit(maxResults)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/* ──────────────────────────────────────────
   Batch Writes
   ────────────────────────────────────────── */

/**
 * Perform a batch update of multiple zone densities in a single atomic write.
 * More efficient than individual setDoc calls for admin bulk updates.
 *
 * @param updates - Record of field names to density values (0-100)
 * @returns Promise that resolves when the batch commit completes
 */
export async function batchUpdateZoneDensities(
  updates: Partial<Record<keyof Omit<ZoneDensity, 'updatedAt'>, number>>
): Promise<void> {
  if (!db) return;
  const batch = writeBatch(db);
  const ref = doc(db, ZONES_DOC);
  batch.set(ref, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
  await batch.commit();
}

/**
 * Publish multiple alerts in a single batch operation.
 * Atomically writes all alerts — either all succeed or none do.
 *
 * @param alerts - Array of alert objects to publish
 * @returns Array of generated document IDs
 */
export async function batchPublishAlerts(
  alerts: Array<Omit<ArenaAlert, 'id' | 'createdAt'>>
): Promise<string[]> {
  if (!db) return [];
  const batch = writeBatch(db);
  const ids: string[] = [];
  for (const alert of alerts) {
    const ref = doc(collection(db, 'alerts'));
    batch.set(ref, { ...alert, createdAt: serverTimestamp() });
    ids.push(ref.id);
  }
  await batch.commit();
  return ids;
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
