'use client';

import React, { useState, useCallback } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function WelcomeScreen({ onContinue }: { onContinue?: () => void }) {
  const [showEmail,      setShowEmail]      = useState(false);
  const [email,          setEmail]          = useState('');
  const [password,       setPassword]       = useState('');
  const [authError,      setAuthError]      = useState<string | null>(null);
  const [loading,        setLoading]        = useState(false);
  // Only show errors after the user has interacted — never on initial render
  const [hasInteracted,  setHasInteracted]  = useState(false);

  /* ── Google auth ─────────────────────────────────────────────────── */
  const handleGoogleSignIn = useCallback(async () => {
    if (!auth) { onContinue?.(); return; }
    setHasInteracted(true);
    setLoading(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      import('@/lib/analytics').then(({ logSignIn }) => logSignIn('google'));
      onContinue?.();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  }, [onContinue]);

  /* ── Email toggle ────────────────────────────────────────────────── */
  const handleEmailContinue = useCallback(() => {
    setHasInteracted(true);
    setShowEmail(prev => !prev);
    setAuthError(null);
  }, []);

  /* ── Email submit ────────────────────────────────────────────────── */
  const handleEmailSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setHasInteracted(true);
    setLoading(true);
    setAuthError(null);
    try {
      import('@/lib/analytics').then(({ logSignIn }) => logSignIn('email'));
      onContinue?.();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  }, [email, password, onContinue]);

  /* ── Skip auth ───────────────────────────────────────────────────── */
  const handleExplore = useCallback(() => {
    import('@/lib/analytics').then(({ logSignIn }) => logSignIn('guest'));
    onContinue?.();
  }, [onContinue]);

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', system-ui, sans-serif",
        background: '#0b0f19',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── Scoped styles ─────────────────────────────────────────────── */}
      <style>{`
        @keyframes ws-email-slide {
          from { opacity: 0; max-height: 0;    margin-top: 0;   }
          to   { opacity: 1; max-height: 220px; margin-top: 12px; }
        }
        .ws-email-fields {
          overflow: hidden;
          animation: ws-email-slide 350ms cubic-bezier(0.4,0,0.2,1) forwards;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /* Google button */
        .ws-btn-google {
          display: flex; align-items: center; justify-content: center; gap: 12px;
          width: 100%; height: 56px;
          background: #1E2A3A;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          color: #ffffff;
          font-size: 14px; font-weight: 600;
          font-family: 'Inter', system-ui, sans-serif;
          cursor: pointer;
          transition: background 200ms ease, transform 150ms ease, border-color 200ms ease;
          outline: none;
          user-select: none;
          -webkit-user-select: none;
        }
        .ws-btn-google:hover:not(:disabled) {
          background: #253447;
          border-color: rgba(255,255,255,0.18);
        }
        .ws-btn-google:active:not(:disabled)  { transform: scale(0.98); }
        .ws-btn-google:disabled               { opacity: 0.5; cursor: not-allowed; }
        .ws-btn-google:focus-visible          { outline: 2px solid #06b6d4; outline-offset: 2px; }

        /* Cyan Email / primary button */
        .ws-btn-cyan {
          display: flex; align-items: center; justify-content: center; gap: 12px;
          width: 100%; height: 56px;
          background: #06b6d4;
          border: none;
          border-radius: 12px;
          color: #0b0f19;
          font-size: 14px; font-weight: 700;
          font-family: 'Inter', system-ui, sans-serif;
          cursor: pointer;
          box-shadow: 0 0 24px rgba(6,182,212,0.35), 0 4px 12px rgba(6,182,212,0.20);
          transition: filter 200ms ease, transform 150ms ease, box-shadow 200ms ease;
          outline: none;
          user-select: none;
          -webkit-user-select: none;
        }
        .ws-btn-cyan:hover:not(:disabled) {
          filter: brightness(1.10);
          box-shadow: 0 0 32px rgba(6,182,212,0.50), 0 4px 16px rgba(6,182,212,0.30);
        }
        .ws-btn-cyan:active:not(:disabled)  { transform: scale(0.98); }
        .ws-btn-cyan:disabled               { opacity: 0.5; cursor: not-allowed; filter: none; }
        .ws-btn-cyan:focus-visible          { outline: 2px solid #ffffff; outline-offset: 2px; }

        /* Text inputs */
        .ws-input {
          width: 100%; height: 48px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 10px;
          color: #f0f4ff;
          font-size: 14px;
          font-family: 'Inter', system-ui, sans-serif;
          padding: 0 16px;
          outline: none;
          transition: border-color 200ms ease, box-shadow 200ms ease;
          box-sizing: border-box;
        }
        .ws-input::placeholder { color: rgba(240,244,255,0.30); }
        .ws-input:focus {
          border-color: #06b6d4;
          box-shadow: 0 0 0 3px rgba(6,182,212,0.12);
        }

        /* Sign-in submit button */
        .ws-btn-submit {
          width: 100%; height: 48px;
          background: #06b6d4;
          border: none; border-radius: 10px;
          color: #0b0f19;
          font-size: 14px; font-weight: 700;
          font-family: 'Inter', system-ui, sans-serif;
          cursor: pointer;
          transition: filter 200ms ease, transform 150ms ease;
          outline: none;
        }
        .ws-btn-submit:hover:not(:disabled) { filter: brightness(1.10); }
        .ws-btn-submit:active:not(:disabled) { transform: scale(0.98); }
        .ws-btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .ws-btn-submit:focus-visible { outline: 2px solid #ffffff; outline-offset: 2px; }

        /* Explore link button */
        .ws-btn-explore {
          display: inline-flex; align-items: center; gap: 6px;
          background: none; border: none;
          color: #7C4DFF;
          font-size: 14px; font-weight: 700;
          font-family: 'Space Grotesk', system-ui, sans-serif;
          cursor: pointer;
          padding: 8px 0;
          outline: none;
          transition: color 200ms ease;
        }
        .ws-btn-explore:hover { color: #9d75ff; }
        .ws-btn-explore:hover .ws-explore-arrow { transform: translateX(3px); }
        .ws-btn-explore:focus-visible { outline: 2px solid #7C4DFF; outline-offset: 2px; border-radius: 4px; }
        .ws-explore-arrow { transition: transform 200ms ease; display: inline-flex; align-items: center; }
      `}</style>

      {/* ── Hexagon texture overlay (fixed, full screen, 3% opacity) ─── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.03,
        }}
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="ws-hex-pattern"
              x="0" y="0"
              width="56" height="48"
              patternUnits="userSpaceOnUse"
            >
              {/* Flat-top hexagon tile */}
              <polygon
                points="14,2 42,2 56,26 42,46 14,46 0,26"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ws-hex-pattern)" />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TOP SECTION — 45%
          Background: #0b0f19 + radial cyan beam
          Stadium SVG illustration + NexArena logo
          ══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          flex: '0 0 45%',
          background: '#0b0f19',
          backgroundImage:
            'radial-gradient(ellipse 55% 50% at 50% 62%, rgba(6,182,212,0.15) 0%, transparent 70%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
          padding: '32px 24px 20px',
        }}
      >
        {/* Stadium SVG illustration */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <svg
            width="240"
            height="168"
            viewBox="0 0 240 168"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            style={{ display: 'block' }}
          >
            {/* Structural lines from centre — 4 directions */}
            <line x1="120" y1="84" x2="120" y2="4"   stroke="#06b6d4" strokeWidth="0.8" opacity="0.30" />
            <line x1="120" y1="84" x2="120" y2="164" stroke="#06b6d4" strokeWidth="0.8" opacity="0.30" />
            <line x1="120" y1="84" x2="4"   y2="84"  stroke="#06b6d4" strokeWidth="0.8" opacity="0.30" />
            <line x1="120" y1="84" x2="236" y2="84"  stroke="#06b6d4" strokeWidth="0.8" opacity="0.30" />

            {/* Ellipse 1 — outermost, cyan */}
            <ellipse
              cx="120" cy="84"
              rx="114" ry="78"
              stroke="#06b6d4" strokeWidth="1.2" fill="none" opacity="0.40"
            />
            {/* Ellipse 2 — purple */}
            <ellipse
              cx="120" cy="84"
              rx="88" ry="60"
              stroke="#7C4DFF" strokeWidth="1.0" fill="none" opacity="0.40"
            />
            {/* Ellipse 3 — green */}
            <ellipse
              cx="120" cy="84"
              rx="63" ry="42"
              stroke="#00E676" strokeWidth="1.0" fill="none" opacity="0.40"
            />
            {/* Ellipse 4 — innermost, cyan dashed */}
            <ellipse
              cx="120" cy="84"
              rx="40" ry="26"
              stroke="#06b6d4" strokeWidth="1.0"
              strokeDasharray="4 3"
              fill="none" opacity="0.40"
            />
          </svg>

          {/* Logo square — centred over stadium art */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 48,
              height: 48,
              background: '#06b6d4',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow:
                '0 0 0 1px rgba(6,182,212,0.40), 0 0 28px rgba(6,182,212,0.55), 0 0 8px rgba(6,182,212,0.30)',
            }}
          >
            {/* Lightning bolt — simple inline SVG, no external dependency */}
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M13 3L5 13.5H11.5L10.5 21L19 10.5H12.5L13 3Z"
                fill="#0b0f19"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* NEXARENA wordmark */}
        <p
          style={{
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '0.20em',
            color: '#ffffff',
            lineHeight: 1,
            textTransform: 'uppercase',
            position: 'relative',
            zIndex: 1,
          }}
        >
          NEXARENA
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          BOTTOM SECTION — 55%
          Glass panel with rounded top corners
          ══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          flex: '1 1 55%',
          background:
            'linear-gradient(180deg, rgba(28,31,42,0.90) 0%, rgba(15,19,29,0.97) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '2.5rem 2.5rem 0 0',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflowY: 'auto',
          position: 'relative',
          zIndex: 1,
          marginTop: -1,
        }}
      >
        {/* Inner content — max-width sm (384px) */}
        <div
          style={{
            width: '100%',
            maxWidth: 384,
            padding: '28px 24px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flex: 1,
          }}
        >
          {/* Heading */}
          <h1
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontSize: 26,
              fontWeight: 700,
              color: '#ffffff',
              textAlign: 'center',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              marginBottom: 8,
              width: '100%',
            }}
          >
            Welcome to NexArena
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 14,
              color: '#06b6d4',
              textAlign: 'center',
              fontWeight: 500,
              marginBottom: 24,
              lineHeight: 1.5,
              width: '100%',
            }}
          >
            Navigate smarter. Experience more.
          </p>

          {/* ── Auth buttons ─────────────────────────────────────────── */}
          <div
            style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {/* Continue with Google */}
            <button
              className="ws-btn-google"
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
              {loading ? 'Signing in\u2026' : 'Continue with Google'}
            </button>

            {/* Continue with Email */}
            <button
              className="ws-btn-cyan"
              onClick={handleEmailContinue}
              disabled={loading}
              aria-label="Continue with Email"
              aria-expanded={showEmail}
              type="button"
            >
              <svg
                width="18" height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              Continue with Email
            </button>
          </div>

          {/* ── Slide-down email fields ───────────────────────────────── */}
          {showEmail && (
            <form
              className="ws-email-fields"
              onSubmit={handleEmailSubmit}
              aria-label="Sign in with email and password"
            >
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
              />
              <button
                type="submit"
                className="ws-btn-submit"
                disabled={loading || !email.trim() || !password.trim()}
                aria-label="Sign in with email and password"
              >
                {loading ? 'Signing in\u2026' : 'Sign in'}
              </button>
            </form>
          )}

          {/* ── Error ────────────────────────────────────────────────── */}
          {hasInteracted && authError && (
            <p
              role="alert"
              style={{
                marginTop: 12,
                fontSize: 13,
                color: '#FF5252',
                textAlign: 'center',
                lineHeight: 1.4,
                width: '100%',
              }}
            >
              {authError}
            </p>
          )}

          {/* ── Divider ──────────────────────────────────────────────── */}
          <div
            aria-hidden="true"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              margin: '14px 0 12px',
              width: '100%',
            }}
          >
            <div
              style={{
                flex: 1,
                height: 1,
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 100%)',
              }}
            />
            <span
              style={{
                fontSize: 10,
                letterSpacing: '0.20em',
                color: 'rgba(255,255,255,0.28)',
                fontWeight: 600,
                textTransform: 'uppercase',
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              OR
            </span>
            <div
              style={{
                flex: 1,
                height: 1,
                background: 'linear-gradient(90deg, rgba(255,255,255,0.12) 0%, transparent 100%)',
              }}
            />
          </div>

          {/* ── Explore without account ───────────────────────────────── */}
          <button
            className="ws-btn-explore"
            onClick={handleExplore}
            type="button"
            aria-label="Explore without account — skip sign in"
          >
            Explore without account
            <span className="ws-explore-arrow" aria-hidden="true">
              <svg
                width="16" height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          </button>

          {/* ── Footer ───────────────────────────────────────────────── */}
          <p
            style={{
              marginTop: 'auto',
              paddingTop: 28,
              fontSize: 10,
              color: 'rgba(255,255,255,0.22)',
              textAlign: 'center',
              lineHeight: 1.7,
              width: '100%',
            }}
          >
            By continuing, you agree to our{' '}
            <span
              style={{
                color: 'rgba(255,255,255,0.45)',
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
            >
              Terms of Service
            </span>{' '}
            and{' '}
            <span
              style={{
                color: 'rgba(255,255,255,0.45)',
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
            >
              Privacy Policy
            </span>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
