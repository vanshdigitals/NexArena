/**
 * @jest-environment node
 *
 * Tests for app/api/analytics/route.ts
 * Covers: valid POST, invalid body, invalid event type,
 * rate limiting, and method enforcement.
 */

import { POST, GET } from '@/app/api/analytics/route';
import { NextRequest } from 'next/server';

/* ── Mock logger and rate limiter ────────────────────────────────── */
jest.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

/* ── Helpers ─────────────────────────────────────────────────────── */

function makeRequest(body: unknown, ip = '127.0.0.1'): NextRequest {
  return new NextRequest('http://localhost/api/analytics', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
  });
}

/* ── Tests ────────────────────────────────────────────────────────── */

describe('Analytics API Route', () => {
  it('rejects GET requests with 405', async () => {
    const res = await GET();
    expect(res.status).toBe(405);
    const data = await res.json();
    expect(data.error).toContain('Method not allowed');
  });

  it('accepts valid POST with known event type', async () => {
    const req = makeRequest({
      eventType: 'page_view',
      properties: { page_name: 'home' },
      sessionId: 'test-session',
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.eventType).toBe('page_view');
  });

  it('rejects invalid JSON body', async () => {
    const req = new NextRequest('http://localhost/api/analytics', {
      method: 'POST',
      body: 'not-json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Invalid JSON');
  });

  it('rejects unknown event type', async () => {
    const req = makeRequest({ eventType: 'invalid_event' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Invalid eventType');
  });

  it('rejects non-object properties field', async () => {
    const req = makeRequest({
      eventType: 'zone_click',
      properties: 'not-an-object',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('properties');
  });

  it('rejects empty string sessionId', async () => {
    const req = makeRequest({
      eventType: 'chat_message',
      sessionId: '   ',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('sessionId');
  });

  it('accepts POST without optional fields', async () => {
    const req = makeRequest({ eventType: 'sign_in' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('includes Cache-Control no-store header', async () => {
    const req = makeRequest({ eventType: 'web_vital' });
    const res = await POST(req);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('includes X-RateLimit-Remaining header on success', async () => {
    const req = makeRequest({ eventType: 'navigation' }, '10.0.0.1');
    const res = await POST(req);
    const remaining = res.headers.get('X-RateLimit-Remaining');
    expect(remaining).toBeDefined();
    expect(Number(remaining)).toBeGreaterThanOrEqual(0);
  });

  it('accepts all valid event types', async () => {
    const validTypes = [
      'page_view', 'zone_click', 'chat_message', 'chat_response',
      'quick_action', 'sign_in', 'sign_out', 'navigation',
      'alert_viewed', 'web_vital',
    ];
    for (const eventType of validTypes) {
      const req = makeRequest({ eventType }, `10.0.${validTypes.indexOf(eventType)}.1`);
      const res = await POST(req);
      expect(res.status).toBe(200);
    }
  });
});
