/**
 * app/api/chat/route.ts
 *
 * Backend-only Gemini integration endpoint.
 *
 * ✅ Security: GEMINI_API_KEY lives only in server environment.
 *    It is NEVER exposed to the browser.
 * ✅ Input validation: message is sanitised and capped.
 * ✅ Rate limiting: add middleware (e.g., upstash/ratelimit) in production.
 * ✅ System prompt: hard-coded venue context ensures Gemini stays on-topic.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MAX_MSG_LENGTH = 2_000;
const MAX_HISTORY_TURNS = 10;
const MODEL_NAME = 'gemini-2.0-flash';

// ── Module-load diagnostic ─────────────────────────────────────────────────
// Printed once when Next.js first imports this route (server start / cold boot).
// Lets you confirm the key is present without revealing it in full.
{
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error(
      '[NexArena /api/chat] ❌ GEMINI_API_KEY is not set. ' +
      'Copy .env.local.example → .env.local and add your key, then restart the dev server.'
    );
  } else {
    console.log(
      `[NexArena /api/chat] ✅ GEMINI_API_KEY detected (length: ${key.length}, prefix: ${key.slice(0, 8)}…). Model: ${MODEL_NAME}`
    );
  }
}

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

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  history?: HistoryMessage[];
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Auth check placeholder ──────────────────────────────────────────────
  // In production, verify Firebase ID token from Authorization header:
  //   const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
  //   const decoded = await adminAuth.verifyIdToken(idToken);
  // ───────────────────────────────────────────────────────────────────────

  // ── Parse body ──────────────────────────────────────────────────────────
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

  // ── Input validation ────────────────────────────────────────────────────
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

  // ── API key guard ───────────────────────────────────────────────────────
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        reply:
          '⚙️ Arena AI is not yet configured. Please set GEMINI_API_KEY in your server environment to enable AI responses.',
      },
      { status: 200 } // Return 200 so the chat UI shows the message gracefully
    );
  }

  // ── Build conversation history for Gemini ───────────────────────────────
  // Gemini requires the history array to begin with a 'user' turn.
  // The client sends the full message list including the AI welcome message
  // (role: 'assistant') which maps to 'model' — if that lands at index 0
  // the SDK throws "First content should be with role 'user', got model".
  // Fix: after mapping, drop every leading 'model' entry.
  const mapped = history
    .slice(-MAX_HISTORY_TURNS * 2) // cap total turns
    .filter(m => m.role && m.content)
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content.slice(0, MAX_MSG_LENGTH) }],
    }));

  // Find the index of the first 'user' turn and slice from there.
  const firstUserIdx = mapped.findIndex(m => m.role === 'user');
  const safeHistory = firstUserIdx > 0 ? mapped.slice(firstUserIdx) : mapped;

  // ── Call Gemini ─────────────────────────────────────────────────────────
  console.log(`[NexArena /api/chat] Calling model: ${MODEL_NAME} | key prefix: ${apiKey.slice(0, 8)}… | history turns: ${safeHistory.length}`);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: SYSTEM_PROMPT,
    });

    const chat = model.startChat({
      history: safeHistory,
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.7,
        topP: 0.9,
      },
    });

    const result = await chat.sendMessage(sanitisedMessage);
    const reply = result.response.text();

    console.log(`[NexArena /api/chat] ✅ Reply received (${reply.length} chars)`);
    return NextResponse.json({ reply }, { status: 200 });

  } catch (err: unknown) {
    // ── Structured error logging ─────────────────────────────────────────
    // Extracts every useful field from the Gemini SDK error object so the
    // actual failure reason always appears in the server terminal.
    const errObj = err as Record<string, unknown>;
    const code    = errObj?.code    ?? errObj?.status   ?? 'UNKNOWN';
    const message = errObj?.message ?? String(err);
    const details = errObj?.errorDetails ?? errObj?.details ?? null;

    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('[NexArena /api/chat] ❌ Gemini call failed');
    console.error('  Model   :', MODEL_NAME);
    console.error('  Code    :', code);
    console.error('  Message :', message);
    if (details) console.error('  Details :', JSON.stringify(details, null, 2));
    if (err instanceof Error && err.stack) {
      console.error('  Stack   :', err.stack.split('\n').slice(0, 6).join('\n'));
    }
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Return a sanitised error to the client (never expose raw API errors).
    // In development the code is included so the network tab shows the cause.
    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        error: 'AI service temporarily unavailable. Please try again shortly.',
        ...(isDev && { _debug_code: code, _debug_message: message }),
      },
      { status: 503 }
    );
  }
}

// Only allow POST
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 });
}
