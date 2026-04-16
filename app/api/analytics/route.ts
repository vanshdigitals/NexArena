/**
 * app/api/analytics/route.ts
 *
 * Server-side analytics endpoint for NexArena venue events.
 * Accepts structured event data via POST and logs it for
 * processing by downstream analytics pipelines.
 *
 * ✅ Input validation with proper error responses
 * ✅ Rate limiting to prevent abuse
 * ✅ Structured logging for event data
 * ✅ Cache-Control headers for proper client behaviour
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';
import { createRateLimiter } from '@/lib/rate-limit';
import { isNonEmptyString } from '@/lib/sanitize';

const log = createLogger('/api/analytics');

/** Dedicated rate limiter for analytics: 60 requests per minute */
const analyticsLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 60 });

/** Valid venue event types */
const VALID_EVENT_TYPES = [
  'page_view',
  'zone_click',
  'chat_message',
  'chat_response',
  'quick_action',
  'sign_in',
  'sign_out',
  'navigation',
  'alert_viewed',
  'web_vital',
] as const;

/** Union type of valid event type strings */
type VenueEventType = (typeof VALID_EVENT_TYPES)[number];

/** Shape of a venue analytics event */
interface VenueEvent {
  eventType: VenueEventType;
  properties?: Record<string, string | number | boolean>;
  sessionId?: string;
  timestamp?: number;
}

/**
 * Validate that an event type is one of the known types.
 *
 * @param value - Value to validate
 * @returns True if value is a valid VenueEventType
 */
function isValidEventType(value: unknown): value is VenueEventType {
  return typeof value === 'string' && (VALID_EVENT_TYPES as readonly string[]).includes(value);
}

/**
 * POST /api/analytics
 *
 * Accepts a venue event payload and logs it for analytics processing.
 *
 * @param req - Incoming request with JSON body containing event data
 * @returns JSON response with success status or error message
 *
 * Request body:
 * ```json
 * {
 *   "eventType": "zone_click",
 *   "properties": { "zone_id": "gate-a", "density": 45 },
 *   "sessionId": "abc-123"
 * }
 * ```
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // Rate limiting
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rateLimitResult = analyticsLimiter.check(clientIp);

  if (!rateLimitResult.allowed) {
    log.warn('Rate limit exceeded', { ip: clientIp });
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)),
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  // Parse body
  let body: VenueEvent;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // Validate event type
  if (!isValidEventType(body.eventType)) {
    return NextResponse.json(
      {
        error: `Invalid eventType. Must be one of: ${VALID_EVENT_TYPES.join(', ')}`,
      },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // Validate properties if provided
  if (body.properties !== undefined && body.properties !== null) {
    if (typeof body.properties !== 'object' || Array.isArray(body.properties)) {
      return NextResponse.json(
        { error: 'Field "properties" must be a flat object.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }
  }

  // Validate sessionId if provided
  if (body.sessionId !== undefined && !isNonEmptyString(body.sessionId)) {
    return NextResponse.json(
      { error: 'Field "sessionId" must be a non-empty string if provided.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // Log the event
  log.info('Venue event received', {
    eventType: body.eventType,
    properties: body.properties ?? {},
    sessionId: body.sessionId ?? 'anonymous',
    timestamp: body.timestamp ?? Date.now(),
    ip: clientIp,
  });

  return NextResponse.json(
    { success: true, eventType: body.eventType },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'X-RateLimit-Remaining': String(rateLimitResult.remaining),
      },
    }
  );
}

/**
 * GET /api/analytics — Method not allowed.
 *
 * @returns 405 error response
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405, headers: { 'Cache-Control': 'no-store' } }
  );
}
