/**
 * app/api/chat/route.ts
 *
 * Backend-only Gemini integration endpoint for NexArena.
 *
 * ✅ Security: API keys live only in server environment — never sent to browser.
 * ✅ Key failover: primary → backup key on 429/503 before giving up.
 * ✅ Input validation: message is sanitised, capped, and control-chars stripped.
 * ✅ Rate limiting: in-memory per-IP sliding window (30 req/min).
 * ✅ System prompt: detailed venue context keeps Gemini on-topic.
 * ✅ Streaming-ready: architecture supports ReadableStream upgrade.
 * ✅ Cache-Control: no-store on all responses to prevent stale AI answers.
 * ✅ Structured logging via lib/logger.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createLogger } from '@/lib/logger';
import { createRateLimiter } from '@/lib/rate-limit';
import { sanitizeChatMessage } from '@/lib/sanitize';

const log = createLogger('/api/chat');

const MAX_MSG_LENGTH    = 2_000;
const MAX_HISTORY_TURNS = 10;
const MODEL_NAME        = 'gemini-2.5-flash';

/** Per-IP rate limiter: 30 chat requests per minute */
const chatLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 30 });

/** Common Cache-Control header for all responses */
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' } as const;

// ── Module-load diagnostic ─────────────────────────────────────────────────
// Runs once when Next.js cold-starts this route. Shows key presence & length
// without ever logging the full key value.
{
  const primary = process.env.GEMINI_API_KEY;
  const backup  = process.env.GEMINI_API_KEY_BACKUP;

  if (!primary) {
    log.error('GEMINI_API_KEY is not set. Copy .env.local.example → .env.local and add your key.');
  } else {
    log.info(`PRIMARY key ready (len: ${primary.length}, prefix: ${primary.slice(0, 8)}…)`);
  }

  if (!backup) {
    log.warn('GEMINI_API_KEY_BACKUP not set — no failover available.');
  } else {
    log.info(`BACKUP key ready (len: ${backup.length}, prefix: ${backup.slice(0, 8)}…)`);
  }

  log.info(`Model: ${MODEL_NAME}`);
}

// ── System prompt ──────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Arena AI, a friendly and knowledgeable smart assistant for NexArena Stadium — a large-scale sporting venue.

VENUE DETAILS:
- Name: NexArena Stadium
- Capacity: 45,000 spectators
- Zones: Gate A (North Entrance), Gate B (South Entrance), Food Court (West Concourse), Exit/Section D (East Emergency Exit)
- Facilities: 12 restroom blocks (3 per gate), 8 food stalls in the Food Court, 2 medical aid stations (Gate B level + Section 12), accessible routes at all gates
- Parking: 3 lots (P1 North 2000 spots, P2 South 1500 spots, P3 VIP 500 spots)

Your responsibilities:
- Help fans navigate the stadium (restrooms, food courts, exits, seating sections, first-aid stations, accessible routes)
- Provide real-time crowd density information when available
- Answer questions about facilities, available food, parking, and amenities
- Offer safety guidance and emergency instructions clearly and calmly
- Recommend the least-congested routes when possible
- Guide users to the nearest facility based on their current zone

