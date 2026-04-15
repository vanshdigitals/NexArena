/**
 * @jest-environment jsdom
 *
 * Tests for components/ChatInterface.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatInterface from '@/components/ChatInterface';

// Mock scrollIntoView (not available in jsdom)
Element.prototype.scrollIntoView = jest.fn();

// Mock QuickActions to keep test focused
jest.mock('@/components/QuickActions', () => {
  return function MockQuickActions({ onSelect, disabled }: { onSelect: (s: string) => void; disabled: boolean }) {
    return (
      <div data-testid="quick-actions" data-disabled={disabled}>
        <button onClick={() => onSelect('test prompt')}>Mock Quick Action</button>
      </div>
    );
  };
});

// Mock analytics to prevent firebase import chain in jsdom
jest.mock('@/lib/analytics', () => ({
  logChatMessageSent: jest.fn(),
  logChatResponseReceived: jest.fn(),
  logQuickActionUsed: jest.fn(),
  initAnalytics: jest.fn(),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => `test-uuid-${Date.now()}-${Math.random()}`,
  },
});

describe('ChatInterface', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('renders the zero-state when no messages exist', () => {
    render(<ChatInterface />);
    expect(screen.getByText('How can I help you navigate the arena?')).toBeTruthy();
  });

  it('renders the chat header with Arena AI title', () => {
    render(<ChatInterface />);
    expect(screen.getByText('Arena AI')).toBeTruthy();
  });

  it('shows the online status indicator', () => {
    render(<ChatInterface />);
    expect(screen.getByText(/Online · Powered by Gemini/)).toBeTruthy();
  });

  it('renders suggestion chips in zero state', () => {
    render(<ChatInterface />);
    expect(screen.getByText('How busy is Gate A?')).toBeTruthy();
    expect(screen.getByText('Find nearest restroom')).toBeTruthy();
    expect(screen.getByText('Food court wait time')).toBeTruthy();
  });

  it('renders the input textarea', () => {
    render(<ChatInterface />);
    const input = screen.getByPlaceholderText('Ask Arena AI anything...');
    expect(input).toBeTruthy();
    expect(input.tagName.toLowerCase()).toBe('textarea');
  });

  it('renders the send button', () => {
    render(<ChatInterface />);
    const sendBtn = screen.getByLabelText('Send message');
    expect(sendBtn).toBeTruthy();
  });

  it('send button is disabled when input is empty', () => {
    render(<ChatInterface />);
    const sendBtn = screen.getByLabelText('Send message');
    expect(sendBtn).toBeDisabled();
  });

  it('send button becomes enabled when text is entered', () => {
    render(<ChatInterface />);
    const input = screen.getByPlaceholderText('Ask Arena AI anything...');
    fireEvent.change(input, { target: { value: 'Hello' } });
    const sendBtn = screen.getByLabelText('Send message');
    expect(sendBtn).not.toBeDisabled();
  });

  it('displays user message after sending', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: 'AI response here' }),
    });

    render(<ChatInterface />);
    const input = screen.getByPlaceholderText('Ask Arena AI anything...');
    fireEvent.change(input, { target: { value: 'Where is Gate A?' } });

    const form = input.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Where is Gate A?')).toBeTruthy();
    });
  });

  it('displays AI response after successful fetch', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: 'Gate A is at the north entrance.' }),
    });

    render(<ChatInterface />);
    const input = screen.getByPlaceholderText('Ask Arena AI anything...');
    fireEvent.change(input, { target: { value: 'Where is Gate A?' } });

    const form = input.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Gate A is at the north entrance.')).toBeTruthy();
    });
  });

  it('shows error message on failed fetch', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' }),
    });

    render(<ChatInterface />);
    const input = screen.getByPlaceholderText('Ask Arena AI anything...');
    fireEvent.change(input, { target: { value: 'Test message' } });

    const form = input.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy();
    });
  });

  it('clears input after sending a message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: 'OK' }),
    });

    render(<ChatInterface />);
    const input = screen.getByPlaceholderText('Ask Arena AI anything...') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'Hello' } });
    expect(input.value).toBe('Hello');

    const form = input.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('renders the disclaimer text', () => {
    render(<ChatInterface />);
    expect(
      screen.getByText(/Arena AI can make mistakes/)
    ).toBeTruthy();
  });

  it('renders QuickActions component in zero state', () => {
    render(<ChatInterface />);
    expect(screen.getByTestId('quick-actions')).toBeTruthy();
  });
});
