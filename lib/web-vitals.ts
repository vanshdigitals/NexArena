/**
 * lib/web-vitals.ts
 *
 * Client-side Web Vitals measurement for NexArena.
 * Tracks Core Web Vitals (CLS, FID, LCP) and supplementary metrics
 * (FCP, TTFB) using the native Performance Observer API.
 *
 * ✅ Zero external dependencies (uses native PerformanceObserver)
 * ✅ SSR-safe: all functions guard against server-side execution
 * ✅ Reports metrics to Firebase Analytics when available
 */

/** Supported Web Vital metric names */
export type MetricName = 'CLS' | 'FID' | 'LCP' | 'FCP' | 'TTFB';

/** Shape of a reported web vital metric */
export interface WebVitalMetric {
  name: MetricName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

/** Callback type for metric reporting */
export type MetricReporter = (metric: WebVitalMetric) => void;

/**
 * Rate a CLS value according to Google's thresholds.
 * Good: ≤ 0.1, Needs Improvement: ≤ 0.25, Poor: > 0.25
 *
 * @param value - Cumulative Layout Shift score
 * @returns Rating string
 */
export function rateCLS(value: number): WebVitalMetric['rating'] {
  if (value <= 0.1) return 'good';
  if (value <= 0.25) return 'needs-improvement';
  return 'poor';
}

/**
 * Rate an FID value according to Google's thresholds.
 * Good: ≤ 100ms, Needs Improvement: ≤ 300ms, Poor: > 300ms
 *
 * @param value - First Input Delay in milliseconds
 * @returns Rating string
 */
export function rateFID(value: number): WebVitalMetric['rating'] {
  if (value <= 100) return 'good';
  if (value <= 300) return 'needs-improvement';
  return 'poor';
}

/**
 * Rate an LCP value according to Google's thresholds.
 * Good: ≤ 2500ms, Needs Improvement: ≤ 4000ms, Poor: > 4000ms
 *
 * @param value - Largest Contentful Paint in milliseconds
 * @returns Rating string
 */
export function rateLCP(value: number): WebVitalMetric['rating'] {
  if (value <= 2500) return 'good';
  if (value <= 4000) return 'needs-improvement';
  return 'poor';
}

/**
 * Rate an FCP value according to Google's thresholds.
 * Good: ≤ 1800ms, Needs Improvement: ≤ 3000ms, Poor: > 3000ms
 *
 * @param value - First Contentful Paint in milliseconds
 * @returns Rating string
 */
export function rateFCP(value: number): WebVitalMetric['rating'] {
  if (value <= 1800) return 'good';
  if (value <= 3000) return 'needs-improvement';
  return 'poor';
}

/**
 * Rate a TTFB value according to Google's thresholds.
 * Good: ≤ 800ms, Needs Improvement: ≤ 1800ms, Poor: > 1800ms
 *
 * @param value - Time to First Byte in milliseconds
 * @returns Rating string
 */
export function rateTTFB(value: number): WebVitalMetric['rating'] {
  if (value <= 800) return 'good';
  if (value <= 1800) return 'needs-improvement';
  return 'poor';
}

/**
 * Observe and report Core Web Vitals using native Performance Observer API.
 * Call this once on app mount in a client component.
 *
 * @param onReport - Callback invoked for each metric measurement
 *
 * @example
 * ```ts
 * observeWebVitals((metric) => {
 *   console.log(`${metric.name}: ${metric.value} (${metric.rating})`);
 * });
 * ```
 */
export function observeWebVitals(onReport: MetricReporter): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  // CLS — Cumulative Layout Shift
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
        if (!shift.hadRecentInput && shift.value) {
          clsValue += shift.value;
        }
      }
      onReport({ name: 'CLS', value: clsValue, rating: rateCLS(clsValue) });
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch {
    // LayoutShift not supported in this browser
  }

  // LCP — Largest Contentful Paint
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        onReport({ name: 'LCP', value: lastEntry.startTime, rating: rateLCP(lastEntry.startTime) });
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    // LCP not supported
  }

  // FID — First Input Delay
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstEntry = entries[0] as PerformanceEntry & { processingStart?: number };
      if (firstEntry && firstEntry.processingStart) {
        const fid = firstEntry.processingStart - firstEntry.startTime;
        onReport({ name: 'FID', value: fid, rating: rateFID(fid) });
      }
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
  } catch {
    // FID not supported
  }

  // FCP — First Contentful Paint
  try {
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          onReport({ name: 'FCP', value: entry.startTime, rating: rateFCP(entry.startTime) });
        }
      }
    });
    fcpObserver.observe({ type: 'paint', buffered: true });
  } catch {
    // Paint timing not supported
  }

  // TTFB — Time to First Byte
  try {
    const navEntries = performance.getEntriesByType('navigation') as (PerformanceEntry & {
      responseStart?: number;
    })[];
    if (navEntries.length > 0 && navEntries[0].responseStart) {
      const ttfb = navEntries[0].responseStart;
      onReport({ name: 'TTFB', value: ttfb, rating: rateTTFB(ttfb) });
    }
  } catch {
    // Navigation timing not supported
  }
}

/**
 * Report web vitals to Firebase Analytics.
 * Combines observeWebVitals with the analytics module.
 * Safe to call server-side (no-ops gracefully).
 */
export function reportWebVitalsToAnalytics(): void {
  if (typeof window === 'undefined') return;

  observeWebVitals((metric) => {
    import('@/lib/analytics')
      .then(({ logEvent }) => {
        logEvent('web_vital', {
          metric_name: metric.name,
          metric_value: Math.round(metric.value * 1000) / 1000,
          metric_rating: metric.rating,
        });
      })
      .catch(() => {
        // Analytics not available — non-critical
      });
  });
}
