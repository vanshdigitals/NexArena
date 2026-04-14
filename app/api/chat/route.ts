/**
 * app/api/chat/route.ts
 *
 * Backend-only Gemini integration endpoint.
 *
 * ✅ Security: API keys live only in server environment — never sent to browser.
 * ✅ Key failover: primary → backup key on 429/503 before giving up.
 * ✅ Input validation: message is sanitised and capped.
 * ✅ Rate limiting: add middleware (e.g., upstash/ratelimit) in production.
 * ✅ System prompt: hard-coded venue context ensures Gemini stays on-topic.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MAX_MSG_LENGTH  = 2_000;
const MAX_HISTORY_TURNS = 10;
const MODEL_NAME      = 'gemini-2.5-flash';

// ── Module-load diagnostic ─────────────────────────────────────────────────
// Runs once when Next.js cold-starts this route. Shows key presence & length
// without ever logging the full key value.
{
  const primary = process.env.GEMINI_API_KEY;
  const backup  = process.env.GEMINI_API_KEY_BACKUP;

  if (!primary) {
    console.error(
      '[NexArena /api/chat] ❌ GEMINI_API_KEY is not set. ' +
      'Copy .env.local.example → .env.local and add your key, then restart.'
    );
  } else {
    console.log(
      `[NexArena /api/chat] ✅ PRIMARY key ready  (len: ${primary.length}, prefix: ${primary.slice(0, 8)}…)`
    );
  }

  if (!backup) {
    console.warn('[NexArena /api/chat] ⚠️  GEMINI_API_KEY_BACKUP not set — no failover available.');
  } else {
    console.log(
      `[NexArena /api/chat] ✅ BACKUP  key ready  (len: ${backup.length},  prefix: ${backup.slice(0, 8)}…)`
    );
  }

  console.log(`[NexArena /api/chat]    Model: ${MODEL_NAME}`);
}

// ── System prompt ──────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Arena AI, a friendly and knowledgeable smart assistant for NexArena — a large-scale sporting venue.

Your responsibilities:
- Help fans navigate the stadium (restrooms, food courts, exits, seating sections, first-aid stations, accessible routes)
- Provide real-time crowd density information when available
- Answer questions about facilities, available food, parking, and amenities
- Offer safety guidance and emergency instructions clearly and calmly
- Recommend the least-congested routes when possible

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

/** Returns true for 429 quota / rate-limit errors and 503 overload errors. */
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

/** Logs a structured error block to the server console. */
function logGeminiError(label: string, err: unknown): void {
  const e       = err as Record<string, unknown>;
  const code    = e?.code    ?? e?.status   ?? 'UNKNOWN';
  const message = e?.message ?? String(err);
  const details = e?.errorDetails ?? e?.details ?? null;

  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error(`[NexArena /api/chat] ❌ ${label}`);
  console.error('  Model   :', MODEL_NAME);
  console.error('  Code    :', code);
  console.error('  Message :', message);
  if (details) console.error('  Details :', JSON.stringify(details, null, 2));
  if (err instanceof Error && err.stack) {
    console.error('  Stack   :', err.stack.split('\n').slice(0, 5).join('\n'));
  }
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// ── Main route handler ─────────────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
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
      { status: 400 }
    );
  }

  const { message, history = [] } = body;

  // ── Input validation ─────────────────────────────────────────────────────
  if (!message || typeof message !== 'string') {
    return NextResponse.json(
      { error: 'Field "message" is required and must be a string.' },
      { status: 400 }
    );
  }

  const sanitisedMessage = message.trim().slice(0, MAX_MSG_LENGTH);
  if (!sanitisedMessage) {
    return NextResponse.json(
      { error: 'Message cannot be empty.' },
      { status: 400 }
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
      { status: 200 } // 200 so the chat UI renders this as a message gracefully
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
    console.log(
      `[NexArena /api/chat] 🔑 Trying ${label} key (prefix: ${apiKey.slice(0, 8)}…) | model: ${MODEL_NAME} | history: ${safeHistory.length} turns`
    );
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
    console.log(`[NexArena /api/chat] ✅ PRIMARY succeeded (${reply.length} chars)`);
    return NextResponse.json({ reply }, { status: 200 });

  } catch (primaryErr: unknown) {
    if (isRetryableError(primaryErr)) {
      // ── Attempt 2: backup key ─────────────────────────────────────────────
      console.warn(
        `[NexArena /api/chat] ⚠️  PRIMARY key hit quota/overload — failing over to BACKUP key…`
      );
      const e = primaryErr as Record<string, unknown>;
      console.warn(`  Primary error: ${e?.status ?? e?.code} — ${String(e?.message ?? primaryErr)}`);

      if (!backupKey) {
        console.warn('[NexArena /api/chat] ⚠️  No backup key configured — returning static fallback.');
        return NextResponse.json({ reply: QUOTA_FALLBACK }, { status: 200 });
      }

      try {
        const reply = await callWithKey(backupKey, 'BACKUP');
        console.log(`[NexArena /api/chat] ✅ BACKUP succeeded (${reply.length} chars)`);
        return NextResponse.json({ reply }, { status: 200 });

      } catch (backupErr: unknown) {
        if (isRetryableError(backupErr)) {
          // Both keys exhausted → static fallback
          console.warn('[NexArena /api/chat] ⚠️  BACKUP key also quota-limited — returning static fallback.');
          const eb = backupErr as Record<string, unknown>;
          console.warn(`  Backup error: ${eb?.status ?? eb?.code} — ${String(eb?.message ?? backupErr)}`);
          return NextResponse.json({ reply: QUOTA_FALLBACK }, { status: 200 });
        }

        // Backup failed with a non-retryable error
        logGeminiError('BACKUP key failed (non-retryable)', backupErr);
        const isDev = process.env.NODE_ENV === 'development';
        const eb = backupErr as Record<string, unknown>;
        return NextResponse.json(
          {
            error: 'AI service temporarily unavailable. Please try again shortly.',
            ...(isDev && { _debug_key: 'backup', _debug_code: eb?.code ?? eb?.status, _debug_message: eb?.message }),
          },
          { status: 503 }
        );
      }

    } else {
      // Primary failed with a non-retryable error — don't bother with backup
      logGeminiError('PRIMARY key failed (non-retryable)', primaryErr);
      const isDev = process.env.NODE_ENV === 'development';
      const ep = primaryErr as Record<string, unknown>;
      return NextResponse.json(
        {
          error: 'AI service temporarily unavailable. Please try again shortly.',
          ...(isDev && { _debug_key: 'primary', _debug_code: ep?.code ?? ep?.status, _debug_message: ep?.message }),
        },
        { status: 503 }
      );
    }
  }
}

// Only allow POST
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 });
}
