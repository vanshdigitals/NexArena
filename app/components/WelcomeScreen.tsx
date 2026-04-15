'use client';

import React, { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function WelcomeScreen({ onContinue }: { onContinue?: () => void }) {
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* ── Google Auth ── */
  const handleGoogleSignIn = async () => {
    if (!auth) {
      onContinue?.();
      return;
    }
    setLoading(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onContinue?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed';
      setAuthError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ── Email toggle ── */
  const handleEmailContinue = () => {
    setShowEmail(prev => !prev);
    setAuthError(null);
  };

  /* ── Email submit ── */
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setAuthError(null);
    try {
      onContinue?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed';
      setAuthError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ── Skip auth ── */
  const handleExplore = () => {
    onContinue?.();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#060918',
        fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
      }}
    >
      <style>{`
        @keyframes wsBrandIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes wsSignInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes wsEmailSlide {
          from { opacity: 0; max-height: 0; margin-top: 0; }
          to   { opacity: 1; max-height: 220px; margin-top: 12px; }
        }

        .ws-brand-zone  { animation: wsBrandIn  300ms cubic-bezier(0.4,0,0.2,1) forwards; }
        .ws-signin-zone { animation: wsSignInUp 400ms cubic-bezier(0.4,0,0.2,1) 200ms both; }

        .ws-email-fields {
          overflow: hidden;
          animation: wsEmailSlide 350ms cubic-bezier(0.4,0,0.2,1) forwards;
        }

        .ws-auth-btn {
          width: 100%;
          height: 50px;
          border-radius: 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: all 200ms cubic-bezier(0.4,0,0.2,1);
          outline: none;
          -webkit-user-select: none;
          user-select: none;
        }
        .ws-auth-btn:hover:not(:disabled) {
          filter: brightness(1.15);
          border-color: rgba(255,255,255,0.15);
        }
        .ws-auth-btn:active:not(:disabled) {
          transform: scale(0.98);
        }
        .ws-auth-btn:focus-visible {
          outline: 2px solid #00E5FF;
          outline-offset: 2px;
        }
        .ws-auth-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ws-input {
          width: 100%;
          height: 48px;
          border-radius: 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: #fff;
          font-size: 14px;
          font-family: inherit;
          padding: 0 16px;
          outline: none;
          transition: border-color 200ms ease, box-shadow 200ms ease;
        }
        .ws-input::placeholder { color: rgba(255,255,255,0.30); }
        .ws-input:focus {
          border-color: #00E5FF;
          box-shadow: 0 0 0 3px rgba(0,229,255,0.10);
        }

        .ws-frame {
          width: 100%;
          min-height: 100vh;
          max-width: 420px;
          display: flex;
          flex-direction: column;
        }
        @media (min-width: 768px) {
          .ws-frame {
            min-height: auto;
            height: 760px;
            border-radius: 32px;
            border: 1px solid rgba(255,255,255,0.06);
            overflow: hidden;
            box-shadow:
              0 0 0 1px rgba(255,255,255,0.03),
              0 40px 80px rgba(0,0,0,0.60);
          }
        }
      `}</style>

      <div className="ws-frame">

        {/* ═══ TOP BRAND ZONE — 40% ═══ */}
        <div
          className="ws-brand-zone"
          style={{
            flex: '0 0 40%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#060918',
            backgroundImage: 'radial-gradient(circle at 50% 55%, rgba(0,229,255,0.08) 0%, transparent 65%)',
            padding: '40px 28px 20px',
          }}
        >
          {/* Hexagon logo — 64px */}
          <div style={{ marginBottom: 20 }}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Outer hexagon */}
              <polygon
                points="32,4 56.25,18 56.25,46 32,60 7.75,46 7.75,18"
                stroke="#00E5FF"
                strokeWidth="1.5"
                strokeLinejoin="round"
                fill="none"
                opacity="0.6"
              />
              {/* Inner hexagon — rotated 30deg */}
              <polygon
                points="32,14 47.6,23 47.6,41 32,50 16.4,41 16.4,23"
                stroke="#7C4DFF"
                strokeWidth="1"
                strokeLinejoin="round"
                fill="none"
                opacity="0.4"
                transform="rotate(30, 32, 32)"
              />
              {/* Center dot */}
              <circle cx="32" cy="32" r="4" fill="#00E676" />
            </svg>
          </div>

          {/* Wordmark */}
          <h1
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: '0.14em',
              color: '#ffffff',
              lineHeight: 1,
              marginBottom: 6,
            }}
          >
            NEXARENA
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 10,
              letterSpacing: '0.25em',
              color: 'rgba(255,255,255,0.35)',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}
          >
            SMART VENUE ASSISTANT
          </p>
        </div>

        {/* ═══ BOTTOM SIGN-IN ZONE — 60% ═══ */}
        <div
          className="ws-signin-zone"
          style={{
            flex: '1 1 60%',
            background: '#0A0F1E',
            borderRadius: '24px 24px 0 0',
            padding: '36px 28px 32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            overflowY: 'auto',
            marginTop: -12,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Heading */}
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.2,
              textAlign: 'center',
              marginBottom: 8,
              width: '100%',
            }}
          >
            Welcome back
          </h2>
          <p
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.45)',
              lineHeight: 1.5,
              textAlign: 'center',
              marginBottom: 28,
              width: '100%',
            }}
          >
            Sign in to access live navigation, crowd intel &amp; stadium AI.
          </p>

          {/* ── Google Button ── */}
          <button
            className="ws-auth-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            aria-label="Continue with Google"
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          {/* ── Email Button ── */}
          <button
            className="ws-auth-btn"
            onClick={handleEmailContinue}
            disabled={loading}
            aria-label="Continue with Email"
            type="button"
            style={{ marginTop: 12 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            Continue with Email
          </button>

          {/* ── Slide-down email fields ── */}
          {showEmail && (
            <form className="ws-email-fields" onSubmit={handleEmailSubmit} style={{ width: '100%' }}>
              <input
                className="ws-input"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                aria-label="Email address"
                autoComplete="email"
                required
              />
              <input
                className="ws-input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                aria-label="Password"
                autoComplete="current-password"
                required
                style={{ marginTop: 10 }}
              />
              <button
                type="submit"
                disabled={loading || !email.trim() || !password.trim()}
                className="ws-auth-btn"
                style={{
                  marginTop: 12,
                  background: '#00E5FF',
                  color: '#060918',
                  fontWeight: 700,
                  border: 'none',
                }}
              >
                {loading ? 'Signing in\u2026' : 'Sign in'}
              </button>
            </form>
          )}

          {/* ── Error ── */}
          {authError && (
            <p
              role="alert"
              style={{
                marginTop: 12,
                fontSize: 13,
                color: '#FF5252',
                textAlign: 'center',
              }}
            >
              {authError}
            </p>
          )}

          {/* ── Divider ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              margin: '20px 0',
              width: '100%',
            }}
          >
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.25)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              or
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* ── Explore without account ── */}
          <button
            onClick={handleExplore}
            type="button"
            aria-label="Explore without account — skip sign in"
            style={{
              background: 'none',
              border: 'none',
              color: '#00E5FF',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
              padding: '8px 0',
              textAlign: 'center',
              width: '100%',
              transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
            }}
            onMouseOver={e => {
              (e.currentTarget as HTMLButtonElement).style.textDecoration = 'underline';
              (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.2)';
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLButtonElement).style.textDecoration = 'none';
              (e.currentTarget as HTMLButtonElement).style.filter = 'none';
            }}
          >
            Explore without account &rarr;
          </button>

          {/* ── Footer ── */}
          <p
            style={{
              marginTop: 'auto',
              paddingTop: 32,
              fontSize: 10,
              color: 'rgba(255,255,255,0.2)',
              textAlign: 'center',
              lineHeight: 1.7,
            }}
          >
            By continuing, you agree to our{' '}
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>Terms of Service</span> and{' '}
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
