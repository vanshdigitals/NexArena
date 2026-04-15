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
 * ChatInterface - Premium Edition
 * ChatGPT/Gemini inspired UI with borderless bubbles, custom styling,
 * animated typing indicators, and zero-state suggestions.
 */
export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
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
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          history: messages.map(m => ({ role: m.role, content: m.content })),
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
    // Basic HTML sanitization to prevent XSS
    const sanitized = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    return sanitized.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  const isZeroState = messages.length === 0;

  return (
    <section
      aria-label="NexArena AI Chat Assistant"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        position: 'relative',
        background: 'var(--bg-surface)',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexShrink: 0,
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(10px)',
          zIndex: 10,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            flexShrink: 0,
            boxShadow: 'var(--glow-sm)',
          }}
        >
          🤖
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Arena AI <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>Assistant</span>
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span className="status-dot status-live" aria-hidden="true" style={{ width: 6, height: 6 }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--brand-accent)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Online · Powered by Gemini
            </span>
          </div>
        </div>
      </div>

      {/* ── Messages / Zero State ── */}
      <div
        role="log"
        aria-live="polite"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          minHeight: 0,
        }}
      >
        {isZeroState ? (
          <div className="animate-fade-in" style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', gap: 20, textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: -8 }}>🏟️</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              How can I help you navigate the arena?
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto', fontSize: '0.9375rem' }}>
              I have real-time access to stadium cameras, sensor data, and facility schedules. Ask me anything!
            </p>
            {/* Suggestion chips */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              {[
                { label: 'How busy is Gate A?', prompt: 'How busy is Gate A right now?' },
                { label: 'Find nearest restroom', prompt: 'Where is the nearest restroom from my current section?' },
                { label: 'Food court wait time', prompt: 'What is the current wait time at the food court?' },
              ].map(chip => (
                <button
                  key={chip.label}
                  type="button"
                  className="btn-chip"
                  onClick={() => sendMessage(chip.prompt)}
                  disabled={isLoading}
                  style={{ fontSize: '0.8125rem', padding: '8px 16px' }}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 8, textAlign: 'left' }}>
              <QuickActions onSelect={sendMessage} disabled={isLoading} />
            </div>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <div
                key={msg.id}
                className="animate-pop-in"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                {msg.role === 'assistant' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, marginLeft: 4 }}>
                    <span style={{ fontSize: '0.9rem' }}>🤖</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Arena AI</span>
                  </div>
                )}
                <div
                  style={{
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #00E5FF, #7C4DFF)'
                      : 'rgba(255,255,255,0.04)',
                    color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-lg)',
                    borderBottomRightRadius: msg.role === 'user' ? 4 : 'var(--radius-lg)',
                    borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 'var(--radius-lg)',
                    fontSize: '0.9375rem',
                    lineHeight: 1.6,
                    boxShadow: msg.role === 'user' ? '0 8px 24px rgba(0,229,255,0.20)' : 'inset 0 1px 0 rgba(255,255,255,0.05)',
                    border: msg.role === 'user' ? 'none' : '1px solid var(--glass-border)',
                  }}
                  dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                />
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 8, padding: '0 4px' }}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {isLoading && (
              <div className="animate-fade-in" style={{ alignSelf: 'flex-start' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, marginLeft: 4 }}>
                    <span style={{ fontSize: '0.9rem' }}>🤖</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Arena AI is thinking...</span>
                  </div>
                <div style={{
                  background: 'var(--bg-elevated)',
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-lg)',
                  borderBottomLeftRadius: 4,
                  border: '1px solid var(--glass-border)',
                  display: 'flex', gap: 6
                }}>
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}
          </>
        )}

        {error && (
          <div role="alert" className="animate-fade-in" style={{
            padding: '14px 18px', background: 'hsla(350, 84%, 60%, 0.15)', border: '1px solid hsla(350, 84%, 60%, 0.4)',
            borderRadius: 'var(--radius-md)', color: 'var(--brand-danger)', fontSize: '0.875rem',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span aria-hidden="true" style={{ fontSize: '1.2rem' }}>⚠️</span>
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
      <div style={{ padding: '0 24px 24px', flexShrink: 0, position: 'relative' }}>
        <form onSubmit={handleSubmit} style={{ position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            className="input-field"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask Arena AI anything..."
            aria-label="Type your message to Arena AI"
            disabled={isLoading}
            rows={1}
            style={{
              paddingRight: 60,
              paddingTop: 16,
              paddingBottom: 16,
              resize: 'none',
              background: 'var(--bg-elevated)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5), inset 0 2px 4px rgba(0,0,0,0.2)',
              borderRadius: 'var(--radius-xl)',
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            style={{
              position: 'absolute',
              right: 8,
              bottom: 8,
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: input.trim() ? 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' : 'var(--bg-card)',
              color: input.trim() ? 'white' : 'var(--text-muted)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              boxShadow: input.trim() ? '0 4px 12px rgba(0,229,255,0.35)' : 'none',
            }}
            aria-label="Send message"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
        <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 12, textAlign: 'center' }}>
          Arena AI can make mistakes. Verify critical safety info with venue staff.
        </p>
      </div>
    </section>
  );
}
