'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import QuickActions from './QuickActions';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * ChatInterface
 * Full chat UI that communicates with /api/chat backend route.
 * The backend route talks to Gemini so the API key stays server-side.
 */
export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        '👋 Welcome to **NexArena**! I\'m your AI-powered venue assistant. Ask me anything about restrooms, food courts, exits, seating, or first-aid stations. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* Auto-scroll to bottom on new message */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  /* Auto-resize textarea */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;
    setError(null);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          // Exclude the initial welcome message — it is an assistant-role
          // message that was never part of the real conversation and would
          // cause Gemini to reject the history with "first content must be
          // role 'user'". Filter by the stable 'welcome' id so this is
          // resilient to any future reordering of the messages array.
          history: messages
            .filter(m => m.id !== 'welcome')
            .map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? `Server error ${res.status}`);
      }

      const data = await res.json();
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const formatContent = (text: string) => {
    // Simple bold markdown support
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  return (
    <section
      aria-label="NexArena AI Chat Assistant"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexShrink: 0,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            flexShrink: 0,
          }}
        >
          🤖
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
            Arena AI
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="status-dot status-live" aria-hidden="true" />
            <span style={{ fontSize: '0.75rem', color: 'var(--brand-accent)', fontWeight: 500 }}>
              Online · Powered by Gemini
            </span>
          </div>
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          minHeight: 0,
        }}
      >
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}
              aria-label={`${msg.role === 'user' ? 'You' : 'Arena AI'}: ${msg.content}`}
              dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
            />
            <time
              dateTime={msg.timestamp.toISOString()}
              suppressHydrationWarning={true}
              style={{
                fontSize: '0.6875rem',
                color: 'var(--text-muted)',
                marginTop: 4,
                padding: '0 4px',
              }}
            >
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </time>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div
              className="chat-bubble chat-bubble-ai typing-indicator"
              role="status"
              aria-label="Arena AI is typing"
            >
              <span className="typing-dot" aria-hidden="true" />
              <span className="typing-dot" aria-hidden="true" />
              <span className="typing-dot" aria-hidden="true" />
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div
            role="alert"
            style={{
              padding: '12px 16px',
              background: 'hsla(0,84%,60%,0.1)',
              border: '1px solid hsla(0,84%,60%,0.3)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--brand-danger)',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span aria-hidden="true">⚠️</span>
            {error}
          </div>
        )}

        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* ── Quick Actions ── */}
      <div
        style={{
          padding: '12px 20px 8px',
          borderTop: '1px solid var(--glass-border)',
          flexShrink: 0,
        }}
      >
        <QuickActions onSelect={sendMessage} disabled={isLoading} />
      </div>

      {/* ── Input ── */}
      <div style={{ padding: '12px 20px 20px', flexShrink: 0 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <label htmlFor="chat-input" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
            Message Arena AI
          </label>
          <textarea
            ref={inputRef}
            id="chat-input"
            className="input-field"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about restrooms, food, exits, seating…"
            disabled={isLoading}
            rows={1}
            aria-label="Type your message to Arena AI"
            style={{
              flex: 1,
              resize: 'none',
              lineHeight: '1.5',
              overflowY: 'hidden',
              minHeight: 46,
              maxHeight: 140,
            }}
          />
          <button
            id="chat-send-btn"
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !input.trim()}
            aria-label="Send message to Arena AI"
            style={{ padding: '12px 20px', flexShrink: 0 }}
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            <span className="hide-mobile">Send</span>
          </button>
        </form>
        <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
          Arena AI can make mistakes. Verify critical safety info with venue staff.
        </p>
      </div>
    </section>
  );
}