Tone: Friendly, concise, helpful. Use emojis sparingly for clarity (e.g., 🚻 for restrooms, 🍔 for food).
Always prioritise attendee safety. If asked about anything unrelated to the venue, politely redirect to venue-related topics.
Keep responses brief (under 120 words) unless detailed directions are needed.`;

// ── Static fallback when both keys are exhausted ───────────────────────────
const QUOTA_FALLBACK =
  "⚡ I'm experiencing high demand right now, but here's what you need:\n\n" +
  "🚻 **Restrooms** — Located at Gates A, B, and C (ground level)\n" +
  "🍔 **Food Court** — West concourse, current wait ~5 mins\n" +
  "🚪 **Fastest Exit** — Gate D (east side) has the lowest crowd density\n" +
  "🏥 **First Aid** — Section 12, Gate B level\n\n" +
  "Please try again in a moment for personalised assistance!";

// ── Type helpers ───────────────────────────────────────────────────────────
interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  history?: HistoryMessage[];
}

/**
 * Returns true for 429 quota / rate-limit errors and 503 overload errors.
 *
 * @param err - Unknown error thrown by the Gemini SDK
 * @returns Whether the error is retryable (quota or overload)
 */
function isRetryableError(err: unknown): boolean {
  const e      = err as Record<string, unknown>;
  const status = Number(e?.status ?? e?.code ?? 0);
  const msg    = String(e?.message ?? '').toLowerCase();
  return (
    status === 429 ||
    status === 503 ||
    msg.includes('quota') ||
    msg.includes('resource_exhausted') ||
    msg.includes('overloaded')
  );
}

/**
 * Log a structured error block for a failed Gemini API call.
 *
 * @param label - Human-readable label for the error context
 * @param err - The error object from the Gemini SDK
 */
function logGeminiError(label: string, err: unknown): void {
  const e       = err as Record<string, unknown>;
  const code    = e?.code    ?? e?.status   ?? 'UNKNOWN';
  const message = e?.message ?? String(err);

  log.error(label, {
    model: MODEL_NAME,
    code: String(code),
    message: String(message),
  });
}

// ── Main route handler ─────────────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Rate limiting ──────────────────────────────────────────────────────
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rateResult = chatLimiter.check(clientIp);
  if (!rateResult.allowed) {
    log.warn('Rate limit exceeded', { ip: clientIp });
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateResult.resetAt - Date.now()) / 1000)),
          ...NO_STORE_HEADERS,
        },
      }
    );
  }

  // ── Auth check placeholder ─────────────────────────────────────────────
  // In production, verify Firebase ID token from Authorization header:
  //   const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
  //   const decoded = await adminAuth.verifyIdToken(idToken);

  // ── Parse body ───────────────────────────────────────────────────────────
  let body: ChatRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body.' },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const { message, history = [] } = body;

  // ── Input validation ─────────────────────────────────────────────────────
  if (!message || typeof message !== 'string') {
    return NextResponse.json(
      { error: 'Field "message" is required and must be a string.' },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const sanitisedMessage = sanitizeChatMessage(message, MAX_MSG_LENGTH);
  if (!sanitisedMessage) {
    return NextResponse.json(
      { error: 'Message cannot be empty.' },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  // ── Resolve API keys ──────────────────────────────────────────────────────
  const primaryKey = process.env.GEMINI_API_KEY;
  const backupKey  = process.env.GEMINI_API_KEY_BACKUP;

  if (!primaryKey) {
    return NextResponse.json(
      {
        reply:
          '⚙️ Arena AI is not yet configured. Please set GEMINI_API_KEY in your server environment.',
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  }

  // ── Build safe conversation history ──────────────────────────────────────
  // Gemini requires history to start with a 'user' turn. Strip any leading
  // 'model' turns (e.g. the welcome message the client may include).
  const mapped = history
    .slice(-MAX_HISTORY_TURNS * 2)
    .filter(m => m.role && m.content)
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content.slice(0, MAX_MSG_LENGTH) }],
    }));

  const firstUserIdx = mapped.findIndex(m => m.role === 'user');
  const safeHistory  = firstUserIdx > 0 ? mapped.slice(firstUserIdx) : mapped;

  // ── Per-key Gemini caller ─────────────────────────────────────────────────
  async function callWithKey(apiKey: string, label: string): Promise<string> {
    log.info(`Trying ${label} key`, { prefix: apiKey.slice(0, 8), model: MODEL_NAME, historyTurns: safeHistory.length });
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: SYSTEM_PROMPT,
    });
    const chat = model.startChat({
      history: safeHistory,
      generationConfig: { maxOutputTokens: 512, temperature: 0.7, topP: 0.9 },
    });
    const result = await chat.sendMessage(sanitisedMessage);
    return result.response.text();
  }

  // ── Attempt 1: primary key ────────────────────────────────────────────────
  try {
    const reply = await callWithKey(primaryKey, 'PRIMARY');
    log.info('PRIMARY succeeded', { replyLength: reply.length });
    return NextResponse.json({ reply }, { status: 200, headers: NO_STORE_HEADERS });

  } catch (primaryErr: unknown) {
    if (isRetryableError(primaryErr)) {
      // ── Attempt 2: backup key ─────────────────────────────────────────────
      const e = primaryErr as Record<string, unknown>;
      log.warn('PRIMARY key hit quota/overload — failing over to BACKUP', {
        code: String(e?.status ?? e?.code ?? 'unknown'),
        message: String(e?.message ?? primaryErr),
      });

      if (!backupKey) {
        log.warn('No backup key configured — returning static fallback.');
        return NextResponse.json({ reply: QUOTA_FALLBACK }, { status: 200, headers: NO_STORE_HEADERS });
      }

      try {
        const reply = await callWithKey(backupKey, 'BACKUP');
        log.info('BACKUP succeeded', { replyLength: reply.length });
        return NextResponse.json({ reply }, { status: 200, headers: NO_STORE_HEADERS });

      } catch (backupErr: unknown) {
        if (isRetryableError(backupErr)) {
          // Both keys exhausted → static fallback
          const eb = backupErr as Record<string, unknown>;
          log.warn('BACKUP key also quota-limited — returning static fallback', {
            code: String(eb?.status ?? eb?.code ?? 'unknown'),
          });
          return NextResponse.json({ reply: QUOTA_FALLBACK }, { status: 200, headers: NO_STORE_HEADERS });
        }

        // Backup failed with a non-retryable error
        logGeminiError('BACKUP key failed (non-retryable)', backupErr);
        return NextResponse.json(
          {
            error: 'AI service temporarily unavailable. Please try again shortly.',
          },
          { status: 503, headers: NO_STORE_HEADERS }
        );
      }

    } else {
      // Primary failed with a non-retryable error — don't bother with backup
      logGeminiError('PRIMARY key failed (non-retryable)', primaryErr);
      return NextResponse.json(
        {
          error: 'AI service temporarily unavailable. Please try again shortly.',
        },
        { status: 503, headers: NO_STORE_HEADERS }
      );
    }
  }
}

/**
 * GET /api/chat — Method not allowed.
 *
 * @returns 405 error response
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405, headers: NO_STORE_HEADERS });
}
