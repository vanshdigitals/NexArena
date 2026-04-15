/**
 * @jest-environment node
 *
 * Comprehensive tests for app/api/chat/route.ts
 *
 * Covers: input validation, Gemini integration, key failover,
 * quota exhaustion fallback, history handling, and edge cases.
 */

import { POST, GET } from '@/app/api/chat/route';
import { NextRequest } from 'next/server';

/* ── Gemini SDK mock ─────────────────────────────────────────────────── */

const mockSendMessage = jest.fn().mockResolvedValue({
  response: { text: () => 'Mocked AI response' },
});

const mockStartChat = jest.fn().mockReturnValue({
  sendMessage: mockSendMessage,
});

const mockGetGenerativeModel = jest.fn().mockReturnValue({
  startChat: mockStartChat,
});

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

/* ── Helpers ─────────────────────────────────────────────────────────── */

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/chat', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

/* ── Tests ────────────────────────────────────────────────────────────── */

describe('Chat API Route', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test-primary-key' };
    // Reset the mock to success state
    mockSendMessage.mockResolvedValue({
      response: { text: () => 'Mocked AI response' },
    });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  /* ── Method enforcement ──────────────────────────────────────────── */

  it('rejects GET requests with 405', async () => {
    const res = await GET();
    expect(res.status).toBe(405);
    const data = await res.json();
    expect(data.error).toBe('Method not allowed.');
  });

  /* ── Input validation ────────────────────────────────────────────── */

  it('rejects invalid JSON body with 400', async () => {
    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: 'not-json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid JSON in request body.');
  });

  it('rejects missing message field with 400', async () => {
    const req = makeRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Field "message" is required and must be a string.');
  });

  it('rejects non-string message with 400', async () => {
    const req = makeRequest({ message: 123 });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Field "message" is required and must be a string.');
  });

  it('rejects empty/whitespace message with 400', async () => {
    const req = makeRequest({ message: '   ' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Message cannot be empty.');
  });

  it('rejects null message with 400', async () => {
    const req = makeRequest({ message: null });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Field "message" is required and must be a string.');
  });

  /* ── Successful message handling ─────────────────────────────────── */

  it('returns AI reply for valid message', async () => {
    const req = makeRequest({ message: 'Where is the food court?' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.reply).toBe('Mocked AI response');
  });

  it('passes system instruction to Gemini model', async () => {
    const req = makeRequest({ message: 'Hello' });
    await POST(req);
    expect(mockGetGenerativeModel).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-2.5-flash',
        systemInstruction: expect.stringContaining('Arena AI'),
      })
    );
  });

  it('configures generation parameters correctly', async () => {
    const req = makeRequest({ message: 'Test' });
    await POST(req);
    expect(mockStartChat).toHaveBeenCalledWith(
      expect.objectContaining({
        generationConfig: expect.objectContaining({
          maxOutputTokens: 512,
          temperature: 0.7,
          topP: 0.9,
        }),
      })
    );
  });

  /* ── Message truncation ──────────────────────────────────────────── */

  it('truncates messages longer than 2000 characters', async () => {
    const longMessage = 'A'.repeat(3000);
    const req = makeRequest({ message: longMessage });
    await POST(req);
    // The sendMessage should receive the truncated version
    expect(mockSendMessage).toHaveBeenCalledWith(
      expect.stringMatching(/^A{2000}$/)
    );
  });

  /* ── Conversation history ────────────────────────────────────────── */

  it('passes conversation history to chat', async () => {
    const req = makeRequest({
      message: 'Follow up question',
      history: [
        { role: 'user', content: 'First question' },
        { role: 'assistant', content: 'First answer' },
      ],
    });
    await POST(req);
    expect(mockStartChat).toHaveBeenCalledWith(
      expect.objectContaining({
        history: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            parts: [{ text: 'First question' }],
          }),
          expect.objectContaining({
            role: 'model', // assistant → model mapping
            parts: [{ text: 'First answer' }],
          }),
        ]),
      })
    );
  });

  it('handles empty history array gracefully', async () => {
    const req = makeRequest({ message: 'Hello', history: [] });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockStartChat).toHaveBeenCalledWith(
      expect.objectContaining({ history: [] })
    );
  });

  it('strips leading model turns from history', async () => {
    const req = makeRequest({
      message: 'Test',
      history: [
        { role: 'assistant', content: 'Welcome!' },    // model turn first — should be stripped
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'How can I help?' },
      ],
    });
    await POST(req);
    const historyArg = mockStartChat.mock.calls[0][0].history;
    // First entry should be the user turn, not the model welcome
    expect(historyArg[0].role).toBe('user');
  });

  /* ── Missing API key ─────────────────────────────────────────────── */

  it('returns config message when GEMINI_API_KEY is not set', async () => {
    process.env = { ...originalEnv }; // Remove GEMINI_API_KEY
    delete process.env.GEMINI_API_KEY;
    const req = makeRequest({ message: 'Hello' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.reply).toContain('not yet configured');
  });

  /* ── Key failover ────────────────────────────────────────────────── */

  it('falls over to backup key on quota error (429)', async () => {
    process.env = {
      ...originalEnv,
      GEMINI_API_KEY: 'primary-key',
      GEMINI_API_KEY_BACKUP: 'backup-key',
    };

    let callCount = 0;
    mockSendMessage.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        const err = new Error('Resource exhausted') as Error & { status: number };
        err.status = 429;
        throw err;
      }
      return { response: { text: () => 'Backup response' } };
    });

    const req = makeRequest({ message: 'Test failover' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.reply).toBe('Backup response');
  });

  it('returns static fallback when both keys are quota-limited', async () => {
    process.env = {
      ...originalEnv,
      GEMINI_API_KEY: 'primary-key',
      GEMINI_API_KEY_BACKUP: 'backup-key',
    };

    mockSendMessage.mockImplementation(() => {
      const err = new Error('quota exceeded') as Error & { status: number };
      err.status = 429;
      throw err;
    });

    const req = makeRequest({ message: 'Test both exhausted' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.reply).toContain('high demand');
    expect(data.reply).toContain('Restrooms');
  });

  it('returns static fallback when primary hits quota and no backup key', async () => {
    process.env = {
      ...originalEnv,
      GEMINI_API_KEY: 'primary-key',
    };
    delete process.env.GEMINI_API_KEY_BACKUP;

    mockSendMessage.mockImplementation(() => {
      const err = new Error('resource_exhausted') as Error & { status: number };
      err.status = 429;
      throw err;
    });

    const req = makeRequest({ message: 'No backup' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.reply).toContain('high demand');
  });

  /* ── Non-retryable errors ────────────────────────────────────────── */

  it('returns 503 for non-retryable primary errors', async () => {
    mockSendMessage.mockImplementation(() => {
      throw new Error('Invalid API key');
    });

    const req = makeRequest({ message: 'Test error' });
    const res = await POST(req);
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toContain('temporarily unavailable');
  });

  /* ── Overload detection ──────────────────────────────────────────── */

  it('detects 503 overload errors as retryable', async () => {
    process.env = {
      ...originalEnv,
      GEMINI_API_KEY: 'primary-key',
      GEMINI_API_KEY_BACKUP: 'backup-key',
    };

    let callCount = 0;
    mockSendMessage.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        const err = new Error('Service overloaded') as Error & { status: number };
        err.status = 503;
        throw err;
      }
      return { response: { text: () => 'Recovered' } };
    });

    const req = makeRequest({ message: 'Overload test' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.reply).toBe('Recovered');
  });
});
