'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import ChatInterface from '@/components/ChatInterface';
import MapWrapper from '@/components/MapWrapper';
import SplashScreen from './components/SplashScreen';
import WelcomeScreen from './components/WelcomeScreen';

export default function FanPage() {
  const [viewState, setViewState] = useState<'splash' | 'welcome' | 'app'>('splash');

  const currentTime = useMemo(() => new Date().toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }), []);

  // Initialize Firebase Analytics on mount (lazy import to avoid SSR issues)
  useEffect(() => {
    import('@/lib/analytics').then(({ initAnalytics }) => initAnalytics());
  }, []);

  // Splash to Welcome transition
  useEffect(() => {
    if (viewState === 'splash') {
      const timer = setTimeout(() => {
        setViewState('welcome');
      }, 2500);
      return () => clearTimeout(timer);
    }
    if (viewState === 'app') {
      import('@/lib/analytics').then(({ logPageView }) => logPageView('arena_home'));
    }
  }, [viewState]);

  return (
    <>
      <style jsx global>{`
        .fan-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          max-width: 1600px;
          margin: 0 auto;
          padding: 0 20px 24px;
        }
        .fan-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          flex: 1;
        }
        @media (min-width: 1024px) {
          .fan-grid {
            /* Map gets 55%, Chat gets 45%, capping chat at 500px max if needed or just scaling */
            grid-template-columns: minmax(0, 1.4fr) minmax(360px, 1fr);
            grid-template-rows: 1fr;
            min-height: 0;
            gap: 32px;
          }
        }
        .map-panel {
          min-height: 400px;
          border-radius: var(--radius-xl);
          overflow: hidden;
          position: relative;
        }
        @media (min-width: 1024px) {
          .fan-layout {
            height: 100vh;
            overflow: hidden;
            padding-bottom: 24px;
          }
          .fan-grid {
            flex: 1;
            min-height: 0;
          }
          .map-panel {
            min-height: unset;
            height: 100%;
          }
        }
        .stat-card {
          flex: 1;
          padding: 16px 20px;
          border-radius: var(--radius-lg);
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          min-width: 0;
          position: relative;
          overflow: hidden;
          transition: transform 300ms cubic-bezier(0.4,0,0.2,1), border-color 300ms cubic-bezier(0.4,0,0.2,1), box-shadow 300ms cubic-bezier(0.4,0,0.2,1);
        }
        .stat-card:hover {
          transform: translateY(-2px);
          border-color: rgba(0,229,255,0.3);
          box-shadow: 0 0 20px rgba(0,229,255,0.08);
        }

        /* Splash Screen */
        .splash-screen {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: var(--bg-void);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: opacity 500ms ease, visibility 500ms ease;
        }
        .splash-screen.fade-out {
          opacity: 0;
          visibility: hidden;
        }
        .splash-logo-container {
          animation: scale-up-center 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }
        .splash-logo {
          width: 80px;
          height: 80px;
          border-radius: 20px;
          background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
          display: flex;
          alignItems: center;
          justify-content: center;
          font-size: 2.5rem;
          box-shadow: 0 0 60px hsla(217, 91%, 60%, 0.5);
          margin: 0 auto 24px;
        }
        .splash-text {
          opacity: 0;
          animation: fade-in-up 0.5s ease 0.3s forwards;
          text-align: center;
        }

        @keyframes scale-up-center {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fade-in-up {
          0% { transform: translateY(10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        .main-content {
          opacity: 0;
          animation: fade-in 0.8s ease 1.2s forwards;
        }
      `}</style>

      {/* ── Immersive Splash Screen ── */}
      {viewState === 'splash' && <SplashScreen />}

      {/* ── Welcome Screen ── */}
      {viewState === 'welcome' && (
        <div className="w-full h-full" style={{ animation: 'fade-in 0.8s ease forwards' }}>
          <WelcomeScreen onContinue={() => setViewState('app')} />
        </div>
      )}

      {/* ── Main App ── */}
      {viewState === 'app' && (
      <div className="fan-layout" style={{ animation: 'fade-in 0.8s ease forwards' }}>
        
        {/* ── Glass Header Bar ── */}
        <header
          role="banner"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            padding: '14px 20px',
            marginTop: 16,
            marginBottom: 20,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 'var(--radius-xl)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            flexShrink: 0,
            gap: 12,
          }}
        >
          {/* Left: Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              aria-hidden="true"
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #00E5FF, #7C4DFF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                boxShadow: '0 0 20px rgba(0,229,255,0.25)',
                flexShrink: 0,
              }}
            >
              🏟️
            </div>
            <h1
              className="text-gradient"
              style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}
            >
              NexArena
            </h1>
          </div>

          {/* Centre: Live Event badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifySelf: 'center' }}>
            <span className="status-dot status-live" aria-hidden="true" />
            <span className="hide-mobile" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.02em' }}>
              Live Event
            </span>
          </div>

          {/* Right: Admin button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Link
              href="/admin"
              className="btn btn-ghost"
              aria-label="Go to Admin Dashboard"
              style={{ padding: '8px 18px', fontSize: '0.8125rem' }}
            >
              Admin
            </Link>
          </div>
        </header>

        {/* ── Quick stats row ── */}
        <div
          role="region"
          aria-label="Venue quick stats"
          className="animate-slide-up"
          style={{
            display: 'flex',
            gap: 16,
            marginBottom: 24,
            flexShrink: 0,
          }}
        >
          <div className="stat-card">
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Attendance
            </p>
            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#00E5FF', fontFamily: 'var(--font-mono)' }}>
              42,816
            </p>
          </div>
          <div className="stat-card">
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Crowd Level
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="status-dot status-warning" style={{ animation: 'none' }} />
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-warning)', fontFamily: 'var(--font-mono)' }}>
                Moderate
              </p>
            </div>
          </div>
          <div className="stat-card hide-mobile">
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Event Time
            </p>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              Q3 <span style={{ color: 'var(--text-muted)' }}>08:42</span>
            </p>
          </div>
          <div className="stat-card hide-mobile">
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Wait: Food Court
            </p>
            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFB300', fontFamily: 'var(--font-mono)' }}>
              ~4 min
            </p>
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="fan-grid animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {/* Left: Stadium Map - Now significantly larger */}
          <section
            aria-label="Stadium zone map"
            className="glass-panel map-panel shine-border"
          >
            <MapWrapper />
          </section>

          {/* Right: Premium Chat Interface */}
          <section
            className="glass-panel"
            aria-label="AI chat assistant panel"
            style={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: 550,
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            <ChatInterface />
          </section>
        </div>

        {/* ── Footer ── */}
        <footer
          role="contentinfo"
          className="animate-fade-in"
          style={{
            animationDelay: '0.3s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 0 0',
            flexShrink: 0,
          }}
        >
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            © 2025 <span className="text-gradient">NexArena</span> · Built for PromptWars
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            <time dateTime={new Date().toISOString()} suppressHydrationWarning>{currentTime}</time>
          </p>
        </footer>
      </div>
      )}
    </>
  );
}
