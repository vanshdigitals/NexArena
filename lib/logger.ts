/**
 * lib/logger.ts
 *
 * Structured logging utility for NexArena.
 * Provides consistent, severity-levelled logging across the application.
 * Replaces raw console.* calls with structured JSON output in production
 * and human-readable output in development.
 *
 * ✅ Zero external dependencies
 * ✅ Isomorphic — works in both Node.js and browser environments
 * ✅ Structured output with timestamp, level, context, and optional data
 */

/** Supported log severity levels */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Structured log entry shape */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: Record<string, unknown>;
}

/** Numeric priority for level comparison */
const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/** Minimum log level — only messages at or above this level are emitted */
const MIN_LEVEL: LogLevel =
  (process.env.LOG_LEVEL as LogLevel | undefined) ??
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

/**
 * Format and emit a structured log entry.
 * In production, outputs single-line JSON for log aggregation.
 * In development, outputs human-readable prefixed text.
 *
 * @param entry - The structured log entry to emit
 */
function emit(entry: LogEntry): void {
  if (LEVEL_PRIORITY[entry.level] < LEVEL_PRIORITY[MIN_LEVEL]) return;

  const prefix = `[NexArena${entry.context ? ` ${entry.context}` : ''}]`;

  const consoleFn =
    entry.level === 'error' ? console.error :
    entry.level === 'warn'  ? console.warn  :
    entry.level === 'debug' ? console.debug :
    console.log;

  if (process.env.NODE_ENV === 'production') {
    consoleFn(JSON.stringify(entry));
  } else {
    const parts: string[] = [`${prefix} ${entry.message}`];
    if (entry.data) parts.push(JSON.stringify(entry.data, null, 2));
    consoleFn(...parts);
  }
}

/**
 * Create a contextualised logger instance.
 *
 * @param context - Module or component name for log prefixing (e.g. '/api/chat')
 * @returns Logger object with debug, info, warn, error methods
 *
 * @example
 * ```ts
 * const log = createLogger('/api/chat');
 * log.info('Request received', { messageLength: 42 });
 * log.error('Gemini call failed', { code: 429 });
 * ```
 */
export function createLogger(context?: string) {
  const make =
    (level: LogLevel) =>
    (message: string, data?: Record<string, unknown>): void => {
      emit({
        level,
        message,
        timestamp: new Date().toISOString(),
        context,
        data,
      });
    };

  return {
    /** Log a debug-level message (suppressed in production) */
    debug: make('debug'),
    /** Log an informational message */
    info: make('info'),
    /** Log a warning */
    warn: make('warn'),
    /** Log an error */
    error: make('error'),
  };
}

/** Default application-wide logger */
export const logger = createLogger();
