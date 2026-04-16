/**
 * lib/cloud-functions.ts
 *
 * Helper utilities for Firebase Cloud Functions integration.
 * Provides typed wrappers for calling Cloud Functions from the
 * NexArena client application.
 *
 * ✅ Type-safe function call wrappers with generics
 * ✅ SSR-safe with typeof window guard
 * ✅ Lazy SDK initialization to avoid bundling in server builds
 * ✅ Graceful error handling with typed responses
 */

import { app, isConfigured } from './firebase';

/* ── Types ──────────────────────────────────────────────────────────── */

/** Response shape for Cloud Function calls */
export interface CloudFunctionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Parameters for a crowd alert notification function */
export interface AlertNotificationParams {
  zone: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

/** Parameters for a batch zone density update */
export interface BatchDensityUpdateParams {
  updates: Array<{
    zone: string;
    density: number;
  }>;
}

/** Parameters for venue analytics export */
export interface AnalyticsExportParams {
  startDate: string;
  endDate: string;
  format: 'csv' | 'json';
}

/** Result of a venue analytics export */
export interface AnalyticsExportResult {
  downloadUrl: string;
  recordCount: number;
  generatedAt: string;
}

/* ── Lazy Functions SDK loader ──────────────────────────────────────── */

/** Cached Functions SDK instance */
let functionsInstance: ReturnType<typeof import('firebase/functions').getFunctions> | null = null;

/**
 * Lazily load and initialise the Firebase Functions SDK.
 * Returns null if Firebase is not configured or running server-side.
 *
 * @returns Firebase Functions instance, or null
 */
async function getFunctionsInstance(): Promise<typeof functionsInstance> {
  if (typeof window === 'undefined' || !app || !isConfigured) return null;

  try {
    const { getFunctions } = await import('firebase/functions');
    return getFunctions(app, 'asia-south1');
  } catch {
    return null;
  }
}

/**
 * Call a Firebase Cloud Function by name with typed parameters.
 *
 * @typeParam TParams - Input parameters type
 * @typeParam TResult - Expected result type
 * @param functionName - Name of the deployed Cloud Function
 * @param params - Parameters to pass to the function
 * @returns Typed response with success status and data or error
 *
 * @example
 * ```ts
 * const result = await callFunction<AlertNotificationParams, void>(
 *   'sendAlertNotification',
 *   { zone: 'gateA', severity: 'warning', message: 'High crowd density' }
 * );
 * if (result.success) { ... }
 * ```
 */
export async function callFunction<TParams, TResult>(
  functionName: string,
  params: TParams
): Promise<CloudFunctionResponse<TResult>> {
  try {
    if (!functionsInstance) {
      functionsInstance = await getFunctionsInstance();
    }

    if (!functionsInstance) {
      return { success: false, error: 'Cloud Functions not available' };
    }

    const { httpsCallable } = await import('firebase/functions');
    const callable = httpsCallable<TParams, TResult>(functionsInstance, functionName);
    const result = await callable(params);
    return { success: true, data: result.data };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error calling Cloud Function';
    return { success: false, error: message };
  }
}

/* ── Pre-typed function wrappers ──────────────────────────────────── */

/**
 * Send a crowd alert notification via Cloud Functions.
 * Triggers push notifications to nearby fans.
 *
 * @param params - Alert details including zone, severity, and message
 * @returns Response indicating success or failure
 */
export async function sendAlertNotification(
  params: AlertNotificationParams
): Promise<CloudFunctionResponse<void>> {
  return callFunction<AlertNotificationParams, void>('sendAlertNotification', params);
}

/**
 * Perform a batch density update across multiple zones.
 * More efficient than individual writes for bulk operations.
 *
 * @param params - Array of zone+density pairs to update
 * @returns Response with count of updated zones
 */
export async function batchUpdateDensity(
  params: BatchDensityUpdateParams
): Promise<CloudFunctionResponse<{ updatedCount: number }>> {
  return callFunction<BatchDensityUpdateParams, { updatedCount: number }>(
    'batchUpdateDensity',
    params
  );
}

/**
 * Export venue analytics data for a date range.
 *
 * @param params - Date range and export format
 * @returns Response with download URL and record count
 */
export async function exportAnalytics(
  params: AnalyticsExportParams
): Promise<CloudFunctionResponse<AnalyticsExportResult>> {
  return callFunction<AnalyticsExportParams, AnalyticsExportResult>(
    'exportAnalytics',
    params
  );
}
