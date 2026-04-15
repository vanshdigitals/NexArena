/**
 * lib/analytics.ts
 *
 * Firebase Analytics integration for NexArena.
 * Wraps Google Analytics event logging in build-safe helpers.
 *
 * ✅ Gracefully no-ops during SSR, build, and when Firebase is unconfigured.
 * ✅ Lazy initialization — analytics SDK is only loaded in the browser.
 * ✅ All event names follow GA4 naming conventions (snake_case, ≤40 chars).
 */

import { app, isConfigured } from './firebase';

// Lazy-loaded analytics instance
let analyticsInstance: import('firebase/analytics').Analytics | null = null;
let initAttempted = false;

/**
 * Initialize Firebase Analytics.
 * Safe to call multiple times — only the first call has any effect.
 * Must be called from a client component (browser context).
 */
export async function initAnalytics(): Promise<void> {
  if (initAttempted || typeof window === 'undefined' || !app || !isConfigured) return;
  initAttempted = true;

  try {
    const { getAnalytics, isSupported } = await import('firebase/analytics');
    const supported = await isSupported();
    if (supported) {
      analyticsInstance = getAnalytics(app);
      console.log('[NexArena Analytics] ✅ Firebase Analytics initialized');
    }
  } catch (err) {
    console.warn('[NexArena Analytics] ⚠️ Analytics not available:', err);
  }
}

/**
 * Log a custom event to Firebase Analytics.
 * No-ops gracefully if analytics is not initialized.
 */
export function logEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
): void {
  if (!analyticsInstance) return;

  // Dynamic import to avoid bundling analytics in SSR
  import('firebase/analytics').then(({ logEvent: firebaseLogEvent }) => {
    firebaseLogEvent(analyticsInstance!, eventName, params);
  }).catch(() => {
    // Silently fail — analytics is non-critical
  });
}

// ── Pre-defined event helpers ─────────────────────────────────────────────

/** User sent a chat message to Arena AI */
export function logChatMessageSent(messageLength: number): void {
  logEvent('chat_message_sent', {
    message_length: messageLength,
    timestamp: Date.now(),
  });
}

/** User received an AI response */
export function logChatResponseReceived(responseLength: number): void {
  logEvent('chat_response_received', {
    response_length: responseLength,
    timestamp: Date.now(),
  });
}

/** User clicked a zone on the stadium map */
export function logZoneClicked(zoneId: string, density: number): void {
  logEvent('zone_clicked', {
    zone_id: zoneId,
    density,
    timestamp: Date.now(),
  });
}

/** User used a quick action chip */
export function logQuickActionUsed(actionLabel: string): void {
  logEvent('quick_action_used', {
    action_label: actionLabel,
    timestamp: Date.now(),
  });
}

/** User signed in via a specific method */
export function logSignIn(method: 'google' | 'email' | 'guest'): void {
  logEvent('sign_in', { method });
}

/** Page view tracking */
export function logPageView(pageName: string): void {
  logEvent('page_view', { page_name: pageName });
}
