import { POST, GET } from '@/app/api/chat/route';
import { NextRequest } from 'next/server';

// Mock generative-ai
jest.mock('@google/generative-ai', () => {
  const mockSendMessage = jest.fn().mockResolvedValue({
    response: { text: () => 'Mocked AI response' },
  });
  
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        startChat: jest.fn().mockReturnValue({
          sendMessage: mockSendMessage,
        }),
      }),
    })),
  };
});

describe('Chat API Route', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test-key' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('rejects GET requests', async () => {
    const res = await GET();
    expect(res.status).toBe(405);
  });

  it('rejects invalid JSON body', async () => {
     // A request with missing/invalid JSON body
     const req = new NextRequest('http://localhost/api/chat', {
       method: 'POST',
       body: 'not-json',
     });
     const res = await POST(req);
     expect(res.status).toBe(400);
     const data = await res.json();
     expect(data.error).toBe('Invalid JSON in request body.');
  });

  it('requires a message string', async () => {
    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Field "message" is required and must be a string.');
  });

  it('rejects empty messages', async () => {
    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: '   ' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Message cannot be empty.');
  });

  it('handles valid message', async () => {
    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Where is the food court?' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.reply).toBe('Mocked AI response');
  });
});
